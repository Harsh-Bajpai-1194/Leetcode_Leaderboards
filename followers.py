import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Load environment variables & Supabase Setup
load_dotenv()
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use service key for write access
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Use an environment variable for the target username, with a sensible default.
TARGET_USERNAME = os.environ.get("LEETCODE_TARGET_USERNAME", "harsh_bajpai1")
URL = f"https://leetcode.com/u/{TARGET_USERNAME}/"

def get_leetcode_data():
    """Scrapes Followers and Following directly from your LeetCode profile using Selenium."""
    global_names = set()
    chrome_options = Options()
    chrome_options.add_argument("--headless=new") 
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 20)

    try:
        driver.get(URL)
        time.sleep(6) # Wait for initial load
        
        for label in ["Following", "Followers"]:
            print(f"\n--- Scraping {label} ---")
            
            tab_xpath = f"//*[contains(text(), '{label}')]"
            tab_button = wait.until(EC.element_to_be_clickable((By.XPATH, tab_xpath)))
            driver.execute_script("arguments[0].click();", tab_button)
            time.sleep(3)

            all_names = []
            page_num = 1

            while True:
                user_elements = driver.find_elements(By.XPATH, "//a[contains(@href, '/u/')]")
                
                new_names_on_page = 0
                for el in user_elements:
                    href = el.get_attribute("href")
                    username = href.split('/u/')[-1].strip('/')
                    if username and username != TARGET_USERNAME and username not in all_names:
                        all_names.append(username)
                        global_names.add(username)
                        print(f"Page {page_num}: Found {username}")
                        new_names_on_page += 1

                try:
                    next_btns = driver.find_elements(By.XPATH, 
                        "//button[*[local-name()='svg' and (@data-icon='chevron-right' or contains(@data-icon, 'right'))]] | "
                        "//button[contains(@aria-label, 'next') or contains(@aria-label, 'Next')] | "
                        "//div[@role='dialog']//nav//button[last()]"
                    )
                    
                    if next_btns:
                        next_button = next_btns[0]
                        is_disabled = next_button.get_attribute("disabled") or "opacity-50" in next_button.get_attribute("class")
                        
                        if is_disabled:
                            break
                        
                        driver.execute_script("arguments[0].click();", next_button)
                        page_num += 1
                        time.sleep(2.5)
                        continue
                        
                    if user_elements:
                        driver.execute_script("arguments[0].scrollIntoView(true);", user_elements[-1])
                        time.sleep(2.5)
                        current_elements = driver.find_elements(By.XPATH, "//a[contains(@href, '/u/')]")
                        if len(current_elements) > len(user_elements):
                            page_num += 1
                            continue
                            
                    break
                except Exception as e:
                    print(f"Finished pages for {label}. Reason: {e}")
                    break
            
            print(f"✅ Total {label} found: {len(all_names)}")
            driver.refresh()
            time.sleep(4)

    except Exception as e:
        print(f"General Error: {str(e)}")
    finally:
        driver.quit()
        print("\nScraping finished.")
        return list(global_names)