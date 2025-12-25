from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import json

def get_solved_count(text):
    try:
        return int(text.split('/')[0])
    except:
        return 0

def scrape_user_total(url, driver):
    try:
        driver.get(url)
        # Use Explicit Wait to wait for the "Easy" label to appear (up to 20 seconds)
        wait = WebDriverWait(driver, 20)
        wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Easy')]")))
        
        # Additional small buffer for the numbers to catch up
        time.sleep(2) 
        
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
        print(f"Error scraping {url}: {e}")
        return 0

def update_leaderboard():
    with open('profiles.json', 'r') as f:
        profiles = json.load(f)

    options = webdriver.ChromeOptions()
    options.add_argument('--headless') 
    # Important: Set a window size so elements are rendered correctly
    options.add_argument('--window-size=1920,1080')
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    print(f"Starting scrape for {len(profiles)} users...")
    for user in profiles:
        print(f"Scraping {user['name']}...")
        user['total_solved'] = scrape_user_total(user['url'], driver)
    
    driver.quit()

    with open('profiles.json', 'w') as f:
        json.dump(profiles, f, indent=2)
    print("profiles.json updated successfully!")

if __name__ == "__main__":
    update_leaderboard()