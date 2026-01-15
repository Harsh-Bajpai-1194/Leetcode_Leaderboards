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
app.get('/api/leaderboard', async(req, res) => {
    try {
        // A. Fetch Users
        const users = await User.find().sort({ total_solved: -1 });

        // B. Fetch Recent Activities (Limit to top 15, newest first)
        const activities = await Activity.find().sort({ created_at: -1 }).limit(15);

        // C. Fetch Last Updated Time
        const meta = await Metadata.findOne({ type: "last_updated" });
        const lastUpdated = meta ? meta.date_string : "Just now";

        // D. Send it all together
        res.json({
            users: users,
            activities: activities,
            last_updated: lastUpdated
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));