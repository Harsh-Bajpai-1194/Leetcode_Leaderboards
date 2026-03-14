from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

URL = "https://leetcode.com/u/harsh_bajpai1/"

def get_leetcode_data():
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    # Using detach so you can see if the modal actually opened
    chrome_options.add_experimental_option("detach", True) 
    
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 15)

    try:
        driver.get(URL)
        
        for label in ["Following", "Followers"]:
            print(f"\n--- Scraping {label} ---")
            
            # 1. Click the button (Following/Followers)
            btn_xpath = f"//div[contains(text(), '{label}')]"
            button = wait.until(EC.element_to_be_clickable((By.XPATH, btn_xpath)))
            driver.execute_script("arguments[0].click();", button)
            
            # 2. Wait for the modal container to exist (using a common overlay class)
            # This selector looks for any div that covers the screen or has a fixed position
            try:
                # Wait for any new list to appear in the DOM
                time.sleep(3) 
                
                # Broad selector: Find all profile links that appeared AFTER clicking
                # Profile links on LeetCode start with /u/
                links = driver.find_elements(By.XPATH, "//a[contains(@href, '/u/')]")
                
                names = []
                for link in links:
                    name_text = link.text.strip()
                    
                    # LOGIC: Your own name (Harsh Bajpai) is always on the page.
                    # We want to skip your name and focus on the ones that just appeared.
                    if name_text and "Harsh" not in name_text and name_text != "Follow":
                        if name_text not in names and not name_text.isdigit():
                            names.append(name_text)
                
                if names:
                    for idx, name in enumerate(names, 1):
                        print(f"{idx}. {name}")
                else:
                    print(f"No names found for {label}. Try scrolling the list manually while the script waits.")
                    
            except Exception as inner_err:
                print(f"Error while reading names: {inner_err}")

            # 3. Refresh to clear the modal
            driver.refresh()
            time.sleep(2)

    except Exception as e:
        print(f"General Error: {str(e)}")
    finally:
        print("\nProcess finished.")

if __name__ == "__main__":
    get_leetcode_data()