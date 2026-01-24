require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection String
const MONGO_URI = process.env.MONGO_URI;

// --- GLOBAL VARIABLES (This fixes the "not defined" error) ---
let db;
let usersCollection;
let activitiesCollection;
let metadataCollection;

// Connect to MongoDB
const client = new MongoClient(MONGO_URI);

async function connectDB() {
    try {
        await client.connect();
        db = client.db("leetcode_db");
        
        // Assign collections to global variables
        usersCollection = db.collection("users");
        activitiesCollection = db.collection("activities");
        metadataCollection = db.collection("metadata");

        console.log("✅ Server Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
}
connectDB();

// --- API 1: GET LEADERBOARD & GRAPH DATA ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(503).json({ error: "Database not ready yet" });
        }

        // 1. Fetch Users
        const users = await usersCollection.find().toArray();

        // 2. Fetch Activities (Last 100 for graph calculation)
        const activities = await activitiesCollection
            .find()
            .sort({ created_at: -1 })
            .limit(100) 
            .toArray();

        // 3. Get "Last Updated" Time
        const metadata = await metadataCollection.findOne({ type: "last_updated" });

        // 4. Calculate 7-Day Stats for the Graph 📊
        const sevenDaysStats = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., "Jan 20"
            
            // Filter activities for this specific day
            const dailyCount = activities.filter(act => {
                if (!act.created_at) return false;
                const actDate = new Date(act.created_at);
                return actDate.getDate() === d.getDate() && actDate.getMonth() === d.getMonth();
            }).reduce((acc, act) => {
                // Extract number from text "User solved +2 questions"
                const match = act.text.match(/\+(\d+)/); 
                return acc + (match ? parseInt(match[1]) : 0);
            }, 0);

            sevenDaysStats.push({ date: dateStr, solved: dailyCount });
        }

        res.json({ 
            users, 
            activities: activities.slice(0, 50), // Send only top 50 for the feed text
            graph_data: sevenDaysStats,          // Send calculated graph data
            last_updated: metadata ? metadata.date_string : '--' 
        });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- API 2: ADMIN ADD USER ---
app.post('/api/add-user', async (req, res) => {
    const { username, password } = req.body;

    if (password !== "admin123") { // Change this password if you want
        return res.status(401).json({ error: "❌ Wrong Password" });
    }

    if (!username) {
        return res.status(400).json({ error: "❌ Username is required" });
    }

    try {
        if (!usersCollection) return res.status(503).json({ error: "Database not ready" });

        const existingUser = await usersCollection.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ error: "⚠️ User already exists!" });
        }

        const newUser = {
            username: username,
            name: username,
            total_solved: 0,
            easy_solved: 0,
            medium_solved: 0,
            hard_solved: 0,
            url: `https://leetcode.com/${username}/`,
            last_updated: new Date()
        };

        await usersCollection.insertOne(newUser);
        console.log(`✅ Added new user: ${username}`);
        res.json({ message: `Successfully added ${username}! They will appear after the next update.` });

    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
