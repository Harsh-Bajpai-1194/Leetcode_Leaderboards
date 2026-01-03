# 🏆 LeetCode Leaderboard

![Leaderboard Status](https://img.shields.io/github/actions/workflow/status/Harsh-Bajpai-1194/Leetcode_Leaderboards/scraper.yml?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-Automated-2088FF?style=for-the-badge&logo=github-actions)
![Netlify Status](https://img.shields.io/badge/Netlify-Live-00C7B7?style=for-the-badge&logo=netlify)

A fully automated, self-updating leaderboard to track LeetCode progress among friends and peers. The system fetches data using the LeetCode GraphQL API and updates the website every 10 minutes.

## 🚀 Live Demo
**Check out the live leaderboard here:**
👉 **[https://leetcode-leaderboards.netlify.app/](https://leetcode-leaderboards.netlify.app/)**

---

## ✨ Features

* **🔄 Fully Automated:** Runs every **10 minutes** via GitHub Actions to fetch the latest data.
* **⚡ Real-Time Search:** Instantly filter users by name using the search bar.
* **📈 Activity Feed:** Tracks recent activity and displays a live feed of who solved questions recently (keeps history of last 10 updates).
* **🌙 Dark Mode UI:** A clean, responsive dark-themed interface with side-by-side layout for Desktop and stacked layout for Mobile.
* **📊 Smart Ranking:** Automatically sorts users based on total problems solved.

---

## 🛠️ How It Works

1.  **The Scraper (`update_leaderboard.py`):**
    * Connects to LeetCode's hidden GraphQL API.
    * Fetches profile stats for every user in the list.
    * Compares new data with old data to generate the "Activity Feed" updates.
    * Saves everything to `profiles.json`.

2.  **The Automation (GitHub Actions):**
    * A Cron job triggers the script every 10 minutes.
    * If changes are found, the bot commits the new `profiles.json` back to the repository.

3.  **The Frontend (`index.html`):**
    * Fetches the JSON data dynamically.
    * Renders the Leaderboard Table and Activity Box using JavaScript.

---

## 🤝 How to Join
If you want your name added to the leaderboard:
1.  Send your **LeetCode Profile Link** to me.
2.  Or create a **Pull Request** adding your username to `profiles.json`.

---

## 👨‍💻 Author
**Harsh Bajpai**
* Created on: 24-10-2025
* [LinkedIn](https://www.linkedin.com/in/Harsh-Bajpai1194) | [GitHub](https://github.com/Harsh-Bajpai-1194)
