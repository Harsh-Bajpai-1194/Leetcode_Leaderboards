import os
import json
import time
from datetime import datetime, timedelta, timezone
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import requests

def get_leetcode_data(username):
    """
    Fetches data directly from LeetCode's GraphQL API.
    No browser required. returns: (real_name, total_solved)
    """
    url = "https://leetcode.com/graphql"
    
    # This query asks for specific data: Real Name and Solved Counts
    query = """
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
    """
    
    variables = {"username": username}
    
    try:
        response = requests.post(url, json={"query": query, "variables": variables}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if user exists
            if "errors" in data or data["data"]["matchedUser"] is None:
                print(f"      ⚠️ User not found: {username}")
                return None, 0

            user_data = data["data"]["matchedUser"]
            
            # 1. Get Real Name
            real_name = user_data["profile"]["realName"]
            if not real_name:
                real_name = user_data["username"] # Fallback to username
            
            # 2. Get Solved Count (The first item in acSubmissionNum is usually 'All')
            solved_stats = user_data["submitStats"]["acSubmissionNum"]
            total_solved = 0
            
            # Loop to find the 'All' category count
            for stat in solved_stats:
                if stat["difficulty"] == "All":
                    total_solved = stat["count"]
                    break
            
            return real_name, total_solved
            
        else:
            print(f"      ❌ API Error {response.status_code} for {username}")
            return None, 0
            
    except Exception as e:
        print(f"      ⚠️ Connection Error for {username}: {e}")
        return None, 0

def update_leaderboard():
    file_path = os.path.join(os.getcwd(), 'profiles.json')
    print(f"--- Starting API Update: {datetime.now()} ---")
    
    # Load JSON
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        profiles = data["users"] if isinstance(data, dict) else data
        print(f"✅ Loaded {len(profiles)} users from profiles.json")
    except Exception as e:
        print(f"❌ Failed to load JSON: {e}")
        return

    # Loop through users
    for user in profiles:
        # Extract username from URL (e.g. "https://leetcode.com/u/Harsh/" -> "Harsh")
        username_from_url = user['url'].strip('/').split('/')[-1]
        
        print(f"🔍 Fetching: {username_from_url}...")
        
        real_name, total_solved = get_leetcode_data(username_from_url)
        
        # Update JSON object
        if real_name:
            user['name'] = real_name
        
        if total_solved > 0:
            user['total_solved'] = total_solved
            print(f"      -> Solved: {total_solved}")

        # Tiny sleep to be nice to the API
        time.sleep(0.5)

    # Save Updates
    ist_time = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    final_data = {
        "last_updated": ist_time.strftime("%d/%m/%Y, %I:%M %p"),
        "users": profiles
    }

    with open(file_path, 'w') as f:
        json.dump(final_data, f, indent=2)
    
    print(f"✅ Successfully updated profiles.json at {final_data['last_updated']}")

if __name__ == "__main__":
    update_leaderboard()
