// src/pages/UploadResume.jsx
import { useState } from "react";
import { apiFetchForm } from "../services/api";

const allowedResumeExtensions = [".pdf", ".doc", ".docx"];

function isSupportedResumeFile(file) {
  const filename = file?.name?.toLowerCase() || "";

  return allowedResumeExtensions.some((extension) => filename.endsWith(extension));
}

function getUploadErrorMessage(error) {
  if (error.code === "API_HTML_RESPONSE") {
    return "The upload reached the website instead of the API. Check the Firebase /api rewrite and redeploy hosting/functions.";
  }

  if (error.code === "FORM_NETWORK_ERROR") {
    return "The upload could not reach the API. Check your connection, CORS, and the deployed Functions URL.";
  }

  if (error.status === 401) {
    return "Your sign-in session expired. Please sign in again, then retry the upload.";
  }

  if (error.status === 400) {
    return error.message || "The API did not receive the resume file. Check the upload field name and file type.";
  }

  if (error.status >= 500) {
    return "The API received the upload but failed while processing it. Check the Functions logs for the resume parser.";
  }

  return error.message || "Unable to upload your CV right now. Please try again.";
}

export default function UploadResume({ onNext, onNeedsManualEntry }) {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function chooseFile(nextFile) {
    setError("");
    setUploadMessage("");
    setFile(nextFile || null);
  }

  const upload = async () => {
    if (!file) {
      setError("Please choose a resume file first.");
      return;
    }

    if (!isSupportedResumeFile(file)) {
      setError("Please upload your CV as a PDF, DOC, or DOCX file.");
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
        section: uploadError.section || "unknown",
        code: uploadError.code || "unknown",
        status: uploadError.status || null,
        error: uploadError
      });
      setError(getUploadErrorMessage(uploadError));
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
            onChange={(event) => chooseFile(event.target.files[0])}
          />
          <span className="upload-badge">Upload Resume </span>
          <strong className="upload-file-name" title={file ? file.name : ""}>
            {file ? file.name : "Choose a resume file"}
          </strong>
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
