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
import { getJobsForUser, syncJobsForUser } from "./services/jobsService.js";
import {
  generateProfileFromResume,
  ProfileGenerationError
} from "./services/profileService.js";
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
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });

  next();
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ajuma-ai-backend"
  });
});

app.post("/resume/upload", authLimiter, verifyFirebaseToken, upload.single("resume"), async (req, res) => {
  if (!req.file) {
    console.error("Resume upload failed: no file provided");
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
    console.error("Resume upload parsing failed", {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      error
    });

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

app.post("/ai/generate-profile", authLimiter, aiLimiter, verifyFirebaseToken, async (req, res) => {
  const { onboarding = {}, resumeText = "" } = req.body;

  if (!resumeText.trim()) {
    console.error("Profile generation failed: empty resumeText payload");
    return res.status(400).json({
      error: "Resume text is required to generate a profile."
    });
  }

  console.info("Profile generation input received", {
    userId: req.user.uid,
    characters: resumeText.length,
    targetRole: onboarding?.targetRole || "not provided"
  });

  try {
    const profile = await generateProfileFromResume(resumeText, onboarding);

    return res.json({
      message: "Profile generated successfully.",
      profile
    });
  } catch (error) {
    console.error("Profile generation failed", {
      userId: req.user.uid,
      code: error.code,
      error
    });

    if (error instanceof ProfileGenerationError && error.code === "OPENAI_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "OpenAI is not configured yet. Add OPENAI_API_KEY to the backend environment."
      });
    }

    if (error instanceof ProfileGenerationError && error.code === "EMPTY_RESUME_TEXT") {
      return res.status(400).json({
        error: "Resume text is required to generate a profile."
      });
    }

    return res.status(502).json({
      error: "Unable to generate a profile right now. Please try again."
    });
  }
});

app.post("/jobs/sync", authLimiter, verifyFirebaseToken, async (req, res) => {
  try {
    const { jobs, matchingMethod, source, syncedAt } = await syncJobsForUser(req.user.uid, {
      profile: req.body?.profile,
      resumeText: req.body?.resumeText
    });

    return res.json({
      message: "Jobs synced successfully.",
      synced: jobs.length,
      source,
      matchingMethod,
      syncedAt
    });
  } catch (error) {
    console.error("Jobs sync failed", {
      userId: req.user.uid,
      error
    });

    return res.status(502).json({
      error: "Unable to sync jobs from Arbeitnow right now. Please try again."
    });
  }
});

app.get("/jobs", authLimiter, verifyFirebaseToken, (req, res) => {
  const cached = getJobsForUser(req.user.uid);

  if (!cached) {
    return res.json({
      jobs: [],
      message: "No synced jobs found yet. Run /jobs/sync first."
    });
  }

  return res.json({
    jobs: cached.jobs,
    syncedAt: cached.syncedAt,
    source: cached.source,
    matchingMethod: cached.matchingMethod
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
