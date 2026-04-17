// src/pages/Jobs.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/api";

function formatPostedAge(job) {
  if (typeof job.ageInDays !== "number") {
    return "Posted date unavailable";
  }

  if (job.ageInDays === 0) {
    return "Posted today";
  }

  if (job.ageInDays === 1) {
    return "Posted 1 day ago";
  }

  return `Posted ${job.ageInDays} days ago`;
}

export default function Jobs({
  favoriteJobs,
  onBack,
  onGoToFavorites,
  onToggleFavorite,
  profile,
  resumeData,
  onboardingData
}) {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoFetchedRef = useRef(false);
  const favoriteJobIds = new Set(favoriteJobs.map((job) => job.id));

  const fetchJobs = useCallback(async () => {
    setError("");
    setIsLoading(true);

    console.info("Starting jobs fetch");

    try {
      await apiFetch("/jobs/sync", {
        method: "POST",
        body: JSON.stringify({
          profile,
          resumeText: resumeData?.resumeText || "",
          onboarding: onboardingData || {}
        })
      });

      const res = await apiFetch("/jobs", { method: "GET" });
      setJobs(res.jobs || []);
      console.info("Jobs fetch succeeded", {
        jobsCount: res.jobs?.length || 0
      });
    } catch (fetchError) {
      console.error("Jobs fetch failed", {
        error: fetchError
      });
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  }, [onboardingData, profile, resumeData]);

  const applyToJob = (job) => {
    if (!job.url) {
      setError("This job does not have an application link yet.");
      return;
    }

    window.open(job.url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (hasAutoFetchedRef.current) {
      return;
    }

    hasAutoFetchedRef.current = true;
    fetchJobs();
  }, [fetchJobs]);

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label section-label-jobs">Matched Jobs</p>
        <h1 className="app-title">Review roles aligned to your profile.</h1>
        <p className="app-subtitle">
          Your profile is ready. Ajuma is pulling matching opportunities for
          you now.
        </p>
      </div>

      <div className="jobs-summary">
        {resumeData?.filename ? (
          <div className="profile-meta-card">
            <span className="profile-meta-label">Resume</span>
            <strong>{resumeData.filename}</strong>
          </div>
        ) : null}

        {profile?.summary ? (
          <div className="profile-meta-card">
            <span className="profile-meta-label">Profile Summary</span>
            <strong>{profile.summary}</strong>
          </div>
        ) : null}
      </div>

      {error ? <p className="auth-error">{error}</p> : null}

      <div className="profile-actions">
        <button className="button button-secondary" type="button" onClick={onBack}>
          Back
        </button>
        <button className="button button-secondary" type="button" onClick={onGoToFavorites}>
          My Favorites ({favoriteJobs.length})
        </button>
        <button className="button button-primary" type="button" onClick={fetchJobs} disabled={isLoading}>
          {isLoading ? "Loading Jobs..." : "Refresh Jobs"}
        </button>
      </div>

      <div className="jobs-grid">
        {jobs.length ? (
          jobs.map((job) => {
            const isFavorite = favoriteJobIds.has(job.id);

            return (
              <article className="job-card" key={job.id}>
                <div className="job-card-header">
                  <span className="profile-meta-label">Matched Role</span>
                  <button
                    className={`favorite-button${isFavorite ? " favorite-button-active" : ""}`}
                    type="button"
                    onClick={() => onToggleFavorite(job)}
                    aria-label={`${isFavorite ? "Remove" : "Add"} ${job.title} ${isFavorite ? "from" : "to"} favorites`}
                  >
                    <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
                  </button>
                </div>
                <h3>{job.title}</h3>
                <p>{job.company}</p>
                {job.freshnessLabel ? (
                  <div className="job-freshness-row">
                    <span className={`job-freshness-badge job-freshness-${job.freshnessLabel.toLowerCase().replace(/\s+/g, "-")}`}>
                      {job.freshnessLabel}
                    </span>
                    <span className="job-freshness-meta">{formatPostedAge(job)}</span>
                  </div>
                ) : null}
                {typeof job.matchScore === "number" ? (
                  <p><strong>Match Score:</strong> {job.matchScore}/100</p>
                ) : null}
                {Array.isArray(job.matchReasons) && job.matchReasons.length ? (
                  <p>{job.matchReasons.join(" • ")}</p>
                ) : null}
                <div className="job-card-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => onToggleFavorite(job)}
                  >
                    {isFavorite ? "Favorited" : "Favorite"}
                  </button>
                  <button className="button button-primary" type="button" onClick={() => applyToJob(job)}>
                    Apply
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="job-card job-card-empty">
            <span className="profile-meta-label">Next Step</span>
            <h3>{isLoading ? "Finding matching jobs..." : "No strong matches yet."}</h3>
            <p>
              {isLoading
                ? "Ajuma is searching for roles that fit your profile and preferences."
                : "Try refreshing jobs after adjusting your profile, target role, or preferences."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
