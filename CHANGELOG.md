# Changelog

All notable changes to the LeetCode Leaderboard project will be documented in this file.

## [5.5.0] - 2026-04-18
### Added
- Dual-Server Architecture: Added Supabase for hosting the backend as a backup for Render, improving uptime and reliability.

## [5.4.0] - 2026-04-16
### Added
- Added animated loading skeletons to the frontend UI to improve perceived performance while fetching data.

## [5.3.12] - 2026-04-16
### Performance
- Eliminated the remaining ~80s workflow delay during manual updates. Modified `scraper.yml` to skip the slow Selenium follower sync on manual dispatch, and removed the obsolete Git commit step for `profiles.json`. Reduced frontend reload delay to 20s.

## [5.3.11] - 2026-04-16
### Performance
- Drastically reduced GitHub Actions scraper execution time (from ~107s down to ~25s) by adding `pip` caching, implementing `requests.Session()` for TLS connection pooling, and increasing parallel `max_workers` from 10 to 50.
- Increased the frontend auto-reload delay from 30s to 45s to reliably capture the completed backend refresh.

## [5.3.10] - 2026-04-16
### Fixed
- Implemented Stale-While-Revalidate cache architecture to eliminate UptimeRobot response spikes. Cron jobs now trigger `202 Accepted` and resolve in the background without blocking the event loop.
- Fixed a critical `TypeError` regex crash where missing `act.text` fields would take the server offline.
- Configured Express to instantly pre-warm the cache upon MongoDB connection up-start.

## [5.3.9] - 2026-04-15
### Fixed
- Resolved a cache stampede issue where UptimeRobot periodically hit an expired cache. Implemented `?refresh=true` in `keep-alive.yml` and increased cache TTL to 15 minutes, ensuring the cache is actively warmed in the background.

## [5.3.8] - 2026-04-15
### Added
- Implemented an In-Memory caching system (`CACHE_TTL`: 5 min) on the Express backend to drop API response times below 50ms.
- Added automated MongoDB index creation for `created_at` in the `activities` collection.
- Updated GitHub Actions `keep-alive.yml` to routinely hit the leaderboard endpoint, ensuring the cache stays perfectly warm in the background.

## [5.3.7] - 2026-04-15
### Fixed
- Updated the release version badge in the frontend UI (`Leaderboard.jsx`) to sync with the current system version.

## [5.3.6] - 2026-04-15
### Changed
- Optimized the backend logic in `server.js`. Implemented `Promise.all` for parallel database queries and refactored the graph generation loop from O(N * 21) to O(N), resolving CPU bottleneck issues and massively decreasing response time.

## [5.3.5] - 2026-04-15
### Added
- Added `workflow_dispatch` to `keep-alive.yml` to allow manual triggering of the keep-alive ping.

## [5.3.4] - 2026-04-15
### Fixed
- Added missing `compression` dependency to `package.json` to fix Render deployment failure.

## [5.3.3] - 2026-04-15
### Added
- Implemented a keep-alive system. Added a `/api/health` endpoint and a 5-minute cron job via GitHub Actions to prevent the free-tier server from sleeping.

## [5.3.2] - 2026-04-15
### Added
- Implemented Gzip Compression and Database Projection/Sorting for optimized API response sizes and speed.

## [5.3.1] - 2026-04-15
### Changed
- Patch: Removed duplicate headings.

## [5.3.0] - 2026-04-15
### Changed
- Optimized database performance by adding a descending index to the `total_solved` field in the `users` collection. This significantly reduces query time for sorting the leaderboard.

## [5.2.1] - 2026-04-14
### Fixed
- Decreased the height of the LeetCode logo in the UI to improve vertical alignment and element spacing.

## [5.2.0] - 2026-04-11
### Added
- Sponsorship section with QR code integration.
- Animated borders for UI elements using `border.gif`.
- Dynamic status feedback for the "Force Update" button.

## [5.1.1] - 2026-04-05
### Fixed
- Port binding issues for Render deployment using `0.0.0.0`.
- Missing alt tags in React components for accessibility compliance.

## [5.1.0] - 2026-04-01
### Added
- Admin Panel for user management.
- Activity Graph with 21-day historical look-back logic.

## [5.0.0] - 2026-03-25
### Changed
- Major architectural shift to the MERN stack.
- Migrated local JSON storage to MongoDB Atlas.
- Refactored API layer to use Express.js.

## [4.0.0] - 2026-01-15
### Added
- Automation via GitHub Actions for daily data syncing.
- Multi-threaded Python scraper with 10 parallel workers.

... (continue down to v1.0.0)
