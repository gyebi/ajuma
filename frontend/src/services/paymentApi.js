import { apiFetch } from "./api";

export async function initializePayment(planId, email) {
  return apiFetch("/payments/initialize", {
    method: "POST",
    body: JSON.stringify({ planId, email })
  });
}

export async function verifyPayment(reference) {
  return apiFetch(`/payments/verify/${reference}`);
}

export async function fetchMyEntitlement() {
  return apiFetch("/billing/entitlement/me");
}
