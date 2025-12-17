import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

const listModels = async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }
        const data = await response.json();
        console.log("Available Models:");
        data.models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error("Fetch failed:", e);
    }
};

listModels();
