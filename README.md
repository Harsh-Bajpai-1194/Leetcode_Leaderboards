# 🏆 Real-Time LeetCode Leaderboard (Full-Stack MERN)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

A robust, full-stack automated leaderboard system that tracks LeetCode problem-solving progress in real-time. This project integrates a **Python automation script** for data scraping with a **MERN stack** backend and a high-performance **React** frontend.

---

## 🚀 Live Demo
👉 **[View the Live Leaderboard](https://leetcode-leaderboards.netlify.app/)** ⌛ **[Website Status](https://stats.uptimerobot.com/kQ4Ujs21Yz)** ---

## 🏗️ System Architecture

This project uses a decoupled **Client-Server Architecture**:

1.  **Frontend (React + Vite):** A modern Single Page Application (SPA) hosted on **Netlify**. It handles client-side routing, state management, and real-time search filtering.
2.  **Backend API (Node.js & Express):** A RESTful API hosted on **Render** that serves JSON data and handles database connections.
3.  **Database (MongoDB Atlas):** Persistent cloud storage for User Profiles and Activity Logs.
4.  **Automation (Python):** A scheduled script (GitHub Actions) that scrapes LeetCode GraphQL data and pushes updates to MongoDB.

---

## ✨ Features

* **🥇 Dynamic Trophy System:** Top 3 players are automatically highlighted with Gold, Silver, and Bronze styles.
* **⚡ React Performance:** Built with Vite for blazing fast loading and instant interactions.
* **📜 Smart Scrolling:** "Sticky" table headers and independent scrolling for the leaderboard and activity feed (clean UI).
* **🔍 Instant Search:** Real-time filtering of users by name without reloading the page.
* **🕒 Live Activity Feed:** Tracks and displays detailed solve history (e.g., "X solved +2 questions") with timestamps.
* **🌙 Modern Dark UI:** A custom dark-themed interface with orange accents, fully responsive for Mobile and Desktop.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React.js + Vite** | High-performance UI with Component-based architecture |
| **Backend** | **Node.js & Express** | REST API handling data requests & CORS |
| **Database** | **MongoDB Atlas** | Cloud NoSQL database storing Users & Activities |
| **Automation** | **Python** | ETL script (Extract, Transform, Load) for LeetCode data |
| **Hosting** | **Render (Backend) + Netlify (Frontend)** | CI/CD deployments for server and client |

---

## ⚙️ How It Works

### 1. The Automation Logic (`update_leaderboard.py`)
The script iterates through a list of users, fetches their latest stats via LeetCode's GraphQL API, and compares them with the database.
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

### 2. The React Frontend (Leaderboard.jsx)

The frontend fetches data once and handles sorting/filtering locally for speed.

```JavaScript
// React Logic Snippet
useEffect(() => {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => setData(data));
}, []);
```

###🤝 How to Join
If you want to be tracked on this leaderboard:-

1. Send your LeetCode Profile Link to the administrator.

2. Or submit a Pull Request adding your username to profiles.json (for local tracking).

**👨‍💻 Author - Harsh Bajpai**  

Role: Full-Stack Developer & Automation Engineer

LinkedIn: [https://www.linkedin.com/in/harsh-bajpai1194/](https://www.linkedin.com/in/harsh-bajpai1194/)
