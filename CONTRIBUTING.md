# 🏆 LeetCode Leaderboard v5.3.8

An automated, full-stack tracking system designed to monitor competitive programming progress across a group of users. This project utilizes a specialized MERN architecture combined with multi-threaded Python automation to provide real-time stats, badges, and activity visualization.

## 🚀 Key Features

* **Automated Data Pipeline**: Daily synchronization powered by GitHub Actions and a multi-threaded Python scraper (10 parallel workers).
* **Dynamic Leaderboard**: Real-time ranking with support for LeetCode badges (Guardian, Knight, etc.) and hover-based solve breakdowns.
* **Activity Visualization**: Interactive 21-day progress graphs and a live activity feed.
* **Admin Management**: An administrative panel for seamless user management and manual update triggers.
* **Production Optimized**: Specifically configured for high availability on Render and Netlify with built-in Cloudflare connection fixes.

---

## 🛠️ Technical Architecture

The system operates across four distinct layers to ensure data integrity and performance:

1.  **Data Acquisition**: A Python-based scraper utilizes the LeetCode GraphQL API to fetch user statistics and submission history.
2.  **Storage**: MongoDB Atlas serves as the central cloud database, storing user profiles, activity logs, and historical graph data.
3.  **API Layer**: A Node.js and Express backend manages routing, manual update triggers via GitHub Workflow Dispatches, and data delivery.
4.  **Frontend**: A responsive React (Vite) application provides the user interface, utilizing specialized components for activity tracking and leaderboard rendering.

---

## 📦 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Chart.js, CSS3 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas |
| **Automation** | GitHub Actions, Python 3, ThreadPoolExecutor |
| **Hosting** | Render (API), Netlify (UI) |

---

## 🔧 Installation & Setup

### Prerequisites
* Node.js (v18+)
* Python (v3.9+)
* MongoDB Atlas Account
* GitHub Personal Access Token (with `workflow` scope)

### 1. Clone the Repository
```bash
git clone https://github.com/Harsh-Bajpai-1194/Leetcode_Leaderboards.git
cd Leetcode_Leaderboards
```

### 2. Backend Configuration
Create a `.env` file in the root directory:
```env
MONGO_URI=your_mongodb_connection_string
GITHUB_TOKEN=your_github_token
PORT=10000
```
Install dependencies and start the server:
```bash
npm install
node server.js
```

### 3. Frontend Configuration
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
npm run dev
```

---

## 📊 API Documentation

### `GET /api/leaderboard`
Fetches the current leaderboard data, including user badges, solved counts, and the group activity feed.

### `POST /api/trigger-update`
Manually triggers the GitHub Action scraper to update the database. Returns a status of `loading`, `success`, or `error`.

### `POST /api/add-user`
Adds a new LeetCode handle to the tracking system.
* **Body**: `{ "username": "string" }`

---

## 📈 Version History

* **v5.3.8**: Performance. Implemented In-Memory caching and MongoDB indexes for `<50ms` API response times.
* **v5.3.7**: Patch. Synced the release version badge in the frontend UI.
* **v5.3.6**: Performance. Refactored backend query execution to use `Promise.all` and optimized the graph rendering logic to avoid excessive loop computations.
* **v5.3.5**: Patch. Added `workflow_dispatch` to `keep-alive.yml` for manual triggering.
* **v5.3.4**: Patch. Added missing `compression` dependency to fix deployment.
* **v5.3.3**: Availability. Added a GitHub Actions cron job to ping a health endpoint every 5 minutes, preventing server sleep.
* **v5.3.2**: API Performance. Implemented Gzip Compression and Database Projection/Sorting.
* **v5.3.1**: Version Patch. Increased the patch update number.
* **v5.3.0**: DB Performance. Added a MongoDB index to `total_solved` for faster sorting.
* **v5.2.1**: UI Patch. Adjusted logo dimensions to improve layout spacing.
* **v5.2.0**: Production Milestone. Integrated Sponsorship QR, animated UI elements, and dynamic update status feedback.
* **v5.1.0**: Analytics & Management. Added 21-day Activity Graph and the Admin Panel.
* **v5.0.0**: MERN Migration. Major architectural shift to MongoDB and Express-based API.
* **v4.0.0**: Automation Era. Implementation of GitHub Actions and 10-worker parallel scraping.
* **v3.1.7**: Baseline. Initial integration of badge support and search functionality.

---

## 🤝 Contributing

Contributions are welcome! To maintain the quality of the project, please follow these steps:

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

### **🚀 Roadmap for v6.0.0+**
* **v6.0.0**: Introduction of a **Global Authentication** system using OAuth for user logins.
* **v7.0.0**: Migration of the entire codebase from JavaScript to **TypeScript** for enterprise-grade type safety.

The project is currently operating at a **v5.3.8** level of technical maturity! 🚀

## 💖 Support
If this project helped you track your community's progress, consider supporting the development through the **Sponsors** section on the live dashboard.
