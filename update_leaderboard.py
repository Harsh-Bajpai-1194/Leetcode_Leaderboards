import os
import json
import requests
import time
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

# 1. SETUP MONGODB
load_dotenv()
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    print("⚠️ Error: MONGO_URI not found!")
    exit()

try:
    client = MongoClient(mongo_uri)
    db = client["leetcode_db"]
    users_col = db["users"]
    activities_col = db["activities"]
    metadata_col = db["metadata"]  # <--- ADD THIS LINE
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit()

# 2. THE SCRAPER FUNCTION (Unchanged)
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

# 3. THE UPDATE LOOP
def update_leaderboard():
    # We read profiles.json ONLY to know WHO to track
    file_path = os.path.join(os.getcwd(), 'profiles.json')
    
    try:
        with open(file_path, 'r') as f:
            config_data = json.load(f)
            # Handle both formats (list or dict)
            profile_list = config_data.get("users", []) if isinstance(config_data, dict) else config_data
    except FileNotFoundError:
        print("❌ profiles.json not found! I need a list of users to track.")
        return

    print(f"Checking stats for {len(profile_list)} users...")

    for user_config in profile_list:
        # Extract username from URL
        url = user_config.get('url', '')
        username = url.strip('/').split('/')[-1]
        
        if not username: continue
            
        # A. Get NEW data from LeetCode
        real_name, current_solved = get_leetcode_data(username)
        
        if current_solved == 0: 
            print(f"⚠️ Could not fetch data for {username}")
            continue 

        # B. Get OLD data from MongoDB
        # We check the database to see what their score was last time
        existing_user = users_col.find_one({"username": username})
        previous_solved = existing_user.get("total_solved", 0) if existing_user else 0
        
        # C. Calculate Progress
        diff = current_solved - previous_solved
        
        if diff > 0 and previous_solved > 0:
            print(f"🔥 {real_name} solved +{diff}!")
            
            # Create Activity Log
            ist_time = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%I:%M %p")
            new_activity = {
                "text": f"{real_name} solved +{diff} questions",
                "time": ist_time,
                "type": "up",
                "created_at": datetime.now() # Date object for sorting
            }
            # Insert into 'activities' collection
            activities_col.insert_one(new_activity)
            
            # Optional: Keep only last 10 activities in DB to save space?
            # For now, let's keep all history because MongoDB can handle it!

        # D. Update User in MongoDB
        user_doc = {
            "username": username,
            "name": real_name,
            "total_solved": current_solved,
            "url": url,
            "last_updated": datetime.now()
        }
        
        # This saves the new score to the 'users' collection
        users_col.update_one(
            {"username": username}, 
            {"$set": user_doc}, 
            upsert=True
        )

        time.sleep(0.5) # Be nice to LeetCode API
    
    # E. Update Global "Last Updated" Time
    current_ist = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%d/%m/%Y, %I:%M %p")
    metadata_col.update_one(
        {"type": "last_updated"},
        {"$set": {"date_string": current_ist}},
        upsert=True
    )
    print(f"🕒 Updated timestamp to: {current_ist}")

    print("✅ MongoDB Update Complete")

if __name__ == "__main__":
    update_leaderboard()
