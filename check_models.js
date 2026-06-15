import 'dotenv/config';

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log("❌ No API key found. Make sure GEMINI_API_KEY is in your .env file!");
        return;
    }

    console.log("🔍 Checking available models for your API key...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("\n✅ TEXT MODELS AVAILABLE TO YOUR KEY:");
            data.models.forEach(m => {
                // We only want to see models that can generate text/chat
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(` -> ${m.name.replace('models/', '')}`);
                }
            });
            console.log("\n👉 Copy one of the names above and paste it into your server.js file!");
        } else {
            console.error("\n❌ API Key Error:", data);
        }
    } catch (err) {
        console.error("\n❌ Network error:", err.message);
    }
}

checkModels();