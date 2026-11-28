import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Send, Mail, MousePointerClick, Eye, AlertCircle, ArrowLeft, Inbox as InboxIcon } from "lucide-react";
import { api, REPLY_CATS, STAGES, when } from "./coldApi";
import { Pill, Spinner } from "./parts";

const FILTERS = [
  { id: "",               label: "All replies" },
  { id: "interested",     label: "Interested" },
  { id: "question",       label: "Questions" },
  { id: "not_interested", label: "Not interested" },
  { id: "wrong_person",   label: "Wrong person" },
  { id: "unsubscribe",    label: "Unsubscribe" },
  { id: "other",          label: "Other" },
  { id: "auto",           label: "Out of office" },
];

// Every reply from every mailbox in one place. Sorted by Claude into interested / question / etc.
export default function Inbox() {
  const [filter, setFilter] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (filter) q.set("category", filter);
    if (unreadOnly) q.set("unread", "1");
    try { setData(await api(`/inbox?${q}`)); } catch (e) { setData({ threads: [], counts: {}, error: e.message }); }
  }, [filter, unreadOnly]);

  useEffect(() => { load(); }, [load]);
  // Keep it fresh while it's open.
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  async function checkNow() {
    setChecking(true); setNote("");
    try {
      const r = await api("/inbox/check", { method: "POST" });
      if (r.skipped) setNote("Already checking — give it a minute.");
      else setNote(`Checked ${r.checked} new message(s): ${r.replies} repl${r.replies === 1 ? "y" : "ies"}, ${r.bounces} bounce(s).${r.errors?.length ? ` Problem: ${r.errors.join("; ")}` : ""}`);
      await load();
    } catch (e) { setNote(e.message); }
    finally { setChecking(false); }
  }

  const counts = data?.counts || {};
  const countFor = (id) => {
    if (id === "") return Object.entries(counts).filter(([k]) => k !== "auto").reduce((n, [, v]) => n + (v.unread || 0), 0);
    return counts[id]?.unread || 0;
  };

  if (openId) return <Conversation contactId={openId} onBack={() => { setOpenId(null); load(); }} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-white font-black text-lg">Inbox</h2>
          <p className="text-white/40 text-xs">Replies to your cold emails from all mailboxes. Checked automatically every ~10 minutes.</p>
        </div>
        <button onClick={checkNow} disabled={checking} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20">
          <RefreshCw size={14} className={checking ? "animate-spin" : ""} /> {checking ? "Checking…" : "Check for replies now"}
        </button>
      </div>
      {note && <p className="text-white/60 text-xs bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2">{note}</p>}

      <div className="flex gap-1.5 flex-wrap items-center">
        {FILTERS.map((f) => {
          const n = countFor(f.id);
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${filter === f.id ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-white/45 hover:text-white/75"}`}>
              {f.label}
              {n > 0 && <span className={`text-[10px] px-1.5 rounded-full ${filter === f.id ? "bg-white/25" : "bg-emerald-500/25 text-emerald-300"}`}>{n}</span>}
            </button>
          );
        })}
        <label className="ml-auto flex items-center gap-2 text-xs text-white/50 cursor-pointer">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="accent-emerald-500" /> Unread only
        </label>
      </div>

      <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl overflow-hidden">
        {!data ? (
          <div className="flex justify-center py-14"><Spinner /></div>
        ) : data.error ? (
          <p className="text-rose-400 text-sm p-5">{data.error}</p>
        ) : data.threads.length === 0 ? (
          <div className="py-14 text-center">
            <InboxIcon size={28} className="mx-auto text-white/15 mb-2" />
            <p className="text-white/40 text-sm">No replies here yet.</p>
            <p className="text-white/25 text-xs mt-1">When someone answers one of your emails it shows up here.</p>
          </div>
        ) : (
          data.threads.map((t) => {
            const c = t.contact || {};
            const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || t.from;
            return (
              <button key={t._id} onClick={() => setOpenId(t.contactId)} className="w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] cursor-pointer">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${t.unread ? "bg-emerald-400" : "bg-transparent"}`} />
                <div className="w-9 h-9 rounded-lg bg-white/[0.07] flex items-center justify-center text-sm font-black text-white/50 shrink-0">{(name[0] || "?").toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm truncate ${t.unread ? "text-white font-bold" : "text-white/75"}`}>{name}</span>
                    {c.company && <span className="text-white/30 text-xs truncate">{c.company}</span>}
                    <Pill map={REPLY_CATS} value={t.autoReply ? "out_of_office" : t.category} />
                    {t.count > 1 && <span className="text-white/30 text-[10px]">{t.count} messages</span>}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${t.unread ? "text-white/70" : "text-white/40"}`}>{t.subject}</p>
                  <p className="text-white/30 text-xs truncate">{(t.body || "").slice(0, 160)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white/35 text-[11px]">{when(t.receivedAt)}</p>
                  {t.campaign && <p className="text-white/25 text-[10px] mt-0.5 max-w-[140px] truncate">{t.campaign.name}</p>}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// One person's whole conversation: our emails (with opens/clicks), their replies, our answers.
export function Conversation({ contactId, onBack }) {
  const [data, setData] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef(null);

  const load = useCallback(async () => {
    try { setData(await api(`/inbox/contact/${contactId}`)); } catch (e) { setErr(e.message); }
  }, [contactId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [data]);

  async function send() {
    if (!text.trim()) return;
    setSending(true); setErr("");
    try {
      await api(`/inbox/contact/${contactId}/respond`, { method: "POST", body: JSON.stringify({ text }) });
      setText("");
      await load();
    } catch (e) { setErr(e.message); }
    finally { setSending(false); }
  }

  async function setCategory(id, category) {
    await api(`/inbox/${id}`, { method: "PATCH", body: JSON.stringify({ category }) });
    load();
  }
  async function setStage(stage) {
    await api(`/contacts/${contactId}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) });
    load();
  }

  if (!data) return <div className="flex justify-center py-20">{err ? <p className="text-rose-400 text-sm">{err}</p> : <Spinner />}</div>;
  const c = data.contact;
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email;
  const hasReply = data.messages.some((m) => m.kind === "reply");

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-sm cursor-pointer"><ArrowLeft size={14} /> Back</button>

      <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-lg font-black text-emerald-300">{(name[0] || "?").toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold">{name}</p>
          <p className="text-white/40 text-xs">{c.email}{c.company ? ` · ${c.company}` : ""}{c.title ? ` · ${c.title}` : ""}</p>
        </div>
        <label className="text-xs text-white/40 flex items-center gap-2">
          Stage
          <select value={c.stage || "new"} onChange={(e) => setStage(e.target.value)} className="bg-white/[0.06] border border-white/[0.1] text-white text-xs rounded-lg px-2 py-1.5 cursor-pointer">
            {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k} className="bg-[#0B2D22]">{v.label}</option>)}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        {data.messages.map((m) => <Bubble key={m._id} m={m} onCategory={setCategory} />)}
        <div ref={endRef} />
      </div>

      {hasReply ? (
        <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl p-3 space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={`Write your answer to ${c.firstName || "them"}… It's sent from the same mailbox, in the same email thread.`} className="w-full bg-transparent text-white text-sm placeholder:text-white/25 resize-y outline-none" />
          {err && <p className="text-rose-400 text-xs">{err}</p>}
          <div className="flex justify-end">
            <button onClick={send} disabled={sending || !text.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer disabled:opacity-40">
              {sending ? <Spinner small /> : <Send size={14} />} Send answer
            </button>
          </div>
        </div>
      ) : (
        <p className="text-white/30 text-xs text-center">No reply from {c.firstName || "this person"} yet — you can answer once they reply.</p>
      )}
    </div>
  );
}

function Bubble({ m, onCategory }) {
  const ours = m.kind !== "reply";
  const head =
    m.kind === "sent" ? `${m.campaign || "Campaign"} · step ${m.stepIndex + 1}${m.variant === "B" ? " · version B" : ""}` :
    m.kind === "answer" ? `Your answer${m.sentBy ? ` (${m.sentBy})` : ""}` :
    m.from;
  return (
    <div className={`flex ${ours ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 border ${ours ? "bg-emerald-500/[0.07] border-emerald-500/15" : "bg-white/[0.04] border-white/[0.08]"}`}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {m.kind === "sent" ? <Mail size={12} className="text-emerald-300/70" /> : null}
          <span className="text-white/50 text-[11px] font-semibold">{head}</span>
          <span className="text-white/25 text-[11px]">{when(m.at)}</span>
          {m.kind === "reply" && (
            <select value={m.autoReply ? "out_of_office" : m.category || "other"} onChange={(e) => onCategory(m._id, e.target.value)} title="Change how this reply is sorted" className="bg-white/[0.06] border border-white/[0.1] text-white/70 text-[10px] rounded-md px-1.5 py-0.5 cursor-pointer">
              {Object.entries(REPLY_CATS).map(([k, v]) => <option key={k} value={k} className="bg-[#0B2D22]">{v.label}</option>)}
            </select>
          )}
        </div>
        {m.subject && <p className="text-white/80 text-sm font-semibold mb-1">{m.subject}</p>}
        <p className="text-white/70 text-sm whitespace-pre-wrap break-words">{m.body}</p>
        {m.kind === "sent" && (
          <div className="flex gap-3 mt-2 text-[11px]">
            {m.status === "bounced" ? (
              <span className="flex items-center gap-1 text-orange-300"><AlertCircle size={11} /> Bounced{m.bounceReason ? `: ${m.bounceReason}` : ""}</span>
            ) : (
              <>
                <span className="text-blue-300/80">✓ Delivered</span>
                <span className={`flex items-center gap-1 ${m.opens ? "text-cyan-300" : "text-white/25"}`}><Eye size={11} /> {m.opens ? `Opened ${m.opens}×` : "Not opened"}</span>
                <span className={`flex items-center gap-1 ${m.clicks ? "text-indigo-300" : "text-white/25"}`}><MousePointerClick size={11} /> {m.clicks ? `Clicked ${m.clicks}×` : "No clicks"}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
