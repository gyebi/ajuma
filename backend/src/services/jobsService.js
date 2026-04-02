import OpenAI from "openai";

const ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api";
const MAX_SYNC_PAGES = Number(process.env.JOBS_SYNC_PAGES || 2);
const MAX_RETURNED_JOBS = Number(process.env.JOBS_RESULT_LIMIT || 50);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const AI_RERANK_POOL_SIZE = Number(process.env.JOBS_AI_RERANK_POOL_SIZE || 25);
const AI_ENABLED = Boolean(process.env.OPENAI_API_KEY);

const jobCacheByUser = new Map();
const openai = AI_ENABLED
  ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  : null;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "in", "is", "it", "of", "on", "or", "that", "the", "to", "with",
  "your", "you", "our", "we", "will", "this", "their", "they", "us"
]);

function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+\-#/.\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function toSet(tokens = []) {
  return new Set(tokens);
}

function countOverlap(tokensA, tokensB) {
  let count = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) {
      count += 1;
    }
  });
  return count;
}

function normalizeJob(rawJob = {}) {
  const title = rawJob.title || "Untitled role";
  const company = rawJob.company_name || "Unknown company";
  const location = rawJob.location || "Location not specified";
  const slug = rawJob.slug || "";
  const jobUrl = rawJob.url || "";
  const id = slug || jobUrl || `${company}:${title}`;
  const description = stripHtml(rawJob.description || "");

  return {
    id,
    title,
    company,
    location,
    remote: Boolean(rawJob.remote),
    url: jobUrl,
    tags: Array.isArray(rawJob.tags) ? rawJob.tags : [],
    description,
    postedAt: rawJob.created_at || null
  };
}

function buildCandidateContext(matchInput = {}) {
  const profile = matchInput.profile || {};
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const summary = profile.summary || "";
  const resumeText = matchInput.resumeText || "";

  return {
    summary,
    skills,
    experience,
    education,
    resumeText,
    contextText: [
      summary,
      skills.join(" "),
      experience.join(" "),
      education.join(" "),
      resumeText
    ].join(" ")
  };
}

function scoreJobsHeuristically(jobs = [], matchInput = {}) {
  const candidate = buildCandidateContext(matchInput);
  const candidateTokens = toSet(tokenize(candidate.contextText));
  const skillTokens = skillsToTokenSet(candidate.skills);

  return jobs.map((job) => {
    const jobTitleTokens = toSet(tokenize(job.title));
    const jobTagTokens = toSet(tokenize(job.tags.join(" ")));
    const jobDescriptionTokens = toSet(tokenize(job.description || ""));
    const jobCombinedTokens = new Set([
      ...jobTitleTokens,
      ...jobTagTokens,
      ...jobDescriptionTokens
    ]);

    const titleOverlap = countOverlap(candidateTokens, jobTitleTokens);
    const tagOverlap = countOverlap(candidateTokens, jobTagTokens);
    const descriptionOverlap = countOverlap(candidateTokens, jobDescriptionTokens);
    const skillOverlap = countOverlap(skillTokens, jobCombinedTokens);

    const weightedScore = (
      (titleOverlap * 3) +
      (tagOverlap * 2) +
      (descriptionOverlap * 1) +
      (skillOverlap * 2)
    );

    const normalizedScore = Math.min(99, Math.round(weightedScore * 3.5));
    const reasons = [];

    if (titleOverlap > 0) {
      reasons.push("Title aligns with your profile keywords");
    }
    if (tagOverlap > 0) {
      reasons.push("Job tags overlap with your CV context");
    }
    if (skillOverlap > 0) {
      reasons.push("Role mentions skills present in your profile");
    }
    if (!reasons.length) {
      reasons.push("General relevance from overall profile context");
    }

    return {
      ...job,
      matchScore: normalizedScore,
      matchReasons: reasons.slice(0, 2),
      matchingMethod: "heuristic"
    };
  });
}

function skillsToTokenSet(skills = []) {
  return toSet(tokenize(skills.join(" ")));
}

function parseAiRanking(content) {
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.rankings)) {
      return null;
    }
    return parsed.rankings;
  } catch {
    return null;
  }
}

async function rerankJobsWithOpenAI(seedRankedJobs = [], matchInput = {}) {
  if (!openai) {
    return seedRankedJobs;
  }

  const candidate = buildCandidateContext(matchInput);
  const rankingCandidates = seedRankedJobs.slice(0, AI_RERANK_POOL_SIZE).map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    tags: job.tags,
    description: (job.description || "").slice(0, 500)
  }));

  if (!rankingCandidates.length) {
    return seedRankedJobs;
  }

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content: "You are a strict job-matching engine. Return only valid JSON with a rankings array."
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction: "Rank jobs for this candidate using CV fit. Provide score 0-100 and 1-2 concise reasons per job. Return only JSON: {\"rankings\":[{\"id\":\"...\",\"matchScore\":number,\"matchReasons\":[\"...\"]}]}",
          candidate: {
            summary: candidate.summary,
            skills: candidate.skills,
            experience: candidate.experience,
            education: candidate.education,
            resumeTextSnippet: candidate.resumeText.slice(0, 1200)
          },
          jobs: rankingCandidates
        })
      }
    ]
  });

  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    return seedRankedJobs;
  }

  const aiRankings = parseAiRanking(content);
  if (!aiRankings) {
    return seedRankedJobs;
  }

  const aiRankingById = new Map();
  aiRankings.forEach((item) => {
    if (!item?.id) {
      return;
    }

    aiRankingById.set(item.id, {
      matchScore: Number(item.matchScore) || 0,
      matchReasons: Array.isArray(item.matchReasons) ? item.matchReasons.slice(0, 2) : []
    });
  });

  return seedRankedJobs
    .map((job) => {
      const ai = aiRankingById.get(job.id);

      if (!ai) {
        return job;
      }

      return {
        ...job,
        matchScore: Math.max(0, Math.min(100, Math.round(ai.matchScore))),
        matchReasons: ai.matchReasons.length ? ai.matchReasons : job.matchReasons,
        matchingMethod: "openai"
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

async function fetchArbeitnowPage(pageNumber) {
  const endpoint = new URL(ARBEITNOW_API_URL);
  endpoint.searchParams.set("page", String(pageNumber));

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Arbeitnow request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const jobs = Array.isArray(payload.data) ? payload.data : [];

  return jobs;
}

export async function syncJobsForUser(userId, matchInput = {}) {
  const collected = [];

  for (let page = 1; page <= MAX_SYNC_PAGES; page += 1) {
    const pageJobs = await fetchArbeitnowPage(page);

    if (!pageJobs.length) {
      break;
    }

    collected.push(...pageJobs);
  }

  const dedupedById = new Map();

  collected.forEach((rawJob) => {
    const normalized = normalizeJob(rawJob);
    dedupedById.set(normalized.id, normalized);
  });

  const normalizedJobs = Array.from(dedupedById.values());
  const heuristicRanked = scoreJobsHeuristically(normalizedJobs, matchInput)
    .sort((a, b) => b.matchScore - a.matchScore);
  const aiRanked = await rerankJobsWithOpenAI(heuristicRanked, matchInput);
  const jobs = aiRanked.slice(0, MAX_RETURNED_JOBS);
  const syncedAt = new Date().toISOString();
  const source = "arbeitnow";
  const matchingMethod = jobs.some((job) => job.matchingMethod === "openai")
    ? "openai+heuristic"
    : "heuristic";

  jobCacheByUser.set(userId, {
    jobs,
    syncedAt,
    source,
    matchingMethod
  });

  return {
    jobs,
    syncedAt,
    source,
    matchingMethod
  };
}

export function getJobsForUser(userId) {
  return jobCacheByUser.get(userId) || null;
}
