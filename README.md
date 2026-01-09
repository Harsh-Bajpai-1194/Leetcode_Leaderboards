# 🏆 Real-Time LeetCode Leaderboard (Full-Stack MERN)

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

A robust, full-stack automated leaderboard system that tracks LeetCode problem-solving progress in real-time. This project integrates a **Python automation script** for data scraping with a **MERN stack** (MongoDB, Express, Node.js) backend to serve live data to a responsive frontend.

---

## 🚀 Live Demo
👉 **[View the Live Leaderboard](https://leetcode-leaderboards.netlify.app/)**

---

## 🏗️ System Architecture

This project moves beyond simple static files by using a **Cloud-Native Architecture**:

1.  **Data Ingestion (Python):** A custom Python script scrapes user metrics from LeetCode's GraphQL API and detects new problem solves.
2.  **Database (MongoDB Atlas):** Data is stored in a scalable NoSQL database, separated into `users`, `activities`, and `metadata` collections.
3.  **Backend API (Node.js & Express):** A RESTful API hosted on **Render** fetches data from MongoDB and serves it to the client.
4.  **Frontend (Netlify):** A responsive dashboard fetches live JSON data from the API and renders the leaderboard and activity feed dynamically.

---

## ✨ Features

* **⚡ Automated Data Pipeline:** Python script intelligently updates only changed profiles to minimize API usage.
* **📊 REST API Integrated:** Frontend is decoupled from data logic, communicating via a custom built JSON API (`/api/leaderboard`).
* **🕒 Real-Time Activity Feed:** Logs specific "solve events" (e.g., "X solved +2 questions") with timestamps saved to the database.
* **💾 Persistent History:** Unlike static files, MongoDB retains activity logs and historical data efficiently.
* **🌙 Responsive Dark UI:** Optimized for both Desktop (side-by-side view) and Mobile (stacked view).

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Database** | **MongoDB Atlas** | Cloud NoSQL database storing Users & Activities |
| **Backend** | **Node.js & Express** | REST API handling data requests & CORS |
| **Automation** | **Python** | ETL script (Extract, Transform, Load) for LeetCode data |
| **Hosting** | **Render (Backend) + Netlify (Frontend)** | CI/CD deployments for server and client |
| **Frontend** | **HTML5 / CSS3 / JavaScript** | Vanilla JS for lightweight, fast rendering |

---

## ⚙️ How It Works

### 1. The Automation Logic (`update_leaderboard.py`)
The script iterates through a list of users, fetches their latest stats, and compares them with the database.
```python
# Logic Snippet
if current_solved > previous_solved:
    diff = current_solved - previous_solved
    new_activity = {
        "text": f"{real_name} solved +{diff} questions",
        "time": current_timestamp
    }
    # Pushes update to MongoDB 'activities' collection
```

2. The API Layer (server.js)
The Express server exposes a single endpoint that aggregates all necessary data.

Endpoint: GET /api/leaderboard

Response: JSON object containing sorted users, last 10 activities, and sync timestamp.

🤝 How to Join
If you want to be tracked on this leaderboard:

Send your LeetCode Profile Link to the administrator.

Or submit a Pull Request adding your username to profiles.json (for local tracking).

👨‍💻 Author
Harsh Bajpai

Role: Full-Stack Developer & Automation Engineer

LinkedIn: [https://www.linkedin.com/in/harsh-bajpai1194/](https://www.linkedin.com/in/harsh-bajpai1194/)
