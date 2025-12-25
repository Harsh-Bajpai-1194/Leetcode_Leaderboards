from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import json
from datetime import datetime

def get_solved_count(text):
    try:
        # Splits '197/918' and takes the first number
        return int(text.split('/')[0])
    except:
        return 0

def scrape_user_total(url, driver):
    try:
        driver.get(url)
        # Wait for the statistics section to appear
        wait = WebDriverWait(driver, 20)
        wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Easy')]")))
        
        # Buffer to ensure numbers are fully populated in the UI
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
        
        total = easy + med + hard
        print(f"Captured: {total}")
        return total
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return 0

def update_leaderboard():
    # Load profile list (expects the simple array format initially)
    with open('profiles.json', 'r') as f:
        data = json.load(f)
    
    # Handle both old array format and new dictionary format
    profiles = data["users"] if isinstance(data, dict) else data

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    print(f"Starting scrape for {len(profiles)} users...")
    for user in profiles:
        print(f"Scraping {user['name']}...")
        user['total_solved'] = scrape_user_total(user['url'], driver)
    
    driver.quit()

    # Create new JSON structure with timestamp
    final_data = {
        "last_updated": datetime.now().strftime("%d/%m/%Y, %I:%M %p"),
        "users": profiles
    }

    with open('profiles.json', 'w') as f:
        json.dump(final_data, f, indent=2)
    print(f"Updated at {final_data['last_updated']}")

if __name__ == "__main__":
    update_leaderboard()