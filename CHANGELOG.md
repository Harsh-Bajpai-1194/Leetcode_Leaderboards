# Changelog

All notable changes to the LeetCode Leaderboard project will be documented in this file.

## [5.7.6] - 2026-06-19
### Added
- Integrated 37-tier fallback array for CodeX AI, prioritized by reasoning capability
- Rewrote `followers.py` to utilize Selenium for direct LeetCode scraping and Supabase syncing

### Changed
- Refactored `server.js` to fully replace MongoDB with Supabase Edge architecture
- Optimized `Leaderboard.jsx` with stale-while-revalidate caching and zero-latency loading
- Patched `fix_names.js` environment variable loading and updated requirement configs
- Bumped version to v5.7.6 across UI badges, `README.md`, and `CONTRIBUTING.md`

### Fixed
- Bump `js-yaml` from `4.1.1` to `4.2.0` in `/frontend` in the `npm_and_yarn` group across 1 directory
- Replaced `fix_names.py` with `fix_names.js` in workflow

## [5.7.5] - 2026-06-15
### Added
- **CodeX AI Assistant**: Implemented AI overview and summary features for enhancing user profiles and suggesting topics to revise.
- **Resilient AI Fallback**: Implemented a multi-model fallback loop (including newer Gemini models) to automatically handle API rate limits and high demand (503) errors.
- **Utility Scripts**: Added `fix_names.js` and `check_models.js` for database and API maintenance.
### Changed
- **Serverless Migration**: Migrated Gemini AI logic from the Express backend to a serverless Supabase Edge Function (`codex-chat`).
- **BaaS Database Migration**: Removed `mongodb` dependency, `MongoClient` setup, and redundant MongoDB-to-Supabase sync logic. Updated `buildLeaderboardData` and `/api/add-user` endpoints to read and write directly to Supabase.
- Improved text formatting in AI outputs.
### Fixed
- Updated `Stats.jsx` to invoke the new Edge Function directly, fixing production connection errors.
- Resolved the `Multiple GoTrueClient instances` memory leak warning by moving Supabase client initialization outside the component lifecycle.

## [5.7.4] - 2026-06-14
### Added
- Created interactive layout badges for public and private LeetCode profiles.
- Added a `LICENSE` file to make the repository ready to accept open-source contributions.
### Changed
- Re-architected data parsing hooks to match database handles case-insensitively.
- Updated `.github/dependabot.yml` configuration.
### Fixed
- Resolved metric evaluation races by establishing a strict hybrid state fallback pattern.
- Fixed YAML parsing and truncated syntax inside the GitHub Actions `assign-claim` condition.

## [5.7.3] - 2026-06-12
### Performance
- **Instant Load Times**: Added local storage SWR caching for instant 0ms perceived load times on the frontend.
- Refactored `fetchAllData` to use `Promise.all` for parallel Supabase requests.
- Optimized activity graph rendering to use an `O(N)` hash map calculation.

## [5.7.2] - 2026-06-12
### Added
- Added `logo.svg` as the primary website image.

## [5.7.1] - 2026-06-11
### Added
- Added a comprehensive `Stats.jsx` page displaying profile image, username, name, questions solved, difficulty bars, contest ratings, global rankings, and contest ranks.
- Added `/api/user-stats/:username` endpoint in `server.js` to fetch detailed LeetCode profile and contest ranking data.

## [5.7.0] - 2026-06-10
### Added
- Added `/claim` and unassigned features for GitHub issues handling.
- Added a new "Stats" column header and button to each leaderboard row.
### Changed
- Shifted Solved and Profile columns left to accommodate the new Stats button.
- Set explicit column widths (8%, 30%, 20%, 18%, 14%) to optimize spacing.
- Styled the Stats button with an orange background and hover effects.
- Updated `colSpan` from 4 to 5 for the loading state skeleton.
- Updated versioning documentation across `README.md`, `VERSIONS.md`, and `CONTRIBUTING.md`.
- Bumped `react-router` from 7.13.0 to 7.16.0.

## [5.6.8] - 2026-05-30
### Fixed
- Patch Update: Fixed sponsor button border, activity feed height, and leaderboard height scaling.

## [5.6.7] - 2026-05-30
### Changed
- Bumped the `npm_and_yarn` group across 2 directories (Updated `qs` to 6.15.2 and `ws` to 8.21.0).

## [5.6.6] - 2026-05-29
### Changed
- Added `.env` and `node_modules` to `.gitignore` for cleaner local testing.

## [5.6.5] - 2026-05-20
### Changed
- Applied `overflow: hidden` to the center flex container to prevent the table from pushing the activity feed off the screen.
- Added `overflowX: auto` to the table wrapper to allow horizontal scrolling on smaller laptop displays.
### Removed
- Fully removed deprecated `handleForceUpdate` logic to clean up component state.

## [5.6.4] - 2026-05-20
### Removed
- Removed the manual "Force Update" button from the UI.

## [5.6.3] - 2026-05-20
### Fixed
- Added a 1.5s debounce timer to the Supabase real-time listener to prevent API rate-limiting and UI flickering during heavy batch updates.
- Fixed a lingering `undefined` metaData variable reference in the React state updater that caused silent rendering failures.
- Updated loading state logic to only mount the loading skeleton if the user array is completely empty, ensuring the table remains visible during background data refreshes.

## [5.6.2] - 2026-05-20
### Fixed
- Installed missing `@supabase/supabase-js` dependency in the backend environment.

## [5.6.1] - 2026-05-20
### Changed
- Ensured future background updates triggered by Supabase seamlessly update the numbers on the screen without ever making the table disappear.

## [5.6.0] - 2026-05-20
### Performance
- Restructured `fetchAllData` to fetch lightweight user and metadata in parallel, completely eliminating the initial 5000ms page load block.
- Moved the heavy 5000-row activity query and graph processing to a background task that resolves silently.
### Added
- Added a fallback loading state specifically for the Activity Graph UI while background calculations complete.
### Fixed
- Fixed a syntax error in the React state updater block.

## [5.5.34] - 2026-05-20
### Performance
- Fixed the frontend bottleneck and stopped over-fetching data payloads.

## [5.5.33] - 2026-05-15
### Fixed
- Resolved activity graph flatline and timezone offset issues by enforcing strict `Date.UTC()` logic for generating the 21-day activity window.
- Removed a stray semicolon that was breaking the Supabase query chain.
### Changed
- Added `.limit(5000)` to the Supabase activities fetch query to bypass the default 1000-row API cap and retrieve older historical data.

## [5.5.32] - 2026-05-14
### Changed
- Linked release badge to the GitHub repository and updated UI versioning.

## [5.5.31] - 2026-05-09
### Fixed
- Fixed Activity Graph in Leaderboards.jsx to fetch 5000 rows rather than 1000 rows from the database.

## [5.5.30] - 2026-05-09
### Fixed
- Fixed 21-day progress graph to show data of the last 21 days.

## [5.5.29] - 2026-05-09
### Fixed
- Fixed time zone issues for 21-day progress graph.

## [5.5.28] - 2026-05-09
### Fixed
- Fixed UTC time zone issues for 21-day progress graph.

## [5.5.27] - 2026-05-09
### Fixed
- Fixed 21-day progress graph.

## [5.5.26] - 2026-05-08
### Changed
- Bumped `mongoose` from 9.1.2 to 9.1.6 in the `npm_and_yarn` group across 1 directory.

## [5.5.25] - 2026-05-04
### Added
- Setup security and vulnerability policies.

## [5.5.24] - 2026-05-04
### Changed
- Bumped the `npm_and_yarn` group across 2 directories with 6 updates.
### Fixed
- Fixed formatting by adding a newline at the end of the `dependabot.yml` file.

## [5.5.23] - 2026-04-29
### Fixed
- Fixed Easy, Medium and Hard solved problems count bugs.

## [5.5.21] - 2026-04-24
### Fixed
- Fixed Graph data.

## [5.5.20] - 2026-04-24
### Changed
- Updated the logic to ensure the dailySolvedMap and the 21-day loop.

## [5.5.19] - 2026-04-24
### Changed
- Updated the Leaderboard component to ensure it fetches exactly 21 days of activity data and processes graph data accordingly.

## [5.5.18] - 2026-04-24
### Changed
- Changed Activity Graph logic to show 21 days of data.

## [5.5.17] - 2026-04-24
### Changed
- Updated Admin Panel.

## [5.5.16] - 2026-04-24
### Changed
- Changed the Search User Box layout.

## [5.5.15] - 2026-04-24
### Changed
- Removed the maxWidth constraints and implemented the 1:3:2 flex ratio.

## [5.5.14] - 2026-04-24
### Changed
- Adjusted the flex ratios to 15:55:30.

## [5.5.13] - 2026-04-19
### Added
- Added API key and authorization headers for force update function.

## [5.5.12] - 2026-04-19
### Changed
- Automation: Update Leaderboards automatically every 5 minutes.

## [5.5.11] - 2026-04-18
### Changed
- Keep pinging the server after every 5 minutes.

## [5.5.10] - 2026-04-18
### Changed
- Improved UI of Leaderboards.

## [5.5.9] - 2026-04-18
### Fixed
- Updated the activity fetching logic to retrieve more data and process it for a 21-day graph.

## [5.5.8] - 2026-04-18
### Changed
- Updated UI for Right Column Wrapper.

## [5.5.7] - 2026-04-18
### Changed
- UI update for Search Box and version number.

## [5.5.6] - 2026-04-18
### Fixed
- Fixed: ReferenceError, meta is not defined at c.

## [5.5.5] - 2026-04-18
### Fixed
- Fixed: 406 error happened with the `.single()` method.

## [5.5.3] - 2026-04-18
### Removed
- Removed Render fetch, deleted the code that was calling leetcode-leaderboards.onrender.com.

## [5.5.2] - 2026-04-18
### Added
- Sync data to MongoDB and Supabase simultaneously.

## [5.5.1] - 2026-04-18
### Added
- Sync data to Supabase.

## [5.5.0] - 2026-04-18
### Changed
- Architecture: Dual-Server configuration adding Supabase as a backend backup for Render.

## [5.4.0] - 2026-04-16
### Changed
- UI Polish: Added animated loading skeletons to the frontend leaderboard to improve perceived performance during data fetching.

## [5.3.12] - 2026-04-16
### Changed
- Performance: Eliminated 80s scraping bottleneck by skipping Selenium follower sync on manual triggers and removing legacy git commit step.

## [5.3.11] - 2026-04-16
### Changed
- Performance: Drastically reduced GitHub Actions runtime via requests.Session pooling, pip caching, and 50 parallel workers.

## [5.3.10] - 2026-04-16
### Fixed
- Stability: Added Stale-While-Revalidate cache pattern and fixed a TypeError crash to ensure highly stable uptime.

## [5.3.9] - 2026-04-15
### Fixed
- Patch: Resolved cache stampede bug by turning Keep-Alive cron into an active cache warmer using `?refresh=true`.

## [5.3.8] - 2026-04-15
### Changed
- Performance: Added In-Memory Caching and automated MongoDB indexing, dropping response times to ~30ms.

## [5.3.7] - 2026-04-15
### Fixed
- Updated the release version badge in the frontend UI (`Leaderboard.jsx`) to sync with the current system version.

## [5.3.6] - 2026-04-15
### Changed
- Performance: Implemented `Promise.all` in `server.js` and optimized Graph logic, effectively reducing DB waterfall querying and removing the CPU bottleneck.

## [5.3.5] - 2026-04-15
### Changed
- Patch: Added `workflow_dispatch` to `keep-alive.yml` for manual triggering of the keep-alive ping.

## [5.3.4] - 2026-04-15
### Fixed
- Fix: Add missing compression dependency.

## [5.3.3] - 2026-04-15
### Changed
- Availability: Added a keep-alive cron job to prevent server from sleeping.

## [5.3.2] - 2026-04-15
### Changed
- Implemented Gzip Compression and Database Projection/Sorting.

## [5.3.1] - 2026-04-15
### Changed
- Patch: Removed duplicate headings.

## [5.3.0] - 2026-04-15
### Changed
- Added a MongoDB index to `total_solved` for faster sorting.

## [5.2.1] - 2026-04-14
### Changed
- Patch Update: Downsizes the LeetCode Logo.

## [5.2.0] - 2026-04-11
### Added
- Created `CONTRIBUTING.md` with project details, technical architecture, and guidelines.
- Created `VERSIONS.md` and `CHANGELOG.md` to track project history.
### Changed
- Updated project title, badges, and GitHub tag links in `README.md`.

## [5.1.1] - 2026-04-08
### Fixed
- Updated server to listen on all network interfaces (`0.0.0.0`) to resolve port binding issues.

## [5.1.0] - 2026-04-03
### Added
- Added Sponsor button and QR code functionality.
- Enhanced Leaderboard with a dynamic button for triggering updates with loading states and improved user feedback.
### Changed
- Refactored Leaderboard component with updated UI, styles, and an animated border.

## [5.0.1] - 2026-04-01
### Changed
- Updated leaderboard badge logic and parallel workers.
- Added `creationDate` to badges and updated badge handling.

## [5.0.0] - 2026-03-29
### Added
- New badges support.

## [4.1.0] - 2026-03-21
### Changed
- Increased parallel workers from 5 to 10.

## [4.0.1] - 2026-03-20
### Added
- Displayed followers/following users on leaderboards automatically.
- Added followers/following page with usernames.
### Fixed
- Fixed unresponsive view profile buttons.

## [4.0.0] - 2026-03-19
### Added
- Profile followers/following fetching (Fetches all names).

## [3.2.0] - 2026-03-18
### Changed
- Updated code and removed redundant code.

## [3.1.8] - 2026-03-14
### Changed
- Minor code updates.

## [3.1.7] - 2026-02-20
### Changed
- Fixed title case in `index.html`.
- Changed page title to 'LEETCODE LEADERBOARDS'.
- Modified `add-user` API to remove password check requirement.

## [3.1.4]
### Added
- Name Formatting: Added logic to capitalize the first letter of usernames if the "Name" field was empty.

## [3.1.3]
### Changed
- Frontend Badges: Updated `Leaderboard.jsx` to render the badge icon next to the user's name.

## [3.1.2]
### Changed
- Badge Logic: Updated the backend and scraper to recognize and store LeetCode Badge icons (Guardian, Knight, etc.).

## [3.0.0]
### Changed
- Core UI Enhancements: Refined the React frontend architecture for better state handling and search filtering.

## [2.11.85]
### Fixed
- Fixed a bug where a user with 0 solves broke the sorting algorithm.

## [2.10.0]
### Added
- Activity Tracking: Added a logic block to check for "Recent Submissions" and store them in the JSON.

## [2.9.0]
### Changed
- Dark Mode: Updated `style.css` with a persistent dark theme (LeetCode inspired).

## [2.8.0]
### Added
- Deployment Prep: Added `package.json` scripts for production builds.

## [2.7.0]
### Added
- Environment Variables: Added `.env` support to hide sensitive paths and tokens.

## [2.6.0]
### Changed
- Scraper Optimization: Moved the scraper from Selenium to a more efficient `requests` based system using LeetCode's public endpoints.

## [2.5.0]
### Changed
- API Integration: Frontend now fetches from `http://localhost:5000/api/leaderboard` instead of a local file.

## [2.4.0]
### Added
- First Backend Attempt: Created `server.js`. Introduced Node.js and Express.js to serve the data API.

## [2.3.0]
### Changed
- Responsive Grid: Redesigned the layout using Flexbox to support both desktop and mobile.

## [2.2.0]
### Added
- State Management: Implemented `useState` and `useEffect` to fetch local data.

## [2.1.0]
### Added
- Component Architecture: Created `Leaderboard.jsx` and separated CSS into `style.css`.

## [2.0.0]
### Changed
- The Vite/React Migration: Deleted static `index.html`. Initialized the `frontend/` folder using Vite and React.

## [1.9.42]
### Changed
- Changed the text "Solves" to "Total Solved" in the header to improve professional clarity.

## [1.9.41]
### Changed
- Standardized all indentations in `style.css` from 4 spaces to 2 spaces.

## [1.9.40]
### Added
- Added a basic `alt` attribute to the LeetCode logo image.

## [1.9.39]
### Removed
- Removed an unused `test.py` file from the root directory.

## [1.9.38]
### Changed
- Changed the default "Last Updated" format to `DD-MM-YYYY HH:MM`.

## [1.9.37]
### Changed
- Increased the font size of the "Total Solved" count to make it the primary focal point.

## [1.9.36]
### Added
- Added a check to skip empty lines in the `users.txt` input file.

## [1.9.35]
### Added
- Added a `trim()` function to the JavaScript search logic to ignore leading/trailing spaces.

## [1.9.34]
### Fixed
- Fixed a CSS conflict where the search bar was overlapping with the title on small screens.

## [1.9.33]
### Changed
- Updated the "View Profile" link to open in a new tab (`target="_blank"`).

## [1.9.32]
### Changed
- Changed the table header background from `#f8f9fa` to a darker `#2c2c2c`.

## [1.9.31]
### Changed
- Optimized the Python scraper by removing unnecessary BeautifulSoup re-parses.

## [1.9.30]
### Added
- Added a "No results found" message that appears when the search filter returns zero rows.

## [1.9.29]
### Changed
- Adjusted the search bar's placeholder text from "Search..." to "🔍 Search for names...".

## [1.9.28]
### Fixed
- Fixed an encoding issue where special characters in names were saved as Unicode escape sequences.

## [1.9.27]
### Added
- Added a `loading="lazy"` attribute to any future image placeholders.

## [1.9.26]
### Changed
- Updated the Python script to sort the `profiles.json` keys alphabetically after writing.

## [1.9.25]
### Added
- Added a favicon link to the `head` section of `index.html`.

## [1.9.24]
### Fixed
- Fixed a bug where the search bar would clear itself after a page refresh.

## [1.9.23]
### Added
- Added a `max-width: 1200px` limit to the main dashboard container.

## [1.9.22]
### Changed
- Changed the text color of "Hard" solves to red (`#ff2d55`).

## [1.9.21]
### Changed
- Changed the text color of "Medium" solves to orange (`#ffb800`).

## [1.9.20]
### Changed
- Changed the text color of "Easy" solves to green (`#00af9b`).

## [1.9.19]
### Added
- Added a "Last Updated" timestamp at the bottom of the `index.html` file.

## [1.9.18]
### Fixed
- Fixed a logic error where the script would stop entirely if one profile returned a 404 error.

## [1.9.17]
### Added
- Added a `transition: 0.3s` effect to the button hover state.

## [1.9.16]
### Changed
- Changed the "View Profile" button background color from `#007bff` to the LeetCode orange (`#ffa116`).

## [1.9.15]
### Changed
- Implemented `overflow-x: auto` on the table wrapper to fix horizontal scrolling on mobile devices.

## [1.9.14]
### Changed
- Adjusted the padding of table cells from `8px` to `12px` for better readability.

## [1.9.13]
### Fixed
- Fixed an issue where the "Total Solved" count was showing as a string instead of an integer in `profiles.json`.

## [1.9.12]
### Added
- Added a subtle `box-shadow` to the main `.container` in `style.css`.

## [1.9.11]
### Changed
- Changed the font family from `Arial` to `Inter, sans-serif` for a more modern look.

## [1.9.10]
### Added
- Added a 1-second `time.sleep()` between requests to avoid triggering LeetCode’s basic rate limiter.

## [1.9.9]
### Fixed
- Fixed a bug where usernames containing underscores (`_`) were not being parsed correctly by the regex.

## [1.9.8]
### Added
- Added a `cursor: pointer` style to the table headers to hint at future sorting features.

## [1.9.7]
### Changed
- Changed the "Rank" column width from `50px` to `60px` to prevent clipping on triple digits.

## [1.9.6]
### Added
- Added `__pycache__/` and `*.pyc` to the `.gitignore` file.

## [1.9.5]
### Fixed
- Fixed a typo in the console log: changed "Scrapping started" to "Scraping started."

## [1.9.4]
### Changed
- Updated `requirements.txt` to include specific versions for `requests` and `beautifulsoup4`.

## [1.9.3]
### Changed
- Changed the table border-collapse property in `style.css` from `separate` to `collapse`.

## [1.9.2]
### Added
- Added a 10-second `timeout` to the `requests` call to prevent the script from hanging on poor connections.

## [1.9.1]
### Fixed
- Fixed a `ZeroDivisionError` in the script when a new user with 0 solves was added.

## [1.9.0]
### Added
- Error Handling: Added try-except blocks to handle private LeetCode profiles that blocked scraping.

## [1.8.0]
### Added
- Profile Links: Added a "View Profile" column with hyperlinks to LeetCode usernames.

## [1.7.0]
### Added
- Sorting Logic: Auto-sort the table based on the "Total Solved" count in descending order.

## [1.6.0]
### Changed
- Solves Breakdown: Updated the scraper to fetch "Easy", "Medium", and "Hard" counts separately.

## [1.5.5]
### Fixed
- Fixed search bar alignment for mobile screens.

## [1.5.0]
### Added
- Search & Filter: Implemented a simple JavaScript search bar to filter names in the table.

## [1.4.0]
### Added
- Manual Refresh: Added a "Refresh" button that manually triggered the Python script on a local machine.

## [1.3.1]
### Changed
- Changed table header color from blue to dark grey.

## [1.3.0]
### Added
- First Frontend: Added a basic `index.html` and `style.css` to display the JSON data in a table.

## [1.2.0]
### Added
- Data Storage: Added `profiles.json` to store scraped results locally instead of just printing them.

## [1.1.1]
### Fixed
- Fixed a typo in the LeetCode URL string.

## [1.1.0]
### Added
- Scraper Logic: Implementation of Selenium-based scraping for LeetCode profile pages.

## [1.0.0]
### Added
- Initial Repository Setup: First commit with basic `README.md` and `.gitignore`.
- Created `update_leaderboard.py` (Version 1.0).
