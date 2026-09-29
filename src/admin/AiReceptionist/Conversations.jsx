import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Send, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { aiApi } from "./api";
import { Bubble } from "./ChatParts";
import { timeLabel } from "./format";

const POLL_MS = 5000;

const STATUS = {
  ai: { label: "AI replying", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  human: { label: "Staff handling", cls: "bg-sky-500/15 text-sky-400 border-sky-500/25" },
  closed: { label: "Closed", cls: "bg-white/5 text-white/40 border-white/10" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "human", label: "Staff handling" },
];

export default function AiConversations() {
  const [list, setList] = useState([]);
  const [listError, setListError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tick, setTick] = useState(0);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const bottomRef = useRef(null);
  const lastCount = useRef(0);

  // Refresh every few seconds so new messages appear without reloading.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (filter === "attention") params.set("attention", "1");
    if (filter === "human") params.set("status", "human");
    if (search.trim()) params.set("q", search.trim());
    aiApi(`/conversations?${params}`)
      .then((d) => { if (active) { setList(d); setListError(""); } })
      .catch((e) => { if (active) setListError(e.message); });
    return () => { active = false; };
  }, [filter, search, tick]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let active = true;
    aiApi(`/conversations/${selectedId}`)
      .then((d) => { if (active) setDetail(d); })
      .catch((e) => { if (active) setActionError(e.message); });
    return () => { active = false; };
  }, [selectedId, tick]);

  // Scroll to the newest message when new ones arrive.
  useEffect(() => {
    const count = detail?.messages?.length || 0;
    if (count !== lastCount.current) {
      lastCount.current = count;
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [detail]);

  const open = (id) => {
    setSelectedId(id);
    setDetail(null);
    setReply("");
    setActionError("");
    lastCount.current = 0;
  };

  const setStatus = async (status) => {
    setBusy(true);
    setActionError("");
    try {
      const conversation = await aiApi(`/conversations/${selectedId}/status`, { method: "POST", body: { status } });
      setDetail((d) => (d ? { ...d, conversation } : d));
      setTick((t) => t + 1);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    setActionError("");
    try {
      await aiApi(`/conversations/${selectedId}/reply`, { method: "POST", body: { text: reply } });
      setReply("");
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const conv = detail?.conversation;

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-4 lg:h-[calc(100vh-260px)] min-h-[520px]">
      {/* List */}
      <div className={`bg-[#0B2D22] border border-white/7 rounded-2xl flex flex-col min-h-0 ${selectedId ? "hidden lg:flex" : "flex"}`}>
        <div className="p-3 space-y-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or number"
              className="w-full pl-9 pr-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filter === f.key ? "bg-emerald-500 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
          {listError && <p className="p-4 text-sm text-rose-300">{listError}</p>}
          {!listError && list.length === 0 && (
            <p className="p-6 text-center text-sm text-white/40">No WhatsApp conversations yet.</p>
          )}
          {list.map((c) => (
            <button
              key={c._id}
              onClick={() => open(c._id)}
              className={`w-full text-left px-4 py-3 transition-colors ${selectedId === c._id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white truncate flex-1">{c.name || c.phone}</p>
                <span className="text-[10px] text-white/35 shrink-0">{timeLabel(c.lastMessageAt)}</span>
              </div>
              {c.name && <p className="text-[11px] text-white/35">{c.phone}</p>}
              <p className="text-xs text-white/50 truncate mt-0.5">{c.lastMessagePreview}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${STATUS[c.status]?.cls}`}>
                  {STATUS[c.status]?.label}
                </span>
                {c.needsAttention && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase bg-amber-500/15 text-amber-400 border-amber-500/25">
                    Needs attention
                  </span>
                )}
                {c.unreadCount > 0 && (
                  <span className="ml-auto text-[10px] font-black bg-emerald-500 text-white rounded-full px-1.5 min-w-[18px] text-center">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className={`bg-[#0B2D22] border border-white/7 rounded-2xl flex flex-col min-h-0 ${selectedId ? "flex" : "hidden lg:flex"}`}>
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-white/40 p-6 text-center">
            Pick a conversation to see what the customer and the AI said.
          </div>
        ) : !conv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-white/[0.06] flex flex-wrap items-center gap-3">
              <button onClick={() => setSelectedId(null)} className="lg:hidden text-white/50 hover:text-white">
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{conv.name || conv.phone}</p>
                <p className="text-[11px] text-white/40">
                  {conv.phone} · {STATUS[conv.status]?.label}
                </p>
              </div>
              <div className="flex gap-2">
                {conv.status !== "human" && (
                  <button disabled={busy} onClick={() => setStatus("human")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25 hover:bg-sky-500/25 disabled:opacity-50">
                    Take over
                  </button>
                )}
                {conv.status !== "ai" && (
                  <button disabled={busy} onClick={() => setStatus("ai")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 disabled:opacity-50">
                    Hand back to AI
                  </button>
                )}
                {conv.status !== "closed" && (
                  <button disabled={busy} onClick={() => setStatus("closed")} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/40 border border-white/10 hover:text-white disabled:opacity-50">
                    Close
                  </button>
                )}
              </div>
            </div>

            {conv.needsAttention && (
              <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertTriangle size={14} /> The AI couldn't help or hit a limit here. Reply yourself, or hand back to the AI.
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {detail.messages.map((m) => (
                <Bubble
                  key={m._id}
                  role={m.role}
                  text={m.text}
                  at={m.createdAt}
                  tools={m.tools}
                  footer={
                    m.deliveryStatus === "failed" ? (
                      <p className="mt-1.5 text-[11px] text-rose-300 flex items-center gap-1">
                        <XCircle size={11} /> Not delivered: {m.error}
                      </p>
                    ) : m.deliveryStatus === "sent" && m.role !== "customer" ? (
                      <p className="mt-1 text-[10px] text-white/30 flex items-center gap-1 justify-end">
                        <CheckCircle2 size={10} /> Sent
                      </p>
                    ) : null
                  }
                />
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendReply} className="p-3 border-t border-white/[0.06]">
              {actionError && <p className="text-xs text-rose-300 mb-2">{actionError}</p>}
              {conv.replyWindowOpen ? (
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={conv.status === "ai" ? "Reply as staff (this takes the chat over from the AI)" : "Reply as staff"}
                    className="flex-1 px-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                  <button type="submit" disabled={busy || !reply.trim()} className="self-end px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center gap-1.5">
                    <Send size={14} /> Send
                  </button>
                </div>
              ) : (
                <p className="text-xs text-white/40 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
                  WhatsApp only allows replies within 24 hours of the customer's last message. This window has closed, so you
                  can reply once the customer messages again.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
