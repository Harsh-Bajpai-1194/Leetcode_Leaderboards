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

URL = "https://leetcode.com/u/harsh_bajpai1/"

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
                    if username and username != "harsh_bajpai1" and username not in all_names:
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


def sync_to_supabase(scraped_names):
    """Takes the scraped LeetCode names and inserts missing ones into Supabase."""
    print("\n🔍 Checking existing users in Supabase...")
    
    # Fetch existing users from Supabase to avoid duplicates
    response = supabase.table("leaderboard").select("leetcode_handle").execute()
    existing_users = [user["leetcode_handle"] for user in response.data]
    
    # Compare and find missing users
    new_users = [u for u in scraped_names if u not in existing_users]
    print(f"🌟 Found {len(new_users)} completely new users to add to the leaderboard!")
    
    if not new_users:
        print("Everything is up to date! Exiting.")
        return
        
    # Prepare the payload for Supabase
    payload = []
    for user in new_users:
        payload.append({
            "leetcode_handle": user,
            "total_solved": 0,
            "easy_solved": 0,
            "medium_solved": 0,
            "hard_solved": 0,
            # The Supabase Edge Function will fill in the actual stats later!
        })
    
    # Insert into Supabase in safe batches of 50
    batch_size = 50
    for i in range(0, len(payload), batch_size):
        batch = payload[i:i+batch_size]
        supabase.table("leaderboard").insert(batch).execute()
        print(f"⬆️ Inserted batch {i//batch_size + 1}...")
        
    print("\n🎉 Sync Complete! Your Supabase Edge Function will automatically scrape their LeetCode stats on its next run.")


if __name__ == "__main__":
    # 1. Scrape all usernames using your Selenium logic
    names = get_leetcode_data()
    print(f"\nFound {len(names)} unique followers/following from LeetCode.")
    
    # 2. Push any new ones to your Supabase database
    if names:
        sync_to_supabase(names)