require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(cors());
app.use(express.json());

// --- DATABASE CONFIGURATION ---
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);
let db, usersCollection, activitiesCollection, metadataCollection;

// --- SUPABASE CONFIGURATION ---
const supabase = createClient(
    process.env.VITE_SUPABASE_URL, 
    process.env.VITE_SUPABASE_ANON_KEY
);

// --- IN-MEMORY CACHE ---
let leaderboardCache = { data: null, timestamp: 0 };
const CACHE_TTL = 15 * 60 * 1000; 
let isFetchingCache = false;

// --- SYNC LOGIC: PUSH TO SUPABASE ---
async function syncToSupabase(mongoUsers) {
    try {
        // Map MongoDB native structure to your Supabase table schema
        const supabasePayload = mongoUsers.map(user => ({
            leetcode_handle: user.username,
            problems_solved: user.total_solved || 0,
            streak: user.streak || 0,
            badge_icon: user.badge_icon,
            badge_name: user.badge_name
        }));

        const { error } = await supabase
            .from('leaderboard')
            .upsert(supabasePayload, { onConflict: 'leetcode_handle' });

        if (error) throw error;
        console.log(`✅ Successfully synced ${mongoUsers.length} users to Supabase Realtime.`);
    } catch (err) {
        console.error('❌ Supabase Sync Error:', err.message);
    }
}

// ⚡ BACKGROUND CACHE BUILDER
async function buildLeaderboardData() {
    if (isFetchingCache || !usersCollection) return;
    isFetchingCache = true;
    try {
        const daysToLookBack = 21; 
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysToLookBack);

        const [users, metadata, feedActivities, graphActivities] = await Promise.all([
            usersCollection.find().sort({ total_solved: -1 }).project({
                username: 1, name: 1, total_solved: 1, easy_solved: 1, 
                medium_solved: 1, hard_solved: 1, url: 1, badge_icon: 1, badge_name: 1, streak: 1
            }).toArray(),
            metadataCollection.findOne({ type: "last_updated" }),
            activitiesCollection.find().sort({ created_at: -1 }).limit(100).toArray(),
            activitiesCollection.find({ created_at: { $gte: pastDate } }).toArray()
        ]);

        // Trigger the Supabase sync whenever we build the cache (ensures Supabase is fresh)
        if (users.length > 0) {
            syncToSupabase(users);
        }

        const dailySolvedMap = {};
        for (const act of graphActivities) {
            if (!act.created_at || typeof act.text !== 'string') continue;
            const match = act.text.match(/\+(\d+)/);
            const solved = match ? parseInt(match[1]) : 0;
            const actDate = new Date(act.created_at);
            const dateKey = actDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailySolvedMap[dateKey]) dailySolvedMap[dateKey] = 0;
            dailySolvedMap[dateKey] += solved;
        }

        const graphStats = [];
        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            graphStats.push({ date: dateStr, solved: dailySolvedMap[dateStr] || 0 });
        }

        leaderboardCache.data = { 
            users, activities: feedActivities, graph_data: graphStats, last_updated: metadata ? metadata.date_string : '--' 
        };
        leaderboardCache.timestamp = Date.now();
        console.log("✅ Cache updated and pushed to Supabase.");
    } catch (error) {
        console.error("❌ Cache Build Error:", error);
    } finally {
        isFetchingCache = false;
    }
}

async function connectDB() {
    try {
        await client.connect();
        db = client.db("leetcode_db");
        usersCollection = db.collection("users");
        activitiesCollection = db.collection("activities");
        metadataCollection = db.collection("metadata");
        console.log("✅ Server Connected to MongoDB Atlas");

        await usersCollection.createIndex({ total_solved: -1 });
        await activitiesCollection.createIndex({ created_at: -1 });
        
        buildLeaderboardData();
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

// --- API ENDPOINTS ---

app.get('/api/health', (req, res) => res.status(200).send('OK'));

app.get('/api/leaderboard', async (req, res) => {
    try {
        if (!usersCollection) return res.status(503).json({ error: "Database not ready" });
        if (req.query.refresh === 'true') {
            buildLeaderboardData(); 
            return res.status(202).json({ message: "Background sync triggered" });
        }
        if (leaderboardCache.data) {
            if (Date.now() - leaderboardCache.timestamp > CACHE_TTL) buildLeaderboardData();
            return res.json(leaderboardCache.data);
        }
        await buildLeaderboardData();
        res.json(leaderboardCache.data);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/add-user', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });
    try {
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "User already exists" });
        const leetCodeData = await fetchLeetCodeData(username);
        if (!leetCodeData) return res.status(404).json({ error: "User not found on LeetCode" });

        await usersCollection.insertOne(leetCodeData);
        // After adding to Mongo, sync this specific user to Supabase
        syncToSupabase([leetCodeData]);
        
        res.json({ message: `Added ${leetCodeData.name}` });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/trigger-update', async (req, res) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "Harsh-Bajpai-1194"; 
    const REPO_NAME = "Leetcode_Leaderboards";
    const WORKFLOW_FILE = "scraper.yml"; 

    leaderboardCache.timestamp = 0; 

    if (!GITHUB_TOKEN) return res.status(500).json({ error: "Missing GitHub Token" });

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ref: 'main', inputs: { skip_followers: 'true' } })
        });

        if (response.status === 204) res.json({ message: "Update Started! Pushing to Mongo and Supabase soon." });
        else res.status(500).json({ error: `GitHub Error: ${await response.text()}` });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});