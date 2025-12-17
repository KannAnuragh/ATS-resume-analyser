import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

// --- Rate Limit Queue Implementation ---
class RateLimitQueue {
  constructor(delayBetweenRequestsMs) {
    this.queue = [];
    this.isProcessing = false;
    this.delay = delayBetweenRequestsMs;
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (e) {
      reject(e);
    }

    // Wait before processing next item
    setTimeout(() => {
      this.isProcessing = false;
      this.process();
    }, this.delay);
  }
}

// Global Queue: 1 request every 2000ms (to be safe within Groq limits)
const groqQueue = new RateLimitQueue(2000);

// In-Memory Cache
const resultCache = new Map();

// Initialize Groq
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
};

// --- API Functions ---

export const aiAnalysis = async (text, jd = "") => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallbackAnalysis(text, "Missing GROQ_API_KEY");

  // Cache Check
  const cacheKey = `analysis-${text.length}-${jd}`;
  if (resultCache.has(cacheKey)) {
    console.log("Serving Analysis from Cache");
    return resultCache.get(cacheKey);
  }

  try {
    const groq = getGroqClient();

    const prompt = `
      You are an expert Reviewer/Hiring Manager for the role of "${jd || "General Professional"}". 
      Provide a brutal, honest, yet constructive analysis of this resume.

      Resume Content:
      ${text.slice(0, 15000)}

      Role Context:
      ${jd || "Standard Industry Expectations"}

      Your task is to:
      1. Identify missing sections or content gaps for "${jd}".
      2. Analyze bullet points (Quantified? Result-oriented?).
      3. Identify missing keywords for "${jd}".
      4. Formatting checks.
      
      CRITICAL: For every score or critique, provide the "Why" and "How".

      Return ONLY a raw JSON object (no markdown, no explanations outside JSON) with this EXACT structure:
      {
        "summary": "3-4 sentences summarizing fit, red flags, and strengths.",
        "keywordSuggestions": ["List of 8-12 missing technical/hard skills"],
        "bulletImprovements": [
          "Rewrite suggestion 1: Weak bullet -> Strong bullet",
          "Rewrite suggestion 2..."
        ],
        "atsScore": number (Integer 0-10),
        "scoreReasoning": "Brief explanation of the score.",
        "detailedAnalysis": {
           "impactScore": "Low/Medium/High",
           "structureScore": "Low/Medium/High",
           "relevanceScore": "Low/Medium/High"
        }
      }
      `;

    // Add to Queue
    const completion = await groqQueue.add(() =>
      groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" } // Force JSON
      })
    );

    const jsonResponse = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Save to Cache
    resultCache.set(cacheKey, jsonResponse);
    return jsonResponse;

  } catch (err) {
    console.error("Groq AI Analysis Error:", err.message);
    return fallbackAnalysis(text);
  }
};

export const generateInterviewAnswer = async (question, resumeText, jobRole) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "API Key missing. Cannot generate answer.";

  const cacheKey = `interview-${question}-${resumeText.length}`;
  if (resultCache.has(cacheKey)) {
    console.log("Serving Interview Answer from Cache");
    return resultCache.get(cacheKey);
  }

  try {
    const groq = getGroqClient();

    const prompt = `
      You are an expert Interview Coach. 
      The candidate is applying for the role of: ${jobRole || "Professional"}.
      
      Resume Context:
      ${resumeText.slice(0, 5000)}...

      Question: "${question}"

      Task: Provide a strong, STAR-method based answer that this candidate could give. 
      Use specific details from their resume to personalize it.
      Keep it conversational, confident, and professional.
    `;

    const completion = await groqQueue.add(() =>
      groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5
      })
    );

    const answer = completion.choices[0]?.message?.content || "No answer generated.";

    resultCache.set(cacheKey, answer);
    return answer;

  } catch (err) {
    console.error("Groq Interview Error:", err.message);
    return "Sorry, I couldn't generate an answer at this moment due to high traffic. Please try again in a few seconds.";
  }
};

// Fallback Function
const fallbackAnalysis = (text, errorMsg = "AI Service Unavailable") => {
  console.warn("Using Fallback Analysis");
  return {
    summary: `Analysis failed (${errorMsg}). Basic keyword check performed.`,
    keywordSuggestions: ["Java", "Python", "React", "Node.js", "SQL", "AWS"],
    bulletImprovements: ["Measure your impact with numbers.", "Use stronger action verbs."],
    atsScore: 5,
    scoreReasoning: "Fallback score due to AI unavailability.",
    detailedAnalysis: {
      impactScore: "Low",
      structureScore: "Medium",
      relevanceScore: "Medium"
    }
  };
};
