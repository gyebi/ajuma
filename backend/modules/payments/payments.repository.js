import { db } from "../../src/config/firebaseAdmin.js";

const paymentsCollection = db.collection("payments");

export async function createPayment(paymentData) {
  const docRef = paymentsCollection.doc();

  const payload = {
    ...paymentData,
    paymentId: docRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await docRef.set(payload);

  return {
    id: docRef.id,
    ...payload,
  };
}

export async function getPaymentByReference(reference) {
  const snapshot = await paymentsCollection
    .where("reference", "==", reference)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];

  return {
    id: doc.id,
    ...doc.data(),
  };
}

export async function updatePaymentByReference(reference, updates) {
  const snapshot = await paymentsCollection
    .where("reference", "==", reference)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];

  const nextData = {
    ...updates,
    updatedAt: new Date(),
  };

  await doc.ref.update(nextData);

  const updatedDoc = await doc.ref.get();

  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
  };
}

export async function updatePaymentStatus(reference, status, extraData = {}) {
  return updatePaymentByReference(reference, {
    status,
    ...extraData,
  });
}

export async function getPaymentsByUserId(userId) {
  const snapshot = await paymentsCollection
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
