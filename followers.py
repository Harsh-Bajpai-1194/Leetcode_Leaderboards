from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

URL = "https://leetcode.com/u/harsh_bajpai1/"

def get_leetcode_data():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new") 
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 20) # Increased timeout

    try:
        driver.get(URL)
        time.sleep(6) # Wait for initial load
        
        for label in ["Following", "Followers"]:
            print(f"\n--- Scraping {label} ---")
            
            # Use a more flexible XPath to find the tab
            tab_xpath = f"//*[contains(text(), '{label}')]"
            tab_button = wait.until(EC.element_to_be_clickable((By.XPATH, tab_xpath)))
            driver.execute_script("arguments[0].click();", tab_button)
            time.sleep(3)

            all_names = []
            page_num = 1

            while True:
                # Get links that are inside the list container (excluding the profile owner)
                user_elements = driver.find_elements(By.XPATH, "//a[contains(@href, '/u/')]")
                
                new_names_on_page = 0
                for el in user_elements:
                    href = el.get_attribute("href")
                    username = href.split('/u/')[-1].strip('/')
                    if username and username != "harsh_bajpai1" and username not in all_names:
                        all_names.append(username)
                        print(f"Page {page_num}: Found {username}")
                        new_names_on_page += 1

                # Locate the 'Next' button (the chevron-right)
                try:
                    # Broadened XPath to catch different variations of the "Next" button
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
                        
                    # Fallback: Handle Infinite Scroll
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
        print("\nProcess finished.")

if __name__ == "__main__":
    get_leetcode_data()