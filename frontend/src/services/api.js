import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");
  return await user.getIdToken();
}

function createApiError(message, details = {}) {
  const error = new Error(message);
  Object.assign(error, details);
  return error;
}

function getBackendUrl(path) {
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

  if (bodyText.includes("<!doctype html") || bodyText.includes("<html")) {
    throw createApiError(`Unexpected HTML response from ${path}. Check VITE_API_BASE_URL and Hosting rewrites.`, {
      code: "API_HTML_RESPONSE",
      section: "hosting_rewrite",
      status: res.status
    });
  }

  throw createApiError(`Unexpected response from ${path} (${res.status}).`, {
    code: "API_NON_JSON_RESPONSE",
    section: "api_response",
    status: res.status
  });
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
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error("API network failure", {
      path,
      url,
      method: options.method || "GET",
      error
    });
    throw createApiError(`Network error while calling ${path}`, {
      code: "API_NETWORK_ERROR",
      section: "network",
      cause: error
    });
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
    throw createApiError(data.error || `Request failed for ${path}`, {
      code: data.code || "API_REQUEST_FAILED",
      section: data.section || "api",
      status: res.status
    });
  }

  console.info("API request succeeded", {
    path,
    url,
    method: options.method || "GET",
    status: res.status
  });

  return data;
}

export async function publicApiFetch(path, options = {}) {
  const url = getBackendUrl(path);
  let res;

  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (error) {
    console.error("Public API network failure", {
      path,
      url,
      method: options.method || "GET",
      error
    });
    throw createApiError(`Network error while calling ${path}`, {
      code: "API_NETWORK_ERROR",
      section: "network",
      cause: error
    });
  }

  const data = await parseApiResponse(res, path, url, options.method || "GET", "Public");

  if (!res.ok) {
    console.error("Public API request failed", {
      path,
      url,
      method: options.method || "GET",
      status: res.status,
      response: data
    });
    throw createApiError(data.error || `Request failed for ${path}`, {
      code: data.code || "API_REQUEST_FAILED",
      section: data.section || "api",
      status: res.status
    });
  }

  console.info("Public API request succeeded", {
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
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error("Form API network failure", {
      path,
      url,
      method: options.method || "POST",
      error
    });
    throw createApiError(`Network error while uploading to ${path}`, {
      code: "FORM_NETWORK_ERROR",
      section: "network",
      cause: error
    });
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
    throw createApiError(data.error || `Request failed for ${path}`, {
      code: data.code || "FORM_REQUEST_FAILED",
      section: data.section || "upload_api",
      status: res.status
    });
  }

  console.info("Form API request succeeded", {
    path,
    url,
    method: options.method || "POST",
    status: res.status
  });

  return data;
}
