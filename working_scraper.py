import os
import json
import sys
import requests
from dotenv import load_dotenv

load_dotenv()
submission_id = sys.argv[1] if len(sys.argv) > 1 else "209654016"

def log(msg):
    print(msg, file=sys.stderr)

def main():
    session_cookie = os.getenv("LEETCODE_SESSION")
    csrf_token = os.getenv("LEETCODE_CSRF_TOKEN")
    
    if not session_cookie or not csrf_token:
        log("❌ CRITICAL: LEETCODE_SESSION or LEETCODE_CSRF_TOKEN missing in environment variables.")
        return

    url = "https://leetcode.com/graphql/"
    
    headers = {
        "Content-Type": "application/json",
        "Referer": f"https://leetcode.com/submissions/detail/{submission_id}/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Cookie": f"LEETCODE_SESSION={session_cookie}; csrftoken={csrf_token}",
        "x-csrftoken": csrf_token
    }

    query = """
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
        lang {
          name
          verboseName
        }
        question {
          titleSlug
          title
        }
        statusCode
        totalCorrect
        totalTestcases
        runtimeDisplay
        memoryDisplay
        timestamp
        user {
          username
        }
        runtimePercentile
        memoryPercentile
        runtimeDistribution
      }
    }
    """

    payload = {
        "query": query,
        "variables": {"submissionId": int(submission_id)}
    }

    try:
        log(f"Sending direct API request for submission ID: {submission_id}...")
        response = requests.post(url, json=payload, headers=headers, timeout=20)
        
        if response.status_code == 200:
            res_json = response.json()
            if "data" in res_json and res_json["data"].get("submissionDetails"):
                sys.stdout.write(json.dumps(res_json) + "\n")
                sys.stdout.flush()
                log("✅ Successfully fetched submission details via API!")
            else:
                log(f"⚠️ Response received, but data block missing: {res_json}")
        else:
            log(f"❌ LeetCode API returned status code {response.status_code}: {response.text}")
            
    except Exception as e:
        log(f"❌ Exception during API request: {e}")

if __name__ == "__main__":
    main()