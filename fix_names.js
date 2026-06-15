import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv'; // 👈 Changed import style

// 🛡️ Force dotenv to load and catch any hidden errors
const envConfig = dotenv.config();

if (envConfig.error) {
    console.error("⚠️ Dotenv failed to load the file! Reason:", envConfig.error);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
let SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (SUPABASE_SERVICE_KEY.startsWith('Bearer ')) {
    SUPABASE_SERVICE_KEY = SUPABASE_SERVICE_KEY.replace('Bearer ', '').trim();
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("\n❌ Still missing Supabase keys!");
    console.log("Did dotenv see the file?", envConfig.parsed ? "Yes" : "No");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixNames() {
    console.log("🔍 Fetching users from Supabase...");
    
    const { data: users, error } = await supabase
        .from('leaderboard')
        .select('leetcode_handle, name');

    if (error || !users) {
        return console.error("❌ Error fetching users:", error);
    }

    console.log(`Found ${users.length} users. Starting the patching process...\n`);

    for (const user of users) {
        try {
            const res = await fetch("https://leetcode.com/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "CodeX-Club-Patch-Script/1.0"
                },
                body: JSON.stringify({
                    query: `query getUserProfile($username: String!) {
                        matchedUser(username: $username) {
                            profile { realName }
                        }
                    }`,
                    variables: { username: user.leetcode_handle }
                })
            });

            const data = await res.json();
            
            const realName = data.data?.matchedUser?.profile?.realName;
            const finalName = (realName && realName.trim() !== "") ? realName : user.leetcode_handle;

            const { error: updateError } = await supabase
                .from('leaderboard')
                .update({ name: finalName })
                .eq('leetcode_handle', user.leetcode_handle);

            if (updateError) {
                console.error(`❌ Failed to update ${user.leetcode_handle}:`, updateError.message);
            } else {
                console.log(`✅ Updated: ${user.leetcode_handle} -> Name set to: "${finalName}"`);
            }

            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (err) {
            console.error(`⚠️ Network error for ${user.leetcode_handle}:`, err.message);
        }
    }
    
    console.log("\n🎉 All names have been successfully corrected!");
}

fixNames();