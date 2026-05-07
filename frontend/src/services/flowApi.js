import { apiFetch } from "./api";

export async function fetchSavedFlow() {
  return apiFetch("/me/flow", {
    method: "GET"
  });
}

export async function saveFlow(flow) {
  return apiFetch("/me/flow", {
    method: "PUT",
    body: JSON.stringify({ flow })
  });
}
