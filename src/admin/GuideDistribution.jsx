import { useState, useEffect, useCallback } from "react";
import { Send, Users, User, CheckSquare, Square, Search, BookOpen, ChevronDown } from "lucide-react";

const TABS = [
  { id: "worker", label: "Worker Guide", icon: Users, description: "Send the Worker App Guide to staff members" },
  { id: "customer", label: "Customer Guide", icon: User, description: "Send the Customer Account Guide to customers" },
];

const GuideDistribution = () => {
  const [activeTab, setActiveTab] = useState("worker");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);

  const fetchPeople = useCallback(async (type) => {
    setLoading(true);
    setPeople([]);
    setSelected(new Set());
    setResult(null);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/guides/${type === "worker" ? "workers" : "customers"}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setPeople(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople(activeTab);
  }, [activeTab, fetchPeople]);

  const filtered = people.filter((p) => {
    const q = search.toLowerCase();
    const name = (p.name || `${p.firstName || ""} ${p.lastName || ""}`).toLowerCase();
    return name.includes(q) || (p.email || "").toLowerCase().includes(q);
  });

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p._id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filtered.forEach((p) => next.delete(p._id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((p) => next.add(p._id));
      setSelected(next);
    }
  };

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const send = async () => {
    if (selected.size === 0) return;
    setSending(true);
    setResult(null);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const recipients = people
        .filter((p) => selected.has(p._id))
        .map((p) => ({
          name: p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
          email: p.email,
        }));

      const res = await fetch(`${import.meta.env.VITE_API_URL}/guides/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: activeTab, recipients }),
      });
      const data = await res.json();
      setResult(data);
      setSelected(new Set());
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSending(false);
    }
  };

  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <BookOpen size={24} className="text-emerald-400" />
            Guide Distribution
          </h1>
          <p className="text-white/40 text-sm font-medium mt-1">
            Send app guides to workers and customers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === t.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/[0.06]"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Info bar */}
      <div className="bg-[#0B2D22] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">{tab.description}</p>
          <p className="text-white/40 text-xs mt-0.5">
            Recipients receive a professional guide email with a link to the full PDF-ready guide
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-emerald-400 font-black text-lg leading-none">{selected.size}</p>
          <p className="text-white/30 text-xs mt-0.5">selected</p>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          result.error ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
            : result.failed > 0 ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
        }`}>
          {result.error ? (
            <span className="text-sm font-bold">Error: {result.error}</span>
          ) : (
            <span className="text-sm font-bold">
              ✅ {result.sent} guide{result.sent !== 1 ? "s" : ""} sent successfully
              {result.failed > 0 && ` · ⚠️ ${result.failed} failed`}
            </span>
          )}
        </div>
      )}

      {/* Main panel */}
      <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40"
            />
          </div>

          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.07] text-white/60 hover:text-white/90 hover:bg-white/[0.08] text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            {allSelected ? <CheckSquare size={14} className="text-emerald-400" /> : <Square size={14} />}
            {allSelected ? "Deselect All" : "Select All"}
          </button>

          <button
            onClick={send}
            disabled={selected.size === 0 || sending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 whitespace-nowrap"
          >
            <Send size={14} />
            {sending ? "Sending…" : `Send to ${selected.size || "…"}`}
          </button>
        </div>

        {/* List */}
        <div className="max-h-[480px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-white/30 text-sm font-medium">
                {search ? "No results match your search" : `No ${activeTab === "worker" ? "workers" : "customers"} found`}
              </p>
            </div>
          ) : (
            filtered.map((person) => {
              const name = person.name || `${person.firstName || ""} ${person.lastName || ""}`.trim();
              const isSelected = selected.has(person._id);
              return (
                <div
                  key={person._id}
                  onClick={() => toggle(person._id)}
                  className={`flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] cursor-pointer transition-all ${
                    isSelected ? "bg-emerald-500/[0.08]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                  }`}>
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                    isSelected ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-white/40"
                  }`}>
                    {name.charAt(0).toUpperCase() || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 font-semibold text-sm truncate">{name || "—"}</p>
                    <p className="text-white/35 text-xs truncate">{person.email || "No email"}</p>
                  </div>

                  {person.status && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      person.status === "Active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-white/[0.06] text-white/30"
                    }`}>
                      {person.status}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.06] flex justify-between items-center">
            <p className="text-white/30 text-xs">
              {filtered.length} {activeTab === "worker" ? "worker" : "customer"}{filtered.length !== 1 ? "s" : ""}
              {search && " match your search"}
            </p>
            {selected.size > 0 && (
              <p className="text-emerald-400 text-xs font-bold">
                {selected.size} selected
              </p>
            )}
          </div>
        )}
      </div>

      {/* Help note */}
      <div className="bg-[#0B2D22]/50 border border-white/[0.04] rounded-xl p-4">
        <p className="text-white/40 text-xs leading-relaxed">
          <span className="text-white/60 font-semibold">How it works: </span>
          Select the people you want to send the guide to, then click "Send". Each recipient receives a professional email with a link to the full app guide, which they can read online or save as a PDF (File → Print → Save as PDF).
          {" "}To update the guide link, set the <code className="text-emerald-400">WORKER_GUIDE_URL</code> or <code className="text-emerald-400">CUSTOMER_GUIDE_URL</code> environment variable on the server.
        </p>
      </div>
    </div>
  );
};

export default GuideDistribution;
