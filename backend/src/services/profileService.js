import OpenAI from "openai";

const OPENAI_MODEL = process.env.OPENAI_PROFILE_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_RESUME_CHARACTERS = Number(process.env.PROFILE_RESUME_CHARACTER_LIMIT || 12000);
const AI_ENABLED = Boolean(process.env.OPENAI_API_KEY);

const openai = AI_ENABLED
  ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  : null;

export class ProfileGenerationError extends Error {
  constructor(message, code = "PROFILE_GENERATION_FAILED") {
    super(message);
    this.name = "ProfileGenerationError";
    this.code = code;
  }
}

function toString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toStringArray(value, limit) {
  if (Array.isArray(value)) {
    return value
      .map((item) => toString(item))
      .filter(Boolean)
      .slice(0, limit);
  }

  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, limit);
  }

  return [];
}

function normalizeOnboarding(onboarding = {}) {
  const source = onboarding && typeof onboarding === "object" ? onboarding : {};

  return {
    fullName: toString(source.fullName),
    location: toString(source.location),
    targetRole: toString(source.targetRole),
    experienceLevel: toString(source.experienceLevel),
    workPreference: toString(source.workPreference),
    educationLevel: toString(source.educationLevel),
    skills: toString(source.skills),
    skillsList: toStringArray(source.skillsList, 16)
  };
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

function parseProfileJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    throw new ProfileGenerationError("AI returned invalid profile JSON.", "INVALID_AI_JSON");
  }
}

export async function generateProfileFromResume(resumeText, onboarding = {}) {
  const normalizedResumeText = toString(resumeText);

  if (!normalizedResumeText) {
    throw new ProfileGenerationError("Resume text is required.", "EMPTY_RESUME_TEXT");
  }

  if (!openai) {
    throw new ProfileGenerationError("OpenAI API key is not configured.", "OPENAI_NOT_CONFIGURED");
  }

  const candidateContext = {
    onboarding: normalizeOnboarding(onboarding),
    resumeText: normalizedResumeText.slice(0, MAX_RESUME_CHARACTERS)
  };

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content: [
          "You create accurate, concise job-seeker profiles for Ajuma AI.",
          "Return only valid JSON.",
          "Do not invent employers, dates, degrees, certifications, job titles, or tools.",
          "You may rewrite, summarize, and organize information that is present or clearly implied.",
          "If important details are missing, put them in missingInfo instead of guessing."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction: "Generate a structured profile that helps this candidate move toward their target role.",
          requiredJsonShape: {
            headline: "string, one concise target-role-oriented line",
            summary: "string, 2-4 sentences",
            skills: ["string, practical skill or tool"],
            experience: ["string, concise experience/project/work bullet"],
            education: ["string, education item if present"],
            suggestedRoles: ["string, role title aligned to the candidate"],
            strengths: ["string, candidate strength grounded in the input"],
            missingInfo: ["string, useful follow-up detail to ask the candidate"]
          },
          constraints: [
            "Keep all arrays short and high-signal.",
            "Prefer concrete skills over vague traits.",
            "Use onboarding target role and work preference to frame the profile.",
            "If the candidate is early-career, treat projects, coursework, volunteer work, and internships as valid experience.",
            "Never include markdown or commentary outside the JSON object."
          ],
          candidate: candidateContext
        })
      }
    ]
  });

  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new ProfileGenerationError("AI returned an empty profile response.", "EMPTY_AI_RESPONSE");
  }

  const parsed = parseProfileJson(content);
  const profile = normalizeProfile(parsed.profile || parsed);

  if (!profile.summary && !profile.headline) {
    throw new ProfileGenerationError("AI profile response did not include enough usable content.", "INCOMPLETE_AI_PROFILE");
  }

  return profile;
}
