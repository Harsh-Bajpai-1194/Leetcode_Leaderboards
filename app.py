from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time

def get_solved_count(text):
    """Helper to extract the '4' from '4/918'"""
    try:
        return int(text.split('/')[0])
    except (ValueError, IndexError, AttributeError):
        return 0

def scrape_leetcode_stats(url):
    options = webdriver.ChromeOptions()
    options.add_argument('--headless') 
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    try:
        driver.get(url)
        time.sleep(10) 
        
        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        
        raw_text = soup.get_text(separator='\n', strip=True)
        lines = raw_text.split('\n')

        easy_val = med_val = hard_val = "0/0"
        found = False

        for i in range(len(lines)):
            if lines[i] == "Easy":
                easy_val = lines[i+1] if i+1 < len(lines) else "0/0"
                found = True
            elif lines[i] == "Med.":
                med_val = lines[i+1] if i+1 < len(lines) else "0/0"
            elif lines[i] == "Hard":
                hard_val = lines[i+1] if i+1 < len(lines) else "0/0"

        if found:
            # Calculate Total
            total_solved = get_solved_count(easy_val) + get_solved_count(med_val) + get_solved_count(hard_val)
            
            # Print Individual Stats
            print(f"Easy\n{easy_val}")
            print(f"Med.\n{med_val}")
            print(f"Hard\n{hard_val}")
            
            # Print Combined Total
            print("-" * 20)
            print(f"Total Solved: {total_solved}")
        else:
            print("No stats found. The page might be blocking the bot.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

scrape_leetcode_stats('https://leetcode.com/u/Harsh_Bajpai1')