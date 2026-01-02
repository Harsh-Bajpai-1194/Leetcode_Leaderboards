import os
import json
import requests
import time
from datetime import datetime, timedelta, timezone

def get_leetcode_data(username):
    url = "https://leetcode.com/graphql"
    query = """
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { realName }
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
            if "errors" in data or data["data"]["matchedUser"] is None:
                return None, 0

            user_data = data["data"]["matchedUser"]
            real_name = user_data["profile"]["realName"] or user_data["username"]
            
            solved_stats = user_data["submitStats"]["acSubmissionNum"]
            total_solved = next((item["count"] for item in solved_stats if item["difficulty"] == "All"), 0)
            
            return real_name, total_solved
        return None, 0
    except:
        return None, 0

def update_leaderboard():
    file_path = os.path.join(os.getcwd(), 'profiles.json')
    
    # 1. LOAD OLD DATA (To compare progress)
    old_stats = {}
    activity_log = []
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            # Create a dictionary of { "url": 100 } (Old Solved Counts)
            for u in data.get("users", []):
                old_stats[u['url']] = u.get('total_solved', 0)
            
            # Keep existing activities (so we don't wipe history every run)
            activity_log = data.get("activities", [])
    except:
        pass # If file doesn't exist yet

    profiles = data["users"] if "users" in data else data

    # 2. FETCH NEW DATA
    for user in profiles:
        username = user['url'].strip('/').split('/')[-1]
        real_name, total_solved = get_leetcode_data(username)
        
        if total_solved > 0:
            # CHECK FOR PROGRESS
            previous_score = old_stats.get(user['url'], 0)
            if total_solved > previous_score and previous_score > 0:
                diff = total_solved - previous_score
                print(f"🔥 {real_name} solved +{diff}!")
                
                # Add to Activity Log
                new_activity = {
                    "text": f"{real_name} solved +{diff} questions",
                    "time": datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%I:%M %p"),
                    "type": "up" # reliable flag for CSS styling
                }
                activity_log.insert(0, new_activity) # Add to TOP of list
            
            # Update User Data
            user['total_solved'] = total_solved
            if real_name: user['name'] = real_name
        
        time.sleep(0.2)

    # 3. TRIM LOG (Keep only last 5 events to save space)
    activity_log = activity_log[:5]

    # 4. SAVE EVERYTHING
    ist_time = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    final_data = {
        "last_updated": ist_time.strftime("%d/%m/%Y, %I:%M %p"),
        "users": profiles,
        "activities": activity_log # <--- New Section in JSON
    }

    with open(file_path, 'w') as f:
        json.dump(final_data, f, indent=2)
    
    print(f"✅ Updated at {final_data['last_updated']}")

if __name__ == "__main__":
    update_leaderboard()
