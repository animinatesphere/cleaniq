// Visual page builder (drag and drop) for pages made of blocks, e.g. the homepage.
//  - Left: blocks to drag onto the page, and an outline of the page.  Middle: the real page.
//    Right: the selected block's fields. Click text on the page to type straight into it.
//  - Save draft keeps your work; Publish commits the page to GitHub (main) and Vercel rebuilds.
import { useEffect, useMemo, useRef, useState } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { Save, UploadCloud, History, Loader2, RotateCcw } from "lucide-react";
import { puckConfigFor, toEditorData, fromEditor } from "./puckConfig";
import { api } from "./api";

const fmt = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export default function PageBuilder({ pageKey, title, notify, onSaved }) {
  const [page, setPage] = useState(null); // { file, sha, draft, history }
  const [startData, setStartData] = useState(null); // what the editor opened with
  const [version, setVersion] = useState(0); // remounts the editor when we load other data
  const [busy, setBusy] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const current = useRef(null); // latest data from the editor
  const saved = useRef(null); // what's saved (draft or published)
  const [dirty, setDirty] = useState(false);
  const config = useMemo(() => puckConfigFor(pageKey), [pageKey]);

  // Show a page as loaded from the server (draft if there is one, otherwise the published file).
  const apply = (r) => {
    setPage(r);
    const start = toEditorData(r.draft ?? r.file);
    current.current = start;
    saved.current = start;
    setStartData(start);
    setDirty(false);
    setVersion((v) => v + 1);
  };
  const load = async () => apply(await api(`/site-content/${pageKey}`));
  useEffect(() => {
    let active = true;
    api(`/site-content/${pageKey}`)
      .then((r) => active && apply(r))
      .catch((e) => notify(e.message, "error"));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const onChange = (data) => {
    current.current = data;
    setDirty(!same(data, saved.current));
  };

  const saveDraft = async () => {
    setBusy("save");
    try {
      await api(`/site-content/${pageKey}`, { method: "PUT", body: { data: fromEditor(current.current) } });
      saved.current = current.current;
      setDirty(false);
      notify("Draft saved. It isn't live until you publish.");
      setPage(await api(`/site-content/${pageKey}`));
      onSaved?.();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const publish = async () => {
    if (!window.confirm(`Publish "${title}"? The website will update in about 2–3 minutes.`)) return;
    setBusy("publish");
    try {
      const r = await api(`/site-content/${pageKey}/publish`, { method: "POST", body: { data: fromEditor(current.current), sha: page.sha } });
      notify(r.message);
      await load();
      onSaved?.();
    } catch (e) {
      if (e.status === 409) {
        try { await api(`/site-content/${pageKey}`, { method: "PUT", body: { data: fromEditor(current.current) } }); } catch { /* keep going */ }
      }
      notify(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const restore = async (index) => {
    if (dirty && !window.confirm("Replace your unsaved changes with this earlier version?")) return;
    try {
      await api(`/site-content/${pageKey}/restore`, { method: "POST", body: { index } });
      setShowHistory(false);
      await load();
      notify("Earlier version restored as your draft. Publish it to make it live.");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const undo = async () => {
    if (!window.confirm(page?.draft && !dirty ? "Discard your draft and go back to the published page?" : "Undo your unsaved changes?")) return;
    if (!dirty && page?.draft) {
      await api(`/site-content/${pageKey}`, { method: "DELETE" }).catch(() => {});
      onSaved?.();
    }
    await load();
  };

  if (!startData) return <div className="flex-1 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;

  const status = dirty ? "Unsaved changes" : page?.draft ? `Draft saved ${fmt(page.draftSavedAt)}` : "Published";
  const actions = (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold px-2 py-1 rounded-md ${dirty ? "bg-amber-100 text-amber-800" : page?.draft ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>{status}</span>
      <div className="relative">
        <button type="button" onClick={() => setShowHistory((s) => !s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 bg-white">
          <History size={14} /> History
        </button>
        {showHistory && (
          <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
            {(page?.history || []).length === 0 && <p className="p-3 text-sm text-slate-500">No earlier versions yet.</p>}
            {(page?.history || []).map((h) => (
              <button type="button" key={h.index} onClick={() => restore(h.index)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm">
                <span className="block font-semibold">{fmt(h.savedAt)}</span>
                <span className="block text-xs text-slate-500">{h.savedBy}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {(dirty || page?.draft) && (
        <button type="button" onClick={undo} disabled={!!busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 bg-white">
          <RotateCcw size={14} /> {dirty ? "Undo changes" : "Discard draft"}
        </button>
      )}
      <button type="button" onClick={saveDraft} disabled={!dirty || !!busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-bold hover:bg-emerald-50 bg-white disabled:opacity-40">
        {busy === "save" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save draft
      </button>
      <button type="button" onClick={publish} disabled={!!busy || (!dirty && !page?.draft)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-40">
        {busy === "publish" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Publish
      </button>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 cms-page-builder">
      <Puck
        key={version}
        config={config}
        data={startData}
        onChange={onChange}
        headerTitle={title}
        overrides={{ headerActions: () => actions }}
        viewports={[
          { width: 390, height: "auto", label: "Phone", icon: "Smartphone" },
          { width: 768, height: "auto", label: "Tablet", icon: "Tablet" },
          { width: 1280, height: "auto", label: "Desktop", icon: "Monitor" },
        ]}
      />
    </div>
  );
}
