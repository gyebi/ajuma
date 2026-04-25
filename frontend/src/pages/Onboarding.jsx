import { useState } from "react";

const defaultForm = {
  fullName: "",
  location: "",
  targetRole: "Software Engineer",
  experienceLevel: "",
  workPreference: "remote",
  educationLevel: "",
  skills: "",
  hasCv: ""
};

const targetRoles = [
  "Software Engineer",
  "Product Designer",
  "Product Manager",
  "Data Analyst",
  "Customer Support",
  "Marketing Specialist",
  "Sales Representative",
  "Finance Officer",
  "Operations Associate",
  "Administrative Assistant"
];

export default function Onboarding({ initialData, onContinue }) {
  const [form, setForm] = useState({
    ...defaultForm,
    ...initialData
  });

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function submit() {
    if (!form.hasCv) {
      return;
    }

    onContinue({
      ...form,
      skillsList: form.skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    });
  }

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label section-label-onboarding">Onboarding</p>
        <h1 className="app-title">Set up your job search in one page.</h1>
        <p className="app-subtitle">
          Tell us just enough to personalize your profile, matching, and CV path
          without slowing you down.
        </p>
      </div>

      <div className="onboarding-grid">
        <label className="app-field">
          <span>Full name</span>
          <input
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            placeholder="Your full name"
          />
        </label>

        <label className="app-field">
          <span>Location</span>
          <input
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="City, country"
          />
        </label>

        <label className="app-field">
          <span>Target role</span>
          <select
            value={form.targetRole}
            onChange={(event) => updateField("targetRole", event.target.value)}
          >
            {targetRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="app-field">
          <span>Years of experience</span>
          <input
            value={form.experienceLevel}
            onChange={(event) => updateField("experienceLevel", event.target.value)}
            placeholder="0-1, 2-4, 5+"
          />
        </label>

        <label className="app-field">
          <span>Education level</span>
          <input
            value={form.educationLevel}
            onChange={(event) => updateField("educationLevel", event.target.value)}
            placeholder="High school, diploma, degree..."
          />
        </label>

        <label className="app-field">
          <span>Work preference</span>
          <select
            value={form.workPreference}
            onChange={(event) => updateField("workPreference", event.target.value)}
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </label>
      </div>

      <label className="app-field app-field-full">
        <span>Key skills</span>
        <textarea
          rows="4"
          value={form.skills}
          onChange={(event) => updateField("skills", event.target.value)}
          placeholder="Communication, React, research, Excel, writing..."
        />
      </label>

      <div className="cv-choice">
        <p className="cv-choice-title">Do you already have a CV?</p>
        <div className="cv-choice-options">
          <button
            className={`choice-card${form.hasCv === "yes" ? " choice-card-active" : ""}`}
            type="button"
            onClick={() => updateField("hasCv", "yes")}
          >
            <strong>I already have a CV</strong>
            <span>Upload it and continue faster.</span>
          </button>

          <button
            className={`choice-card${form.hasCv === "no" ? " choice-card-active" : ""}`}
            type="button"
            onClick={() => updateField("hasCv", "no")}
          >
            <strong>I need help creating one</strong>
            <span>Use Ajuma AI to generate a starter CV.</span>
          </button>
        </div>

        {form.hasCv === "yes" ? (
          <div className="cv-choice-feedback">
            <strong>Next step: upload your current CV.</strong>
            <p>
              We will take you to the upload screen so Ajuma can read what you
              already have and build from it.
            </p>
          </div>
        ) : null}

        {form.hasCv === "no" ? (
          <div className="cv-choice-feedback cv-choice-feedback-starter">
            <strong>Starter CV selected.</strong>
            <p>
              A few extra fields will open on the next step so we can help you
              build a CV from scratch.
            </p>
          </div>
        ) : null}
      </div>

      <button
        className="button button-primary app-cta"
        type="button"
        onClick={submit}
        disabled={!form.hasCv}
      >
        {form.hasCv === "yes"
          ? "Continue with My CV"
          : form.hasCv === "no"
            ? "Generate My Starter CV"
            : "Choose Your CV Path"}
      </button>
    </section>
  );
}
