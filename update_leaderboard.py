import os
import requests
import time
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

# 1. SETUP MONGODB
load_dotenv()
# Get URI from Environment (Local .env) or GitHub Secrets
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    print("⚠️ Error: MONGO_URI not found!")
    exit()

try:
    client = MongoClient(mongo_uri)
    db = client["leetcode_db"]
    users_col = db["users"]
    activities_col = db["activities"]
    metadata_col = db["metadata"]
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit()

# 2. THE SCRAPER FUNCTION
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
                return None

            user_data = data["data"]["matchedUser"]
            # Use Real Name if available, otherwise fallback to username
            real_name = user_data["profile"]["realName"] or user_data["username"]
            
            solved_stats = user_data["submitStats"]["acSubmissionNum"]
            
            stats = {
                "real_name": real_name,
                "total": 0,
                "easy": 0,
                "medium": 0,
                "hard": 0
            }

            for item in solved_stats:
                if item["difficulty"] == "All": stats["total"] = item["count"]
                if item["difficulty"] == "Easy": stats["easy"] = item["count"]
                if item["difficulty"] == "Medium": stats["medium"] = item["count"]
                if item["difficulty"] == "Hard": stats["hard"] = item["count"]
            
            return stats

        return None
    except Exception as e:
        print(f"Error fetching {username}: {e}")
        return None

# 3. THE UPDATE LOOP (FIXED TO READ FROM DB 🟢)
def update_leaderboard():
    
    # 👇 CHANGE: Get users directly from the Database instead of profiles.json
    db_users = list(users_col.find())
    print(f"Checking stats for {len(db_users)} users found in Database...")

    for user_doc in db_users:
        username = user_doc.get("username")
        
        if not username: continue
            
        # A. Get NEW data from LeetCode
        stats = get_leetcode_data(username)
        
        if not stats: 
            print(f"⚠️ Could not fetch data for {username}")
            continue 

        # B. Get OLD data (from the doc we just fetched)
        previous_solved = user_doc.get("total_solved", 0)
        current_solved = stats["total"]

        # C. Calculate Progress
        diff = current_solved - previous_solved
        
        if diff > 0 and previous_solved > 0:
            print(f"🔥 {stats['real_name']} solved +{diff}!")
            
            # Create Activity Log
            ist_time = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%I:%M %p")
            new_activity = {
                "text": f"{stats['real_name']} solved +{diff} questions",
                "time": ist_time,
                "type": "up",
                "created_at": datetime.now()
            }
            activities_col.insert_one(new_activity)

        # D. Update User in MongoDB
        # We ensure all fields (Easy/Med/Hard) are kept in sync
        users_col.update_one(
            {"username": username}, 
            {"$set": {
                "name": stats["real_name"],
                "total_solved": stats["total"],
                "easy_solved": stats["easy"],
                "medium_solved": stats["medium"],
                "hard_solved": stats["hard"],
                "last_updated": datetime.now()
            }}
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