import { generateInterviewAnswer } from "../services/aiService.js";

export const answerQuestion = async (req, res) => {
    try {
        const { question, resumeText, jobRole } = req.body;
        if (!question || !resumeText) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const answer = await generateInterviewAnswer(question, resumeText, jobRole);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate answer" });
    }
};
