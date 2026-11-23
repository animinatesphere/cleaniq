// Page text comes from src/content/*.json (see src/content/index.js).
//
// Live preview: /content-admin shows the real page in a frame (with ?cms-preview=1) and sends the
// editor's unsaved draft to it as they type, so they see the change before publishing. Only
// messages from this same website are accepted. Normal visitors never run any of this.
import { useEffect, useState } from "react";

export const isPreview =
  typeof window !== "undefined" && window.parent !== window && new URLSearchParams(window.location.search).has("cms-preview");

const drafts = {};
const listeners = new Set();

if (isPreview) {
  window.addEventListener("message", (e) => {
    if (e.origin !== window.location.origin || e.data?.type !== "cms-draft") return;
    drafts[e.data.key] = e.data.data;
    listeners.forEach((fn) => fn());
  });
  // Clicking text in the preview tells the editor which text was clicked, so it can jump to that box.
  window.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest("h1,h2,h3,h4,h5,p,li,span,a,button,label,summary,dt,dd,figcaption,td,th");
      e.preventDefault();
      e.stopPropagation();
      if (el) window.parent.postMessage({ type: "cms-click", text: (el.innerText || "").trim().slice(0, 400) }, window.location.origin);
    },
    true,
  );
  window.parent.postMessage({ type: "cms-ready" }, window.location.origin);
}

/** The page's content: the editor's live draft in preview, otherwise the content file. */
export function usePageContent(key, fileData) {
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!isPreview) return undefined;
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    window.parent.postMessage({ type: "cms-ready", key }, window.location.origin);
    return () => listeners.delete(fn);
  }, [key]);
  return (isPreview && drafts[key]) || fileData;
}

/** Fill in anything missing from the content file with the code's default (e.g. a newly added field). */
export function withDefaults(edited, defaults) {
  if (edited == null) return defaults;
  if (Array.isArray(defaults) || Array.isArray(edited)) return edited;
  if (typeof defaults !== "object" || defaults === null) return edited;
  const out = { ...defaults };
  for (const [k, v] of Object.entries(edited)) out[k] = withDefaults(v, defaults[k]);
  return out;
}
