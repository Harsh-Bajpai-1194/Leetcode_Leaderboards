import os
import json
import time
from datetime import datetime, timedelta, timezone
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

def get_solved_count(text):
    try:
        return int(text.split('/')[0])
    except:
        return 0

def scrape_user_data(driver, url):
    """
    Scrapes both the Real Name and Total Solved count from a LeetCode profile.
    Returns: (real_name, total_solved)
    """
    print(f"   -> Processing: {url}")
    try:
        driver.get(url)
        # Wait for dynamic content (Essential for LeetCode)
        time.sleep(5) 
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # --- PART 1: SCRAPE SOLVED COUNT ---
        # Look for the 'Easy', 'Med.', 'Hard' labels to find the counts
        lines = soup.get_text(separator='\n', strip=True).split('\n')
        easy = med = hard = 0
        
        for i in range(len(lines)):
            if lines[i] == "Easy":
                easy = get_solved_count(lines[i+1])
            elif lines[i] == "Med.":
                med = get_solved_count(lines[i+1])
            elif lines[i] == "Hard":
                hard = get_solved_count(lines[i+1])
        
        total_solved = easy + med + hard

        # --- PART 2: SCRAPE REAL NAME ---
        target_username = url.strip('/').split('/')[-1]
        all_text = list(soup.stripped_strings)
        
        real_name = target_username # Default to username
        
        # Find where the username appears in the text list
        index = -1
        for i, text in enumerate(all_text):
            if text.lower() == target_username.lower():
                index = i
                break
        
        if index > 0:
            candidate_name = all_text[index - 1]
            
            # Filter out "Junk" words that appear if no Real Name is set
            junk_words = ["Premium", "Store", "Redeem", "Assessment", 
                          "Register", "Sign in", "Log in", "Explore", "Problems"]
            
            if candidate_name not in junk_words:
                real_name = candidate_name

        print(f"      Found: Name='{real_name}', Solved={total_solved}")
        return real_name, total_solved

    except Exception as e:
        print(f"      ⚠️ Error scraping {url}: {e}")
        return None, 0

def update_leaderboard():
    # File setup
    file_path = os.path.join(os.getcwd(), 'profiles.json')
    print(f"--- Starting Update: {datetime.now()} ---")
    
    # Load JSON
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        profiles = data["users"] if isinstance(data, dict) else data
        print(f"✅ Loaded {len(profiles)} users from profiles.json")
    except Exception as e:
        print(f"❌ Failed to load JSON: {e}")
        return

    # Setup Driver (Single instance for all users)
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    # Loop through users
    for user in profiles:
        real_name, total_solved = scrape_user_data(driver, user['url'])
        
        # Update JSON object
        if real_name:
            user['name'] = real_name 
        
        # Only update score if we got a valid number (prevent resetting to 0 on error)
        if total_solved > 0:
            user['total_solved'] = total_solved

    driver.quit()

    # Save Updates
    ist_time = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    final_data = {
        "last_updated": ist_time.strftime("%d/%m/%Y, %I:%M %p"),
        "users": profiles
    }

    with open(file_path, 'w') as f:
        json.dump(final_data, f, indent=2)
    
    print(f"✅ Successfully updated profiles.json at {final_data['last_updated']}")

if __name__ == "__main__":
    update_leaderboard()
