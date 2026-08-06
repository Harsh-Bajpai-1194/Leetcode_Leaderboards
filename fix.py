import os
import requests
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. SETUP
load_dotenv()

# Environment variables for Supabase
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Error: Supabase environment variables not found!")
    exit()

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Supabase connection failed: {e}")
    exit()

# Session for connection pooling
session = requests.Session()

def backfill_submission_ids():
    """
    Finds and updates activities with a NULL submission_id by matching them
    against a user's recent LeetCode submissions.
    """
    print("\n🛠️ Starting backfill process for missing submission IDs...")
    
    # 1. Fetch all users to create a name -> handle map (for fallback purposes)
    # This is used for older activities that don't have a leetcode_handle.
    try:
        users_res = supabase.from_("leaderboard").select("name, leetcode_handle").execute()
        name_to_handle = {user['name']: user['leetcode_handle'] for user in users_res.data}
        print(f"Loaded {len(name_to_handle)} users into name-map.")
    except Exception as e:
        print(f"❌ Could not fetch users for backfill. Aborting. Error: {e}")
        return
        
    # 2. Fetch all activities that are missing a submission_id
    # We only want detailed activities like "User solved Problem", not "+X questions"
    try:
        activities_res = supabase.from_("activities").select("id, text, created_at, leetcode_handle").is_("submission_id", "null").like("text", "% solved %").not_.like("text", "%+%").execute()
        activities_to_fix = activities_res.data
    except Exception as e:
        print(f"❌ Could not fetch activities to fix. Aborting. Error: {e}")
        return
        
    if not activities_to_fix:
        print("✅ No activities found needing a backfill. All good!")
        return
        
    print(f"Found {len(activities_to_fix)} activities to potentially fix.")

    # 3. Process each activity
    updated_count = 0
    for activity in activities_to_fix:
        try:
            text = activity['text']
            parts = text.split(" solved ")
            if len(parts) != 2:
                continue
            _, problem_title = parts
            
            username = activity.get('leetcode_handle')

            # If the activity record doesn't have the handle, fall back to the old, brittle name-matching logic.
            if not username:
                print(f"⚠️ Activity ID {activity['id']} missing handle, falling back to name parsing...")
                name = parts[0]
                if name not in name_to_handle:
                    print(f"   -> Skipping, name '{name}' not in user map.")
                    continue
                username = name_to_handle[name]

            activity_dt = datetime.fromisoformat(activity['created_at'].replace('Z', '+00:00'))

            # 4. Fetch recent submissions for the user from LeetCode
            submission_query = "query recentAcSubmissions($username: String!, $limit: Int!) { recentAcSubmissionList(username: $username, limit: $limit) { id title timestamp } }"
            sub_response = session.post("https://leetcode.com/graphql", json={"query": submission_query, "variables": {"username": username, "limit": 20}}, timeout=15)
            
            if sub_response.status_code != 200:
                continue
            
            submission_list = sub_response.json().get("data", {}).get("recentAcSubmissionList")
            if not submission_list:
                continue

            # 5. Find the best matching submission based on title and time proximity
            best_match = None
            min_time_diff = timedelta(days=2) # Set a reasonable time window

            for sub in submission_list:
                if sub['title'] == problem_title:
                    sub_dt = datetime.fromtimestamp(int(sub['timestamp']), tz=timezone.utc)
                    if abs(activity_dt - sub_dt) < min_time_diff:
                        min_time_diff = abs(activity_dt - sub_dt)
                        best_match = sub

            # 6. Update the activity in Supabase if a good match was found
            if best_match:
                print(f"✅ Match for '{text}' -> Sub ID: {best_match['id']}. Updating...")
                supabase.from_("activities").update({"submission_id": best_match['id']}).eq("id", activity['id']).execute()
                updated_count += 1
                time.sleep(0.2)

        except Exception as e:
            print(f"❌ Error processing activity ID {activity['id']}: {e}")
            
    print(f"\n✅ Backfill process complete. Updated {updated_count} activities.")

if __name__ == "__main__":
    backfill_submission_ids()