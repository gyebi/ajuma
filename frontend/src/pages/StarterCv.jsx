import { useState } from "react";

export default function StarterCv({ onboardingData, onNext, resumeData }) {
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [projects, setProjects] = useState("");
  const [experience, setExperience] = useState("");
  const [strengths, setStrengths] = useState("");
  const isRecoveryFlow = Boolean(resumeData?.extractionFailed);

  function buildResumeText() {
    return [
      `Name: ${onboardingData.fullName}`,
      `Location: ${onboardingData.location}`,
      `Target role: ${onboardingData.targetRole}`,
      `Experience: ${onboardingData.experienceLevel}`,
      `Education level: ${onboardingData.educationLevel}`,
      `Work preference: ${onboardingData.workPreference}`,
      `Skills: ${onboardingData.skills}`,
      school ? `School: ${school}` : "",
      major ? `Course or major: ${major}` : "",
      projects ? `Projects: ${projects}` : "",
      experience ? `Internships or work experience: ${experience}` : "",
      strengths ? `Strengths and interests: ${strengths}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  function downloadStarterCv() {
    const resumeText = buildResumeText();
    const safeName = (onboardingData.fullName || "candidate")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const filename = `${safeName || "candidate"}-starter-cv.txt`;
    const blob = new Blob([resumeText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  function generateStarterCv() {
    const resumeText = buildResumeText();
    onNext({
      filename: isRecoveryFlow
        ? resumeData?.filename || "Uploaded resume"
        : "Ajuma AI Starter CV",
      size: resumeText.length,
      resumeText,
      parsedFromFile: false,
      hasParsedText: true,
      uploadMessage: isRecoveryFlow ? resumeData?.uploadMessage || "" : ""
    });
  }

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label section-label-starter-cv">Starter CV</p>
        <h1 className="app-title">
          {isRecoveryFlow ? "Add your experience manually." : "Create your first professional CV."}
        </h1>
        <p className="app-subtitle">
          {isRecoveryFlow
            ? "We could not read enough text from your uploaded resume. Add the key details here and Ajuma will keep moving."
            : "We already have your direction. Add a little more detail and Ajuma will turn it into a usable starter profile."}
        </p>
      </div>

      {isRecoveryFlow && resumeData?.filename ? (
        <div className="profile-meta">
          <div className="profile-meta-card">
            <span className="profile-meta-label">Uploaded File</span>
            <strong>{resumeData.filename}</strong>
          </div>
        </div>
      ) : null}

      <div className="onboarding-grid">
        <label className="app-field">
          <span>School</span>
          <input value={school} onChange={(event) => setSchool(event.target.value)} placeholder="Your school or college" />
        </label>

        <label className="app-field">
          <span>Course / major</span>
          <input value={major} onChange={(event) => setMajor(event.target.value)} placeholder="Course, major, or concentration" />
        </label>
      </div>

      <label className="app-field app-field-full">
        <span>Projects</span>
        <textarea rows="4" value={projects} onChange={(event) => setProjects(event.target.value)} placeholder="Describe school, freelance, or personal projects." />
      </label>

      <label className="app-field app-field-full">
        <span>Internships or work experience</span>
        <textarea rows="4" value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="Add internships, volunteer work, leadership, or part-time roles." />
      </label>

      <label className="app-field app-field-full">
        <span>Strengths and interests</span>
        <textarea rows="4" value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="What are you good at and what kind of work interests you?" />
      </label>

      <div className="profile-actions">
        <button className="button button-secondary" type="button" onClick={downloadStarterCv}>
          Download Starter CV
        </button>
        <button className="button button-primary" type="button" onClick={generateStarterCv}>
          Generate My CV
        </button>
      </div>
    </section>
  );
}
