import admin, { db } from "../../src/config/firebaseAdmin.js";

const entitlementsCollection = db.collection("user_entitlements");

function mapEntitlement(doc) {
  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data()
  };
}

function resolvePlanCredits(planData = {}) {
  const credits = Number(
    planData.credits
    ?? planData.creditAmount
    ?? planData.creditCount
    ?? 0
  );

  return Number.isFinite(credits) && credits > 0 ? credits : 0;
}

export async function getEntitlementByUserId(userId) {
  const doc = await entitlementsCollection.doc(userId).get();
  return mapEntitlement(doc);
}

export async function grantCredits(userId, planData = {}) {
  const credits = resolvePlanCredits(planData);

  if (!credits) {
    throw new Error("Plan credits must be greater than zero");
  }

  const entitlementRef = entitlementsCollection.doc(userId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await entitlementRef.set({
    userId,
    planId: planData.id ?? planData.planId ?? null,
    planCode: planData.code ?? null,
    planName: planData.name ?? null,
    totalCredits: admin.firestore.FieldValue.increment(credits),
    availableCredits: admin.firestore.FieldValue.increment(credits),
    active: true,
    updatedAt: now,
    lastGrantedAt: now,
    createdAt: now
  }, { merge: true });

  const updatedDoc = await entitlementRef.get();
  return mapEntitlement(updatedDoc);
}

export async function consumeCredit(userId) {
  const entitlementRef = entitlementsCollection.doc(userId);

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(entitlementRef);

    if (!snapshot.exists) {
      throw new Error("User entitlement not found");
    }

    const entitlement = snapshot.data();
    const availableCredits = Number(entitlement.availableCredits ?? 0);

    if (availableCredits < 1) {
      throw new Error("No credits available");
    }

    transaction.set(entitlementRef, {
      availableCredits: admin.firestore.FieldValue.increment(-1),
      usedCredits: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return {
      id: snapshot.id,
      ...entitlement,
      availableCredits: availableCredits - 1,
      usedCredits: Number(entitlement.usedCredits ?? 0) + 1
    };
  });

  return result;
}
