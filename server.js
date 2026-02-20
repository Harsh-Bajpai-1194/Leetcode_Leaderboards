require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
let db, usersCollection, activitiesCollection, metadataCollection;

const client = new MongoClient(MONGO_URI);

async function connectDB() {
    try {
        await client.connect();
        db = client.db("leetcode_db");
        usersCollection = db.collection("users");
        activitiesCollection = db.collection("activities");
        metadataCollection = db.collection("metadata");
        console.log("✅ Server Connected to MongoDB");
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

        return {
            username: username,
            name: displayName,
            total_solved: stats.find(s => s.difficulty === 'All')?.count || 0,
            easy_solved: stats.find(s => s.difficulty === 'Easy')?.count || 0,
            medium_solved: stats.find(s => s.difficulty === 'Medium')?.count || 0,
            hard_solved: stats.find(s => s.difficulty === 'Hard')?.count || 0,
            url: `https://leetcode.com/${username}/`,
            last_updated: new Date()
        };

    } catch (error) {
        console.error("LeetCode API Error:", error);
        return null;
    }
}

// --- API 1: GET LEADERBOARD (FIXED GRAPH LOGIC) ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (!usersCollection) return res.status(503).json({ error: "Database not ready" });

        const users = await usersCollection.find().toArray();
        const metadata = await metadataCollection.findOne({ type: "last_updated" });

        // 1. FETCH FEED DATA (Fast, small limit)
        const feedActivities = await activitiesCollection
            .find()
            .sort({ created_at: -1 })
            .limit(100) // Keep the feed fast
            .toArray();

        // 2. FETCH GRAPH DATA (Look back 21 days, NO LIMIT)
        const daysToLookBack = 21; 
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysToLookBack);

        // Fetch ALL activities newer than 21 days ago
        const graphActivities = await activitiesCollection
            .find({ created_at: { $gte: pastDate } }) 
            .toArray();

        // 3. BUILD GRAPH
        const graphStats = [];
        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Check strictly against Day/Month
            const dailyCount = graphActivities.filter(act => {
                if (!act.created_at) return false;
                const actDate = new Date(act.created_at);
                return actDate.getDate() === d.getDate() && actDate.getMonth() === d.getMonth();
            }).reduce((acc, act) => {
                const match = act.text.match(/\+(\d+)/);
                return acc + (match ? parseInt(match[1]) : 0);
            }, 0);

            graphStats.push({ date: dateStr, solved: dailyCount });
        }

        res.json({ 
            users, 
            activities: feedActivities, // Send small list to UI
            graph_data: graphStats,     // Send calculated stats
            last_updated: metadata ? metadata.date_string : '--' 
        });
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
