// src/pages/UploadResume.jsx
import { useState } from "react";
import { apiFetchForm } from "../services/api";

export default function UploadResume({ onNext, onNeedsManualEntry }) {
  const [file, setFile] = useState(null);
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

      const nextResumeData = {
        filename: data.filename || file.name,
        size: data.size || file.size,
        resumeText: data.extractedText || "",
        parsedFromFile: Boolean(data.extractedText),
        hasParsedText: Boolean(data.extractedText),
        supportedFormat: Boolean(data.supportedFormat),
        extractionFailed: !data.extractedText,
        uploadMessage: data.message || ""
      };

      if (data.extractedText) {
        onNext(nextResumeData);
      } else {
        onNeedsManualEntry(nextResumeData);
      }

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
        <p className="section-label section-label-upload">Resume Upload</p>
        <h1 className="app-title">Bring in your existing CV.</h1>
        <p className="app-subtitle">
          Upload your resume by clicking on cv. 
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
          <span className="upload-badge">Upload Resume </span>
          <strong>{file ? file.name : "Choose a resume file"}</strong>
          {!file ? (
            <p>Upload a PDF, DOC, or DOCX file.</p>
          ) : null}
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
