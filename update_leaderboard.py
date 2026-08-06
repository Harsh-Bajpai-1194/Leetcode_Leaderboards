import os
import requests
import time
import json
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
        userCalendar { submissionCalendar }
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

        # Extract and parse the calendar JSON string
        raw_calendar = user_data.get("userCalendar", {}).get("submissionCalendar")
        parsed_calendar = json.loads(raw_calendar) if raw_calendar and raw_calendar != "null" else {}

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
        last_updated_time = user_doc.get("last_updated")
        diff = stats["total"] - previous_solved

        # This flag will be used to determine if the user's main record should be updated.
        # It's set to False only when we detect API lag, to prevent "burning" a diff.
        should_update_user_record = True

        # Log activity only if the user has been updated at least once before.
        if diff > 0 and last_updated_time is not None:
            print(f"🔥 {real_name} solved +{diff}!")

            try:
                # Fetch the 'diff' most recent submissions to create individual activity logs.
                # Cap at 15 to avoid overly large requests.
                limit = min(diff, 15)

                submission_query = """
                query recentAcSubmissions($username: String!, $limit: Int!) {
                  recentAcSubmissionList(username: $username, limit: $limit) {
                    id
                    title
                    timestamp
                  }
                }
                """
                sub_response = session.post(
                    "https://leetcode.com/graphql",
                    json={"query": submission_query, "variables": {"username": username, "limit": limit}},
                    timeout=15
                )

                if sub_response.status_code == 200:
                    sub_data = sub_response.json()
                    submission_list = sub_data.get("data", {}).get("recentAcSubmissionList")

                    if submission_list:  # User has public, visible submissions
                        user_last_updated_dt = datetime.fromisoformat(last_updated_time.replace('Z', '+00:00'))
                        new_activities = []

                        for sub in submission_list:
                            submission_dt = datetime.fromtimestamp(int(sub['timestamp']), tz=timezone.utc)
                            # Only log submissions that are genuinely new since the last update
                            if submission_dt > user_last_updated_dt:
                                ist_time = submission_dt.astimezone(timezone(timedelta(hours=5, minutes=30))).strftime("%I:%M %p")
                                new_activities.append({
                                    "leetcode_handle": username,
                                    "text": f"{real_name} solved {sub.get('title')}",
                                    "time": ist_time,
                                    "type": "up",
                                    "created_at": submission_dt.isoformat(),
                                    "submission_id": sub.get('id')
                                })

                        if new_activities:
                            # Insert oldest-first to maintain chronological order in the feed
                            supabase.from_("activities").insert(new_activities[::-1]).execute()
                            print(f"✅ Logged {len(new_activities)} new detailed activities for {real_name}.")
                        else:
                            # API LAG DETECTED: A diff exists, but the submission API hasn't caught up.
                            # We will skip updating this user's record to try again on the next run.
                            print(f"ℹ️ {real_name} has a diff of {diff}, but no new submissions were found. API might be lagging. Skipping DB update for this user.")
                            should_update_user_record = False

                    else:
                        # This occurs for users with private submission history
                        print(f"DEBUG: No recent submissions found for {real_name} (private profile?). Logging generically.")
                        raise Exception("Submission list is null or empty.") # Force fallback
                else:
                    raise Exception(f"API request failed with status {sub_response.status_code}")

            except Exception as e:
                # Fallback for any error (private profile, API error): log a single generic activity.
                # The user record will still be updated.
                print(f"⚠️ Could not fetch submission details for {real_name}: {e}. Logging generically.")
                ist_time = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%I:%M %p")
                supabase.from_("activities").insert({
                    "leetcode_handle": username,
                    "text": f"{real_name} solved +{diff} questions",
                    "time": ist_time,
                    "submission_id": None,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "type": "up"
                }).execute()

        # Always prepare the main user data payload from the initial GraphQL query.
        user_payload = {
            "name": real_name,
            "url": f"https://leetcode.com/{username}/",
            "badge_icon": stats["badge_icon"],
            "badge_name": stats["badge_name"],
            "calendar_data": parsed_calendar
        }

        # Conditionally add solve counts and the last_updated timestamp.
        # This is the fix: we only update these sensitive fields if we are NOT experiencing API lag.
        # This prevents the "soft-lock" while still allowing calendar data to be updated.
        if should_update_user_record:
            user_payload["total_solved"] = stats["total"]
            user_payload["easy_solved"] = stats["easy"]
            user_payload["medium_solved"] = stats["medium"]
            user_payload["hard_solved"] = stats["hard"]
            # Only move the timestamp forward if we are updating the solve counts.
            user_payload["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        # Execute the update. The payload will either be partial (just profile info) or full.
        supabase.from_("leaderboard").update(user_payload).eq("leetcode_handle", username).execute()

        if should_update_user_record:
            return f"✅ {username}"
        else:
            # This is the case where we skipped the solve count update due to API lag
            return f"⏳ {username}: Skipped solve count update due to API lag, but synced calendar."

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
                # Fetch existing handles to prevent duplicates before insertion
                response = supabase.from_("leaderboard").select("leetcode_handle").execute()
                existing_handles = {user['leetcode_handle'].lower() for user in response.data}

                new_users_payload = []
                for username in scraped_users:
                    # Add user only if they don't already exist (case-insensitive check)
                    if username.lower() not in existing_handles:
                        new_users_payload.append({
                            "leetcode_handle": username,
                            "name": username,
                            "url": f"https://leetcode.com/{username}/"
                        })
                        # Add to set to avoid adding duplicates from the scraped list itself
                        existing_handles.add(username.lower())
                
                if new_users_payload:
                    # Use a simple insert since we have already filtered out duplicates
                    supabase.from_("leaderboard").insert(new_users_payload).execute()
                    print(f"Synced {len(new_users_payload)} new follower/following users.")

        except Exception as e:
            print(f"Follower sync error: {e}")
    else:
        print("⏩ Skipping follower sync for ultra-fast manual update...")

    response = supabase.from_('leaderboard').select('leetcode_handle, total_solved, last_updated').execute()
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
