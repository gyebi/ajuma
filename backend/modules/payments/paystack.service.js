import { env } from "../../src/config/env.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

async function paystackRequest(path, options = {}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.message || "Paystack request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function initializeTransaction({
  email,
  amount,
  reference,
  callbackUrl,
  metadata = {},
  currency = "GHS",
}) {
  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount,
      reference,
      callback_url: callbackUrl,
      metadata,
      currency,
    }),
  });
}

export async function verifyTransaction(reference) {
  return paystackRequest(`/transaction/verify/${reference}`);
}
