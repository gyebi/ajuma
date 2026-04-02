const ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api";
const MAX_SYNC_PAGES = Number(process.env.JOBS_SYNC_PAGES || 2);
const MAX_RETURNED_JOBS = Number(process.env.JOBS_RESULT_LIMIT || 50);

const jobCacheByUser = new Map();

function normalizeJob(rawJob = {}) {
  const title = rawJob.title || "Untitled role";
  const company = rawJob.company_name || "Unknown company";
  const location = rawJob.location || "Location not specified";
  const slug = rawJob.slug || "";
  const jobUrl = rawJob.url || "";
  const id = slug || jobUrl || `${company}:${title}`;

  return {
    id,
    title,
    company,
    location,
    remote: Boolean(rawJob.remote),
    url: jobUrl,
    tags: Array.isArray(rawJob.tags) ? rawJob.tags : [],
    postedAt: rawJob.created_at || null
  };
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

export async function syncJobsForUser(userId) {
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

  const jobs = Array.from(dedupedById.values()).slice(0, MAX_RETURNED_JOBS);
  const syncedAt = new Date().toISOString();

  jobCacheByUser.set(userId, {
    jobs,
    syncedAt,
    source: "arbeitnow"
  });

  return {
    jobs,
    syncedAt,
    source: "arbeitnow"
  };
}

export function getJobsForUser(userId) {
  return jobCacheByUser.get(userId) || null;
}
