# 🏆 Real-Time LeetCode Leaderboard (Full-Stack MERN)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

A robust, full-stack automated leaderboard system that tracks LeetCode problem-solving progress in real-time. This project integrates a **Parallel Python automation script** for data scraping with a **MERN stack** backend and a high-performance **React** frontend.

---

## 🚀 Live Demo
👉 **[View the Live Leaderboard](https://leetcode-leaderboards.netlify.app/)**  
⌛ **[Website Status](https://stats.uptimerobot.com/kQ4Ujs21Yz)**  
---

## ✨ Key Features

### 🎨 **Frontend Experience**
* **🥇 Dynamic Rank System:** Top 3 players are highlighted with Gold, Silver, and Bronze trophies.
* **🏅 Badge Support:** Automatically fetches and displays user badges (Guardian, Knight, Monthly Badges) next to names.
* **📈 Activity Graph:** Visualizes the group's total problem-solving trend over the last 7 days.
* **⚡ Instant Search:** Real-time filtering of users by name.
* **🌙 Modern Dark UI:** Fully responsive design with a custom dark theme and orange accents.

### 🛡️ **Admin & Control**
* **🔐 Secure Admin Panel:** Password-protected area to add new users directly to the live database.
* **⚡ Force Update Button:** Triggers the scraper robot **directly from the website UI**, updating stats in ~30 seconds.
* **📜 Live Activity Feed:** Logs real-time updates (e.g., *"X solved +2 questions"*) with timestamps.

### 🤖 **Automation & Performance**
* **🚀 Parallel Processing:** Python script uses `ThreadPoolExecutor` (5 workers) to scrape 75+ users in under 30 seconds.
* **☁️ Zero Maintenance:** GitHub Actions runs the scraper automatically every 24 hours.

---

## 🏗️ System Architecture

This project uses a decoupled **Client-Server Architecture**:

1.  **Frontend (React + Vite):** Hosted on **Netlify**. Handles routing, searching, and triggers the "Force Update" API.
2.  **Backend API (Node.js & Express):** Hosted on **Render**. Acts as a secure gateway between the Frontend, MongoDB, and GitHub API.
3.  **Database (MongoDB Atlas):** Stores User Profiles, Activity Logs, and Metadata.
4.  **Automation (Python + GitHub Actions):** A script that wakes up (via schedule or trigger), scrapes LeetCode GraphQL data in parallel, and updates MongoDB.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React.js + Vite** | High-performance UI with Recharts for graphing |
| **Backend** | **Node.js & Express** | REST API with GitHub Dispatch trigger integration |
| **Database** | **MongoDB Atlas** | Cloud NoSQL database storing Users & Activities |
| **Automation** | **Python (PyMongo)** | Multi-threaded ETL script for rapid scraping |
| **CI/CD** | **GitHub Actions** | Automated scheduling and manual trigger execution |

---

## ⚙️ How It Works

### 1. The Parallel Scraper (`update_leaderboard.py`)
The script uses 5 parallel threads to fetch data simultaneously, reducing execution time by 80%.

```python
# Parallel Execution Snippet
with ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(process_user, db_users))
```

##2. The Force Update Trigger
1️⃣When the "Force Update" button is clicked:

2️⃣Frontend sends a request to Backend with the Admin Password.

3️⃣Backend validates the password and calls GitHub API.

4️⃣GitHub Actions wakes up, runs the Python script, and updates MongoDB.

The Frontend refreshes to show the new data.

##🤝 How to Join
To be added to this leaderboard:
Ask an Admin to add you via the Secure Admin Panel.

(Developers) Submit a Pull Request if running a local instance.

#👨‍💻 Author
#**Harsh Bajpai Full-Stack Developer & Automation Engineer**

LinkedIn: [https://www.linkedin.com/in/harsh-bajpai1194/](https://www.linkedin.com/in/harsh-bajpai1194/)
