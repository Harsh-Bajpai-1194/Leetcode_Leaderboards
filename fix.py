import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
db = client["leetcode_db"]
activities = db["activities"]

# Fetch the oldest and newest activity
oldest = activities.find_one(sort=[("created_at", 1)])
newest = activities.find_one(sort=[("created_at", -1)])

print(f"📉 Total Activities: {activities.count_documents({})}")

if oldest:
    print(f"📅 Oldest Record: {oldest.get('created_at', 'No Date Found')}")
else:
    print("❌ No activities found.")

if newest:
    print(f"📅 Newest Record: {newest.get('created_at', 'No Date Found')}")