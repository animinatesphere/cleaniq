// Cookie consent banner (UK GDPR / PECR). Analytics and marketing tags in index.html only load
// once the visitor agrees here. The choice is saved in this browser and can be changed any time
// from "Cookies" in the footer (which opens these settings again).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

const KEY = "cleaniq_cookie_consent";
// The footer's "Cookies" link sends this event to open the settings again.
const OPEN_COOKIE_SETTINGS = "cleaniq:open-cookie-settings";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

// Remove analytics/marketing cookies this site set (Google Analytics/Ads, TikTok), e.g. after
// consent is withdrawn. Cookies set by other websites can only be cleared by the browser.
const clearTrackingCookies = () => {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (!/^(_ga|_gid|_gat|_gcl|_ttp|_tt_|ttcsid|tt_)/.test(name)) return;
    domains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
    });
  });
};

const CATEGORIES = [
  { id: "necessary", label: "Necessary", desc: "Needed for the website to work, such as keeping you signed in and remembering this choice. Always on.", locked: true },
  { id: "analytics", label: "Analytics", desc: "Help us understand how visitors use the website so we can improve it (Google Analytics, Metricool)." },
  { id: "marketing", label: "Marketing", desc: "Used to measure and show our adverts (Google Ads, TikTok)." },
];

export default function CookieBanner() {
  // Rendered only in the browser: pre-built HTML for crawlers never includes the banner.
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [choice, setChoice] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const saved = read();
    const t = setTimeout(() => {
      setMounted(true);
      if (saved) setChoice({ analytics: !!saved.analytics, marketing: !!saved.marketing });
      else setOpen(true);
    }, 0);
    const reopen = () => {
      const s = read();
      if (s) setChoice({ analytics: !!s.analytics, marketing: !!s.marketing });
      setManage(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => {
      clearTimeout(t);
      window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
    };
  }, []);

  const save = (c) => {
    const before = read();
    const value = { analytics: !!c.analytics, marketing: !!c.marketing, at: new Date().toISOString(), v: 1 };
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      /* private browsing: the choice applies to this visit only */
    }
    setChoice(value);
    setOpen(false);
    setManage(false);
    // Withdrawing consent: tags already running can't be unloaded, so clear their cookies and reload.
    const withdrawn = before && ((before.analytics && !value.analytics) || (before.marketing && !value.marketing));
    if (withdrawn) {
      clearTrackingCookies();
      window.location.reload();
      return;
    }
    window.dispatchEvent(new CustomEvent("cleaniq:consent", { detail: value }));
  };

  if (!mounted || !open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-5 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-black/20 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="hidden sm:flex w-10 h-10 rounded-xl bg-primary/10 text-primary items-center justify-center shrink-0">
            <Cookie size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 id="cookie-title" className="text-base font-black text-primary-dark">We use cookies</h2>
              {read() && (
                <button onClick={() => { setOpen(false); setManage(false); }} aria-label="Close cookie settings" className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              )}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">
              We use necessary cookies to make our website work. With your permission, we'd also like to use analytics cookies to
              understand how you use the site, and marketing cookies to measure our adverts. You can change your choice at any time
              from "Cookies" at the bottom of the page. Read more in our{" "}
              <Link to="/privacy" className="font-semibold text-primary underline underline-offset-2">privacy and cookie policy</Link>.
            </p>

            {manage && (
              <ul className="mt-4 space-y-2">
                {CATEGORIES.map((cat) => {
                  const on = cat.locked || choice[cat.id];
                  return (
                    <li key={cat.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-3">
                      <div>
                        <p className="text-sm font-bold text-primary-dark">{cat.label}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`${cat.label} cookies`}
                        disabled={cat.locked}
                        onClick={() => setChoice((c) => ({ ...c, [cat.id]: !c[cat.id] }))}
                        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-slate-300"} ${cat.locked ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button onClick={() => save({ analytics: true, marketing: true })} className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors">
                Accept all
              </button>
              <button onClick={() => save({ analytics: false, marketing: false })} className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-bold hover:border-slate-300 transition-colors">
                Reject non-essential
              </button>
              {manage ? (
                <button onClick={() => save(choice)} className="px-5 py-2.5 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors">
                  Save my choices
                </button>
              ) : (
                <button onClick={() => setManage(true)} className="px-5 py-2.5 rounded-xl text-slate-600 text-sm font-bold underline underline-offset-2 hover:text-primary-dark">
                  Manage cookies
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
