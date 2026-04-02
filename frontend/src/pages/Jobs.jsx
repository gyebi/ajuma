// src/pages/Jobs.jsx
import { useState } from "react";
import { apiFetch } from "../services/api";

export default function Jobs({ profile, resumeData }) {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchJobs = async () => {
    setError("");
    setIsLoading(true);

    try {
      await apiFetch("/jobs/sync", { method: "POST" });

      const res = await apiFetch("/jobs", { method: "GET" });
      setJobs(res.jobs || []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label">Matched Jobs</p>
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
              <div className="job-card-actions">
                <button className="button button-secondary" type="button">Save</button>
                <button className="button button-primary" type="button">Apply</button>
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
