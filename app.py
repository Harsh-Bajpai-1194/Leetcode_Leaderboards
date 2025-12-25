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
        # Extracts '389' from '389/3312'
        return int(text.split('/')[0])
    except (ValueError, IndexError, AttributeError):
        return 0

def scrape_user_total(url, driver):
    try:
        driver.get(url)
        # Explicitly wait for the dynamic content to load
        wait = WebDriverWait(driver, 15)
        # We wait for the 'Easy' label which signifies the stats grid is present
        wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Easy')]")))
        
        # A 3-second buffer ensures the numbers inside the grid are populated
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
        return total
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return 0

def update_leaderboard():
    # 1. Load profiles.json safely
    try:
        with open('profiles.json', 'r') as f:
            data = json.load(f)
        
        # This part is the fix: It handles both old and new formats
        if isinstance(data, dict) and "users" in data:
            profiles = data["users"]
        else:
            profiles = data
            
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"File error: {e}")
        return

    # 2. Configure Chrome
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    # 3. Scrape data
    print(f"Starting update...")
    for user in profiles:
        print(f"Fetching: {user['name']}...")
        user['total_solved'] = scrape_user_total(user['url'], driver)
    
    driver.quit()

    # 4. Save with timestamp
    final_data = {
        "last_updated": datetime.now().strftime("%d/%m/%Y, %I:%M %p"),
        "users": profiles
    }

    with open('profiles.json', 'w') as f:
        json.dump(final_data, f, indent=2)
    print("Success!")