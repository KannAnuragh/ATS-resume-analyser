import express from "express";
import upload from "../middleware/upload.js";
import { handleUpload } from "../controllers/uploadController.js";
import { analyzeResume } from "../controllers/analyzeController.js";
import { scoreResume } from "../controllers/scoreController.js";

const router = express.Router();

router.post("/upload", upload.single("file"), handleUpload);
router.post("/analyze", analyzeResume);
router.post("/score", scoreResume);

export default router;
