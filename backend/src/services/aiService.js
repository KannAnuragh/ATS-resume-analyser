import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

export const aiAnalysis = async (text, jd = "") => {
  const apiKey = process.env.OPENAI_API_KEY;
  // Fallback when no API key is provided: lightweight heuristic
  if (!apiKey) {
    const lower = (text || "").toLowerCase();
    const keywords = ["experience", "skills", "education", "project", "lead", "manage", "develop", "analyze"]; 
    const found = keywords.filter(k => lower.includes(k));
    const atsScore = Math.min(10, found.length); // 0-10 scale
    return {
      summary: "Heuristic analysis (no OpenAI key): basic keyword presence scored.",
      keywordSuggestions: keywords.filter(k => !lower.includes(k)).slice(0, 6),
      bulletImprovements: [
        "Use action verbs and quantify achievements.",
        "Align bullet points with the job description keywords.",
        "Keep formatting simple (standard fonts, no tables)."
      ],
      atsScore
    };
  }

  const client = new OpenAI({ apiKey });
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
