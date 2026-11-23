// API calls for /content-admin. Content editors sign in with their own login; a main admin who is
// already signed in to /admin can use the editor too.
const API = import.meta.env.VITE_API_URL;
export const TOKEN_KEY = "contentToken";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("adminToken") || "";
  } catch {
    return "";
  }
};

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
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
