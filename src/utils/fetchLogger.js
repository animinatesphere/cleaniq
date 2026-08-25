// Singleton that intercepts window.fetch and logs every request/response.
// Skips devpanel requests themselves to avoid noise.

const MAX_ENTRIES = 500;
const log = [];
let _listeners = [];
let _installed = false;

const SKIP = [
  "/api/devpanel/",
  "google-analytics.com",
  "googletagmanager.com",
  "analytics.google.com",
  "/g/collect",
  "/ccm/collect",
  "doubleclick.net",
  "facebook.com/tr",
];

export const getLog    = () => [...log];
export const clearLog  = () => { log.length = 0; _emit(); };
export const subscribe = (fn) => {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter((l) => l !== fn); };
};

function _emit() { _listeners.forEach((fn) => fn([...log])); }

function _push(entry) {
  log.unshift(entry);
  if (log.length > MAX_ENTRIES) log.pop();
  _emit();
}

export function install() {
  if (_installed || typeof window === "undefined") return;
  _installed = true;

  const _orig = window.fetch.bind(window);

  window.fetch = async function loggedFetch(input, init) {
    const url    = typeof input === "string" ? input : input?.url ?? String(input);
    const method = ((init?.method) || (typeof input !== "string" && input?.method) || "GET").toUpperCase();

    // Pass through devpanel calls untracked
    if (SKIP.some((p) => url.includes(p))) return _orig(input, init);

    const id        = `f_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const timestamp = new Date().toISOString();
    const startMs   = Date.now();
    let   reqBody   = null;
    try { reqBody = init?.body ?? null; } catch {}

    _push({ id, method, url, status: null, statusText: null, duration: null, timestamp, reqBody, resBody: null, pending: true, error: null });

    try {
      const resp     = await _orig(input, init);
      const duration = Date.now() - startMs;
      let resBody    = null;
      try {
        const ct = resp.headers.get("content-type") || "";
        if (ct.includes("json")) {
          resBody = await resp.clone().json().then((j) => JSON.stringify(j, null, 2)).catch(() => null);
        } else if (ct.includes("text")) {
          resBody = await resp.clone().text().catch(() => null);
        }
      } catch {}

      const idx = log.findIndex((e) => e.id === id);
      if (idx !== -1) {
        log[idx] = { ...log[idx], status: resp.status, statusText: resp.statusText, duration, resBody, pending: false };
        _emit();
      }
      return resp;
    } catch (err) {
      const duration = Date.now() - startMs;
      const idx = log.findIndex((e) => e.id === id);
      if (idx !== -1) {
        log[idx] = { ...log[idx], status: 0, statusText: "Network Error", duration, error: err.message, pending: false };
        _emit();
      }
      throw err;
    }
  };
}
