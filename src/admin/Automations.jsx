import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

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

  const toggleAutomation = async (type, newVal) => {
    // Optimistic update — flip immediately so the toggle feels instant
    setSettings(prev => prev.map(s => s.key === type ? { ...s, enabled: newVal } : s));
    setSavingKey(type);
    try {
      await axios.patch(`${API}/automations/settings/${type}`, { enabled: newVal });
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

      {/* Queue / History Tabs */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="border-b border-zinc-100 px-4 sm:px-6 flex gap-1 pt-2">
          {[
            { key: "queue",   label: "Queue",   count: queue.length },
            { key: "history", label: "History", count: history.length },
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
      </div>
    </div>
  );
}
