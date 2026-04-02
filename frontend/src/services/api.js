import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");
  return await user.getIdToken();
}

export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const url = `${BASE_URL}${path}`;
  let res;

  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
  } catch (error) {
    console.error("API network failure", {
      path,
      url,
      method: options.method || "GET",
      error
    });
    throw new Error(`Network error while calling ${path}`);
  }

  let data;

  try {
    data = await res.json();
  } catch (error) {
    console.error("API response parse failure", {
      path,
      url,
      method: options.method || "GET",
      status: res.status,
      error
    });
    throw new Error(`Invalid JSON response from ${path}`);
  }

  if (!res.ok) {
    console.error("API request failed", {
      path,
      url,
      method: options.method || "GET",
      status: res.status,
      response: data
    });
    throw new Error(data.error || `Request failed for ${path}`);
  }

  console.info("API request succeeded", {
    path,
    url,
    method: options.method || "GET",
    status: res.status
  });

  return data;
}

export async function apiFetchForm(path, formData, options = {}) {
  const token = await getToken();
  const url = `${BASE_URL}${path}`;
  let res;

  try {
    res = await fetch(url, {
      ...options,
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
  } catch (error) {
    console.error("Form API network failure", {
      path,
      url,
      method: options.method || "POST",
      error
    });
    throw new Error(`Network error while uploading to ${path}`);
  }

  let data;

  try {
    data = await res.json();
  } catch (error) {
    console.error("Form API response parse failure", {
      path,
      url,
      method: options.method || "POST",
      status: res.status,
      error
    });
    throw new Error(`Invalid JSON response from ${path}`);
  }

  if (!res.ok) {
    console.error("Form API request failed", {
      path,
      url,
      method: options.method || "POST",
      status: res.status,
      response: data
    });
    throw new Error(data.error || `Request failed for ${path}`);
  }

  console.info("Form API request succeeded", {
    path,
    url,
    method: options.method || "POST",
    status: res.status
  });

  return data;
}
