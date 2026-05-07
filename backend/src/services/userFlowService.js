import admin, { db } from "../config/firebaseAdmin.js";

const userFlowsCollection = db.collection("user_flows");

export async function getUserFlow(userId) {
  const snapshot = await userFlowsCollection.doc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();

  return data.flow || null;
}

export async function saveUserFlow(userId, flow = {}) {
  const now = admin.firestore.FieldValue.serverTimestamp();

  await userFlowsCollection.doc(userId).set({
    userId,
    flow,
    updatedAt: now,
    createdAt: now
  }, { merge: true });

  return flow;
}
