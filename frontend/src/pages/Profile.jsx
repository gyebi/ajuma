// src/pages/Profile.jsx
import { useState } from "react";
import { apiFetch } from "../services/api";

export default function Profile({
  onNext,
  profile,
  resumeData,
  onProfileGenerated
}) {
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateProfile = async () => {
    if (!resumeData?.resumeText) {
      setError("We could not extract enough text from the uploaded file. Please go back and paste the resume text as a fallback.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const data = await apiFetch("/ai/generate-profile", {
        method: "POST",
        body: JSON.stringify({
          resumeText: resumeData.resumeText
        })
      });

      onProfileGenerated(data.profile);
    } catch (generationError) {
      setError(generationError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label">Profile Review</p>
        <h1 className="app-title">Shape your AI profile before job matching.</h1>
        <p className="app-subtitle">
          Review what Ajuma AI creates from your CV or starter profile, then
          move forward when it feels right.
        </p>
      </div>

      <div className="profile-meta">
        {resumeData?.filename ? (
          <div className="profile-meta-card">
            <span className="profile-meta-label">Source</span>
            <strong>{resumeData.filename}</strong>
          </div>
        ) : null}

        {resumeData?.resumeText ? (
          <div className="profile-meta-card">
            <span className="profile-meta-label">Status</span>
            <strong>{resumeData?.parsedFromFile ? "Resume text extracted from file" : "Resume text ready for AI generation"}</strong>
          </div>
        ) : null}
      </div>

      {error ? <p className="auth-error">{error}</p> : null}

      <div className="profile-actions">
        <button className="button button-primary" type="button" onClick={generateProfile} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Profile"}
        </button>
      </div>

      {profile ? (
        <div className="profile-preview">
          <div className="profile-preview-card">
            <span className="profile-meta-label">Summary</span>
            <p>{profile.summary || "No summary generated yet."}</p>
          </div>

          <div className="profile-preview-grid">
            <div className="profile-preview-card">
              <span className="profile-meta-label">Skills</span>
              {profile.skills?.length ? (
                <ul className="inline-list">
                  {profile.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p>No skills listed yet.</p>
              )}
            </div>

            <div className="profile-preview-card">
              <span className="profile-meta-label">Experience</span>
              {profile.experience?.length ? (
                <ul className="inline-list">
                  {profile.experience.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No experience items listed yet.</p>
              )}
            </div>

            <div className="profile-preview-card">
              <span className="profile-meta-label">Education</span>
              {profile.education?.length ? (
                <ul className="inline-list">
                  {profile.education.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No education items listed yet.</p>
              )}
            </div>
          </div>

          <div className="profile-actions">
            <button className="button button-secondary" type="button" onClick={generateProfile} disabled={isGenerating}>
              Regenerate
            </button>
            <button className="button button-primary" type="button" onClick={onNext}>
              See Matching Jobs
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
