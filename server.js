require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
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

// --- HELPER: Fetch Real Data from LeetCode ---
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
                            submitStats {
                                acSubmissionNum { difficulty count }
                            }
                        }
                    }
                `,
                variables: { username }
            })
        });

        const data = await response.json();
        
        if (!data.data || !data.data.matchedUser) {
            return null; // User not found on LeetCode
        }

        const userData = data.data.matchedUser;
        const stats = userData.submitStats.acSubmissionNum;

        // Parse stats safely
        const total = stats.find(s => s.difficulty === 'All')?.count || 0;
        const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
        const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
        const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
        
        // Use Real Name if available, otherwise fallback to username
        const displayName = userData.profile.realName || username;

        return {
            username: username,
            name: displayName,
            total_solved: total,
            easy_solved: easy,
            medium_solved: medium,
            hard_solved: hard,
            url: `https://leetcode.com/${username}/`,
            last_updated: new Date()
        };

    } catch (error) {
        console.error("LeetCode API Error:", error);
        return null;
    }
}

// --- API 1: GET LEADERBOARD ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (!usersCollection) return res.status(503).json({ error: "Database not ready" });

        const users = await usersCollection.find().toArray();
        const activities = await activitiesCollection
            .find()
            .sort({ created_at: -1 })
            .limit(100)
            .toArray();

        const metadata = await metadataCollection.findOne({ type: "last_updated" });

        // Calculate 7-Day Graph Data
        const sevenDaysStats = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const dailyCount = activities.filter(act => {
                if (!act.created_at) return false;
                const actDate = new Date(act.created_at);
                return actDate.getDate() === d.getDate() && actDate.getMonth() === d.getMonth();
            }).reduce((acc, act) => {
                const match = act.text.match(/\+(\d+)/);
                return acc + (match ? parseInt(match[1]) : 0);
            }, 0);

            sevenDaysStats.push({ date: dateStr, solved: dailyCount });
        }

        res.json({ 
            users, 
            activities: activities.slice(0, 50), 
            graph_data: sevenDaysStats, 
            last_updated: metadata ? metadata.date_string : '--' 
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- API 2: SMART ADD USER (UPDATED) ---
app.post('/api/add-user', async (req, res) => {
    const { username, password } = req.body;

    if (password !== "admin123") {
        return res.status(401).json({ error: "❌ Wrong Password" });
    }

    if (!username) {
        return res.status(400).json({ error: "❌ Username is required" });
    }

    try {
        if (!usersCollection) return res.status(503).json({ error: "Database not ready" });

        // 1. Check if user already exists in OUR DB
        const existingUser = await usersCollection.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ error: `⚠️ '${username}' is already in the leaderboard!` });
        }

        // 2. Fetch REAL data from LeetCode
        console.log(`🌍 Checking LeetCode for: ${username}...`);
        const leetCodeData = await fetchLeetCodeData(username);

        if (!leetCodeData) {
            return res.status(404).json({ error: `❌ User '${username}' does not exist on LeetCode!` });
        }

        // 3. Save to Database
        await usersCollection.insertOne(leetCodeData);
        
        console.log(`✅ Added: ${leetCodeData.name} (${leetCodeData.total_solved} Solved)`);
        
        res.json({ 
            message: `Successfully added ${leetCodeData.name}! Stats: ${leetCodeData.total_solved} solved.` 
        });

    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});