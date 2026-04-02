// src/pages/UploadResume.jsx
import { useState } from "react";
import { apiFetchForm } from "../services/api";

export default function UploadResume({ onNext }) {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const upload = async () => {
    if (!file) {
      setError("Please choose a resume file first.");
      return;
    }

    setError("");
    setUploadMessage("");
    setIsUploading(true);

    console.info("Starting resume upload", {
      filename: file.name,
      size: file.size,
      type: file.type || "unknown"
    });

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const data = await apiFetchForm("/resume/upload", formData, {
        method: "POST"
      });

      onNext({
        filename: data.filename || file.name,
        size: data.size || file.size,
        resumeText: data.extractedText || resumeText.trim(),
        parsedFromFile: Boolean(data.extractedText),
        uploadMessage: data.message || ""
      });

      console.info("Resume upload completed", {
        filename: data.filename || file.name,
        hasParsedText: Boolean(data.extractedText),
        message: data.message || ""
      });
    } catch (uploadError) {
      console.error("Resume upload failed", {
        filename: file.name,
        error: uploadError
      });
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label">Resume Upload</p>
        <h1 className="app-title">Bring in your existing CV.</h1>
        <p className="app-subtitle">
          Upload your resume to keep moving quickly. If parsing is not fully
          connected yet, you can paste the resume text below so Ajuma still has
          strong material for profile generation.
        </p>
      </div>

      <div className="upload-card">
        <label className="upload-dropzone">
          <input
            className="upload-input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) => setFile(event.target.files[0])}
          />
          <span className="upload-badge">CV</span>
          <strong>{file ? file.name : "Choose a resume file"}</strong>
          <p>
            Upload PDF, DOC, or DOCX to continue with your existing professional
            history.
          </p>
        </label>

        <label className="app-field app-field-full">
          <span>Resume text fallback</span>
          <textarea
            placeholder="Usually you will not need this. Paste resume text only if extraction misses important details."
            rows="10"
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
          />
        </label>

        {uploadMessage ? <p className="upload-hint">{uploadMessage}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <div className="upload-actions">
          <button className="button button-primary app-cta" type="button" onClick={upload} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload and Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}
