import { useState } from "react";

export default function StarterCv({ onboardingData, onNext }) {
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [projects, setProjects] = useState("");
  const [experience, setExperience] = useState("");
  const [strengths, setStrengths] = useState("");

  function generateStarterCv() {
    const resumeText = [
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

    onNext({
      filename: "Ajuma AI Starter CV",
      size: resumeText.length,
      resumeText
    });
  }

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label">Starter CV</p>
        <h1 className="app-title">Create your first professional CV.</h1>
        <p className="app-subtitle">
          We already have your direction. Add a little more detail and Ajuma
          will turn it into a usable starter profile.
        </p>
      </div>

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

      <button className="button button-primary app-cta" type="button" onClick={generateStarterCv}>
        Generate My CV
      </button>
    </section>
  );
}
