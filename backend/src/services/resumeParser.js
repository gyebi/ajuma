import mammoth from "mammoth";
import pdfParse from "pdf-parse";

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

export async function extractResumeText(file) {
  const mimeType = file.mimetype;
  const filename = file.originalname.toLowerCase();

  if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
    const parsed = await pdfParse(file.buffer);
    return normalizeText(parsed.text || "");
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({
      buffer: file.buffer
    });
    return normalizeText(parsed.value || "");
  }

  return "";
}
