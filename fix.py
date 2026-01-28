import os
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

print("🔌 Connecting to the LIVE Database...")
client = MongoClient(MONGO_URI)
db = client.get_database("leetcode_db")
users_collection = db.users

# 1. Check if we can find him now
user = users_collection.find_one({"username": "neal_wu"})
if user:
    print("✅ Found 'neal_wu' in this database!")
else:
    print("❌ Still can't find 'neal_wu'. Check your MONGO_URI again!")
    exit()

# 2. Fix the name to match API case (just to be safe)
print("🛠️  Renaming 'neal_wu' to 'Neal_Wu'...")
users_collection.update_one({"username": "neal_wu"}, {"$set": {"username": "Neal_Wu"}})

# 3. Force Update Stats
print("🌍 Fetching data for Neal_Wu...")
query = """
    query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
            submitStats {
                acSubmissionNum { difficulty count }
            }
        }
    }
"""
response = requests.post("https://leetcode.com/graphql", json={"query": query, "variables": {"username": "Neal_Wu"}})
data = response.json()

try:
    stats = data['data']['matchedUser']['submitStats']['acSubmissionNum']
    total = next(item['count'] for item in stats if item['difficulty'] == 'All')
    
    print(f"📈 Found {total} solved! Updating DB...")
    users_collection.update_one(
        {"username": "Neal_Wu"},
        {"$set": {"total_solved": total}}
    )
    print("✅ SUCCESS! Refresh your website.")
except Exception as e:
    print(f"❌ Error: {e}")
    print("API Response:", data)