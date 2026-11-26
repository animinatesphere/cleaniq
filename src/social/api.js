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
