// Small building blocks shared by the cold email screens (inbox, analytics, campaign page).
export const API = import.meta.env.VITE_API_URL;
export const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` });

export async function api(path, opts = {}) {
  const r = await fetch(`${API}/cold-email${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...auth(), ...(opts.headers || {}) },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || `Error ${r.status}`);
  return d;
}

export const REPLY_CATS = {
  interested:     { label: "Interested",     cls: "bg-emerald-500/15 text-emerald-300" },
  question:       { label: "Question",       cls: "bg-sky-500/15 text-sky-300" },
  not_interested: { label: "Not interested", cls: "bg-rose-500/15 text-rose-300" },
  out_of_office:  { label: "Out of office",  cls: "bg-amber-500/15 text-amber-300" },
  unsubscribe:    { label: "Unsubscribe",    cls: "bg-orange-500/15 text-orange-300" },
  wrong_person:   { label: "Wrong person",   cls: "bg-purple-500/15 text-purple-300" },
  other:          { label: "Other",          cls: "bg-white/[0.08] text-white/50" },
};

export const STAGES = {
  new:            { label: "New",            cls: "bg-white/[0.08] text-white/50" },
  contacted:      { label: "Contacted",      cls: "bg-blue-500/15 text-blue-300" },
  opened:         { label: "Opened",         cls: "bg-cyan-500/15 text-cyan-300" },
  clicked:        { label: "Clicked",        cls: "bg-indigo-500/15 text-indigo-300" },
  replied:        { label: "Replied",        cls: "bg-emerald-500/15 text-emerald-300" },
  interested:     { label: "Interested",     cls: "bg-emerald-500/25 text-emerald-200" },
  meeting:        { label: "Meeting booked", cls: "bg-lime-500/20 text-lime-200" },
  not_interested: { label: "Not interested", cls: "bg-rose-500/15 text-rose-300" },
  bounced:        { label: "Bounced",        cls: "bg-orange-500/15 text-orange-300" },
  unsubscribed:   { label: "Unsubscribed",   cls: "bg-amber-500/15 text-amber-300" },
};

export const VERIFY = {
  valid:   { label: "Valid",     cls: "bg-emerald-500/15 text-emerald-300", tip: "This address has a working mail server." },
  risky:   { label: "Risky",     cls: "bg-amber-500/15 text-amber-300",     tip: "Works, but it's a shared/role address (info@, sales@) — replies are less likely." },
  invalid: { label: "Invalid",   cls: "bg-rose-500/15 text-rose-300",       tip: "This address can't receive email. It will be skipped so it doesn't bounce." },
  unknown: { label: "Unchecked", cls: "bg-white/[0.06] text-white/40",      tip: "Not checked yet." },
};

export function when(d) {
  if (!d) return "—";
  const t = new Date(d);
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return t.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Cold emails only go out Monday–Friday, 8am–6pm UK time (server: utils/deliverability.js).
// Returns null while sending is allowed, else when it starts again, e.g. "Monday at 8am".
export function sendingPausedUntil(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  const day = parts.find((p) => p.type === "weekday").value;
  const hour = Number(parts.find((p) => p.type === "hour").value) % 24;
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(day);
  if (weekday && hour >= 8 && hour < 18) return null;
  if (weekday && hour < 8) return "today at 8am";
  if (["Mon", "Tue", "Wed", "Thu"].includes(day)) return "tomorrow at 8am";
  return "Monday at 8am";
}
