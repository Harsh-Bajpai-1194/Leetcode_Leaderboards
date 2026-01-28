import os
import requests
import time
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

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
    metadata_col = db["metadata"]
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit()

# 2. WORKER FUNCTION (Process ONE user)
def process_user(user_doc):
    username = user_doc.get("username")
    if not username: return None

    # Fetch Data from LeetCode
    url = "https://leetcode.com/graphql"
    query = """
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { realName }
        badges { id displayName icon }
        submitStats { acSubmissionNum { difficulty count } }
      }
    }
    """
    try:
        response = requests.post(url, json={"query": query, "variables": {"username": username}}, timeout=5)
        if response.status_code != 200: return None
        
        data = response.json()
        if "errors" in data or not data.get("data") or not data["data"]["matchedUser"]:
            return None

        user_data = data["data"]["matchedUser"]
        real_name = user_data["profile"]["realName"] or user_data["username"]
        solved_stats = user_data["submitStats"]["acSubmissionNum"]

        # Badge Logic
        active_badge = None
        badges = user_data.get("badges", [])
        for b in badges:
            if "Guardian" in b["displayName"] or "Knight" in b["displayName"]:
                active_badge = b
                break
        if not active_badge and badges: active_badge = badges[-1]

        # Stats Logic
        stats = {
            "total": 0, "easy": 0, "medium": 0, "hard": 0,
            "badge_icon": active_badge["icon"] if active_badge else None,
            "badge_name": active_badge["displayName"] if active_badge else None
        }
        for item in solved_stats:
            if item["difficulty"] == "All": stats["total"] = item["count"]
            if item["difficulty"] == "Easy": stats["easy"] = item["count"]
            if item["difficulty"] == "Medium": stats["medium"] = item["count"]
            if item["difficulty"] == "Hard": stats["hard"] = item["count"]

        # Check for Activity (Progress)
        previous_solved = user_doc.get("total_solved", 0)
        diff = stats["total"] - previous_solved

        if diff > 0 and previous_solved > 0:
            print(f"🔥 {real_name} solved +{diff}!")
            ist_time = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%I:%M %p")
            activities_col.insert_one({
                "text": f"{real_name} solved +{diff} questions",
                "time": ist_time,
                "type": "up",
                "created_at": datetime.now()
            })

        # Update Database
        users_col.update_one(
            {"username": username}, 
            {"$set": {
                "name": real_name,
                "total_solved": stats["total"],
                "easy_solved": stats["easy"],
                "medium_solved": stats["medium"],
                "hard_solved": stats["hard"],
                "badge_icon": stats["badge_icon"],
                "badge_name": stats["badge_name"],
                "last_updated": datetime.now()
            }}
        )
        return f"✅ {username}"

    except Exception as e:
        return f"❌ {username}: {e}"

# 3. MAIN PARALLEL LOOP
def update_leaderboard():
    db_users = list(users_col.find())
    print(f"Checking stats for {len(db_users)} users using 5 parallel workers...")

    # 👇 Run 5 requests at the same time
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(process_user, db_users))

    # Update Time
    current_ist = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%d/%m/%Y, %I:%M %p")
    metadata_col.update_one({"type": "last_updated"}, {"$set": {"date_string": current_ist}}, upsert=True)
    
    print(f"🚀 Update Complete at {current_ist}")

if __name__ == "__main__":
    update_leaderboard()