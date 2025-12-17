import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`SUCCESS: ${modelName}`);
        console.log(response.text());
        return true;
    } catch (e) {
        console.error(`FAILED: ${modelName}`);
        console.error(e.message);
        return false;
    }
}

async function run() {
    const models = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro-latest", "gemini-1.0-pro"];

    for (const m of models) {
        if (await testModel(m)) break;
    }
}

run();
