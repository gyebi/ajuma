// src/pages/UploadResume.jsx
import { useState } from "react";
import { apiFetchForm } from "../services/api";

export default function UploadResume({ onNext }) {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const upload = async () => {
    if (!file) {
      setError("Please choose a resume file first.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const data = await apiFetchForm("/resume/upload", formData, {
        method: "POST"
      });

      onNext({
        filename: data.filename || file.name,
        size: data.size || file.size,
        resumeText: resumeText.trim()
      });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2>Upload Resume</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <textarea
        placeholder="Paste resume text here so the current MVP can generate a profile from real content."
        rows="10"
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
      />
      {error ? <p>{error}</p> : null}
      <button onClick={upload} disabled={isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
