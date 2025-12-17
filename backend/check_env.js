import dotenv from "dotenv";
dotenv.config();
console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
console.log("Key length:", process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0);
