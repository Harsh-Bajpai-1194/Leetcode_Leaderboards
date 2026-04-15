# Changelog

All notable changes to the LeetCode Leaderboard project will be documented in this file.

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