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
    <div>
      <h2>Job Listings</h2>
      {resumeData?.filename ? <p>Resume: {resumeData.filename}</p> : null}
      {profile?.summary ? <p>Profile summary: {profile.summary}</p> : null}

      {error ? <p>{error}</p> : null}

      <button onClick={fetchJobs} disabled={isLoading}>
        {isLoading ? "Loading Jobs..." : "Fetch Jobs"}
      </button>

      {jobs.map((job) => (
        <div key={job.id}>
          <h4>{job.title}</h4>
          <p>{job.company}</p>
        </div>
      ))}
    </div>
  );
}
