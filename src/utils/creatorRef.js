// Creator / influencer links: cleaniqservices.com/?ref=CODE. The code is remembered in this
// browser for the programme's "remember the link" days and filled in at checkout and on the
// quote form, so the booking counts for the creator (server/utils/creators.js).
const KEY = "ciq_creator_ref";
const API = import.meta.env.VITE_API_URL;

export function captureCreatorRef(search) {
  try {
    const code = new URLSearchParams(search).get("ref");
    if (!code || !/^[A-Za-z0-9]{3,20}$/.test(code)) return;
    const upper = code.toUpperCase();
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved?.code === upper && Date.now() < saved.until) return; // already counted
    fetch(`${API}/creators/click`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: upper }) })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.valid) return;
        const days = Number(d.linkDays) || 30;
        localStorage.setItem(KEY, JSON.stringify({ code: upper, until: Date.now() + days * 86400000 }));
      })
      .catch(() => {});
  } catch { /* storage blocked: nothing to remember */ }
}

export function getCreatorRef() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    return saved && Date.now() < saved.until ? saved.code : "";
  } catch {
    return "";
  }
}
