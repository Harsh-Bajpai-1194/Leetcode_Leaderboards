### **📈 Versioning Timeline**

* **v1.0.0**: Initial Repository Setup. First commit: Basic README.md and .gitignore. Creation of update_leaderboard.py (Version 1.0).
* **v1.1.0**: Scraper Logic. Implementation of Selenium-based scraping for LeetCode profile pages.
* **v1.1.1**: Patch: Fixed a typo in the LeetCode URL string.
* **v1.2.0**: Data Storage. Added profiles.json to store scraped results locally instead of just printing them.
* **v1.3.0**: First Frontend. Added a basic index.html and style.css to display the JSON data in a table.
* **v1.3.1**: Patch: Changed table header color from blue to dark grey.
* **v1.4.0**: Manual Refresh. Added a "Refresh" button that manually triggered the Python script on a local machine.
* **v1.5.0**: Search & Filter. Implemented a simple JavaScript search bar to filter names in the table.
* **v1.5.5**: Patch: Fixed search bar alignment for mobile screens.
* **v1.6.0**: Solves Breakdown. Updated the scraper to fetch "Easy", "Medium", and "Hard" counts separately.
* **v1.7.0**: Sorting Logic. Auto-sort the table based on the "Total Solved" count in descending order.
* **v1.8.0**: Profile Links. Added a "View Profile" column with hyperlinks to LeetCode usernames.
* **v1.9.0**: Error Handling. Added try-except blocks to handle private LeetCode profiles that blocked scraping.
* **v1.9.1**: Fixed a ZeroDivisionError in the script when a new user with 0 solves was added.
* **v1.9.2**: Added a 10-second `timeout` to the requests call to prevent the script from hanging on poor connections.
* **v1.9.3**: Changed the table border-collapse property in `style.css` from `separate` to `collapse`.
* **v1.9.4**: Updated `requirements.txt` to include specific versions for `requests` and `beautifulsoup4`.
* **v1.9.5**: Fixed a typo in the console log: changed "Scrapping started" to "Scraping started."
* **v1.9.6**: Added `__pycache__/` and `*.pyc` to the `.gitignore` file.
* **v1.9.7**: Changed the "Rank" column width from `50px` to `60px` to prevent clipping on triple digits.
* **v1.9.8**: Added a `cursor: pointer` style to the table headers to hint at future sorting features.
* **v1.9.9**: Fixed a bug where usernames containing underscores (`_`) were not being parsed correctly by the regex.
* **v1.9.10**: Added a 1-second `time.sleep()` between requests to avoid triggering LeetCode’s basic rate limiter.
* **v1.9.11**: Changed the font family from `Arial` to `Inter, sans-serif` for a more modern look.
* **v1.9.12**: Added a subtle `box-shadow` to the main `.container` in `style.css`.
* **v1.9.13**: Fixed an issue where the "Total Solved" count was showing as a string instead of an integer in `profiles.json`.
* **v1.9.14**: Adjusted the padding of table cells from `8px` to `12px` for better readability.
* **v1.9.15**: Implemented `overflow-x: auto` on the table wrapper to fix horizontal scrolling on mobile devices.
* **v1.9.16**: Changed the "View Profile" button background color from `#007bff` to the LeetCode orange (`#ffa116`).
* **v1.9.17**: Added a `transition: 0.3s` effect to the button hover state.
* **v1.9.18**: Fixed a logic error where the script would stop entirely if one profile returned a 404 error.
* **v1.9.19**: Added a "Last Updated" timestamp at the bottom of the `index.html` file.
* **v1.9.20**: Changed the text color of "Easy" solves to green (`#00af9b`).
* **v1.9.21**: Changed the text color of "Medium" solves to orange (`#ffb800`).
* **v1.9.22**: Changed the text color of "Hard" solves to red (`#ff2d55`).
* **v1.9.23**: Added a `max-width: 1200px` limit to the main dashboard container.
* **v1.9.24**: Fixed a bug where the search bar would clear itself after a page refresh.
* **v1.9.25**: Added a favicon link to the `head` section of `index.html`.
* **v1.9.26**: Updated the Python script to sort the `profiles.json` keys alphabetically after writing.
* **v1.9.27**: Added a `loading="lazy"` attribute to any future image placeholders.
* **v1.9.28**: Fixed an encoding issue where special characters in names were saved as Unicode escape sequences.
* **v1.9.29**: Adjusted the search bar's placeholder text from "Search..." to "🔍 Search for names...".
* **v1.9.30**: Added a "No results found" message that appears when the search filter returns zero rows.
* **v1.9.31**: Optimized the Python scraper by removing unnecessary BeautifulSoup re-parses.
* **v1.9.32**: Changed the table header background from `#f8f9fa` to a darker `#2c2c2c`.
* **v1.9.33**: Updated the "View Profile" link to open in a new tab (`target="_blank"`).
* **v1.9.34**: Fixed a CSS conflict where the search bar was overlapping with the title on small screens.
* **v1.9.35**: Added a `trim()` function to the JavaScript search logic to ignore leading/trailing spaces.
* **v1.9.36**: Added a check to skip empty lines in the `users.txt` input file.
* **v1.9.37**: Increased the font size of the "Total Solved" count to make it the primary focal point.
* **v1.9.38**: Changed the default "Last Updated" format to `DD-MM-YYYY HH:MM`.
* **v1.9.39**: Removed an unused `test.py` file from the root directory.
* **v1.9.40**: Added a basic `alt` attribute to the LeetCode logo image.
* **v1.9.41**: Standardized all indentations in `style.css` from 4 spaces to 2 spaces.
* **v1.9.42**: Changed the text "Solves" to "Total Solved" in the header to improve professional clarity.

* **v2.0.0**: The Vite/React Migration. Deleted static index.html. Initialized the frontend/ folder using Vite and React.
* **v2.1.0**: Component Architecture. Created Leaderboard.jsx and separated CSS into style.css.
* **v2.2.0**: State Management. Implemented useState and useEffect to fetch local data.
* **v2.3.0**: Responsive Grid. Redesigned the layout using Flexbox to support both desktop and mobile.
* **v2.4.0**: First Backend Attempt. Created server.js. Introduced Node.js and Express.js to serve the data API.
* **v2.5.0**: API Integration. Frontend now fetches from http://localhost:5000/api/leaderboard instead of a local file.
* **v2.6.0**: Scraper Optimization. Moved the scraper from Selenium to a more efficient requests based system using LeetCode's public endpoints.
* **v2.7.0**: Environment Variables. Added .env support to hide sensitive paths and tokens.
* **v2.8.0**: Deployment Prep. Added package.json scripts for production builds.
* **v2.9.0**: Dark Mode. Updated style.css with a persistent dark theme (LeetCode inspired).
* **v2.10.0**: Activity Tracking. Added a logic block to check for "Recent Submissions" and store them in the JSON.
* **v2.11.85**: Patch: Fixed a bug where a user with 0 solves broke the sorting algorithm.
* **v3.0.0**: Core UI Enhancements. Refined the React frontend architecture for better state handling and search filtering.
* **v3.1.2**: Badge Logic. Updated the backend and scraper to recognize and store LeetCode Badge icons (Guardian, Knight, etc.).
* **v3.1.3**: Frontend Badges. Updated Leaderboard.jsx to render the badge icon next to the user's name.
* **v3.1.4**: Name Formatting. Patch: Added logic to capitalize the first letter of usernames if the "Name" field was empty.
* **v3.1.7**: The "Baseline" Snapshot. The snapshot representing the basic initial state of the tracker before major architectural shifts. Features: Badge Support, Search functionality, and basic local JSON fetching.
* **v4.0.0**: Automation & Parallel Processing. Introduced GitHub Actions (`scraper.yml`) for daily execution. Upgraded `update_leaderboard.py` to use `ThreadPoolExecutor` with 10 parallel workers.
* **v5.0.0**: The Database Major Update (MERN Migration). Major Change: Removed `profiles.json`. Integrated MongoDB Atlas and Express.js backend.
* **v5.1.0**: Analytics & Management. Added the password-protected Admin Panel and the 21-day Activity Graph.
* **v5.1.1**: Deployment Patches. Implemented `0.0.0.0` port binding for Render and added accessibility alt tags.
* **v5.2.0**: The Production Milestone. Integrated Sponsorship QR code, animated UI borders, and dynamic update status feedback.
* **v3.1.7**: The Baseline. Initial state of the tracker as a simple script and basic frontend.
* **v4.0.0**: The Automation Major Update. Major Change: Transitioned from manual updates to a "set it and forget it" architecture. Key Features: Integration of GitHub Actions for daily automation and a ThreadPoolExecutor Python scraper with 10 parallel workers for high-speed data fetching.
* **v5.0.0**: The MERN Stack & UI Major Update. Major Change: Migration to a full MERN (MongoDB, Express, React, Node) stack. Minor Features (v5.1.x): Added the Admin Panel for user management and the Activity Graph with 21-day historical look-back logic. Patch Fixes (v5.1.1): Implemented 0.0.0.0 port binding in server.js to fix deployment errors and added accessibility alt tags to resolve build failures.
* **v5.2.0**: The Production & Branding Milestone (Current Version). Minor Feature: Added professional branding elements, including the Sponsorship QR Code section with an animated border.gif. Minor Feature: Upgraded the Force Update button with real-time dynamic status feedback (⏳ Requesting, ✅ Started, ❌ Failed).
* **v5.2.1**: Patch: Decreased the height of the LeetCode logo to improve vertical alignment and layout spacing.
* **v5.3.0** Patch: Added a descending index to the `total_solved` field in the `users` collection. This significantly reduces query time for sorting the leaderboard.
* **v5.3.1** Patch: Removed duplicate headings.

---

### **🏆 Version Summary Table**

| Version | Milestone | Primary Reason for Change |
| :--- | :--- | :--- |
| **v1.0.0** | **Initial Setup** | Basic repository setup and Python scraper creation. |
| **v2.0.0** | **React Migration** | Transition to a Vite/React frontend and Express backend. |
| **v3.0.0** | **Core UI Enhancements** | Refined the React frontend architecture for better state handling and search filtering. |
| **v3.1.7** | **Baseline** | Initial project tracker. |
| **v4.0.0** | **Automation** | Introduction of GitHub Actions & Parallel Processing. |
| **v5.0.0** | **MERN Stack** | Fundamental shift to a full-stack DB and API architecture. |
| **v5.1.x** | **Analytics** | Addition of Admin Panel and Activity Graph. |
| **v5.2.0** | **Production** | Sponsor integration, branding, and status feedback. |
| **v5.3.0** | **Performance** | Added a MongoDB index to `total_solved` for faster sorting. |
| **v5.3.1** | **Patch** | Removed duplicate headings. |
