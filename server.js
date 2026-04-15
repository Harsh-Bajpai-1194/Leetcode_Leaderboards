require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
let db, usersCollection, activitiesCollection, metadataCollection;

const client = new MongoClient(MONGO_URI);

// --- IN-MEMORY CACHE ---
let leaderboardCache = { data: null, timestamp: 0 };
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (Refreshed every 5m by cron)

async function connectDB() {
    try {
        await client.connect();
        db = client.db("leetcode_db");
        usersCollection = db.collection("users");
        activitiesCollection = db.collection("activities");
        metadataCollection = db.collection("metadata");
        console.log("✅ Server Connected to MongoDB");

        // Ensure Performance Indexes on Startup
        await usersCollection.createIndex({ total_solved: -1 });
        await activitiesCollection.createIndex({ created_at: -1 });
        console.log("✅ MongoDB Indexes Ensured");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
}
connectDB();

async function fetchLeetCodeData(username) {
    try {
        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                    query getUserProfile($username: String!) {
                        matchedUser(username: $username) {
                            profile { realName }
                            activeBadge { displayName icon }
                            badges { id displayName icon creationDate }
                            submitStats { acSubmissionNum { difficulty count } }
                        }
                    }
                `,
                variables: { username }
            })
        });

        const data = await response.json();
        if (!data.data || !data.data.matchedUser) return null;

        const userData = data.data.matchedUser;
        const stats = userData.submitStats.acSubmissionNum;
        const displayName = userData.profile.realName || username;

        let activeBadge = userData.activeBadge;
        let badgeIcon = activeBadge ? activeBadge.icon : null;
        let badgeName = activeBadge ? activeBadge.displayName : null;

        if (!activeBadge && userData.badges && userData.badges.length > 0) {
            const sortedBadges = userData.badges.sort((a, b) => {
                const dateA = a.creationDate || "";
                const dateB = b.creationDate || "";
                return dateB.localeCompare(dateA);
            });
            badgeIcon = sortedBadges[0].icon;
            badgeName = sortedBadges[0].displayName;
        }

        return {
            username: username,
            name: displayName,
            total_solved: stats.find(s => s.difficulty === 'All')?.count || 0,
            easy_solved: stats.find(s => s.difficulty === 'Easy')?.count || 0,
            medium_solved: stats.find(s => s.difficulty === 'Medium')?.count || 0,
            hard_solved: stats.find(s => s.difficulty === 'Hard')?.count || 0,
            url: `https://leetcode.com/${username}/`,
            badge_icon: badgeIcon,
            badge_name: badgeName,
            last_updated: new Date()
        };

    } catch (error) {
        console.error("LeetCode API Error:", error);
        return null;
    }
}

// --- API 0: HEALTH CHECK (for Keep-Alive) ---
app.get('/api/health', (req, res) => {
    // This endpoint does nothing but confirm the server is running.
    res.status(200).send('OK');
});

// --- API 1: GET LEADERBOARD (FIXED GRAPH LOGIC) ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (!usersCollection) return res.status(503).json({ error: "Database not ready" });

        // ⚡ 1. SERVE FROM CACHE (Unless forced by background cron job)
        const forceRefresh = req.query.refresh === 'true';
        if (!forceRefresh && leaderboardCache.data && (Date.now() - leaderboardCache.timestamp < CACHE_TTL)) {
            return res.json(leaderboardCache.data);
        }

        const daysToLookBack = 21; 
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysToLookBack);

        // 1. RUN ALL DB QUERIES CONCURRENTLY (Massive Speedup)
        const [users, metadata, feedActivities, graphActivities] = await Promise.all([
            usersCollection.find().sort({ total_solved: -1 }).project({
                username: 1, name: 1, total_solved: 1, easy_solved: 1, 
                medium_solved: 1, hard_solved: 1, url: 1, badge_icon: 1, badge_name: 1
            }).toArray(),
            metadataCollection.findOne({ type: "last_updated" }),
            activitiesCollection.find().sort({ created_at: -1 }).limit(100).toArray(),
            activitiesCollection.find({ created_at: { $gte: pastDate } }).toArray()
        ]);

        // 2. OPTIMIZED GRAPH LOGIC (O(N) instead of O(N * 21))
        const dailySolvedMap = {};
        
        // Single pass through activities to group by date
        for (const act of graphActivities) {
            if (!act.created_at) continue;
            
            const match = act.text.match(/\+(\d+)/);
            const solved = match ? parseInt(match[1]) : 0;
            
            const actDate = new Date(act.created_at);
            const dateKey = actDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!dailySolvedMap[dateKey]) dailySolvedMap[dateKey] = 0;
            dailySolvedMap[dateKey] += solved;
        }

        // 3. BUILD FINAL 21-DAY ARRAY
        const graphStats = [];
        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            graphStats.push({ date: dateStr, solved: dailySolvedMap[dateStr] || 0 });
        }

        const responseData = { 
            users, 
            activities: feedActivities, // Send small list to UI
            graph_data: graphStats,     // Send calculated stats
            last_updated: metadata ? metadata.date_string : '--' 
        };

        // ⚡ 2. SAVE TO CACHE FOR SUBSEQUENT REQUESTS
        leaderboardCache.data = responseData;
        leaderboardCache.timestamp = Date.now();

        res.json(responseData);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- API 2: ADD USER (NO PASSWORD REQUIRED) ---
app.post('/api/add-user', async (req, res) => {
    const { username } = req.body; // ❌ Password completely removed from here
    
    if (!username) return res.status(400).json({ error: "❌ Username is required" });

    try {
        if (!usersCollection) return res.status(503).json({ error: "Database not ready" });
        const existingUser = await usersCollection.findOne({ username: username });
        if (existingUser) return res.status(400).json({ error: `⚠️ '${username}' is already in the leaderboard!` });

        const leetCodeData = await fetchLeetCodeData(username);
        if (!leetCodeData) return res.status(404).json({ error: `❌ User '${username}' does not exist on LeetCode!` });

        await usersCollection.insertOne(leetCodeData);
        res.json({ message: `Successfully added ${leetCodeData.name}! Stats: ${leetCodeData.total_solved} solved.` });

    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- API 3: TRIGGER UPDATE MANUALLY ---
app.post('/api/trigger-update', async (req, res) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "Harsh-Bajpai-1194"; 
    const REPO_NAME = "Leetcode_Leaderboards";
    const WORKFLOW_FILE = "scraper.yml"; 

    // Invalidate Cache so the next request pulls fresh scraped data
    leaderboardCache.data = null; 

    if (!GITHUB_TOKEN) return res.status(500).json({ error: "Server missing GitHub Token" });

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ref: 'main' })
        });

        if (response.status === 204) res.json({ message: "Update Started! Refresh in ~30 seconds." });
        else res.status(500).json({ error: `GitHub Error: ${await response.text()}` });
    } catch (error) {
        console.error("Trigger Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
