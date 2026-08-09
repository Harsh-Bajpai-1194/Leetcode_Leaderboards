import os
import json
import sys
import time
import random
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
load_dotenv()
submission_id = sys.argv[1] if len(sys.argv) > 1 else "209654016"
target_url = f"https://leetcode.com/submissions/detail/{submission_id}/"
CONFIG = {
    "submissionUrl": target_url,
    "headless": False,
    "credentials": {
        "email": os.getenv("LEETCODE_EMAIL"),
        "password": os.getenv("LEETCODE_PASSWORD"),
    },
}
def log(msg):
    print(msg, file=sys.stderr)
def login(page) -> bool:
    if not CONFIG["credentials"]["email"] or not CONFIG["credentials"]["password"]:
        raise ValueError("LeetCode email or password not set in environment variables")
    if any(term in page.url for term in ["challenge", "cloudflare", "turnstile"]) and "accounts.google.com" not in page.url:
        try:
            frame_locator = page.frame_locator("iframe[src*='cloudflare'], iframe[src*='turnstile']")
            checkbox_locator = frame_locator.locator('.cb-c, input[type="checkbox"], .mark')
            checkbox_locator.wait_for(state="visible", timeout=30000)
            checkbox_locator.click()
            page.wait_for_url(lambda url: not any(term in url for term in ["challenge", "cloudflare", "turnstile"]), timeout=60000)
        except Exception:
            return False
    try:
        if "accounts.google.com" not in page.url:
            google_login_selector = 'a[href*="google/login"]'
            google_login_locator = page.locator(google_login_selector)
            try:
                google_login_locator.wait_for(state="visible", timeout=10000)
                google_login_locator.click()
            except PlaywrightTimeoutError:
                pass
        google_email_input_selector = 'input[type="email"], input[name="identifier"]'
        google_email_locator = page.locator(google_email_input_selector)
        google_email_locator.wait_for(state="visible", timeout=30000)
        google_email_locator.fill(CONFIG["credentials"]["email"])
        time.sleep(random.uniform(1, 3))
        google_email_next_button_selector = 'button:has-text("Next"), div[role="button"]:has-text("Next")'
        google_email_next_locator = page.locator(google_email_next_button_selector)
        google_email_next_locator.click(timeout=15000)
        page.wait_for_url(lambda url: "accounts.google.com" in url and ("signin/challenge" in url or "signin/sl/pwd" in url or "signin/recovery" in url or "signin/webpass" in url), timeout=30000)
        page.wait_for_load_state("networkidle", timeout=30000)
        google_password_locator = page.get_by_label("Enter your password")
        google_password_locator.wait_for(state="visible", timeout=30000)
        google_password_locator.fill(CONFIG["credentials"]["password"])
        time.sleep(random.uniform(1, 3))
        google_password_next_button_selector = 'button:has-text("Next"), button:has-text("Sign in"), div[role="button"]:has-text("Next"), div[role="button"]:has-text("Sign in")'
        google_password_next_locator = page.locator(google_password_next_button_selector)
        google_password_next_locator.click(timeout=15000)
        page.wait_for_url(lambda url: "accounts.google.com" not in url, timeout=60000)
    except Exception:
        return False
    try:
        page.wait_for_url(lambda url: "/accounts/login/" not in url and not any(term in url for term in ["challenge", "cloudflare", "turnstile", "accounts.google.com"]), timeout=60000)
    except Exception:
        pass
    return True
def main():
    if not CONFIG["submissionUrl"]:
        return
    captured_responses = []
    def handle_response(response):
        nonlocal captured_responses
        if "graphql" in response.url and response.request.method == "POST":
            try:
                log(f"DEBUG: Intercepting GraphQL POST request to {response.url}")
                json_payload = response.json()
                captured_responses.append({
                    "url": response.url,
                    "request_post_data": response.request.post_data,
                    "response_json": json_payload
                })
                log(f"DEBUG: Captured response. Total captured: {len(captured_responses)}")
            except Exception as e:
                log(f"DEBUG: Error while processing/capturing response: {e}")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=CONFIG["headless"],
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]
        )
        context = browser.new_context(
            viewport={"width": 1366, "height": 768},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.set_default_navigation_timeout(90000)
        page.on("response", handle_response)
        try:
            # Ensure no cookie file is persisted. If one exists from a previous
            # version or other process, delete it to guarantee a fresh session.
            cookie_file = Path("cookies.json")
            if cookie_file.exists():
                cookie_file.unlink()
                log("DEBUG: Removed pre-existing cookies.json file to ensure no session persistence.")

            page.goto(CONFIG["submissionUrl"], wait_until="domcontentloaded")
            time.sleep(5)
            needs_login = False
            if "/accounts/login/" in page.url or "accounts.google.com" in page.url:
                needs_login = True
            else:
                try:
                    if page.locator('a[href*="google/login"]').is_visible(timeout=3000):
                        needs_login = True
                    elif page.locator('button:has-text("Sign in")').is_visible(timeout=3000):
                        needs_login = True
                    elif page.locator('a:has-text("Login")').is_visible(timeout=3000):
                        needs_login = True
                    elif page.locator('text=Please sign in to view this submission').is_visible(timeout=3000):
                        needs_login = True
                except PlaywrightTimeoutError:
                    pass
            if needs_login:
                login(page)
                page.goto(CONFIG["submissionUrl"], wait_until="networkidle")
            else:
                page.wait_for_load_state("networkidle")
            
            log("Waiting 5 seconds for all network requests to finalize...")
            time.sleep(5)

            target_json_to_print = None
            if captured_responses:
                # Find the first response that matches all criteria
                for r in captured_responses:
                    response_str = json.dumps(r)
                    if "submissionDetails" in response_str and "Solution" in response_str and "response_json" in response_str:
                        # We found our target. Extract the actual data payload.
                        target_json_to_print = r.get("response_json")
                        if target_json_to_print:
                            break # Found it, stop looking

            if target_json_to_print:
                # Print the JSON to standard output for the Node.js server to capture
                sys.stdout.write(json.dumps(target_json_to_print) + "\n")
                sys.stdout.flush()
                log("✅ Found and printed the submissionDetails GraphQL response to stdout.")
            else:
                log("❌ Could not find the target GraphQL response in the intercepted traffic.")
        except Exception as e:
            log(f"Error: {e}")
        finally:
            browser.close()
if __name__ == "__main__":
    main()