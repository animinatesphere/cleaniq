// API calls for the social media dashboard (/social). Social logins have their own token; a main
// admin already signed in to /admin can use the dashboard too.
const API = import.meta.env.VITE_API_URL;
const FILES = String(API || "").replace(/\/api\/?$/, "");
export const TOKEN_KEY = "socialToken";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("adminToken") || "";
  } catch {
    return "";
  }
};

export async function api(path, { method = "GET", body, form } = {}) {
  const res = await fetch(`${API}/social${path}`, {
    method,
    headers: { ...(form ? {} : { "Content-Type": "application/json" }), Authorization: `Bearer ${getToken()}` },
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || "Something went wrong"), { status: res.status });
  return data;
}

export const signOut = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

/** A post photo ("/uploads/social/…" or "library:our-work/…") → its web address. */
export const photoUrl = (ref) => {
  const r = String(ref || "");
  if (r.startsWith("library:")) return `${FILES}/social-library/${r.slice(8)}`;
  if (r.startsWith("/uploads/")) return `${FILES}${r}`;
  return r;
};

/**
 * Uploads files with progress (fetch can't report upload progress). onProgress(0–100) while
 * sending; 100 means "sent, the server is saving it".
 */
export function uploadFiles(path, form, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/social${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.min(100, Math.round((e.loaded / e.total) * 100))); };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || "{}"); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
      if (xhr.status === 413) return reject(Object.assign(new Error("This file is too big for the server. Try a shorter or smaller video (under 500 MB)."), { status: 413 }));
      reject(Object.assign(new Error(data.message || `Upload failed (error ${xhr.status}).`), { status: xhr.status }));
    };
    xhr.onerror = () => reject(new Error("Upload failed — the connection dropped or the file was too big for the server. Check your internet and try again."));
    xhr.ontimeout = () => reject(new Error("Upload took too long. Try again on a faster connection, or a shorter video."));
    xhr.send(form);
  });
}
