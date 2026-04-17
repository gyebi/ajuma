// src/pages/Profile.jsx
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/api";

export default function Profile({
  onboardingData,
  onNext,
  profile,
  resumeData,
  onReloadCv,
  onProfileGenerated
}) {
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullResumeText, setShowFullResumeText] = useState(false);
  const profilePreviewRef = useRef(null);
  const previewLimit = 800;
  const resumeText = resumeData?.resumeText || "";
  const hasLongResumeText = resumeText.length > previewLimit;
  const visibleResumeText = showFullResumeText || !hasLongResumeText
    ? resumeText
    : `${resumeText.slice(0, previewLimit)}...`;

  useEffect(() => {
    if (!profile || !profilePreviewRef.current) {
      return;
    }

    profilePreviewRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    profilePreviewRef.current.focus({
      preventScroll: true
    });
  }, [profile]);

  const generateProfile = async () => {
    if (!resumeData?.resumeText) {
      setError("We do not have enough resume text yet. Go back and add your experience manually before generating your profile.");
      console.error("Profile generation blocked", {
        reason: "Missing resume text",
        resumeData
      });
      return;
    }

    setError("");
    setIsGenerating(true);

    console.info("Starting profile generation", {
      resumeLength: resumeData.resumeText.length,
      parsedFromFile: Boolean(resumeData.parsedFromFile),
      targetRole: onboardingData?.targetRole || ""
    });

    try {
      const data = await apiFetch("/ai/generate-profile", {
        method: "POST",
        body: JSON.stringify({
          onboarding: onboardingData,
          resumeText: resumeData.resumeText
        })
      });

      onProfileGenerated(data.profile);
      console.info("Profile generation succeeded", {
        hasSummary: Boolean(data.profile?.summary),
        skillsCount: data.profile?.skills?.length || 0
      });
    } catch (generationError) {
      console.error("Profile generation failed", {
        error: generationError
      });
      setError(generationError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label section-label-profile">Profile Review</p>
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

      {resumeText ? (
        <div className="profile-preview-card">
          <span className="profile-meta-label">Parsed Resume Preview</span>
          <p>{visibleResumeText}</p>
          {hasLongResumeText ? (
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setShowFullResumeText((prev) => !prev)}
            >
              {showFullResumeText ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="profile-actions">
        <button className="button button-secondary" type="button" onClick={onReloadCv}>
          Reload CV
        </button>
        <button className="button button-primary" type="button" onClick={generateProfile} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Profile"}
        </button>
      </div>

      {profile ? (
        <div className="profile-preview" ref={profilePreviewRef} tabIndex="-1">
          {profile.headline ? (
            <div className="profile-preview-card">
              <span className="profile-meta-label">Headline</span>
              <p>{profile.headline}</p>
            </div>
          ) : null}

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

          {(profile.strengths?.length || profile.suggestedRoles?.length || profile.missingInfo?.length) ? (
            <div className="profile-preview-grid">
              {profile.strengths?.length ? (
                <div className="profile-preview-card">
                  <span className="profile-meta-label">Strengths</span>
                  <ul className="inline-list">
                    {profile.strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {profile.suggestedRoles?.length ? (
                <div className="profile-preview-card">
                  <span className="profile-meta-label">Suggested Roles</span>
                  <ul className="inline-list">
                    {profile.suggestedRoles.map((role) => (
                      <li key={role}>{role}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {profile.missingInfo?.length ? (
                <div className="profile-preview-card">
                  <span className="profile-meta-label">Helpful Follow-up</span>
                  <ul className="inline-list">
                    {profile.missingInfo.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

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
