require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow website to talk to this server
app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Server Connected to MongoDB"))
    .catch(err => console.error("❌ Server Connection Error:", err));

// 2. Define the Shape of the Data (Schema)
// This must match what your Python script is saving!
const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    total_solved: Number,
    url: String,
    last_updated: Date
});

// "User" model will automatically look for a collection called "users"
const User = mongoose.model('User', userSchema);

// 3. API Route: Get the Leaderboard
app.get('/api/leaderboard', async(req, res) => {
    try {
        // Fetch users, sort by total_solved (descending -1)
        const users = await User.find().sort({ total_solved: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));