import { parsePDF, parseDOCX } from "../services/parserService.js";

export const handleUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    let text = "";

    if (file.mimetype === "application/pdf") {
      text = await parsePDF(file.path);
    } else {
      text = await parseDOCX(file.path);
    }

    res.json({ text });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error parsing file" });
  }
};
