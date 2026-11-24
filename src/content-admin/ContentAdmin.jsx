// /content-admin: edit website text with a live preview, then publish to GitHub.
//  - Left: the pages (from GitHub).  Middle: the page's text as edit boxes.  Right: the real page,
//    updating as you type. Click any text in the preview to jump to its edit box.
//  - Save draft keeps your work (with earlier versions). Publish commits the page's content file
//    to GitHub (main) and Vercel rebuilds the website in about 2–3 minutes.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Save, UploadCloud, RotateCcw, History, ExternalLink, LogOut, Monitor, Smartphone, FileText, MapPin, Loader2, X, Search, LayoutTemplate,
} from "lucide-react";
import FieldEditor from "./FieldEditor";
import PageBuilder from "./PageBuilder";
import { api, getToken, signOut } from "./api";
import { SERVICE_PAGES } from "../utils/servicePages";
import { AREAS } from "../utils/areas";

const SERVICE_NAMES = Object.fromEntries(SERVICE_PAGES.map((p) => [p.slug, p.name]));
const AREA_NAMES = Object.fromEntries(AREAS.map((a) => [a.slug, a.name]));
const pretty = (slug) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const PAGE_NAMES = {
  home: "Homepage",
  about: "About us",
  services: "Services",
  contact: "Contact",
  "commercial-cleaning": "Commercial cleaning quote",
  "get-a-quote": "Get a quote",
  recruitment: "Join our team (jobs)",
};
const PAGE_ORDER = Object.keys(PAGE_NAMES);
const pageRank = (row) => {
  const i = PAGE_ORDER.indexOf(String(row.key).split(":")[1]);
  return i < 0 ? 99 : i;
};
const pageName = (key) => {
  const [type, slug] = key.split(":");
  if (type === "page") return PAGE_NAMES[slug] || pretty(slug);
  return type === "service" ? SERVICE_NAMES[slug] || pretty(slug) : `Cleaners in ${AREA_NAMES[slug] || pretty(slug)}`;
};
const pageUrl = (key) => {
  const [type, slug] = key.split(":");
  if (type === "page") return slug === "home" ? "/" : `/${slug}`;
  return type === "service" ? `/service/${slug}` : `/locations/${slug}`;
};
// Pages built from blocks open in the drag-and-drop page builder.
const isBlockPage = (key) => key.startsWith("page:") || key.startsWith("location:");
const norm = (t) => String(t || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim().toLowerCase();

// All text values in the content, with their paths (for click-to-edit).
function textPaths(value, path = "", out = []) {
  if (typeof value === "string") out.push([path, norm(value)]);
  else if (Array.isArray(value)) value.forEach((v, i) => textPaths(v, path ? `${path}.${i}` : String(i), out));
  else if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => textPaths(v, path ? `${path}.${k}` : k, out));
  return out;
}
function findPath(content, clicked) {
  const t = norm(clicked);
  if (t.length < 2) return null;
  let best = null;
  for (const [path, v] of textPaths(content)) {
    if (!v) continue;
    let score = 0;
    if (v === t) score = 1000;
    else if (v.includes(t)) score = 500 + t.length;
    else if (t.includes(v) && v.length > 12) score = v.length;
    if (score && (!best || score > best.score)) best = { path, score };
  }
  return best?.path || null;
}

const fmt = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

export default function ContentAdmin() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [pages, setPages] = useState(null);
  const [listError, setListError] = useState("");
  const [filter, setFilter] = useState("");
  const [key, setKey] = useState("");
  const [page, setPage] = useState(null); // { file, sha, draft, history, ... }
  const [content, setContent] = useState(null);
  const [savedContent, setSavedContent] = useState(null); // what's saved (draft or file), to know if there are changes
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState(null);
  const [device, setDevice] = useState("desktop");
  const [showHistory, setShowHistory] = useState(false);
  const iframeRef = useRef(null);
  const editorRef = useRef(null);

  const dirty = content && savedContent && JSON.stringify(content) !== JSON.stringify(savedContent);
  const notify = (msg, type = "success") => setToast({ msg, type });

  // Signed in?
  useEffect(() => {
    if (!getToken()) {
      navigate("/content-admin/login", { replace: true });
      return;
    }
    api("/content-editors/me")
      .then((r) => setMe(r.editor))
      .catch(() => {
        signOut();
        navigate("/content-admin/login", { replace: true });
      });
  }, [navigate]);

  const loadPages = useCallback(() => {
    api("/site-content/pages")
      .then((r) => { setPages(r); setListError(""); })
      .catch((e) => setListError(e.message));
  }, []);
  useEffect(() => {
    if (me) loadPages();
  }, [me, loadPages]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const openPage = async (k) => {
    if (dirty && !window.confirm("You have unsaved changes on this page. Leave without saving them?")) return;
    setKey(k);
    if (isBlockPage(k)) {
      setPage(null);
      setContent(null);
      setSavedContent(null);
      return;
    }
    setPage(null);
    setContent(null);
    setShowHistory(false);
    try {
      const r = await api(`/site-content/${k}`);
      setPage(r);
      const start = r.draft ?? r.file;
      setContent(start);
      setSavedContent(start);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  // Send the draft to the preview as you type.
  const sendPreview = useCallback(() => {
    const w = iframeRef.current?.contentWindow;
    if (w && content && key) w.postMessage({ type: "cms-draft", key, data: content }, window.location.origin);
  }, [content, key]);
  useEffect(() => {
    const t = setTimeout(sendPreview, 150);
    return () => clearTimeout(t);
  }, [sendPreview]);

  // Messages from the preview: it's ready (send the draft) or text was clicked (jump to its box).
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === "cms-ready") sendPreview();
      if (e.data?.type === "cms-click" && content) {
        const path = findPath(content, e.data.text);
        const el = path && editorRef.current?.querySelector(`[data-cms-path="${CSS.escape(path)}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus({ preventScroll: true });
          el.classList.add("ring-4", "ring-amber-300");
          setTimeout(() => el.classList.remove("ring-4", "ring-amber-300"), 1600);
        } else {
          notify("That text isn't editable here yet (it's part of the page design or a longer section in code).", "info");
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [content, sendPreview]);

  const saveDraft = async () => {
    setBusy("save");
    try {
      await api(`/site-content/${key}`, { method: "PUT", body: { data: content } });
      setSavedContent(content);
      notify("Draft saved. It isn't live until you publish.");
      const r = await api(`/site-content/${key}`);
      setPage(r);
      loadPages();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const discardDraft = async () => {
    if (!window.confirm("Discard your draft and go back to the published text?")) return;
    setBusy("discard");
    try {
      await api(`/site-content/${key}`, { method: "DELETE" });
      setContent(page.file);
      setSavedContent(page.file);
      setPage({ ...page, draft: null });
      loadPages();
      notify("Draft discarded.");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const restore = async (index) => {
    if (dirty && !window.confirm("Replace your unsaved changes with this earlier version?")) return;
    try {
      const r = await api(`/site-content/${key}/restore`, { method: "POST", body: { index } });
      setContent(r.data);
      setSavedContent(r.data);
      setShowHistory(false);
      notify("Earlier version restored as your draft. Publish it to make it live.");
      setPage(await api(`/site-content/${key}`));
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const publish = async () => {
    if (!window.confirm(`Publish "${pageName(key)}"? The website will update in about 2–3 minutes.`)) return;
    setBusy("publish");
    try {
      const r = await api(`/site-content/${key}/publish`, { method: "POST", body: { data: content, sha: page.sha } });
      notify(r.message);
      const fresh = await api(`/site-content/${key}`);
      setPage(fresh);
      setContent(fresh.draft ?? fresh.file);
      setSavedContent(fresh.draft ?? fresh.file);
      loadPages();
    } catch (e) {
      if (e.status === 409) {
        try { await api(`/site-content/${key}`, { method: "PUT", body: { data: content } }); } catch { /* keep going */ }
      }
      notify(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const groups = useMemo(() => {
    if (!pages) return [];
    const f = filter.trim().toLowerCase();
    const keep = (row) => !f || pageName(row.key).toLowerCase().includes(f);
    return [
      { title: "Pages (drag & drop)", icon: LayoutTemplate, rows: (pages.pages || []).filter(keep).sort((a, b) => pageRank(a) - pageRank(b)) },
      { title: "Service pages", icon: FileText, rows: pages.services.filter(keep) },
      { title: "Location pages", icon: MapPin, rows: pages.locations.filter(keep) },
    ];
  }, [pages, filter]);

  const status = !page ? "" : dirty ? "Unsaved changes" : page.draft ? `Draft saved ${fmt(page.draftSavedAt)}` : "Published";

  if (!me) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-800">
      <Helmet>
        <title>Website Content | Cleaniq</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Top bar */}
      <header className="h-14 shrink-0 bg-[#0A3B2C] text-white flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="font-black tracking-tight">Website Content</span>
          {key && <span className="hidden md:inline text-white/60 text-sm">/ {pageName(key)}</span>}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-white/70">{me.name}</span>
          <button onClick={() => { signOut(); navigate("/content-admin/login"); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </header>

      <div className={`flex-1 min-h-0 grid grid-cols-1 ${key && isBlockPage(key) ? "lg:grid-cols-[240px_1fr]" : "lg:grid-cols-[240px_minmax(380px,1fr)_minmax(420px,1.2fr)]"}`}>
        {/* Pages */}
        <aside className="border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-3 sticky top-0 bg-white border-b border-slate-100">
            <label className="relative block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a page" className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
            </label>
          </div>
          {listError && <p className="m-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">{listError}</p>}
          {!pages && !listError && <p className="p-4 text-sm text-slate-400">Loading pages…</p>}
          {groups.map((g) => (
            <div key={g.title} className="py-2">
              <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><g.icon size={12} /> {g.title}</p>
              {g.rows.map((row) => (
                <button
                  key={row.key}
                  onClick={() => openPage(row.key)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-2 ${key === row.key ? "bg-emerald-50 text-emerald-800 font-bold" : "hover:bg-slate-50"}`}
                >
                  <span className="truncate">{pageName(row.key)}</span>
                  {row.hasDraft && <span className="shrink-0 text-[10px] font-bold uppercase text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">Draft</span>}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {key && isBlockPage(key) ? (
          <main className="min-h-0 flex flex-col">
            <PageBuilder pageKey={key} title={pageName(key)} notify={notify} onSaved={loadPages} />
          </main>
        ) : (
          <>
        {/* Editor */}
        <main className="min-h-0 flex flex-col border-r border-slate-200">
          {!key ? (
            <div className="flex-1 flex items-center justify-center p-10 text-center text-slate-500">
              <div>
                <p className="font-bold text-slate-700">Choose a page on the left to edit it.</p>
                <p className="text-sm mt-1">You'll see a live preview as you type. Nothing goes live until you press Publish.</p>
              </div>
            </div>
          ) : !content ? (
            <div className="flex-1 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
          ) : (
            <>
              <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${dirty ? "bg-amber-100 text-amber-800" : page?.draft ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>{status}</span>
                <div className="flex-1" />
                <div className="relative">
                  <button onClick={() => setShowHistory((s) => !s)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50">
                    <History size={15} /> History
                  </button>
                  {showHistory && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 max-h-80 overflow-y-auto">
                      {page.history.length === 0 && <p className="p-3 text-sm text-slate-500">No earlier versions yet.</p>}
                      {page.history.map((h) => (
                        <button key={h.index} onClick={() => restore(h.index)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm">
                          <span className="block font-semibold">{fmt(h.savedAt)}</span>
                          <span className="block text-xs text-slate-500">{h.savedBy}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {(page?.draft || dirty) && (
                  <button onClick={dirty ? () => { setContent(savedContent); } : discardDraft} disabled={!!busy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50">
                    <RotateCcw size={15} /> {dirty ? "Undo changes" : "Discard draft"}
                  </button>
                )}
                <button onClick={saveDraft} disabled={!dirty || !!busy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-bold hover:bg-emerald-50 disabled:opacity-40">
                  {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save draft
                </button>
                <button onClick={publish} disabled={!!busy || (!dirty && !page?.draft)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-40">
                  {busy === "publish" ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />} Publish
                </button>
              </div>
              <div ref={editorRef} className="flex-1 overflow-y-auto p-4 md:p-6">
                <FieldEditor value={content} onChange={setContent} />
              </div>
            </>
          )}
        </main>

        {/* Live preview */}
        <section className="hidden lg:flex min-h-0 flex-col bg-slate-200">
          <div className="shrink-0 h-11 px-3 flex items-center justify-between bg-white border-b border-slate-200 text-sm">
            <span className="font-bold text-slate-600">Live preview {key && <span className="font-normal text-slate-400">· click any text to edit it</span>}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setDevice("desktop")} className={`p-1.5 rounded ${device === "desktop" ? "bg-slate-200" : "hover:bg-slate-100"}`} aria-label="Desktop preview"><Monitor size={16} /></button>
              <button onClick={() => setDevice("mobile")} className={`p-1.5 rounded ${device === "mobile" ? "bg-slate-200" : "hover:bg-slate-100"}`} aria-label="Phone preview"><Smartphone size={16} /></button>
              {key && <a href={pageUrl(key)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100" aria-label="Open the live page"><ExternalLink size={16} /></a>}
            </div>
          </div>
          <div className="flex-1 min-h-0 flex justify-center overflow-auto p-3">
            {key ? (
              <iframe
                ref={iframeRef}
                key={key}
                title="Live preview"
                src={`${pageUrl(key)}?cms-preview=1`}
                onLoad={sendPreview}
                className={`bg-white rounded-lg shadow-lg h-full ${device === "mobile" ? "w-[390px]" : "w-full"}`}
              />
            ) : (
              <p className="self-center text-sm text-slate-500">The page will appear here.</p>
            )}
          </div>
        </section>
          </>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-lg flex items-start gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-800" : "bg-emerald-600"}`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} aria-label="Close" className="opacity-70 hover:opacity-100"><X size={15} /></button>
        </div>
      )}
    </div>
  );
}
