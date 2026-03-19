from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
from selenium.webdriver.common.keys import Keys

URL = "https://leetcode.com/u/harsh_bajpai1/"

def get_leetcode_data():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    # Add a normal User-Agent so Cloudflare doesn't block the headless browser
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 15)

    try:
        driver.get(URL)
        # Wait for LeetCode's React App (and Cloudflare) to fully load
        time.sleep(5) 
        print(f"Loaded Page Title: {driver.title}")
        
        for label in ["Following", "Followers"]:
            print(f"\n--- Scraping {label} ---")
            
            # 1. Click the button (Following/Followers)
            # Look for ANY element containing the text (not just divs)
            btn_xpath = f"//*[contains(text(), '{label}')]"
            elements = wait.until(EC.presence_of_all_elements_located((By.XPATH, btn_xpath)))
            
            clicked = False
            for el in elements:
                try:
                    driver.execute_script("arguments[0].click();", el)
                    clicked = True
                    break
                except:
                    continue
                    
            if not clicked:
                print(f"Could not click on {label}.")
                continue
            
            # 2. Wait for the modal container to exist (using a common overlay class)
            # This selector looks for any div that covers the screen or has a fixed position
            try:
                # Wait for any new list to appear in the DOM
                time.sleep(3) 

                # Broad selector to find all user links (we filter out the profile owner later)
                modal_links_xpath = "//a[contains(@href, '/u/')]"

                last_count = 0
                retries = 0
                
                # Keep scrolling the modal until no new links are found
                while retries < 3:
                    # Find links within the modal
                    links = driver.find_elements(By.XPATH, modal_links_xpath)
                    if len(links) == last_count:
                        retries += 1
                        time.sleep(1)
                    else:
                        last_count = len(links)
                        retries = 0
                        # Scroll all scrollable containers and the last link to force lazy loading
                        if links:
                            try:
                                driver.execute_script("""
                                    var el = arguments[0];
                                    // Find the closest scrollable container
                                    while (el && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
                                        var style = window.getComputedStyle(el);
                                        if (el.scrollHeight > el.clientHeight && (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay')) {
                                            el.scrollTop = el.scrollHeight;
                                            return;
                                        }
                                        el = el.parentElement;
                                    }
                                    // Fallback
                                    arguments[0].scrollIntoView({block: 'end'});
                                """, links[-1])
                            except Exception:
                                pass # Ignore if element is not interactable for a moment
                        time.sleep(2)  # Wait for LeetCode to fetch new data
                
                names = []
                for link in driver.find_elements(By.XPATH, modal_links_xpath): # Re-fetch all links
                    href = link.get_attribute("href")
                    if href and "/u/" in href:
                        # Extract exact username from the URL
                        username = href.split('/u/')[-1].strip('/')
                        if username and username != "harsh_bajpai1" and username not in names:
                            names.append(username)
                
                if names:
                    for idx, name in enumerate(names, 1):
                        print(f"{idx}. {name}")
                    print(f"\n✅ Total {label} found: {len(names)}")
                else:
                    print(f"No names found for {label}. Try scrolling the list manually while the script waits.")
                    
            except Exception as inner_err:
                print(f"Error while reading names: {inner_err}")

            # 3. Refresh to close the modal cleanly (prevents headless focus issues)
            driver.refresh()
            time.sleep(4) # Wait for page to be ready again

    except Exception as e:
        print(f"General Error: {str(e)}")
    finally:
        print("\nProcess finished.")

if __name__ == "__main__":
    get_leetcode_data()