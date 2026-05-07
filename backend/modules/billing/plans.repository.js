import { db } from "../../src/config/firebaseAdmin.js";
import {
  addMissingDefaultPlans,
  getDefaultPlanById,
  normalizePlanOffer,
  orderPlans,
} from "./defaultPlans.js";

const plansCollection = db.collection("plans");

export async function getActivePlans() {
  const snapshot = await plansCollection
    .where("active", "==", true)
    .get();

  const plans = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return addMissingDefaultPlans(plans);
}

export async function getPlanById(planId) {
  const doc = await plansCollection.doc(planId).get();

  if (!doc.exists) {
    return getDefaultPlanById(planId);
  }

  const plan = normalizePlanOffer({
    id: doc.id,
    ...doc.data(),
  });

  return orderPlans([plan])[0];
}
