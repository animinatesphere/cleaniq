// Files served by the API server (blog images, job photos, …) live on the API's origin,
// e.g. https://api.cleaniqservices.com/uploads/blog/x.jpg.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Only strip a trailing "/api": a plain replace("/api") would also hit the "//api." in the domain.
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function uploadUrl(path) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const clean = path.replace(/^\/api(?=\/)/, "");
  return `${API_ORIGIN}${clean.startsWith("/") ? clean : `/${clean}`}`;
}
