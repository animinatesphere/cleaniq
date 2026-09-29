import { useState, useEffect } from "react";
import { PhoneCall, PhoneForwarded, ArrowLeft, Clock } from "lucide-react";
import { aiApi } from "./api";
import { Bubble } from "./ChatParts";
import { timeLabel } from "./format";

const POLL_MS = 5000;

function duration(call) {
  if (!call.endedAt) return "In progress";
  const secs = Math.max(0, Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000));
  return `${Math.floor(secs / 60)}m ${String(secs % 60).padStart(2, "0")}s`;
}

export default function AiCalls() {
  const [calls, setCalls] = useState([]);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [call, setCall] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    aiApi("/calls")
      .then((d) => { if (active) { setCalls(d); setError(""); } })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [tick]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let active = true;
    aiApi(`/calls/${selectedId}`)
      .then((d) => { if (active) setCall(d); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [selectedId, tick]);

  const open = (id) => {
    setSelectedId(id);
    setCall(null);
  };

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-4 lg:h-[calc(100vh-260px)] min-h-[520px]">
      <div className={`bg-[#0B2D22] border border-white/7 rounded-2xl flex flex-col min-h-0 ${selectedId ? "hidden lg:flex" : "flex"}`}>
        <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white/40 uppercase tracking-widest">
          Recent calls
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
          {error && <p className="p-4 text-sm text-rose-300">{error}</p>}
          {!error && calls.length === 0 && <p className="p-6 text-center text-sm text-white/40">No calls yet.</p>}
          {calls.map((c) => (
            <button
              key={c._id}
              onClick={() => open(c._id)}
              className={`w-full text-left px-4 py-3 transition-colors ${selectedId === c._id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
            >
              <div className="flex items-center gap-2">
                {c.transferred ? <PhoneForwarded size={14} className="text-sky-400 shrink-0" /> : <PhoneCall size={14} className="text-emerald-400 shrink-0" />}
                <p className="text-sm font-bold text-white truncate flex-1">{c.customerName || c.phone || "Unknown caller"}</p>
                <span className="text-[10px] text-white/35 shrink-0">{timeLabel(c.startedAt)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40">
                <Clock size={11} /> {duration(c)}
                {c.transferred && <span className="text-sky-400 font-bold">· Transferred</span>}
                {c.endReason && !c.transferred && <span>· {c.endReason}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`bg-[#0B2D22] border border-white/7 rounded-2xl flex flex-col min-h-0 ${selectedId ? "flex" : "hidden lg:flex"}`}>
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-white/40 p-6 text-center">
            Pick a call to read the transcript.
          </div>
        ) : !call ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
              <button onClick={() => setSelectedId(null)} className="lg:hidden text-white/50 hover:text-white">
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{call.customerName || call.phone || "Unknown caller"}</p>
                <p className="text-[11px] text-white/40">
                  {call.phone} · {new Date(call.startedAt).toLocaleString("en-GB")} · {duration(call)}
                  {call.transferred ? " · Transferred to the team" : call.endReason ? ` · ${call.endReason}` : ""}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {call.transcript.length === 0 && <p className="text-sm text-white/40">No transcript.</p>}
              {call.transcript.map((t, i) => (
                <Bubble key={i} role={t.role} text={t.text} at={t.at} tools={t.tools} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
