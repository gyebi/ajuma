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
      setError("Add resume text during upload so profile generation has content to work with.");
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
    <div>
      <h2>Your AI Profile</h2>
      {resumeData?.filename ? <p>Uploaded resume: {resumeData.filename}</p> : null}
      {resumeData?.resumeText ? <p>Resume text ready for profile generation.</p> : null}

      {error ? <p>{error}</p> : null}

      <button onClick={generateProfile} disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate Profile"}
      </button>

      {profile && (
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      )}

      {profile && <button onClick={onNext}>Find Jobs</button>}
    </div>
  );
}
