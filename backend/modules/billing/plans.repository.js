import { db } from "../../src/config/firebaseAdmin.js";

const plansCollection = db.collection("plans");

export async function getActivePlans() {
  const snapshot = await plansCollection
    .where("active", "==", true)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function getPlanById(planId) {
  const doc = await plansCollection.doc(planId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  };
}
