require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Server Connected to MongoDB"))
    .catch(err => console.error("❌ Server Connection Error:", err));

// 2. Define Schemas (Shapes of data)
const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    total_solved: Number,
    url: String,
    last_updated: Date
});

const activitySchema = new mongoose.Schema({
    text: String,
    time: String,
    type: String,
    created_at: Date
});

const metadataSchema = new mongoose.Schema({
    type: String,
    date_string: String
}, { collection: 'metadata' }); // Force it to look in 'metadata' collection

// 3. Create Models
const User = mongoose.model('User', userSchema);
const Activity = mongoose.model('Activity', activitySchema);
const Metadata = mongoose.model('Metadata', metadataSchema);

// 4. API Route: Get EVERYTHING (Leaderboard + Activities + Time)
// --- UPDATED API ENDPOINT ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        // 1. Fetch Users
        const users = await usersCollection.find().toArray();

        // 2. Fetch Activities (Last 100 to ensure we cover 7 days)
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
            activities: activities.slice(0, 20), // Send only top 20 for the feed text
            graph_data: sevenDaysStats,          // Send calculated graph data
            last_updated: metadata ? metadata.date_string : '--' 
        });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
