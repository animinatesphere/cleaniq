// Autopilot: Claude writes posts from your instructions and posts them by itself on the days and
// times you choose, with a photo (ours first, Unsplash if none fits).
import { useState } from "react";
import { Bot, Plus, Sparkles, Play, Trash2, Clock, Image as ImageIcon, X as Close, Pencil, CalendarDays, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "./api";
import { AccountAvatar, Button, Card, Empty, Modal, inputCls, labelCls, fmtDate } from "./ui";

const DAYS = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];
const PICTURES = [
  ["ours-then-unsplash", "Our photos first, Unsplash if none fit"],
  ["ours", "Only our photos"],
  ["unsplash", "Always Unsplash"],
  ["none", "No photo (Instagram, TikTok and Pinterest are skipped)"],
];
const EXAMPLES = [
  "Share one practical cleaning tip for Manchester homes. Friendly and short. End by inviting people to get a free quote.",
  "Talk about our end of tenancy cleaning: help tenants get their deposit back. Mention our 48-hour re-clean guarantee.",
  "Post for Airbnb hosts in Manchester about fast, reliable turnover cleans between guests.",
];

function Editor({ value, accounts, onClose, onSaved, notify }) {
  const [f, setF] = useState(() => ({ name: "", instructions: "", accounts: accounts.filter((a) => a.active).map((a) => a._id), days: [1, 3, 5], times: ["10:00"], pictures: "ours-then-unsplash", enabled: true, ...(value || {}), ...(value ? { accounts: (value.accounts || []).map(String) } : {}) }));
  const [time, setTime] = useState("13:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const body = { name: f.name, instructions: f.instructions, accounts: f.accounts, days: f.days, times: f.times, pictures: f.pictures, enabled: f.enabled };
      const saved = value?._id ? await api(`/autopilots/${value._id}`, { method: "PATCH", body }) : await api("/autopilots", { method: "POST", body });
      notify(saved.enabled ? `Autopilot on. First post ${fmtDate(saved.nextRunAt, { weekday: "long" })}.` : "Autopilot saved (switched off).");
      onSaved(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={value?._id ? "Edit autopilot" : "New autopilot"} wide>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-6 space-y-5">
          <div>
            <label className={labelCls} htmlFor="ap-name">Name</label>
            <input id="ap-name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Weekly cleaning tips" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="ap-ins">Instructions for Claude</label>
            <textarea id="ap-ins" rows={7} value={f.instructions} onChange={(e) => set("instructions", e.target.value)} className={`${inputCls} resize-y leading-relaxed`}
              placeholder="What should the posts be about? Who are they for? Any tone, offers or links to mention?" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EXAMPLES.map((x) => <button key={x} type="button" onClick={() => set("instructions", x)} className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-2.5 py-1 text-left">{x.slice(0, 48)}…</button>)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Claude only uses facts about Cleaniq it's been given (services, vetted cleaners, 48-hour re-clean guarantee). It won't invent prices or offers — put any offer in the instructions.</p>
          </div>
          <div>
            <p className={labelCls}>Post to</p>
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => {
                const on = f.accounts.includes(a._id);
                return (
                  <button key={a._id} type="button" onClick={() => set("accounts", on ? f.accounts.filter((x) => x !== a._id) : [...f.accounts, a._id])}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-sm font-medium transition ${on ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "border-slate-200 text-slate-500 opacity-70"}`}>
                    <AccountAvatar account={a} size={24} /> <span className="max-w-[140px] truncate">{a.name}</span>
                  </button>
                );
              })}
              {!accounts.length && <p className="text-sm text-slate-500">Connect accounts first.</p>}
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50/70 border-t lg:border-t-0 lg:border-l border-slate-100 space-y-5">
          <div>
            <p className={labelCls}>Days</p>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map(([d, label]) => {
                const on = f.days.includes(d);
                return <button key={d} type="button" onClick={() => set("days", on ? f.days.filter((x) => x !== d) : [...f.days, d])} className={`h-9 rounded-lg text-xs font-semibold transition ${on ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}>{label.slice(0, 2)}</button>;
              })}
            </div>
          </div>
          <div>
            <p className={labelCls}>Times (UK time)</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {f.times.map((t) => <span key={t} className="inline-flex items-center gap-1 h-8 pl-2.5 pr-1 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 tabular-nums">{t}<button type="button" onClick={() => set("times", f.times.filter((x) => x !== t))} className="p-1 text-slate-400 hover:text-rose-600" aria-label={`Remove ${t}`}><Close size={12} /></button></span>)}
            </div>
            <div className="flex gap-2">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputCls} w-auto`} />
              <Button variant="secondary" onClick={() => time && !f.times.includes(time) && set("times", [...f.times, time].sort())}><Plus size={15} /> Add</Button>
            </div>
          </div>
          <div>
            <p className={labelCls}>Photos</p>
            <div className="space-y-1.5">
              {PICTURES.map(([k, label]) => (
                <label key={k} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer ${f.pictures === k ? "border-primary bg-white ring-2 ring-primary/10" : "border-slate-200 bg-white text-slate-600"}`}>
                  <input type="radio" name="pictures" checked={f.pictures === k} onChange={() => set("pictures", k)} className="accent-[#036847]" /> {label}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-3.5 py-3">
            <span><span className="block text-sm font-semibold text-slate-900">Post by itself</span><span className="block text-xs text-slate-500">Switch off to pause</span></span>
            <button type="button" role="switch" aria-checked={f.enabled} onClick={() => set("enabled", !f.enabled)} className={`relative w-11 h-6 rounded-full transition ${f.enabled ? "bg-primary" : "bg-slate-300"}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${f.enabled ? "left-[22px]" : "left-0.5"}`} /></button>
          </label>
        </div>
      </div>
      {error && <p className="mx-6 mb-2 text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save autopilot"}</Button>
      </div>
    </Modal>
  );
}

export default function Autopilot({ autopilots, accounts, reload, notify, onOpenPost, status }) {
  const [editing, setEditing] = useState(null); // null | {} (new) | autopilot
  const [busy, setBusy] = useState("");
  const toggle = async (ap) => {
    try {
      const saved = await api(`/autopilots/${ap._id}`, { method: "PATCH", body: { enabled: !ap.enabled } });
      notify(saved.enabled ? `Switched on. Next post ${fmtDate(saved.nextRunAt, { weekday: "short" })}.` : "Paused.");
      reload();
    } catch (e) {
      notify(e.message, "error");
    }
  };
  const run = async (ap, kind) => {
    if (kind === "run" && !window.confirm(`Write a post now and publish it to ${ap.accounts.length} account${ap.accounts.length === 1 ? "" : "s"}?`)) return;
    setBusy(`${kind}-${ap._id}`);
    try {
      const post = await api(`/autopilots/${ap._id}/${kind}`, { method: "POST" });
      notify(kind === "preview" ? "Claude wrote a draft — nothing was posted." : post.status === "posted" ? "Written and posted." : "Written, but some accounts failed — see the post.", kind === "run" && post.status !== "posted" ? "error" : "ok");
      reload();
      onOpenPost(post);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy("");
    }
  };
  const remove = async (ap) => {
    if (!window.confirm(`Delete the autopilot "${ap.name}"? Posts it already made stay.`)) return;
    await api(`/autopilots/${ap._id}`, { method: "DELETE" }).catch((e) => notify(e.message, "error"));
    reload();
  };
  const dayNames = (days) => (days.length === 7 ? "Every day" : DAYS.filter(([d]) => days.includes(d)).map(([, l]) => l).join(", "));
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-violet-50 via-white to-emerald-50/60 border-violet-100">
        <div className="flex flex-wrap items-center gap-5">
          <span className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/20"><Sparkles size={22} /></span>
          <div className="flex-1 min-w-[220px]">
            <h2 className="text-lg font-semibold text-slate-900">Let Claude post for you</h2>
            <p className="text-sm text-slate-600 mt-0.5">Write what you want posted. On the days and times you pick, Claude writes a fresh post for each network, adds a photo and posts it straight away.</p>
          </div>
          <Button size="lg" onClick={() => setEditing({})} disabled={!accounts.length}><Plus size={16} /> New autopilot</Button>
        </div>
        {status && (!status.ai || !status.unsplash) && (
          <p className="mt-4 text-xs text-slate-500 flex items-center gap-1.5"><AlertTriangle size={13} className="text-amber-500" />{!status.ai ? "Claude isn't set up on the server yet (ANTHROPIC_API_KEY)." : "Unsplash isn't set up (UNSPLASH_ACCESS_KEY), so only our own photos will be used."}</p>
        )}
      </Card>

      {autopilots.length === 0 ? (
        <Card><Empty icon={Bot} title="No autopilots yet" text={accounts.length ? "Create one and Claude will start posting on your schedule." : "Connect your social accounts first."} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {autopilots.map((ap) => (
            <Card key={ap._id} className="flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{ap.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><CalendarDays size={12} /> {dayNames(ap.days)} · <Clock size={12} /> {ap.times.join(", ")}</p>
                  </div>
                  <button type="button" role="switch" aria-checked={ap.enabled} aria-label={ap.enabled ? "Pause" : "Switch on"} onClick={() => toggle(ap)} className={`relative shrink-0 w-11 h-6 rounded-full transition ${ap.enabled ? "bg-primary" : "bg-slate-300"}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${ap.enabled ? "left-[22px]" : "left-0.5"}`} /></button>
                </div>
                <p className="text-sm text-slate-600 mt-3 line-clamp-3 leading-relaxed">{ap.instructions || <span className="italic text-slate-400">No instructions yet</span>}</p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="flex -space-x-1.5">{(ap.accounts || []).map((id) => accounts.find((a) => a._id === String(id))).filter(Boolean).map((a) => <AccountAvatar key={a._id} account={a} size={26} />)}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><ImageIcon size={12} /> {PICTURES.find(([k]) => k === ap.pictures)?.[1]}</span>
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs space-y-1">
                  <p className="text-slate-600"><span className="font-semibold text-slate-800">Next post:</span> {ap.enabled && ap.nextRunAt ? fmtDate(ap.nextRunAt, { weekday: "long" }) : "Paused"}</p>
                  {ap.lastRunAt && <p className={`flex items-center gap-1 ${/^Failed/.test(ap.lastResult) ? "text-rose-600" : "text-slate-600"}`}>{/^Failed/.test(ap.lastResult) ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} className="text-emerald-600" />}<span className="font-semibold">Last:</span> {fmtDate(ap.lastRunAt)} — {ap.lastResult}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => run(ap, "preview")} disabled={!!busy}><Sparkles size={14} /> {busy === `preview-${ap._id}` ? "Writing…" : "Try it"}</Button>
                <Button variant="secondary" size="sm" onClick={() => run(ap, "run")} disabled={!!busy || !ap.accounts.length}><Play size={14} /> {busy === `run-${ap._id}` ? "Posting…" : "Post one now"}</Button>
                <span className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(ap)} aria-label="Edit"><Pencil size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(ap)} aria-label="Delete" className="hover:!text-rose-600"><Trash2 size={14} /></Button>
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <Editor value={editing._id ? editing : null} accounts={accounts} notify={notify} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}
