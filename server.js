import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(cors());
app.use(express.json());

// --- SUPABASE CONFIGURATION ---
const supabase = createClient(
    process.env.VITE_SUPABASE_URL, 
    process.env.VITE_SUPABASE_ANON_KEY
);

// --- IN-MEMORY CACHE ---
let leaderboardCache = { data: null, timestamp: 0 };
const CACHE_TTL = 15 * 60 * 1000; 
let isFetchingCache = false;

// ⚡ BACKGROUND CACHE BUILDER
async function buildLeaderboardData() {
    if (isFetchingCache) return;
    isFetchingCache = true;
    try {
        const daysToLookBack = 21; 
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysToLookBack);

        const [usersRes, metadataRes, feedRes, graphRes] = await Promise.all([
            supabase.from('leaderboard').select('*').order('total_solved', { ascending: false }),
            supabase.from('metadata').select('*').eq('type', 'last_updated').maybeSingle(),
            supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(100),
            supabase.from('activities').select('*').gte('created_at', pastDate.toISOString())
        ]);

        const users = usersRes.data || [];
        
        // Match the frontend's expected format (mapping leetcode_handle -> username)
        const formattedUsers = users.map(u => ({
            username: u.leetcode_handle,
            name: u.name,
            total_solved: u.total_solved,
            easy_solved: u.easy_solved, 
            medium_solved: u.medium_solved,
            hard_solved: u.hard_solved,
            url: u.url,
            badge_icon: u.badge_icon,
            badge_name: u.badge_name,
            streak: u.streak || 0
        }));

        const metadata = metadataRes.data;
        const feedActivities = feedRes.data || [];
        const graphActivities = graphRes.data || [];

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
            users: formattedUsers, 
            activities: feedActivities, 
            graph_data: graphStats, 
            last_updated: metadata ? metadata.date_string : '--' 
        };
        leaderboardCache.timestamp = Date.now();
        console.log("✅ Cache updated using Supabase.");
    } catch (error) {
        console.error("❌ Cache Build Error:", error);
    } finally {
        isFetchingCache = false;
    }
}

// Initial cache build on startup
buildLeaderboardData();

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
    
    let cleanHandle = username.trim();

    if (cleanHandle.includes("leetcode.com")) {
        const parts = cleanHandle.split('/').filter(part => part.length > 0);
        cleanHandle = parts[parts.length - 1]; 
    }

    cleanHandle = cleanHandle.toLowerCase();

    try {
        const { data: existingUser } = await supabase
            .from('leaderboard')
            .select('*')
            .eq('leetcode_handle', cleanHandle)
            .maybeSingle();

        if (existingUser) return res.status(400).json({ error: "User already exists" });
        
        const leetCodeData = await fetchLeetCodeData(cleanHandle);
        if (!leetCodeData) return res.status(404).json({ error: "User not found on LeetCode" });

        const { error: insertError } = await supabase.from('leaderboard').insert([{
            leetcode_handle: leetCodeData.username,
            name: leetCodeData.name,
            total_solved: leetCodeData.total_solved,
            easy_solved: leetCodeData.easy_solved,
            medium_solved: leetCodeData.medium_solved,
            hard_solved: leetCodeData.hard_solved,
            url: leetCodeData.url,
            badge_icon: leetCodeData.badge_icon,
            badge_name: leetCodeData.badge_name,
            last_updated: leetCodeData.last_updated.toISOString()
        }]);

        if (insertError) throw insertError;
        
        res.json({ message: `Added ${leetCodeData.name}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/trigger-update', async (req, res) => {
    leaderboardCache.timestamp = 0; 

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    try {
        // Triggering your Supabase Edge Function directly!
        const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-api`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) res.json({ message: "Update Started in Edge Function! Pushing to DB soon." });
        else res.status(500).json({ error: `Edge Function Error: ${await response.text()}` });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/api/user-stats/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                    query getUserStats($username: String!) {
                        matchedUser(username: $username) {
                            username
                            profile { realName userAvatar aboutMe }
                            submitStats { acSubmissionNum { difficulty count } }
                        }
                        userContestRanking(username: $username) {
                            attendedContestsCount
                            rating
                            globalRanking
                        }
                    }
                `,
                variables: { username }
            })
        });

        const data = await response.json();
        if (!data.data || !data.data.matchedUser) return res.status(404).json({ error: "User not found" });
        res.json(data.data);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// --- ACTUAL GEMINI AI CHATBOT API ENDPOINT WITH MASSIVE FALLBACK ---
app.post('/api/chat', async (req, res) => {
    const { prompt, context } = req.body;
    
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const engineeredPrompt = `
      You are 'CodeX AI', a helpful, highly encouraging, and intelligent assistant 
      for a coding community called CodeX Club. Keep your responses conversational, 
      helpful, and concise (under 2 paragraphs).
      
      Here are the live LeetCode stats for the user the person is looking at right now:
      - Username: ${context.username}
      - Total Solved: ${context.totalSolved}
      - Easy: ${context.easy} | Medium: ${context.medium} | Hard: ${context.hard}
      - Contest Rating: ${context.rating}
      - Global Rank Top %: ${context.topPercentage}%

      Based ONLY on those stats and your knowledge of Data Structures and Algorithms, 
      answer the following question from the community member: 
      
      "${prompt}"
    `;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // 🔄 MASSIVE FALLBACK LIST: Tries these models in order from top to bottom
        const modelsToTry = [
            "gemini-2.0-flash-lite",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
            "gemini-2.0-flash-001",
            "gemini-2.0-flash-lite-001",
            "gemini-2.5-pro",
            "gemini-pro-latest",
            "gemma-4-26b-a4b-it",
            "gemma-4-31b-it",
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite",
            "gemini-3.1-flash-lite-preview",
            "gemini-3-flash-preview",
            "gemini-3-pro-preview",
            "gemini-3.1-pro-preview",
            "gemini-3.1-pro-preview-customtools",
            "gemini-2.5-flash-preview-tts",
            "gemini-2.5-pro-preview-tts",
            "gemini-3.1-flash-tts-preview",
            "gemini-2.5-flash-image",
            "gemini-3-pro-image-preview",
            "gemini-3-pro-image",
            "gemini-3.1-flash-image-preview",
            "gemini-3.1-flash-image",
            "nano-banana-pro-preview",
            "lyria-3-clip-preview",
            "lyria-3-pro-preview",
            "gemini-robotics-er-1.5-preview",
            "gemini-robotics-er-1.6-preview",
            "gemini-2.5-computer-use-preview-10-2025",
            "antigravity-preview-05-2026",
            "deep-research-preview-04-2026",
            "deep-research-pro-preview-12-2025",
            "deep-research-max-preview-04-2026"
        ];

        // Loop through the models
        for (const modelName of modelsToTry) {
            try {
                console.log(`🤖 AI Attempt: Generating with ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const result = await model.generateContent(engineeredPrompt);
                const responseText = result.response.text();

                // If successful, log it, send the response, and exit the function completely!
                console.log(`✅ AI Success: Responded using ${modelName}`);
                return res.json({ reply: responseText });

            } catch (modelError) {
                // If it fails, log the warning, but don't crash. The loop will just try the next model.
                console.log(`⚠️ AI Warning: ${modelName} failed. Trying next model... (${modelError.message})`);
            }
        }

        // If the loop finishes and we are still here, ALL 37 models failed.
        console.error("❌ AI Error: All 37 fallback models failed.");
        res.status(503).json({ error: "The AI servers are currently experiencing extreme demand. Please try again in 30 seconds!" });

    } catch (error) {
        console.error("Critical API Setup Error:", error);
        res.status(500).json({ error: "Internal Server Configuration Error." });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});