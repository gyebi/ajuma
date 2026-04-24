import admin, { db } from "../../src/config/firebaseAdmin.js";
import { env } from "../../src/config/env.js";
import { getPlanById } from "../billing/plans.repository.js";
import {
  createPayment,
  getPaymentByReference,
  getPaymentsByUserId,
  updatePaymentStatus,
} from "./payments.repository.js";
import {
  initializeTransaction,
  verifyTransaction,
} from "./paystack.service.js";

function resolvePlanCredits(planData = {}) {
  const credits = Number(
    planData.credits
    ?? planData.creditAmount
    ?? planData.creditCount
    ?? 0
  );

  return Number.isFinite(credits) && credits > 0 ? credits : 0;
}

function buildReference(userId) {
  return `ajuma_${userId}_${Date.now()}`;
}

function toMinorAmount(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null;
  }

  return Math.round(numericAmount * 100);
}

function resolvePlanAmount(plan = {}) {
  return (
    plan.amount
    ?? plan.price
    ?? plan.priceAmount
    ?? plan.priceValue
    ?? null
  );
}

async function fulfillSuccessfulPayment(reference, paymentDetails, source) {
  const existingPayment = await getPaymentByReference(reference);

  if (!existingPayment) {
    return {
      payment: null,
      entitlement: null,
      notFound: true,
      alreadyFulfilled: false,
    };
  }

  if (existingPayment.fulfilledAt) {
    return {
      payment: existingPayment,
      entitlement: null,
      notFound: false,
      alreadyFulfilled: true,
    };
  }

  const plan = await getPlanById(existingPayment.planId);

  if (!plan) {
    throw new Error("Plan not found for successful payment fulfillment");
  }

  const credits = resolvePlanCredits(plan);

  if (!credits) {
    throw new Error("Plan credits must be greater than zero");
  }

  const paymentRef = db.collection("payments").doc(existingPayment.id);
  const entitlementRef = db.collection("user_entitlements").doc(existingPayment.userId);

  const result = await db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);

    if (!paymentSnapshot.exists) {
      throw new Error("Payment not found during fulfillment");
    }

    const latestPayment = paymentSnapshot.data();

    if (latestPayment.fulfilledAt) {
      return {
        payment: {
          id: paymentSnapshot.id,
          ...latestPayment,
        },
        entitlement: null,
        alreadyFulfilled: true,
      };
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    transaction.set(entitlementRef, {
      userId: existingPayment.userId,
      planId: plan.id ?? existingPayment.planId ?? null,
      planCode: plan.code ?? null,
      planName: plan.name ?? null,
      totalCredits: admin.firestore.FieldValue.increment(credits),
      availableCredits: admin.firestore.FieldValue.increment(credits),
      active: true,
      updatedAt: now,
      lastGrantedAt: now,
      createdAt: now,
    }, { merge: true });

    transaction.set(paymentRef, {
      status: "success",
      fulfillmentSource: source,
      fulfilledAt: now,
      creditsGranted: credits,
      planSnapshot: {
        id: plan.id ?? existingPayment.planId ?? null,
        name: plan.name ?? null,
        code: plan.code ?? null,
        credits,
      },
      gatewayVerification: paymentDetails,
      paidAt: paymentDetails?.paid_at ?? paymentDetails?.paidAt ?? latestPayment.paidAt ?? null,
      channel: paymentDetails?.channel ?? latestPayment.channel ?? null,
      updatedAt: now,
    }, { merge: true });

    return {
      payment: {
        id: paymentSnapshot.id,
        ...latestPayment,
        status: "success",
        creditsGranted: credits,
        fulfillmentSource: source,
        gatewayVerification: paymentDetails,
        paidAt: paymentDetails?.paid_at ?? paymentDetails?.paidAt ?? latestPayment.paidAt ?? null,
        channel: paymentDetails?.channel ?? latestPayment.channel ?? null,
      },
      entitlement: {
        userId: existingPayment.userId,
        planId: plan.id ?? existingPayment.planId ?? null,
        planName: plan.name ?? null,
        creditsGranted: credits,
      },
      alreadyFulfilled: false,
    };
  });

  return {
    ...result,
    notFound: false,
  };
}

export async function initializePayment(req, res) {
  try {
    if (!env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({
        error: "Paystack secret key is not configured yet.",
      });
    }

    const { planId, email } = req.body ?? {};

    if (!planId || !email) {
      return res.status(400).json({
        error: "planId and email are required.",
      });
    }

    const plan = await getPlanById(planId);

    if (!plan || plan.active === false) {
      return res.status(404).json({
        error: "Active plan not found.",
      });
    }

    const amountMajor = resolvePlanAmount(plan);
    const amount = toMinorAmount(amountMajor);

    if (!amount) {
      return res.status(400).json({
        error: "Selected plan does not have a valid amount.",
      });
    }

    const reference = buildReference(req.user.uid);
    const callbackUrl = env.PAYSTACK_CALLBACK_URL || undefined;

    const paymentRecord = await createPayment({
      userId: req.user.uid,
      planId: plan.id,
      email,
      currency: plan.currency || "GHS",
      amount,
      amountMajor,
      reference,
      status: "pending",
      provider: "paystack",
    });

    const paystackResponse = await initializeTransaction({
      email,
      amount,
      reference,
      callbackUrl,
      currency: plan.currency || "GHS",
      metadata: {
        userId: req.user.uid,
        planId: plan.id,
        paymentId: paymentRecord.id,
      },
    });

    await updatePaymentStatus(reference, "initialized", {
      gatewayResponse: paystackResponse,
      accessCode: paystackResponse?.data?.access_code ?? null,
      authorizationUrl: paystackResponse?.data?.authorization_url ?? null,
    });

    return res.status(201).json({
      message: "Payment initialized successfully.",
      payment: {
        ...paymentRecord,
        status: "initialized",
        accessCode: paystackResponse?.data?.access_code ?? null,
        authorizationUrl: paystackResponse?.data?.authorization_url ?? null,
      },
      paystack: paystackResponse?.data ?? null,
    });
  } catch (error) {
    console.error("Payment initialization failed:", error);

    return res.status(502).json({
      error: "Unable to initialize payment right now.",
    });
  }
}

export async function verifyPayment(req, res) {
  try {
    if (!env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({
        error: "Paystack secret key is not configured yet.",
      });
    }

    const reference = req.params.reference || req.query.reference;

    if (!reference) {
      return res.status(400).json({
        error: "Payment reference is required.",
      });
    }

    const existingPayment = await getPaymentByReference(reference);

    if (!existingPayment) {
      return res.status(404).json({
        error: "Payment not found.",
      });
    }

    const paystackResponse = await verifyTransaction(reference);
    const paymentStatus = paystackResponse?.data?.status || "unknown";

    let updatedPayment;
    let entitlement = null;

    if (paymentStatus === "success") {
      const fulfillment = await fulfillSuccessfulPayment(
        reference,
        paystackResponse?.data ?? null,
        "verify"
      );

      updatedPayment = fulfillment.payment;
      entitlement = fulfillment.entitlement;
    } else {
      updatedPayment = await updatePaymentStatus(reference, paymentStatus, {
        gatewayVerification: paystackResponse,
        paidAt: paystackResponse?.data?.paid_at ?? null,
        channel: paystackResponse?.data?.channel ?? null,
      });
    }

    return res.status(200).json({
      message: "Payment verification completed.",
      payment: updatedPayment,
      entitlement,
      paystack: paystackResponse?.data ?? null,
    });
  } catch (error) {
    console.error("Payment verification failed:", error);

    return res.status(502).json({
      error: "Unable to verify payment right now.",
    });
  }
}

export async function fetchMyPayments(req, res) {
  try {
    const payments = await getPaymentsByUserId(req.user.uid);

    return res.status(200).json({
      payments,
    });
  } catch (error) {
    console.error("Fetching payments failed:", error);

    return res.status(500).json({
      error: "Failed to fetch payments.",
    });
  }
}

export { fulfillSuccessfulPayment };
