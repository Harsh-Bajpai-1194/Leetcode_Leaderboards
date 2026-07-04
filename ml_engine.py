import os
import requests
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from supabase import create_client, Client
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

# 1. Setup Supabase
load_dotenv()
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase keys for ML Engine!")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. LeetCode GraphQL Query for Contest History
def get_contest_history(username):
    url = "https://leetcode.com/graphql"
    query = """
    query getUserContestRankingHistory($username: String!) {
        userContestRankingHistory(username: $username) {
            attended
            rating
            contest { startTime }
        }
    }
    """
    try:
        response = requests.post(url, json={'query': query, 'variables': {'username': username}}, timeout=10)
        data = response.json()
        history = data.get('data', {}).get('userContestRankingHistory', [])
        return [h for h in history if h['attended'] == True]
    except Exception as e:
        print(f"⚠️ Error fetching {username}: {e}")
        return []

# 3. Machine Learning Prediction Logic
def predict_future_rating(user):
    username = user['leetcode_handle']
    history = get_contest_history(username)
    
    # --- FIX: Filter out contests where rating is None ---
    # This prevents the model from breaking on invalid data.
    valid_history = [h for h in history if h.get('rating') is not None]
    
    if len(valid_history) < 3:
        return None

    # Prepare Data for Scikit-Learn
    df = pd.DataFrame(valid_history)
    df['startTime'] = df['contest'].apply(lambda x: x['startTime'])
    
    # X = Time (Independent variable), y = Rating (Dependent variable)
    X = np.array(df['startTime']).reshape(-1, 1)
    y = np.array(df['rating'])

    # Train the Linear Regression Model
    model = LinearRegression()
    model.fit(X, y)

    # Predict exactly 30 days (2592000 seconds) into the future
    last_timestamp = df['startTime'].iloc[-1]
    future_time = np.array([[last_timestamp + 2592000]])
    predicted_rating = model.predict(future_time)[0]

    # Don't predict crazy negative drops or impossible spikes
    current_rating = y[-1]
    predicted_rating = max(current_rating - 100, min(current_rating + 150, predicted_rating))

    print(f"🤖 ML Prediction for {username}: Current={round(current_rating)} -> Next Month={round(predicted_rating)}")
    
    # Update Supabase
    supabase.table('leaderboard').update({
        'predicted_rating': round(predicted_rating)
    }).eq('leetcode_handle', username).execute()

def run_ml_pipeline():
    print("🚀 Starting CodeX Machine Learning Pipeline...")
    
    # Fetch all users
    response = supabase.table('leaderboard').select('leetcode_handle').execute()
    users = response.data
    
    # Run predictions in parallel for extreme speed
    with ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(predict_future_rating, users)
        
    print("✅ ML Predictions Complete & Saved to Database!")

if __name__ == "__main__":
    run_ml_pipeline()