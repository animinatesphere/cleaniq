import { useEffect, useState } from "react";
import { X, Mail, Eye, MousePointerClick, MessageSquare, AlertCircle, Ban, Clock } from "lucide-react";
import { api, STAGES, VERIFY, when } from "./coldApi";
import { Pill, Spinner } from "./parts";
import { Conversation } from "./Inbox";

const EVENT = {
  sent:         { label: "Email sent",            icon: Mail,              cls: "text-blue-300" },
  opened:       { label: "Opened",                icon: Eye,               cls: "text-cyan-300" },
  clicked:      { label: "Clicked a link",        icon: MousePointerClick, cls: "text-indigo-300" },
  replied:      { label: "Replied",               icon: MessageSquare,     cls: "text-emerald-300" },
  auto_reply:   { label: "Automatic reply",       icon: Clock,             cls: "text-amber-300" },
  bounced:      { label: "Bounced",               icon: AlertCircle,       cls: "text-orange-300" },
  soft_bounce:  { label: "Temporary bounce",      icon: AlertCircle,       cls: "text-amber-300" },
  unsubscribed: { label: "Unsubscribed",          icon: Ban,               cls: "text-rose-300" },
};

// Side panel: everything that happened with one contact (like Apollo's activity tab).
export default function ContactActivity({ contactId, onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [showThread, setShowThread] = useState(false);

  async function load() {
    try {
      const d = await api(`/contacts/${contactId}/activity`);
      setData(d);
      setNotes(d.contact.notes || "");
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, [contactId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(body) {
    await api(`/contacts/${contactId}/stage`, { method: "PATCH", body: JSON.stringify(body) });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
    load();
  }

  const c = data?.contact;
  const campaigns = Object.fromEntries((data?.campaigns || []).map((k) => [String(k._id), k.name]));
  const name = c ? [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email : "";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div className="w-full max-w-xl h-full overflow-y-auto bg-[#07261c] border-l border-white/[0.08] p-5 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Contact activity</p>
          <button onClick={onClose} className="text-white/40 hover:text-white cursor-pointer"><X size={18} /></button>
        </div>

        {!data ? (
          <div className="flex justify-center py-20">{err ? <p className="text-rose-400 text-sm">{err}</p> : <Spinner />}</div>
        ) : showThread ? (
          <Conversation contactId={contactId} onBack={() => { setShowThread(false); load(); }} />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-lg font-black text-emerald-300">{(name[0] || "?").toUpperCase()}</div>
              <div className="min-w-0">
                <p className="text-white font-bold truncate">{name}</p>
                <p className="text-white/40 text-xs truncate">{c.email}{c.company ? ` · ${c.company}` : ""}</p>
                <div className="flex gap-1.5 mt-1">
                  <Pill map={VERIFY} value={c.verification?.status || "unknown"} fallback="unknown" />
                  {c.status !== "active" && <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-rose-500/15 text-rose-300">{c.status}</span>}
                </div>
                {c.verification?.reason && <p className="text-white/30 text-[11px] mt-1">{c.verification.reason}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Stage</span>
                <select value={c.stage || "new"} onChange={(e) => save({ stage: e.target.value })} className="mt-1 w-full bg-white/[0.06] border border-white/[0.1] text-white text-sm rounded-lg px-2.5 py-2 cursor-pointer">
                  {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k} className="bg-[#0B2D22]">{v.label}</option>)}
                </select>
              </label>
              <div className="flex items-end">
                <button onClick={() => setShowThread(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer">
                  <MessageSquare size={14} /> Open conversation
                </button>
              </div>
            </div>

            <label className="block">
              <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Notes {saved && <span className="text-emerald-400 normal-case font-semibold">· saved</span>}</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (c.notes || "") && save({ notes })} rows={3} placeholder="e.g. Called on Tuesday, wants a quote for 3 floors" className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/85 text-sm placeholder:text-white/20 outline-none resize-y" />
            </label>

            <div>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-2">Timeline</p>
              {data.events.length === 0 ? (
                <p className="text-white/30 text-sm">Nothing yet — no emails sent to this contact.</p>
              ) : (
                <div className="relative pl-5 space-y-3">
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/[0.08]" />
                  {data.events.map((e) => {
                    const m = EVENT[e.type] || { label: e.type, icon: Mail, cls: "text-white/50" };
                    const Icon = m.icon;
                    return (
                      <div key={e._id} className="relative">
                        <span className="absolute -left-5 top-0.5 w-[15px] h-[15px] rounded-full bg-[#07261c] border border-white/15 flex items-center justify-center">
                          <Icon size={9} className={m.cls} />
                        </span>
                        <p className={`text-sm font-semibold ${m.cls}`}>
                          {m.label}
                          {e.stepIndex !== undefined && e.stepIndex !== null && <span className="text-white/35 font-normal"> · step {e.stepIndex + 1}{e.variant === "B" ? " (B)" : ""}</span>}
                        </p>
                        <p className="text-white/35 text-xs">
                          {when(e.at)}{campaigns[String(e.campaignId)] ? ` · ${campaigns[String(e.campaignId)]}` : ""}
                        </p>
                        {e.url && <p className="text-white/40 text-xs truncate">{e.url}</p>}
                        {e.detail && <p className="text-white/40 text-xs line-clamp-2">{e.detail}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
