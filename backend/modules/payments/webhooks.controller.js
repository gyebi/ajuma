import crypto from "node:crypto";
import { env } from "../../src/config/env.js";
import { updatePaymentStatus } from "./payments.repository.js";
import { fulfillSuccessfulPayment } from "./payments.controller.js";

function isValidPaystackSignature(rawBody, signature) {
  if (!rawBody || !signature || !env.PAYSTACK_SECRET_KEY) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

export async function handlePaystackWebhook(req, res) {
  try {
    const signature = req.headers["x-paystack-signature"];

    if (!isValidPaystackSignature(req.rawBody, signature)) {
      return res.status(401).json({
        error: "Invalid Paystack signature.",
      });
    }

    const event = req.body?.event;
    const data = req.body?.data ?? {};
    const reference = data.reference;

    if (!reference) {
      return res.status(400).json({
        error: "Webhook reference is required.",
      });
    }

    if (event === "charge.success" && data.status === "success") {
      const fulfillment = await fulfillSuccessfulPayment(
        reference,
        data,
        "webhook"
      );

      if (fulfillment.notFound) {
        return res.status(404).json({
          error: "Payment not found for webhook reference.",
        });
      }

      return res.status(200).json({
        received: true,
        event,
        fulfilled: !fulfillment.alreadyFulfilled,
      });
    }

    await updatePaymentStatus(reference, data.status || "webhook_received", {
      webhookEvent: event,
      webhookPayload: data,
    });

    return res.status(200).json({
      received: true,
      event,
      fulfilled: false,
    });
  } catch (error) {
    console.error("Paystack webhook handling failed:", error);

    return res.status(500).json({
      error: "Failed to process Paystack webhook.",
    });
  }
}
