import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, Users, Inbox, ShieldOff, BarChart2 } from "lucide-react";
import Mailboxes from "./Mailboxes";
import Contacts from "./Contacts";
import Campaigns from "./Campaigns";
import Suppression from "./Suppression";

const API = import.meta.env.VITE_API_URL;

const TABS = [
  { id: "campaigns",   label: "Campaigns",   icon: Mail },
  { id: "contacts",    label: "Contacts",     icon: Users },
  { id: "mailboxes",   label: "Mailboxes",    icon: Inbox },
  { id: "suppression", label: "Suppression",  icon: ShieldOff },
];

export default function ColdEmail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "campaigns";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(searchParams.get("connected") === "1");
  const [oauthError, setOauthError] = useState(searchParams.get("error") || "");

  useEffect(() => {
    // Clean URL params after reading
    if (searchParams.get("connected") || searchParams.get("error")) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, []);

  useEffect(() => {
    fetch(`${API}/cold-email/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [activeTab]);

  function switchTab(id) {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Mail size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Cold Email</h1>
            <p className="text-white/40 text-sm mt-0.5">Automated outreach campaigns — connect mailboxes, import contacts, build sequences</p>
          </div>
        </div>
      </div>

      {/* ── OAuth feedback banners ─────────────────────────────────── */}
      {connected && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-emerald-400 text-sm font-semibold">Gmail account connected successfully!</p>
          <button onClick={() => setConnected(false)} className="ml-auto text-emerald-400/60 hover:text-emerald-400 text-lg leading-none cursor-pointer">×</button>
        </div>
      )}
      {oauthError && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <span className="text-rose-400 text-sm font-semibold">OAuth error: {oauthError}. Please try again.</span>
          <button onClick={() => setOauthError("")} className="ml-auto text-rose-400/60 hover:text-rose-400 text-lg leading-none cursor-pointer">×</button>
        </div>
      )}

      {/* ── Overview Stats ─────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Sent",     value: stats.totalSent,      icon: "✉",  color: "emerald" },
            { label: "Replies",        value: stats.totalReplied,   icon: "💬", color: "blue"    },
            { label: "Contacts",       value: stats.activeContacts, icon: "👥", color: "purple"  },
            { label: "Active Mailboxes", value: stats.totalMailboxes, icon: "📬", color: "amber" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-[#0B2D22] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                color === "emerald" ? "bg-emerald-500/15" :
                color === "blue"   ? "bg-blue-500/15"    :
                color === "purple" ? "bg-purple-500/15"  :
                                     "bg-amber-500/15"
              }`}>{icon}</div>
              <div>
                <p className="text-white font-black text-xl leading-none">{(value || 0).toLocaleString()}</p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Bar ────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
              activeTab === id
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────── */}
      <div>
        {activeTab === "campaigns"   && <Campaigns   onStatsChange={() => {}} />}
        {activeTab === "contacts"    && <Contacts    />}
        {activeTab === "mailboxes"   && <Mailboxes   />}
        {activeTab === "suppression" && <Suppression />}
      </div>
    </div>
  );
}
