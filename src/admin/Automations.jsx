import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search,
  Users,
  Mail,
  MailX,
  CheckCircle2,
  XCircle,
  Save,
  UserCheck,
  UserX,
  RefreshCw,
  Send,
  RotateCcw,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings2,
  Clock,
  Zap,
  Bell,
  Star,
  Gift,
  Calendar,
  AlertCircle,
  Filter,
  Trash2,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TYPE_META = {
  booking_reminder_24h: {
    label: "Booking Reminder — 24h before",
    icon: "📅",
    category: "booking",
    delay: "24h before booking",
    trigger: "booking_created",
  },
  booking_reminder_3h: {
    label: "Booking Reminder — 3h before",
    icon: "⏰",
    category: "booking",
    delay: "3h before booking",
    trigger: "booking_created",
  },
  review_request_2h: {
    label: "Review Request — 2h after job",
    icon: "⭐",
    category: "after_service",
    delay: "2h after job done",
    trigger: "booking_completed",
  },
  referral_offer_48h: {
    label: "Referral Offer — 48h after job",
    icon: "🎁",
    category: "after_service",
    delay: "48h after job done",
    trigger: "booking_completed",
  },
  rebooking_discount_3d: {
    label: "Re-booking Discount — 3 days after",
    icon: "💰",
    category: "after_service",
    delay: "3 days after job done",
    trigger: "booking_completed",
  },
  quote_followup_24h: {
    label: "Quote Follow-up — 24 hours",
    icon: "📋",
    category: "quote",
    delay: "24h after quote sent",
    trigger: "quote_sent",
  },
  quote_followup_3d: {
    label: "Quote Follow-up — 3 days",
    icon: "📋",
    category: "quote",
    delay: "3 days after quote",
    trigger: "quote_sent",
  },
  lost_lead_7d: {
    label: "Lost Lead Win-back — 7 days",
    icon: "🔄",
    category: "quote",
    delay: "7 days after lost",
    trigger: "lead_lost",
  },
};

const CATEGORY_META = {
  booking: {
    label: "Booking Reminders",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/25",
  },
  after_service: {
    label: "After Service",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/25",
  },
  quote: {
    label: "Quote & Lead",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/25",
  },
};

const RECIPIENT_OPTIONS = [
  {
    value: "all",
    label: "All customers",
    desc: "Send to every customer who triggers this event",
  },
  {
    value: "opted_in",
    label: "Opted-in only",
    desc: "Only customers with email automation enabled",
  },
  {
    value: "new_only",
    label: "New customers only",
    desc: "Customers who booked for the first time",
  },
  {
    value: "repeat",
    label: "Repeat customers only",
    desc: "Customers with more than one booking",
  },
];

const AVAILABLE_TYPES = Object.entries(TYPE_META).map(([key, v]) => ({
  key,
  ...v,
}));

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Visual-only checkbox (plain div, never a button) ──────────────────────
function Tick({ checked, indeterminate }) {
  return (
    <div
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
        checked
          ? "bg-emerald-500 border-emerald-500"
          : indeterminate
            ? "border-white/30 bg-[#071D16]"
            : "border-white/20 bg-[#071D16] group-hover:border-white/35"
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {indeterminate && !checked && (
        <span className="w-2.5 h-0.5 bg-white/50 rounded-full" />
      )}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, saving }) {
  return (
    <button
      type="button"
      onClick={() => !saving && onChange(!checked)}
      aria-checked={checked}
      role="switch"
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        checked
          ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
          : "bg-[#071D16]"
      } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    sent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    failed: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    cancelled: "bg-[#071D16] text-white/40 border-white/10",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${map[status] || map.cancelled}`}
    >
      {status}
    </span>
  );
}

// ─── Automation row ───────────────────────────────────────────────────────────
function AutomationRow({ item, onToggle, onSaveRecipients, onDelete, saving }) {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState(item.recipients || "opted_in");
  const [savingRec, setSavingRec] = useState(false);

  const meta = TYPE_META[item.key] || {};
  const cat = CATEGORY_META[item.category || meta.category];

  const handleSave = async () => {
    setSavingRec(true);
    try {
      await onSaveRecipients(item.key, recipients);
    } finally {
      setSavingRec(false);
    }
  };

  const recipientLabel =
    RECIPIENT_OPTIONS.find((r) => r.value === recipients)?.label ||
    "All customers";

  return (
    <div className="border-b border-white/5 last:border-0">
      {/* Main row */}
      <div className="px-5 py-4 flex items-center gap-3 hover:bg-[#0A2A1F] transition-colors">
        <span className="text-lg shrink-0 leading-none">
          {meta.icon || "⚡"}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-white leading-tight">
              {item.label}
            </p>
            {cat && (
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color} ${cat.border}`}
              >
                {cat.label}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <p className="text-[11px] text-white/35">{meta.delay || "—"}</p>
            {item.enabled && (
              <span className="text-[10px] text-white/25">
                · {recipientLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-8 h-8 rounded-xl bg-[#071D16] flex items-center justify-center text-white/35 hover:bg-[#0F2F24] hover:text-white/60 transition-all"
          >
            {open ? <ChevronUp size={14} /> : <Settings2 size={14} />}
          </button>
          <Toggle
            checked={item.enabled}
            onChange={(v) => onToggle(item.key, v)}
            saving={saving === item.key}
          />
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="mx-4 mb-4 rounded-2xl bg-[#071E16] border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Users size={11} /> Who Receives This
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RECIPIENT_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRecipients(r.value)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    recipients === r.value
                      ? "bg-emerald-500/15 border-emerald-500/35"
                      : "bg-[#071E16] border-white/10 hover:bg-[#0F2F24]"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      recipients === r.value
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-white/20"
                    }`}
                  >
                    {recipients === r.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{r.label}</p>
                    <p className="text-[10px] text-white/35 leading-tight mt-0.5">
                      {r.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-white/35">
              <Clock size={11} />
              <span>{meta.delay || "Custom timing"}</span>
            </div>
            {meta.trigger && (
              <div className="flex items-center gap-1.5 text-[10px] text-white/35">
                <Zap size={11} />
                <span>Trigger: {meta.trigger.replace(/_/g, " ")}</span>
              </div>
            )}
            <div className="flex-1" />
            <button
              onClick={() => onDelete(item.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 text-[10px] font-black hover:bg-rose-500/20 transition-all border border-rose-500/20"
            >
              <Trash2 size={11} /> Remove
            </button>
            <button
              onClick={handleSave}
              disabled={
                savingRec || recipients === (item.recipients || "opted_in")
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-[10px] font-black hover:bg-emerald-500/25 transition-all border border-emerald-500/25 disabled:opacity-40"
            >
              {savingRec ? (
                <RefreshCw size={10} className="animate-spin" />
              ) : (
                <Save size={10} />
              )}
              {savingRec ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Automations() {
  const [settings, setSettings] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    sentToday: 0,
    failed: 0,
    totalSent: 0,
  });
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("settings");
  const [savingKey, setSavingKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Manual send
  const [manualType, setManualType] = useState("referral_offer_48h");
  const [manualSending, setManualSending] = useState(false);

  // Quick-send tray (single customer)
  const [quickSend, setQuickSend] = useState(null);
  const [quickSendType, setQuickSendType] = useState("referral_offer_48h");
  const [quickSending, setQuickSending] = useState(false);

  // Audience tab
  const [customers, setCustomers] = useState([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceSearch, setAudienceSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getCId = (c) => String(c._id || c.id || "");

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
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load automation data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const loadAudience = useCallback(async () => {
    setAudienceLoading(true);
    try {
      const r = await axios.get(`${API}/customers`);
      setCustomers(r.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load customers");
    } finally {
      setAudienceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "audience" && customers.length === 0) loadAudience();
  }, [tab]);

  // ── Automation actions ────────────────────────────────────────────────────
  const toggleAutomation = async (type, newVal) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === type ? { ...s, enabled: newVal } : s)),
    );
    setSavingKey(type);
    try {
      await axios.post(`${API}/automations/settings/${type}`, {
        enabled: newVal,
      });
      showToast(
        `${newVal ? "Enabled" : "Disabled"} — ${TYPE_META[type]?.label || type}`,
        "success",
      );
    } catch (e) {
      setSettings((prev) =>
        prev.map((s) => (s.key === type ? { ...s, enabled: !newVal } : s)),
      );
      showToast(e?.response?.data?.message || "Failed to save");
    } finally {
      setSavingKey(null);
    }
  };

  const saveRecipients = async (type, recipients) => {
    try {
      await axios.post(`${API}/automations/settings/${type}`, { recipients });
      setSettings((prev) =>
        prev.map((s) => (s.key === type ? { ...s, recipients } : s)),
      );
      showToast("Recipient settings saved", "success");
    } catch (e) {
      showToast(
        e?.response?.data?.message || "Failed to save recipient settings",
      );
      throw e;
    }
  };

  const deleteAutomation = async (type) => {
    if (!window.confirm("Remove this automation?")) return;
    try {
      await axios.delete(`${API}/automations/settings/${type}`);
      setSettings((prev) => prev.filter((s) => s.key !== type));
      showToast("Automation removed", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to remove");
    }
  };

  const cancelTask = async (id) => {
    setCancellingId(id);
    try {
      await axios.delete(`${API}/automations/queue/${id}`);
      setQueue((prev) => prev.filter((t) => t._id !== id));
      setStats((prev) => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
      showToast("Task cancelled", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  };

  const resendTask = async (task) => {
    setResendingId(task._id);
    try {
      await axios.post(`${API}/automations/resend/${task._id}`);
      showToast(`Resent to ${task.payload?.email}`, "success");
      fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to resend");
    } finally {
      setResendingId(null);
    }
  };

  const sendManual = async () => {
    if (selected.size === 0) return;
    setManualSending(true);
    const ids = [...selected];
    let ok = 0;
    for (const customerId of ids) {
      try {
        await axios.post(`${API}/automations/send-manual`, {
          type: manualType,
          customerId,
        });
        ok++;
      } catch {}
    }
    setManualSending(false);
    if (ok > 0) {
      showToast(`Sent to ${ok} customer${ok > 1 ? "s" : ""}`, "success");
      setSelected(new Set());
      fetchAll();
    } else {
      showToast("Failed to send — please try again");
    }
  };

  const doQuickSend = async () => {
    if (!quickSend) return;
    setQuickSending(true);
    try {
      await axios.post(`${API}/automations/send-manual`, {
        type: quickSendType,
        customerId: quickSend.id,
      });
      showToast(`Email sent to ${quickSend.name}`, "success");
      setQuickSend(null);
      fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to send");
    } finally {
      setQuickSending(false);
    }
  };

  // ── Audience helpers ──────────────────────────────────────────────────────
  const filteredCustomers = customers
    .filter((c) => {
      const q = audienceSearch.toLowerCase();
      const matchSearch =
        !q ||
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q);
      const enabled = c.crmEmailsEnabled !== false;
      const matchFilter =
        audienceFilter === "all"
          ? true
          : audienceFilter === "on"
            ? enabled
            : !enabled;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const aReg = !!getCId(a), bReg = !!getCId(b);
      if (aReg !== bReg) return aReg ? -1 : 1;
      const aOn = a.crmEmailsEnabled !== false, bOn = b.crmEmailsEnabled !== false;
      if (aOn !== bOn) return aOn ? -1 : 1;
      return 0;
    });

  const enabledCount = customers.filter(
    (c) => c.crmEmailsEnabled !== false,
  ).length;
  const disabledCount = customers.filter(
    (c) => c.crmEmailsEnabled === false,
  ).length;

  const registeredInView = filteredCustomers.filter((c) => !!getCId(c));
  const allSelected =
    registeredInView.length > 0 &&
    registeredInView.every((c) => selected.has(getCId(c)));
  const someSelected = registeredInView.some((c) => selected.has(getCId(c)));

  const toggleRow = (c) => {
    const cId = getCId(c);
    if (!cId) return;
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(cId) ? n.delete(cId) : n.add(cId);
      return n;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const n = new Set(prev);
        filteredCustomers.forEach((c) => n.delete(getCId(c)));
        return n;
      });
    } else {
      setSelected((prev) => {
        const n = new Set(prev);
        filteredCustomers.forEach((c) => {
          const id = getCId(c);
          if (id) n.add(id);
        });
        return n;
      });
    }
  };

  const applyBulk = async (enable) => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    const ids = [...selected];
    setCustomers((prev) =>
      prev.map((c) =>
        ids.includes(getCId(c)) ? { ...c, crmEmailsEnabled: enable } : c,
      ),
    );
    try {
      await Promise.all(
        ids.map((id) =>
          axios.patch(`${API}/customers/${id}/crm-emails`, { enabled: enable }),
        ),
      );
      showToast(
        `${enable ? "Enabled" : "Disabled"} for ${ids.length} customer${ids.length > 1 ? "s" : ""}`,
        "success",
      );
      setSelected(new Set());
    } catch (e) {
      setCustomers((prev) =>
        prev.map((c) =>
          ids.includes(getCId(c)) ? { ...c, crmEmailsEnabled: !enable } : c,
        ),
      );
      showToast(e?.response?.data?.message || "Failed to apply changes");
    } finally {
      setBulkSaving(false);
    }
  };

  const toggleSingle = async (c, enable) => {
    const cId = getCId(c);
    if (!cId) return;
    setCustomers((prev) =>
      prev.map((cu) => getCId(cu) === cId ? { ...cu, crmEmailsEnabled: enable } : cu),
    );
    try {
      await axios.patch(`${API}/customers/${cId}/crm-emails`, { enabled: enable });
      showToast(`${enable ? "Enabled" : "Excluded"} for ${c.firstName || c.email}`, "success");
    } catch (e) {
      setCustomers((prev) =>
        prev.map((cu) => getCId(cu) === cId ? { ...cu, crmEmailsEnabled: !enable } : cu),
      );
      showToast(e?.response?.data?.message || "Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TABS = [
    { key: "settings", label: "Automations", count: settings.length },
    { key: "queue", label: "Queue", count: queue.length },
    { key: "history", label: "History", count: history.length },
    { key: "audience", label: "Audience", count: customers.length || null },
  ];

  // Merge API data with full predefined list so all 8 are always visible
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s]));
  const allItems = AVAILABLE_TYPES.map((t) => ({
    key: t.key,
    label: TYPE_META[t.key]?.label || t.label,
    category: t.category,
    enabled: settingsMap[t.key]?.enabled ?? false,
    recipients: settingsMap[t.key]?.recipients ?? "opted_in",
  }));
  const groupedItems = allItems.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const selectedInView = filteredCustomers.filter((c) =>
    selected.has(getCId(c)),
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 z-50 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2.5 ${
            toast.type === "error"
              ? "bg-rose-500/90 text-white border border-rose-400/30"
              : "bg-emerald-500/90 text-white border border-emerald-400/30"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
          {toast.msg}
        </div>
      )}

      {/* Quick-send tray */}
      {quickSend && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#071E16] border-t border-emerald-500/30 shadow-2xl px-4 py-4">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white">
                Send to:{" "}
                <span className="text-emerald-400">{quickSend.name}</span>
              </p>
              <p className="text-[11px] text-white/35 truncate">
                {quickSend.email}
              </p>
            </div>
            <select
              value={quickSendType}
              onChange={(e) => setQuickSendType(e.target.value)}
              className="w-full sm:w-auto flex-1 px-3 py-2 rounded-xl bg-[#071D16] text-white text-xs font-semibold border border-white/10 focus:outline-none focus:border-emerald-500"
            >
              {Object.entries(TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.icon} {v.label}
                </option>
              ))}
            </select>
            <button
              onClick={doQuickSend}
              disabled={quickSending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-400 transition-colors disabled:opacity-60 shrink-0 shadow-sm shadow-emerald-500/25"
            >
              {quickSending ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              {quickSending ? "Sending…" : "Send Now"}
            </button>
            <button
              onClick={() => setQuickSend(null)}
              className="p-1.5 text-white/30 hover:text-white transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Automation Engine
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Automated emails that fire at the right moment — reminders,
            follow-ups, reviews, win-backs.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="w-9 h-9 rounded-xl bg-[#071D16] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-[#0F2F24] transition-all shrink-0"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Pending",
            val: stats.pending,
            color: "text-blue-400",
            icon: "⏳",
          },
          {
            label: "Sent Today",
            val: stats.sentToday,
            color: "text-emerald-400",
            icon: "✅",
          },
          {
            label: "Total Sent",
            val: stats.totalSent,
            color: "text-white",
            icon: "📨",
          },
          {
            label: "Failed",
            val: stats.failed,
            color: "text-rose-400",
            icon: "❌",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#0B2D22] border border-white/7 rounded-2xl px-4 py-3"
          >
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>
              {s.val ?? 0}
            </p>
            <p className="text-[10px] text-white/35 font-bold mt-0.5 uppercase tracking-widest">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-white/6 px-4 sm:px-6 flex gap-0.5 pt-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap ${
                tab === t.key
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-white/30 hover:text-white/60"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                    tab === t.key
                      ? "bg-emerald-500 text-white"
                      : "bg-[#0F2F24] text-white/40"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── AUTOMATIONS ── */}
        {tab === "settings" && (
          <div>
            {Object.entries(groupedItems).map(([cat, items]) => {
              const catMeta = CATEGORY_META[cat];
              return (
                <div key={cat}>
                  <div className="px-5 py-2.5 bg-[#071D16] border-b border-white/10 flex items-center gap-2.5">
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest ${catMeta?.color || "text-white/40"}`}
                    >
                      {catMeta?.label || cat}
                    </span>
                    <span className="text-[9px] text-white/20">
                      {items.filter((i) => i.enabled).length}/{items.length}{" "}
                      active
                    </span>
                  </div>
                  {items.map((item) => (
                    <AutomationRow
                      key={item.key}
                      item={item}
                      onToggle={toggleAutomation}
                      onSaveRecipients={saveRecipients}
                      onDelete={deleteAutomation}
                      saving={savingKey}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── QUEUE ── */}
        {tab === "queue" &&
          (queue.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-white/15" />
              <p className="text-white/40 font-bold text-sm">
                No pending automations
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {queue.map((task) => (
                <div
                  key={task._id}
                  className="px-5 py-4 flex items-start gap-3 hover:bg-[#0A2A1F] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-white">
                        {TYPE_META[task.type]?.label || task.type}
                      </p>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-[11px] text-white/35 mt-0.5 break-all">
                      {task.payload?.email}
                      {task.payload?.firstName &&
                        ` · ${task.payload.firstName}`}
                      {task.payload?.bookingRef &&
                        ` · ${task.payload.bookingRef}`}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={10} className="text-white/25" />
                      <p className="text-[10px] text-white/35">
                        {fmtDate(task.runAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelTask(task._id)}
                    disabled={cancellingId === task._id}
                    className="shrink-0 text-[10px] font-black px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-40"
                  >
                    {cancellingId === task._id ? "…" : "Cancel"}
                  </button>
                </div>
              ))}
            </div>
          ))}

        {/* ── HISTORY ── */}
        {tab === "history" &&
          (history.length === 0 ? (
            <div className="text-center py-16">
              <Mail size={32} className="mx-auto mb-3 text-white/15" />
              <p className="text-white/40 font-bold text-sm">
                No automation history yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {history.map((task) => (
                <div
                  key={task._id}
                  className="px-5 py-4 flex items-start gap-3 hover:bg-[#0A2A1F] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-white">
                        {TYPE_META[task.type]?.label || task.type}
                      </p>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-[11px] text-white/35 mt-0.5 break-all">
                      {task.payload?.email}
                      {task.payload?.firstName &&
                        ` · ${task.payload.firstName}`}
                    </p>
                    {task.error && (
                      <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <AlertCircle
                          size={11}
                          className="text-rose-400 shrink-0 mt-0.5"
                        />
                        <p className="text-[10px] text-rose-400">
                          {task.error}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={10} className="text-white/25" />
                      <p className="text-[10px] text-white/35">
                        {fmtDate(task.executedAt || task.createdAt)}
                      </p>
                    </div>
                  </div>
                  {(task.status === "failed" ||
                    task.status === "cancelled") && (
                    <button
                      onClick={() => resendTask(task)}
                      disabled={resendingId === task._id}
                      className="shrink-0 flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-all disabled:opacity-40"
                    >
                      {resendingId === task._id ? (
                        <RefreshCw size={11} className="animate-spin" />
                      ) : (
                        <RotateCcw size={11} />
                      )}
                      {resendingId === task._id ? "…" : "Retry"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

        {/* ── AUDIENCE ── */}
        {tab === "audience" && (
          <div>
            {/* Toolbar */}
            <div className="px-5 py-4 border-b border-white/6 space-y-3">
              {/* Summary chips */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-3 py-1">
                  <Mail size={11} className="text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-400">
                    {enabledCount} receiving
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/25 rounded-full px-3 py-1">
                  <MailX size={11} className="text-rose-400" />
                  <span className="text-[10px] font-black text-rose-400">
                    {disabledCount} excluded
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#071D16] border border-white/10 rounded-full px-3 py-1">
                  <Users size={11} className="text-white/40" />
                  <span className="text-[10px] font-black text-white/40">
                    {customers.length} total
                  </span>
                </div>
                <button
                  onClick={loadAudience}
                  disabled={audienceLoading}
                  className="ml-auto flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors"
                >
                  <RefreshCw
                    size={11}
                    className={audienceLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {/* Search + filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                  />
                  <input
                    value={audienceSearch}
                    onChange={(e) => setAudienceSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#071D16] text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {[
                    { key: "all", label: "All" },
                    { key: "on", label: "Receiving" },
                    { key: "off", label: "Excluded" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setAudienceFilter(f.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                        audienceFilter === f.key
                          ? "bg-emerald-500 text-white"
                          : "bg-[#071D16] text-white/40 hover:bg-[#0F2F24]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk action bar — shown when any selected */}
              {selected.size > 0 && (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/15">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                        {selected.size}
                      </div>
                      <span className="text-sm font-black text-white">
                        {selected.size} customer{selected.size > 1 ? "s" : ""}{" "}
                        selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => applyBulk(true)}
                        disabled={bulkSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
                      >
                        <UserCheck size={12} /> Enable
                      </button>
                      <button
                        onClick={() => applyBulk(false)}
                        disabled={bulkSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs font-black hover:bg-rose-500/25 transition-colors disabled:opacity-50"
                      >
                        <UserX size={12} /> Exclude
                      </button>
                      <button
                        onClick={() => setSelected(new Set())}
                        className="text-xs font-bold text-white/30 hover:text-white/60 transition-colors px-2"
                      >
                        ✕
                      </button>
                      {bulkSaving && (
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>

                  {/* Manual send */}
                  <div className="px-4 py-3 space-y-2.5">
                    <p className="text-xs font-black text-emerald-400 flex items-center gap-2">
                      <Send size={12} />
                      Send Email to {selected.size} Customer
                      {selected.size > 1 ? "s" : ""} Now
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={manualType}
                        onChange={(e) => setManualType(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#061A13] text-white text-xs font-semibold border border-white/10 focus:outline-none focus:border-emerald-500"
                      >
                        {Object.entries(TYPE_META).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.icon} {v.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={sendManual}
                        disabled={manualSending}
                        className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-400 transition-colors disabled:opacity-60 whitespace-nowrap shadow-sm shadow-emerald-500/25"
                      >
                        {manualSending ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                        {manualSending
                          ? "Sending…"
                          : `Send to ${selected.size}`}
                      </button>
                    </div>
                    <p className="text-[10px] text-white/25">
                      Sends immediately, outside the normal schedule.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Select-all row */}
            {registeredInView.length > 0 && (
              <div
                onClick={toggleAll}
                className="group w-full px-5 py-3 bg-[#071D16] border-b border-white/10 flex items-center gap-3 cursor-pointer hover:bg-[#0F2F24] transition-colors select-none"
              >
                <Tick
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                />
                <span className="text-[10px] font-bold text-white/45">
                  {allSelected
                    ? `All ${registeredInView.length} selected — click to deselect`
                    : someSelected
                      ? `${selectedInView} of ${registeredInView.length} selected — click to select all`
                      : `Select all ${registeredInView.length} registered`}
                </span>
              </div>
            )}

            {/* Rows */}
            {audienceLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-16">
                <Users size={32} className="mx-auto mb-3 text-white/15" />
                <p className="text-white/40 font-bold text-sm">
                  No customers found
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] max-h-[560px] overflow-y-auto">
                {filteredCustomers.map((c) => {
                  const cId = getCId(c);
                  const isSel = cId ? selected.has(cId) : false;
                  const enabled = c.crmEmailsEnabled !== false;
                  const isGuest = !cId;

                  return (
                    <div
                      key={cId || c.email}
                      onClick={() => !isGuest && toggleRow(c)}
                      className={`group px-5 py-3.5 flex items-center gap-3 transition-colors select-none ${
                        isGuest
                          ? "cursor-default opacity-50"
                          : isSel
                            ? "bg-emerald-500/[0.07] cursor-pointer"
                            : !enabled
                              ? "bg-rose-500/[0.04] hover:bg-rose-500/[0.07] cursor-pointer"
                              : "hover:bg-[#0A2A1F] cursor-pointer"
                      }`}
                    >
                      {/* Checkbox */}
                      <Tick checked={isSel} />

                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          enabled
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {c.firstName?.[0]}
                        {c.lastName?.[0]}
                      </div>

                      {/* Name / email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold leading-tight truncate ${!enabled ? "text-white/40" : "text-white"}`}>
                            {c.firstName} {c.lastName}
                          </p>
                          {isGuest && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/[0.08] text-white/30 shrink-0">
                              Guest
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${!enabled ? "text-white/20" : "text-white/35"}`}>
                          {c.email}
                        </p>
                      </div>

                      {/* Per-row CRM email toggle */}
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <Toggle
                          checked={enabled}
                          onChange={(v) => toggleSingle(c, v)}
                          saving={isGuest}
                        />
                      </div>

                      {/* Quick send — registered only */}
                      {!isGuest && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickSend({
                              id: cId,
                              name: `${c.firstName} ${c.lastName}`.trim(),
                              email: c.email,
                            });
                          }}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#071E16] border border-white/10 text-white/40 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/25 text-[10px] font-bold transition-all"
                        >
                          <Send size={10} />
                          Send
                        </button>
                      )}
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
