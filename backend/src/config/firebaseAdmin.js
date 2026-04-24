import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const currentDir = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = resolve(currentDir, "../../config/serviceAccountKey.json");

function stripWrappingQuotes(value = "") {
  return value.replace(/^['"]|['"]$/g, "");
}

function getEnvServiceAccount() {
  const projectId = stripWrappingQuotes(process.env.FIREBASE_PROJECT_ID || "");
  const clientEmail = stripWrappingQuotes(process.env.FIREBASE_CLIENT_EMAIL || "");
  const privateKey = stripWrappingQuotes(process.env.FIREBASE_PRIVATE_KEY || "")
    .replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

function getFileServiceAccount() {
  if (!existsSync(serviceAccountPath)) {
    return null;
  }

  return JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
}

const serviceAccount = getEnvServiceAccount() || getFileServiceAccount();

if (!admin.apps.length) {
  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY or provide backend/config/serviceAccountKey.json."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();
export default admin;
