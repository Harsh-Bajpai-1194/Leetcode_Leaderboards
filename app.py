import os
import json
import time
from datetime import datetime
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

def scrape_user_total(url, driver):
    try:
        driver.get(url)
        wait = WebDriverWait(driver, 15)
        wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Easy')]")))
        time.sleep(3) 
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        lines = soup.get_text(separator='\n', strip=True).split('\n')
        
        easy = med = hard = 0
        for i in range(len(lines)):
            if lines[i] == "Easy":
                easy = get_solved_count(lines[i+1])
            elif lines[i] == "Med.":
                med = get_solved_count(lines[i+1])
            elif lines[i] == "Hard":
                hard = get_solved_count(lines[i+1])
        return easy + med + hard
    except Exception as e:
        print(f"  ⚠️ Error scraping {url}: {e}")
        return 0

def update_leaderboard():
    # Ensure we use the correct file path for GitHub Actions
    file_path = os.path.join(os.getcwd(), 'profiles.json')
    
    print(f"--- Starting Update: {datetime.now()} ---")
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        profiles = data["users"] if isinstance(data, dict) else data
        print(f"✅ Loaded {len(profiles)} users from profiles.json")
    except Exception as e:
        print(f"❌ Failed to load JSON: {e}")
        return

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    for user in profiles:
        print(f"🔍 Scraping {user['name']}...")
        user['total_solved'] = scrape_user_total(user['url'], driver)
        print(f"   -> Solved: {user['total_solved']}")
    
    driver.quit()

    final_data = {
        "last_updated": datetime.now().strftime("%d/%m/%Y, %I:%M %p"),
        "users": profiles
    }

    with open(file_path, 'w') as f:
        json.dump(final_data, f, indent=2)
    
    print(f"✅ Successfully updated profiles.json at {final_data['last_updated']}")

if __name__ == "__main__":
    update_leaderboard()