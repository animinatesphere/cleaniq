import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, PhoneCall, BookOpen, UserRound, RefreshCw, CheckCircle2, Circle } from "lucide-react";
import { aiApi } from "./api";

function StatCard({ icon: Icon, label, value, sub, tone = "text-white" }) {
  return (
    <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-wider">
        <Icon size={14} />
        {label}
      </div>
      <p className={`text-3xl font-black mt-3 ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

function ChannelBadge({ on }) {
  return on ? (
    <span className="text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase bg-emerald-500/15 text-emerald-400 border-emerald-500/25">AI on</span>
  ) : (
    <span className="text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase bg-white/5 text-white/40 border-white/10">AI off</span>
  );
}

export default function AiOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    aiApi("/overview")
      .then((d) => { if (active) { setError(""); setData(d); } })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [reloadKey]);

  if (error) {
    return <div className="bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-2xl p-4 text-sm">{error}</div>;
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const checklist = [
    { done: data.knowledgeCount > 0, label: "Add business information (hours, areas, policies)", to: "/admin/ai/knowledge" },
    { done: data.transferNumberSet, label: "Set the phone number calls transfer to", to: "/admin/ai/settings" },
    { done: false, label: "Connect WhatsApp (Meta WhatsApp Cloud API)", note: "Next step" },
    { done: false, label: "Connect the phone line (Twilio)", note: "Later step" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageCircle} label="Open chats" value={data.conversations} sub={<ChannelBadge on={data.whatsappEnabled} />} />
        <StatCard
          icon={UserRound}
          label="Need a human"
          value={data.needsHuman}
          tone={data.needsHuman ? "text-amber-400" : "text-white"}
          sub="Chats staff have taken over"
        />
        <StatCard icon={PhoneCall} label="Calls today" value={data.callsToday} sub={<ChannelBadge on={data.voiceEnabled} />} />
        <StatCard icon={BookOpen} label="Knowledge entries" value={data.knowledgeCount} sub="Active entries the AI can use" />
      </div>

      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.04]">
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">Setup checklist</h2>
          <button onClick={() => setReloadKey((k) => k + 1)} className="text-white/40 hover:text-white transition-colors" title="Refresh">
            <RefreshCw size={13} />
          </button>
        </div>
        <ul className="divide-y divide-white/[0.04]">
          {checklist.map((item) => (
            <li key={item.label} className="px-6 py-4 flex items-center gap-3">
              {item.done ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              ) : (
                <Circle size={18} className="text-white/20 shrink-0" />
              )}
              <span className={`text-sm flex-1 ${item.done ? "text-white/50 line-through" : "text-white/85"}`}>{item.label}</span>
              {item.to && !item.done && (
                <Link to={item.to} className="text-xs font-bold text-emerald-400 hover:text-emerald-300">Set up →</Link>
              )}
              {item.note && <span className="text-[10px] font-black uppercase tracking-wider text-white/30">{item.note}</span>}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-white/35">
        Prices are taken live from <Link to="/admin/services" className="text-emerald-400 hover:underline">Services</Link> (UK only), so
        the AI always quotes your current rates.
      </p>
    </div>
  );
}
