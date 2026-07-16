import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, Users, Mail, MailX, CheckCircle2, XCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TYPE_LABELS = {
  booking_reminder_24h:  "Booking Reminder — 24h before",
  booking_reminder_3h:   "Booking Reminder — 3h before",
  review_request_2h:     "Review Request — 2h after job",
  referral_offer_48h:    "Referral Offer — 48h after job",
  rebooking_discount_3d: "Re-booking Discount — 3 days after",
  quote_followup_24h:    "Quote Follow-up — 24 hours",
  quote_followup_3d:     "Quote Follow-up — 3 days",
  lost_lead_7d:          "Lost Lead Win-back — 7 days",
};

const CATEGORY_LABELS = {
  booking:       "Booking Reminders",
  after_service: "After Service",
  quote:         "Quote & Lead",
};

const CATEGORY_COLORS = {
  booking:       { dot: "bg-blue-500",  badge: "bg-blue-50 text-blue-700 border-blue-200" },
  after_service: { dot: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200" },
  quote:         { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
};

const STATUS_STYLES = {
  pending:   "bg-blue-50 text-blue-700 border-blue-200",
  sent:      "bg-green-50 text-green-700 border-green-200",
  failed:    "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Toggle({ checked, onChange, saving }) {
  return (
    <button
      type="button"
      onClick={() => !saving && onChange(!checked)}
      aria-checked={checked}
      role="switch"
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
        checked ? "bg-zinc-900" : "bg-zinc-300"
      } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function Automations() {
  const [settings, setSettings]       = useState([]);
  const [stats, setStats]             = useState({ pending: 0, sentToday: 0, failed: 0, totalSent: 0 });
  const [queue, setQueue]             = useState([]);
  const [history, setHistory]         = useState([]);
  const [tab, setTab]                 = useState("queue");
  const [savingKey, setSavingKey]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast]             = useState(null);

  // Audience tab state
  const [customers, setCustomers]           = useState([]);
  const [audienceSearch, setAudienceSearch] = useState("");
  const [togglingId, setTogglingId]         = useState(null);
  const [audienceFilter, setAudienceFilter] = useState("all"); // "all" | "enabled" | "disabled"

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, stRes, qRes, hRes] = await Promise.all([
        axios.get(`${API}/automations/settings`),
        axios.get(`${API}/automations/stats`),
        axios.get(`${API}/automations/queue`),
        axios.get(`${API}/automations/history`),
      ]);
      setSettings(sRes.data || []);
      setStats(stRes.data || {});
      setQueue(qRes.data || []);
      setHistory(hRes.data?.tasks || []);
    } catch {
      showToast("Failed to load automation data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch customers for audience tab (lazy — only when tab is opened)
  useEffect(() => {
    if (tab === "audience" && customers.length === 0) {
      axios.get(`${API}/customers`).then(r => setCustomers(r.data || [])).catch(() => {});
    }
  }, [tab]);

  const toggleAutomation = async (type, newVal) => {
    // Optimistic update — flip immediately so the toggle feels instant
    setSettings(prev => prev.map(s => s.key === type ? { ...s, enabled: newVal } : s));
    setSavingKey(type);
    try {
      await axios.post(`${API}/automations/settings/${type}`, { enabled: newVal });
    } catch {
      // Revert on failure
      setSettings(prev => prev.map(s => s.key === type ? { ...s, enabled: !newVal } : s));
      showToast("Failed to save — please try again");
    } finally {
      setSavingKey(null);
    }
  };

  const cancelTask = async (id) => {
    setCancellingId(id);
    try {
      await axios.delete(`${API}/automations/queue/${id}`);
      setQueue(prev => prev.filter(t => t._id !== id));
      setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
    } catch {
      showToast("Failed to cancel task");
    } finally {
      setCancellingId(null);
    }
  };

  const toggleCrmEmails = async (customer) => {
    const newVal = !customer.crmEmailsEnabled;
    setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, crmEmailsEnabled: newVal } : c));
    setTogglingId(customer._id);
    try {
      await axios.patch(`${API}/customers/${customer._id}/crm-emails`, { enabled: newVal });
    } catch {
      setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, crmEmailsEnabled: !newVal } : c));
      showToast("Failed to update — please try again");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = audienceSearch.toLowerCase();
    const matchSearch = !q ||
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q);
    const matchFilter =
      audienceFilter === "all" ? true :
      audienceFilter === "enabled" ? c.crmEmailsEnabled !== false :
      c.crmEmailsEnabled === false;
    return matchSearch && matchFilter;
  });

  const grouped = settings.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Automation Engine</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Automated emails that fire at the right moment — reminders, follow-ups, reviews, win-backs.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending",    val: stats.pending,   color: "text-blue-600",  bg: "bg-blue-50" },
          { label: "Sent Today", val: stats.sentToday, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Sent", val: stats.totalSent, color: "text-zinc-900",  bg: "bg-zinc-50" },
          { label: "Failed",     val: stats.failed,    color: "text-red-600",   bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 border border-zinc-100`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val ?? 0}</p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Automation Toggles */}
      <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Automation Settings</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Toggle individual automations on or off. Changes take effect immediately.</p>
        </div>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div className="px-4 sm:px-6 py-2.5 bg-zinc-50">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[cat]?.badge}`}>
                {CATEGORY_LABELS[cat] || cat}
              </span>
            </div>
            {items.map(item => (
              <div key={item.key} className="px-4 sm:px-6 py-4 flex items-center gap-3 hover:bg-zinc-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.enabled ? CATEGORY_COLORS[cat]?.dot : "bg-zinc-300"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 leading-tight">{item.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {savingKey === item.key ? "Saving…" : item.enabled ? "Active" : "Disabled"}
                  </p>
                </div>
                <Toggle
                  checked={item.enabled}
                  onChange={(v) => toggleAutomation(item.key, v)}
                  saving={savingKey === item.key}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Queue / History / Audience Tabs */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="border-b border-zinc-100 px-4 sm:px-6 flex gap-1 pt-2">
          {[
            { key: "queue",    label: "Queue",    count: queue.length },
            { key: "history",  label: "History",  count: history.length },
            { key: "audience", label: "Audience", count: customers.length || null },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.key ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                }`}>{t.count}</span>
              )}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={fetchAll} className="text-xs text-zinc-400 hover:text-zinc-700 px-3 py-2 transition-colors">
            Refresh
          </button>
        </div>

        {tab === "queue" && (
          queue.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-medium text-sm">No pending automations</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {queue.map(task => (
                <div key={task._id} className="px-4 sm:px-6 py-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-800">
                        {TYPE_LABELS[task.type] || task.type}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[task.status]}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 break-all">
                      {task.payload?.email}
                      {task.payload?.firstName && ` · ${task.payload.firstName}`}
                      {task.payload?.bookingRef && ` · ${task.payload.bookingRef}`}
                      {task.payload?.quoteRef && ` · Quote: ${task.payload.quoteRef}`}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium mt-1">{fmtDate(task.runAt)}</p>
                  </div>
                  <button
                    onClick={() => cancelTask(task._id)}
                    disabled={cancellingId === task._id}
                    className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    {cancellingId === task._id ? "…" : "Cancel"}
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "history" && (
          history.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <div className="text-3xl mb-2">📭</div>
              <p className="font-medium text-sm">No automation history yet</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {history.map(task => (
                <div key={task._id} className="px-4 sm:px-6 py-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-800">
                        {TYPE_LABELS[task.type] || task.type}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[task.status]}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 break-all">
                      {task.payload?.email}
                      {task.payload?.bookingRef && ` · ${task.payload.bookingRef}`}
                      {task.payload?.quoteRef && ` · Quote: ${task.payload.quoteRef}`}
                    </p>
                    {task.error && <p className="text-xs text-red-500 mt-0.5">{task.error}</p>}
                    <p className="text-xs text-zinc-500 font-medium mt-1">{fmtDate(task.executedAt || task.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "audience" && (
          <div>
            {/* Audience header */}
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-100">
              <p className="text-xs text-zinc-500 mb-3">
                Control which customers receive CRM automation emails. Disable individuals to permanently stop all automated emails for them.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={audienceSearch}
                    onChange={e => setAudienceSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex gap-1.5">
                  {[
                    { key: "all",      label: "All" },
                    { key: "enabled",  label: "Receiving" },
                    { key: "disabled", label: "Opted Out" },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setAudienceFilter(f.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        audienceFilter === f.key
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-green-500" />
                  <span className="text-xs font-bold text-zinc-600">
                    {customers.filter(c => c.crmEmailsEnabled !== false).length} receiving
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle size={13} className="text-red-400" />
                  <span className="text-xs font-bold text-zinc-600">
                    {customers.filter(c => c.crmEmailsEnabled === false).length} opted out
                  </span>
                </div>
              </div>
            </div>

            {/* Customer list */}
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="font-medium text-sm">No customers found</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50 max-h-[520px] overflow-y-auto">
                {filteredCustomers.map(c => {
                  const enabled = c.crmEmailsEnabled !== false;
                  const saving  = togglingId === c._id;
                  return (
                    <div
                      key={c._id}
                      className="px-4 sm:px-6 py-3.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${enabled ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-400"}`}>
                        {c.firstName?.[0]}{c.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-800 leading-tight">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">{c.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {enabled ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                            <Mail size={10} /> Receiving
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                            <MailX size={10} /> Opted Out
                          </span>
                        )}
                        <Toggle
                          checked={enabled}
                          onChange={() => !saving && toggleCrmEmails(c)}
                          saving={saving}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
