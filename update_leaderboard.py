import os
import requests
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
from followers import get_leetcode_data
from supabase import create_client, Client

# 1. SETUP
load_dotenv()

# Environment variables for Supabase
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for backend operations

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Error: Supabase environment variables not found!")
    exit()

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Supabase connection failed: {e}")
    exit()

# ⚡ Session for connection pooling (Massive TLS handshake speedup)
session = requests.Session()

# 2. WORKER FUNCTION (Process ONE user)
def process_user(user_doc):
    username = user_doc.get("leetcode_handle") # Supabase uses 'leetcode_handle'
    if not username: return None

    # Fetch Data from LeetCode
    url = "https://leetcode.com/graphql"
    query = """
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { realName }
        activeBadge { displayName icon }
        badges { id displayName icon creationDate }
        submitStats { acSubmissionNum { difficulty count } }
      }
    }
    """
    try:
        response = session.post(url, json={"query": query, "variables": {"username": username}}, timeout=10)
        if response.status_code != 200: return None
        
        data = response.json()
        if "errors" in data or not data.get("data") or not data["data"]["matchedUser"]:
            return None

        user_data = data["data"]["matchedUser"]
        real_name = user_data["profile"]["realName"] or user_data["username"].capitalize()
        solved_stats = user_data["submitStats"]["acSubmissionNum"]

        # Badge Logic
        active_badge = user_data.get("activeBadge")
        badges = user_data.get("badges") or []
        
        badge_icon = None
        badge_name = None

        if active_badge:
            badge_icon = active_badge.get("icon")
            badge_name = active_badge.get("displayName")
        elif badges:
            try:
                latest_badge = max(badges, key=lambda b: b.get("creationDate") or "")
                badge_icon = latest_badge.get("icon")
                badge_name = latest_badge.get("displayName")
            except Exception:
                badge_icon = badges[-1].get("icon")
                badge_name = badges[-1].get("displayName")

        # Stats Logic
        stats = {
            "total": 0, "easy": 0, "medium": 0, "hard": 0,
            "badge_icon": badge_icon,
            "badge_name": badge_name
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
            activity_payload = {
                "text": f"{real_name} solved +{diff} questions",
                "time": ist_time,
                "type": "up",
                "created_at": datetime.now().isoformat()
            }
            supabase.from_("activities").insert(activity_payload).execute()

        # Update Database
        user_payload = {
            "name": real_name,
            "url": f"https://leetcode.com/{username}/",
            "total_solved": stats["total"],
            "easy_solved": stats["easy"],
            "medium_solved": stats["medium"],
            "hard_solved": stats["hard"],
            "badge_icon": stats["badge_icon"],
            "badge_name": stats["badge_name"],
            "last_updated": datetime.now().isoformat()
        }
        supabase.from_("leaderboard").update(user_payload).eq("leetcode_handle", username).execute()
        return f"✅ {username}"

    except Exception as e:
        return f"❌ {username}: {e}"

# 3. MAIN PARALLEL LOOP
def update_leaderboard():
    skip_followers = os.environ.get("SKIP_FOLLOWERS", "false").lower() == "true"
    
    if not skip_followers:
        print("Syncing followers and following list...")
        try:
            scraped_users = get_leetcode_data()
            if scraped_users:
                new_users_payload = []
                for username in scraped_users:
                    new_users_payload.append({
                        "leetcode_handle": username,
                        "name": username,
                        "url": f"https://leetcode.com/{username}/"
                    })
                
                if new_users_payload:
                    # Upsert new users, ignoring conflicts on existing handles
                    supabase.from_("leaderboard").upsert(new_users_payload, on_conflict="leetcode_handle").execute()
                    print(f"Synced {len(new_users_payload)} follower/following users.")

        except Exception as e:
            print(f"Follower sync error: {e}")
    else:
        print("⏩ Skipping follower sync for ultra-fast manual update...")

    response = supabase.from_('leaderboard').select('leetcode_handle, total_solved').execute()
    db_users = response.data
    print(f"Checking stats for {len(db_users)} users using 50 parallel workers...")

    # 👇 Run 50 requests at the same time for lightning-fast scraping
    with ThreadPoolExecutor(max_workers=50) as executor:
        results = list(executor.map(process_user, db_users))

    # Update Time
    current_ist = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%d/%m/%Y, %I:%M %p")
    supabase.from_("metadata").upsert({"type": "last_updated", "date_string": current_ist}).execute()
    
    print(f"🚀 Update Complete at {current_ist}")

if __name__ == "__main__":
    update_leaderboard()
