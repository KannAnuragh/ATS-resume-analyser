import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const aiAnalysis = async (text, jd = "") => {
  const prompt = `
Analyze this resume.

Resume:
${text}

Job Description (optional):
${jd}

Return JSON:
{
  "summary": "",
  "keywordSuggestions": [],
  "bulletImprovements": [],
  "atsScore": 0
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(response.choices[0].message.content);
};
