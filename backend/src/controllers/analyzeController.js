import { atsCheck } from "../services/atsRules.js";
import { aiAnalysis } from "../services/aiService.js";

export const analyzeResume = async (req, res) => {
  try {
    const { text, jobDescription } = req.body;

    const atsResults = atsCheck(text, jobDescription);
    const aiResults = await aiAnalysis(text, jobDescription);

    res.json({ atsResults, aiResults });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Analysis failed" });
  }
};
