const crypto = require("node:crypto");
const Busboy = require("busboy");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");

admin.initializeApp();

const db = admin.firestore();
const app = express();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://www.ajuma-ai.com";
const PAYSTACK_BASE_URL = "https://api.paystack.co";
const OPENAI_MODEL = process.env.OPENAI_PROFILE_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_RESUME_CHARACTERS = Number(process.env.PROFILE_RESUME_CHARACTER_LIMIT || 12000);
const ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const defaultPlans = [
  {
    id: "starter",
    code: "starter",
    name: "Starter",
    amount: 5,
    currency: "GHS",
    credits: 3,
    cadence: "",
    description: "For a focused first batch of applications.",
    active: true,
    sortOrder: 1
  },
  {
    id: "standard",
    code: "standard",
    name: "Standard",
    amount: 10,
    currency: "GHS",
    credits: 7,
    cadence: "",
    description: "For steady job seekers applying with more consistency.",
    active: true,
    featured: true,
    sortOrder: 2
  },
  {
    id: "pro",
    code: "pro",
    name: "Pro",
    amount: 20,
    currency: "GHS",
    credits: 20,
    cadence: "",
    description: "For active job seekers who want more application capacity.",
    active: true,
    theme: "dark",
    sortOrder: 3
  }
];

const allowedOrigins = [
  "https://www.ajuma-ai.com",
  "https://ajuma-ai.com",
  "https://ajuma-ai.web.app",
  "https://ajuma-ai.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:5174",
  ...FRONTEND_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean)
];

const DEFAULT_PAYSTACK_CALLBACK_URL =
  "https://www.ajuma-ai.com/payment/callback";

function captureRawBody(req, _res, buffer) {
  if (buffer?.length) {
    req.rawBody = buffer.toString("utf8");
  }
}

function normalizePlanKey(value = "") {
  return String(value).trim().toLowerCase();
}

function orderPlans(plans = []) {
  const preferredOrder = new Map([
    ["starter", 1],
    ["standard", 2],
    ["pro", 3],
    ["premium", 3],
    ["advanced", 3]
  ]);

  return [...plans].sort((firstPlan, secondPlan) => {
    const firstOrder = firstPlan.sortOrder
      ?? preferredOrder.get(normalizePlanKey(firstPlan.code))
      ?? preferredOrder.get(normalizePlanKey(firstPlan.name))
      ?? 99;
    const secondOrder = secondPlan.sortOrder
      ?? preferredOrder.get(normalizePlanKey(secondPlan.code))
      ?? preferredOrder.get(normalizePlanKey(secondPlan.name))
      ?? 99;

    return firstOrder - secondOrder;
  });
}

function normalizePlanOffer(plan = {}) {
  const keys = [
    normalizePlanKey(plan.id),
    normalizePlanKey(plan.code),
    normalizePlanKey(plan.name)
  ];
  const shouldNormalizeToPro = keys.some((key) => key === "advanced" || key === "premium");

  if (!shouldNormalizeToPro) {
    return plan;
  }

  const proPlan = defaultPlans.find((defaultPlan) => defaultPlan.id === "pro");

  return {
    ...plan,
    ...proPlan,
    id: plan.id || proPlan.id
  };
}

function addMissingDefaultPlans(plans = []) {
  const normalizedPlans = plans.map(normalizePlanOffer);
  const existingKeys = new Set(
    normalizedPlans.flatMap((plan) => [
      normalizePlanKey(plan.id),
      normalizePlanKey(plan.code),
      normalizePlanKey(plan.name)
    ])
  );

  const missingDefaultPlans = defaultPlans.filter((plan) => (
    !existingKeys.has(normalizePlanKey(plan.id))
    && !existingKeys.has(normalizePlanKey(plan.code))
    && !existingKeys.has(normalizePlanKey(plan.name))
  ));

  return orderPlans([...normalizedPlans, ...missingDefaultPlans]);
}

function getDefaultPlanById(planId) {
  const normalizedPlanId = normalizePlanKey(planId);
  const legacyProAliases = new Set(["advanced", "premium"]);

  return defaultPlans.find((plan) => (
    normalizePlanKey(plan.id) === normalizedPlanId
    || normalizePlanKey(plan.code) === normalizedPlanId
    || normalizePlanKey(plan.name) === normalizedPlanId
  )) || (legacyProAliases.has(normalizedPlanId)
    ? defaultPlans.find((plan) => plan.id === "pro")
    : null);
}

function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeText(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function toString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toStringArray(value, limit) {
  if (Array.isArray(value)) {
    return value.map((item) => toString(item)).filter(Boolean).slice(0, limit);
  }

  if (typeof value === "string") {
    return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean).slice(0, limit);
  }

  return [];
}

function resolvePlanAmount(plan = {}) {
  return plan.amount ?? plan.price ?? plan.priceAmount ?? plan.priceValue ?? null;
}

function resolvePlanCredits(plan = {}) {
  const credits = Number(plan.credits ?? plan.creditAmount ?? plan.creditCount ?? 0);
  return Number.isFinite(credits) && credits > 0 ? credits : 0;
}

function toMinorAmount(amount) {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) && numericAmount > 0
    ? Math.round(numericAmount * 100)
    : null;
}

function buildReference(userId) {
  return `ajuma_${userId}_${Date.now()}`;
}

async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const idToken = authHeader.slice("Bearer ".length).trim();

    if (!idToken) {
      return res.status(401).json({ error: "Unauthorized: Empty token" });
    }

    req.user = await admin.auth().verifyIdToken(idToken, true);
    return next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

async function getActivePlans() {
  const snapshot = await db.collection("plans").where("active", "==", true).get();
  const plans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return addMissingDefaultPlans(plans);
}

async function getPlanById(planId) {
  const doc = await db.collection("plans").doc(planId).get();

  if (!doc.exists) {
    return getDefaultPlanById(planId);
  }

  return orderPlans([normalizePlanOffer({ id: doc.id, ...doc.data() })])[0];
}

async function extractResumeText(file) {
  const mimeType = file.mimetype;
  const filename = file.originalname.toLowerCase();

  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    const parsed = await pdfParse(file.buffer);
    return normalizeText(parsed.text || "");
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || filename.endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return normalizeText(parsed.value || "");
  }

  return "";
}

function normalizeProfile(rawProfile = {}) {
  const source = rawProfile && typeof rawProfile === "object" ? rawProfile : {};

  return {
    headline: toString(source.headline),
    summary: toString(source.summary),
    skills: toStringArray(source.skills, 14),
    experience: toStringArray(source.experience, 8),
    education: toStringArray(source.education, 6),
    suggestedRoles: toStringArray(source.suggestedRoles, 6),
    strengths: toStringArray(source.strengths, 6),
    missingInfo: toStringArray(source.missingInfo, 5)
  };
}

async function generateProfileFromResume(resumeText, onboarding = {}) {
  const normalizedResumeText = toString(resumeText);

  if (!normalizedResumeText) {
    const error = new Error("Resume text is required.");
    error.code = "EMPTY_RESUME_TEXT";
    throw error;
  }

  if (!openai) {
    const error = new Error("OpenAI API key is not configured.");
    error.code = "OPENAI_NOT_CONFIGURED";
    throw error;
  }

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You create accurate, concise job-seeker profiles for Ajuma AI.",
          "Return only valid JSON.",
          "Do not invent employers, dates, degrees, certifications, job titles, or tools.",
          "If important details are missing, put them in missingInfo instead of guessing."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction: "Generate a structured profile that helps this candidate move toward their target role.",
          requiredJsonShape: {
            headline: "string",
            summary: "string",
            skills: ["string"],
            experience: ["string"],
            education: ["string"],
            suggestedRoles: ["string"],
            strengths: ["string"],
            missingInfo: ["string"]
          },
          candidate: {
            onboarding,
            resumeText: normalizedResumeText.slice(0, MAX_RESUME_CHARACTERS)
          }
        })
      }
    ]
  });

  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned an empty profile response.");
  }

  const parsed = JSON.parse(content);
  const profile = normalizeProfile(parsed.profile || parsed);

  if (!profile.summary && !profile.headline) {
    throw new Error("AI profile response did not include enough usable content.");
  }

  return profile;
}

async function paystackRequest(path, options = {}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.message || "Paystack request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

function getPaymentByReference(reference) {
  return db.collection("payments").where("reference", "==", reference).limit(1).get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    });
}

async function updatePaymentByReference(reference, updates) {
  const snapshot = await db.collection("payments").where("reference", "==", reference).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const nextData = { ...updates, updatedAt: new Date() };
  await doc.ref.update(nextData);
  const updatedDoc = await doc.ref.get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
}

async function fulfillSuccessfulPayment(reference, paymentDetails, source) {
  const existingPayment = await getPaymentByReference(reference);

  if (!existingPayment) {
    return { payment: null, entitlement: null, notFound: true, alreadyFulfilled: false };
  }

  if (existingPayment.fulfilledAt) {
    return { payment: existingPayment, entitlement: null, notFound: false, alreadyFulfilled: true };
  }

  const plan = await getPlanById(existingPayment.planId);
  const credits = resolvePlanCredits(plan);

  if (!plan || !credits) {
    throw new Error("Plan not found or has no credits for successful payment fulfillment");
  }

  const paymentRef = db.collection("payments").doc(existingPayment.id);
  const entitlementRef = db.collection("user_entitlements").doc(existingPayment.userId);

  const result = await db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);

    if (!paymentSnapshot.exists) {
      throw new Error("Payment not found during fulfillment");
    }

    const latestPayment = paymentSnapshot.data();

    if (latestPayment.fulfilledAt) {
      return {
        payment: { id: paymentSnapshot.id, ...latestPayment },
        entitlement: null,
        alreadyFulfilled: true
      };
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    transaction.set(entitlementRef, {
      userId: existingPayment.userId,
      planId: plan.id ?? existingPayment.planId ?? null,
      planCode: plan.code ?? null,
      planName: plan.name ?? null,
      totalCredits: admin.firestore.FieldValue.increment(credits),
      availableCredits: admin.firestore.FieldValue.increment(credits),
      active: true,
      updatedAt: now,
      lastGrantedAt: now,
      createdAt: now
    }, { merge: true });

    transaction.set(paymentRef, {
      status: "success",
      fulfillmentSource: source,
      fulfilledAt: now,
      creditsGranted: credits,
      planSnapshot: {
        id: plan.id ?? existingPayment.planId ?? null,
        name: plan.name ?? null,
        code: plan.code ?? null,
        credits
      },
      gatewayVerification: paymentDetails,
      paidAt: paymentDetails?.paid_at ?? paymentDetails?.paidAt ?? latestPayment.paidAt ?? null,
      channel: paymentDetails?.channel ?? latestPayment.channel ?? null,
      updatedAt: now
    }, { merge: true });

    return {
      payment: {
        id: paymentSnapshot.id,
        ...latestPayment,
        status: "success",
        creditsGranted: credits,
        fulfillmentSource: source,
        gatewayVerification: paymentDetails
      },
      entitlement: {
        userId: existingPayment.userId,
        planId: plan.id ?? existingPayment.planId ?? null,
        planName: plan.name ?? null,
        creditsGranted: credits
      },
      alreadyFulfilled: false
    };
  });

  return { ...result, notFound: false };
}

async function getEntitlementByUserId(userId) {
  const doc = await db.collection("user_entitlements").doc(userId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function consumeCredit(userId) {
  const entitlementRef = db.collection("user_entitlements").doc(userId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(entitlementRef);

    if (!snapshot.exists) {
      throw new Error("User entitlement not found");
    }

    const entitlement = snapshot.data();
    const availableCredits = Number(entitlement.availableCredits ?? 0);

    if (availableCredits < 1) {
      throw new Error("No credits available");
    }

    transaction.set(entitlementRef, {
      availableCredits: admin.firestore.FieldValue.increment(-1),
      usedCredits: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return {
      id: snapshot.id,
      ...entitlement,
      availableCredits: availableCredits - 1,
      usedCredits: Number(entitlement.usedCredits ?? 0) + 1
    };
  });
}

async function syncJobsForUser(userId, { profile = {}, onboarding = {} }) {
  const response = await fetch(ARBEITNOW_API_URL);
  const data = await response.json();
  const targetRole = toString(onboarding.targetRole || profile.suggestedRoles?.[0]).toLowerCase();
  const skills = Array.isArray(profile.skills) ? profile.skills.map((skill) => skill.toLowerCase()) : [];
  const jobs = (data.data || []).map((rawJob) => {
    const title = rawJob.title || "Untitled role";
    const company = rawJob.company_name || "Unknown company";
    const location = rawJob.location || "Location not specified";
    const description = stripHtml(rawJob.description || "");
    const haystack = `${title} ${description} ${(rawJob.tags || []).join(" ")}`.toLowerCase();
    const roleScore = targetRole && haystack.includes(targetRole) ? 45 : 0;
    const skillScore = skills.reduce((score, skill) => score + (haystack.includes(skill) ? 8 : 0), 0);
    const score = Math.min(100, 35 + roleScore + skillScore);

    return {
      id: rawJob.slug || rawJob.url || `${company}:${title}`,
      title,
      company,
      location,
      remote: Boolean(rawJob.remote),
      url: rawJob.url || "",
      tags: Array.isArray(rawJob.tags) ? rawJob.tags : [],
      description,
      postedAt: rawJob.created_at || null,
      matchScore: score,
      matchReasons: score >= 80 ? ["Strong profile alignment"] : ["Partial profile alignment"],
      freshnessLabel: "Needs verification",
      freshnessReason: "Confirm details on the employer site",
      ageInDays: null
    };
  }).sort((firstJob, secondJob) => secondJob.matchScore - firstJob.matchScore).slice(0, 50);

  const syncedAt = new Date().toISOString();
  const payload = {
    jobs,
    syncedAt,
    source: "arbeitnow",
    matchingMethod: openai ? "keyword-plus-ai-ready" : "keyword"
  };

  await db.collection("user_job_syncs").doc(userId).set(payload, { merge: true });
  return payload;
}

async function getJobsForUser(userId) {
  const doc = await db.collection("user_job_syncs").doc(userId).get();
  return doc.exists ? doc.data() : null;
}

function isValidPaystackSignature(rawBody, signature) {
  if (!rawBody || !signature || !process.env.PAYSTACK_SECRET_KEY) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: 5 * 1024 * 1024 // 5MB
      }
    });

    let uploadedFile = null;

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];

      file.on("data", (chunk) => {
        chunks.push(chunk);
      });

      file.on("limit", () => {
        reject(new Error("File is too large. Maximum allowed size is 5MB."));
      });

      file.on("end", () => {
        uploadedFile = {
          fieldname,
          originalname: filename,
          filename,
          mimetype: mimeType,
          mimeType,
          buffer: Buffer.concat(chunks)
        };

        uploadedFile.size = uploadedFile.buffer.length;
      });
    });

    busboy.on("error", reject);

    busboy.on("finish", () => {
      resolve(uploadedFile);
    });

    if (req.rawBody) {
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  });
}

app.use(cors({
  origin(origin, callback) {
    const uniqueAllowedOrigins = new Set(allowedOrigins);

    if (!origin || uniqueAllowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.error("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb", verify: captureRawBody }));

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ajuma-ai-functions-api" });
});

router.get("/billing/plans", async (_req, res) => {
  try {
    const plans = await getActivePlans();
    return res.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return res.status(500).json({ error: "Failed to fetch plans" });
  }
});

router.get("/billing/plans/:planId", async (req, res) => {
  try {
    const plan = await getPlanById(req.params.planId);
    return plan ? res.json({ plan }) : res.status(404).json({ error: "Plan not found" });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return res.status(500).json({ error: "Failed to fetch plan" });
  }
});

router.get("/billing/entitlement/me", verifyFirebaseToken, async (req, res) => {
  try {
    const entitlement = await getEntitlementByUserId(req.user.uid);
    return res.json({ entitlement });
  } catch (error) {
    console.error("Error fetching entitlement:", error);
    return res.status(500).json({ error: "Failed to fetch entitlement" });
  }
});

router.post("/billing/entitlement/consume", verifyFirebaseToken, async (req, res) => {
  try {
    const entitlement = await consumeCredit(req.user.uid);
    return res.json({ message: "Credit consumed successfully.", entitlement });
  } catch (error) {
    if (error.message === "User entitlement not found") {
      return res.status(404).json({ error: "No entitlement found for this user." });
    }

    if (error.message === "No credits available") {
      return res.status(400).json({ error: "No credits available." });
    }

    console.error("Error consuming credit:", error);
    return res.status(500).json({ error: "Failed to consume credit" });
  }
});

router.get("/me/flow", verifyFirebaseToken, async (req, res) => {
  try {
    const snapshot = await db.collection("user_flows").doc(req.user.uid).get();
    const flow = snapshot.exists ? snapshot.data().flow || null : null;
    return res.json({ flow });
  } catch (error) {
    console.error("User flow fetch failed:", error);
    return res.status(500).json({ error: "Unable to load saved setup right now." });
  }
});

router.put("/me/flow", verifyFirebaseToken, async (req, res) => {
  try {
    const flow = req.body?.flow || {};
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("user_flows").doc(req.user.uid).set({
      userId: req.user.uid,
      flow,
      updatedAt: now,
      createdAt: now
    }, { merge: true });
    return res.json({ message: "Setup saved successfully.", flow });
  } catch (error) {
    console.error("User flow save failed:", error);
    return res.status(500).json({ error: "Unable to save setup right now." });
  }
});

router.post("/resume/upload", verifyFirebaseToken, async (req, res) => {
  let uploadedFile;

  try {
    uploadedFile = await parseMultipartForm(req);

    if (!uploadedFile) {
      return res.status(400).json({ error: "Resume file is required." });
    }

    if (uploadedFile.fieldname !== "resume") {
      return res.status(400).json({
        error: "Invalid upload field. Expected field name 'resume'."
      });
    }

    const extractedText = await extractResumeText(uploadedFile);
    const filename = uploadedFile.originalname.toLowerCase();
    const supportedFormat = filename.endsWith(".pdf") || filename.endsWith(".docx");

    return res.status(201).json({
      filename: uploadedFile.originalname,
      size: uploadedFile.size,
      extractedText,
      hasParsedText: Boolean(extractedText),
      supportedFormat,
      message: extractedText
        ? "Resume uploaded and parsed successfully."
        : "Resume uploaded, but we could not extract enough usable text. Continue to the manual CV step to add your details."
    });
  } catch (error) {
    console.error("Resume upload parsing failed:", {
      message: error.message,
      stack: error.stack
    });

    return res.status(201).json({
      filename: uploadedFile?.originalname || "resume",
      size: uploadedFile?.size || 0,
      extractedText: "",
      hasParsedText: false,
      supportedFormat: false,
      message: "Resume uploaded, but parsing failed. Continue to the manual CV step to add your details."
    });
  }
});

router.get("/ai/ping", (_req, res) => {
  res.json({ status: "ready", provider: process.env.OPENAI_API_KEY ? "configured" : "missing_api_key" });
});

router.post("/ai/generate-profile", verifyFirebaseToken, async (req, res) => {
  const { onboarding = {}, resumeText = "" } = req.body;

  if (!resumeText.trim()) {
    return res.status(400).json({ error: "Resume text is required to generate a profile." });
  }

  try {
    const profile = await generateProfileFromResume(resumeText, onboarding);
    return res.json({ message: "Profile generated successfully.", profile });
  } catch (error) {
    if (error.code === "OPENAI_NOT_CONFIGURED") {
      return res.status(503).json({ error: "OpenAI is not configured yet. Add OPENAI_API_KEY to the backend environment." });
    }

    if (error.code === "EMPTY_RESUME_TEXT") {
      return res.status(400).json({ error: "Resume text is required to generate a profile." });
    }

    console.error("Profile generation failed:", error);
    return res.status(502).json({ error: "Unable to generate a profile right now. Please try again." });
  }
});

router.post("/jobs/sync", verifyFirebaseToken, async (req, res) => {
  try {
    const { jobs, matchingMethod, source, syncedAt } = await syncJobsForUser(req.user.uid, {
      profile: req.body?.profile,
      resumeText: req.body?.resumeText,
      onboarding: req.body?.onboarding
    });

    return res.json({
      message: "Jobs synced successfully.",
      synced: jobs.length,
      source,
      matchingMethod,
      syncedAt
    });
  } catch (error) {
    console.error("Jobs sync failed:", error);
    return res.status(502).json({ error: "Unable to sync jobs from Arbeitnow right now. Please try again." });
  }
});

router.get("/jobs", verifyFirebaseToken, async (req, res) => {
  const cached = await getJobsForUser(req.user.uid);

  if (!cached) {
    return res.json({ jobs: [], message: "No synced jobs found yet. Run /jobs/sync first." });
  }

  return res.json(cached);
});

router.post("/payments/initialize", verifyFirebaseToken, async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ error: "Paystack secret key is not configured yet." });
    }

    const { planId, email: requestedEmail } = req.body ?? {};

    if (!planId) {
      return res.status(400).json({ error: "planId is required." });
    }

    const plan = await getPlanById(planId);

    if (!plan || plan.active === false) {
      return res.status(404).json({ error: "Active plan not found." });
    }

    const userEmail = req.user.email || requestedEmail;

    if (!userEmail) {
      return res.status(400).json({
        error: "User email is required to initialize payment."
      });
    }

    const amountMajor = resolvePlanAmount(plan);
    const amount = toMinorAmount(amountMajor);

    if (!amount) {
      return res.status(400).json({ error: "Selected plan does not have a valid amount." });
    }

    const reference = buildReference(req.user.uid);
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || DEFAULT_PAYSTACK_CALLBACK_URL;
    const docRef = db.collection("payments").doc();
    const paymentRecord = {
      id: docRef.id,
      paymentId: docRef.id,
      userId: req.user.uid,
      planId: plan.id,
      email: userEmail,
      currency: plan.currency || "GHS",
      amount,
      amountMajor,
      reference,
      status: "pending",
      provider: "paystack",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await docRef.set(paymentRecord);

    const paystackResponse = await paystackRequest("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: userEmail,
        amount,
        reference,
        callback_url: callbackUrl,
        currency: plan.currency || "GHS",
        metadata: {
          userId: req.user.uid,
          planId: plan.id,
          paymentId: paymentRecord.id,
          paymentReference: reference,
          credits: resolvePlanCredits(plan)
        }
      })
    });

    await updatePaymentByReference(reference, {
      status: "initialized",
      gatewayResponse: paystackResponse,
      accessCode: paystackResponse?.data?.access_code ?? null,
      authorizationUrl: paystackResponse?.data?.authorization_url ?? null
    });

    return res.status(201).json({
      message: "Payment initialized successfully.",
      payment: {
        ...paymentRecord,
        status: "initialized",
        accessCode: paystackResponse?.data?.access_code ?? null,
        authorizationUrl: paystackResponse?.data?.authorization_url ?? null
      },
      paystack: paystackResponse?.data ?? null
    });
  } catch (error) {
    console.error("Payment initialization failed:", error);
    return res.status(502).json({ error: "Unable to initialize payment right now." });
  }
});

router.get("/payments/verify/:reference", verifyFirebaseToken, async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ error: "Paystack secret key is not configured yet." });
    }

    const reference = req.params.reference || req.query.reference;
    const existingPayment = await getPaymentByReference(reference);

    if (!existingPayment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    if (existingPayment.userId !== req.user.uid) {
      return res.status(403).json({ error: "You are not allowed to verify this payment reference." });
    }

    const paystackResponse = await paystackRequest(`/transaction/verify/${reference}`);
    const paymentStatus = paystackResponse?.data?.status || "unknown";
    let updatedPayment;
    let entitlement = null;

    if (paymentStatus === "success") {
      const fulfillment = await fulfillSuccessfulPayment(reference, paystackResponse?.data ?? null, "verify");
      updatedPayment = fulfillment.payment;
      entitlement = fulfillment.entitlement;
    } else {
      updatedPayment = await updatePaymentByReference(reference, {
        status: paymentStatus,
        gatewayVerification: paystackResponse,
        paidAt: paystackResponse?.data?.paid_at ?? null,
        channel: paystackResponse?.data?.channel ?? null
      });
    }

    return res.json({
      message: "Payment verification completed.",
      payment: updatedPayment,
      entitlement,
      paystack: paystackResponse?.data ?? null
    });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return res.status(502).json({ error: "Unable to verify payment right now." });
  }
});

router.get("/payments/mine", verifyFirebaseToken, async (req, res) => {
  try {
    const snapshot = await db.collection("payments").where("userId", "==", req.user.uid).get();
    const payments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ payments });
  } catch (error) {
    console.error("Fetching payments failed:", error);
    return res.status(500).json({ error: "Failed to fetch payments." });
  }
});

router.post("/payments/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    if (!isValidPaystackSignature(req.rawBody, signature)) {
      return res.status(401).json({ error: "Invalid Paystack signature." });
    }

    const event = req.body?.event;
    const data = req.body?.data ?? {};
    const reference = data.reference;

    if (!reference) {
      return res.status(400).json({ error: "Webhook reference is required." });
    }

    if (event === "charge.success" && data.status === "success") {
      const fulfillment = await fulfillSuccessfulPayment(reference, data, "webhook");

      if (fulfillment.notFound) {
        return res.status(404).json({ error: "Payment not found for webhook reference." });
      }

      return res.json({ received: true, event, fulfilled: !fulfillment.alreadyFulfilled });
    }

    await updatePaymentByReference(reference, {
      status: data.status || "webhook_received",
      webhookEvent: event,
      webhookPayload: data
    });

    return res.json({ received: true, event, fulfilled: false });
  } catch (error) {
    console.error("Paystack webhook handling failed:", error);
    return res.status(500).json({ error: "Failed to process Paystack webhook." });
  }
});

router.post("/webhooks/paystack", (req, res, next) => {
  req.url = "/payments/webhook";
  return router.handle(req, res, next);
});

router.get("/protected", verifyFirebaseToken, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

app.use("/", router);
app.use("/api", router);

exports.app = app;
exports.api = onRequest(
  {
    region: "us-central1",
    secrets: ["OPENAI_API_KEY", "PAYSTACK_SECRET_KEY"]
  },
  app
);
