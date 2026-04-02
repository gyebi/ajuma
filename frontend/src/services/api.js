import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");
  return await user.getIdToken();
}

export async function apiFetch(path, options = {}) {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export async function apiFetchForm(path, formData, options = {}) {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}
