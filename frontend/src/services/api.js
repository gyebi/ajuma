import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");
  return await user.getIdToken();
}

function getBackendUrl(path) {
  if (!BASE_URL) {
    throw new Error("Backend URL is missing. Set VITE_BACKEND_URL in the frontend production environment.");
  }

  return `${BASE_URL}${path}`;
}

async function parseApiResponse(res, path, url, method, kind) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (isJson) {
    try {
      return await res.json();
    } catch (error) {
      console.error(`${kind} API response parse failure`, {
        path,
        url,
        method,
        status: res.status,
        error
      });
      throw new Error(`Invalid JSON response from ${path}`);
    }
  }

  const bodyText = await res.text();

  console.error(`${kind} API non-JSON response`, {
    path,
    url,
    method,
    status: res.status,
    contentType,
    bodyPreview: bodyText.slice(0, 160)
  });

  throw new Error(
    bodyText.includes("<!doctype html") || bodyText.includes("<html")
      ? `Unexpected HTML response from ${path}. Check VITE_BACKEND_URL and Hosting rewrites.`
      : `Unexpected response from ${path} (${res.status}).`
  );
}

export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const url = getBackendUrl(path);
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

  const data = await parseApiResponse(res, path, url, options.method || "GET", "");

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
  const url = getBackendUrl(path);
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

  const data = await parseApiResponse(res, path, url, options.method || "POST", "Form");

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
