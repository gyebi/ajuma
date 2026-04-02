import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import { verifyFirebaseToken } from "./middleware/auth.js";
import {
  aiLimiter,
  authLimiter,
  generalLimiter
} from "./middleware/rateLimit.js";
import { extractResumeText } from "./services/resumeParser.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = Number(process.env.PORT || 3001);
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({
  origin: allowedOrigin
}));
app.use(express.json({ limit: "2mb" }));
app.use(generalLimiter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ajuma-ai-backend"
  });
});

app.post("/resume/upload", authLimiter, verifyFirebaseToken, upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Resume file is required." });
  }

  try {
    const extractedText = await extractResumeText(req.file);
    const hasParsedText = Boolean(extractedText);
    const filename = req.file.originalname.toLowerCase();
    const supportedFormat = filename.endsWith(".pdf") || filename.endsWith(".docx");

    return res.status(201).json({
      filename: req.file.originalname,
      size: req.file.size,
      extractedText,
      hasParsedText,
      supportedFormat,
      message: hasParsedText
        ? "Resume uploaded and parsed successfully."
        : supportedFormat
          ? "Resume uploaded, but text extraction returned no usable content. Paste text only if needed."
          : "Resume uploaded. PDF and DOCX are supported best right now, so legacy DOC files may need pasted text."
    });
  } catch (error) {
    console.error("Resume parsing failed:", error);

    return res.status(201).json({
      filename: req.file.originalname,
      size: req.file.size,
      extractedText: "",
      hasParsedText: false,
      supportedFormat: false,
      message: "Resume uploaded, but parsing failed. Please paste resume text as a fallback."
    });
  }
});

app.get("/ai/ping", (_req, res) => {
  res.json({
    status: "ready",
    provider: process.env.OPENAI_API_KEY ? "configured" : "missing_api_key"
  });
});

app.post("/ai/generate-profile", authLimiter, aiLimiter, verifyFirebaseToken, (req, res) => {
  const { resumeText = "" } = req.body;

  res.json({
    message: "AI profile generation placeholder.",
    inputPreview: resumeText.slice(0, 140),
    profile: {
      summary: "Connect OpenAI here to produce strict JSON profile output.",
      skills: [],
      experience: [],
      education: []
    }
  });
});

app.post("/jobs/sync", authLimiter, verifyFirebaseToken, (_req, res) => {
  res.json({
    message: "Job sync placeholder. Connect Arbeitnow ingestion and deduplication here.",
    synced: 0
  });
});

app.get("/jobs", authLimiter, verifyFirebaseToken, (_req, res) => {
  res.json({
    jobs: [],
    message: "Recommended next endpoint from the project docs."
  });
});

app.get("/protected", authLimiter, verifyFirebaseToken, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user
  });
});

app.listen(port, () => {
  console.log(`Ajuma AI backend listening on http://localhost:${port}`);
});
