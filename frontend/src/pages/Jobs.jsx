// src/pages/Jobs.jsx
import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function Jobs({ onBack, profile, resumeData }) {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("ajuma:saved-jobs") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem("ajuma:saved-jobs", JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  const fetchJobs = async () => {
    setError("");
    setIsLoading(true);

    console.info("Starting jobs fetch");

    try {
      await apiFetch("/jobs/sync", {
        method: "POST",
        body: JSON.stringify({
          profile,
          resumeText: resumeData?.resumeText || ""
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
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobIds((current) => (
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId]
    ));
  };

  const applyToJob = (job) => {
    if (!job.url) {
      setError("This job does not have an application link yet.");
      return;
    }

    window.open(job.url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label section-label-jobs">Matched Jobs</p>
        <h1 className="app-title">Review roles aligned to your profile.</h1>
        <p className="app-subtitle">
          Your profile is ready. Use the button below to load opportunities and
          review what Ajuma AI is surfacing for you.
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
        <button className="button button-primary" type="button" onClick={fetchJobs} disabled={isLoading}>
          {isLoading ? "Loading Jobs..." : "Fetch Jobs"}
        </button>
      </div>

      <div className="jobs-grid">
        {jobs.length ? (
          jobs.map((job) => (
            <article className="job-card" key={job.id}>
              <span className="profile-meta-label">Matched Role</span>
              <h3>{job.title}</h3>
              <p>{job.company}</p>
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
                  onClick={() => toggleSaveJob(job.id)}
                >
                  {savedJobIds.includes(job.id) ? "Saved" : "Save"}
                </button>
                <button className="button button-primary" type="button" onClick={() => applyToJob(job)}>
                  Apply
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="job-card job-card-empty">
            <span className="profile-meta-label">Next Step</span>
            <h3>No jobs loaded yet.</h3>
            <p>Click the button above to fetch matching opportunities.</p>
          </div>
        )}
      </div>
    </section>
  );
}
