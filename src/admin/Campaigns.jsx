import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Send, X, RefreshCw, Eye, Mail } from "lucide-react";

// NOTE: This page calls POST /api/marketing/campaign to send a campaign
// and GET /api/marketing/campaigns for campaign history.
// Customer list is fetched from GET /api/customers for segment filtering.

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SEGMENTS = [
  { value: "all", label: "All Customers" },
  { value: "vip", label: "VIP" },
  { value: "regular", label: "Regular" },
  { value: "new", label: "New Customers" },
  { value: "at-risk", label: "At Risk" },
  { value: "custom", label: "Custom (paste emails)" },
];

const SENT_BADGE = "bg-green-50 text-green-700 border-green-200";
const DRAFT_BADGE = "bg-zinc-100 text-zinc-600 border-zinc-200";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [form, setForm] = useState({
    name: "",
    segment: "all",
    subject: "",
    body: "",
    customEmails: "",
  });

  const fetchAll = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [hRes, cRes] = await Promise.all([
        axios.get(`${API}/marketing/campaigns`).catch(() => ({ data: [] })),
        axios.get(`${API}/customers`).catch(() => ({ data: [] })),
      ]);
      setCampaigns(Array.isArray(hRes.data) ? hRes.data : []);
      setCustomers(Array.isArray(cRes.data) ? cRes.data : []);
    } catch {
      // Silently handle — history may not exist yet
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getTargetEmails = () => {
    if (form.segment === "custom") {
      return form.customEmails
        .split(/[\n,;]+/)
        .map(e => e.trim())
        .filter(e => e.includes("@"));
    }
    const seg = form.segment;
    return customers
      .filter(c => {
        if (seg === "all") return true;
        const tag = (c.segment || c.tags || "").toString().toLowerCase();
        if (seg === "vip") return tag.includes("vip");
        if (seg === "regular") return tag.includes("regular");
        if (seg === "new") return tag.includes("new");
        if (seg === "at-risk") return tag.includes("at risk") || tag.includes("at-risk");
        return true;
      })
      .map(c => c.email)
      .filter(Boolean);
  };

  const targetEmails = getTargetEmails();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setError("Campaign name, subject and body are all required");
      return;
    }
    if (targetEmails.length === 0) {
      setError("No recipients found for the selected segment");
      return;
    }
    if (!window.confirm(`Send to ${targetEmails.length} recipient${targetEmails.length !== 1 ? "s" : ""}?`)) return;
    setSending(true);
    setError("");
    try {
      await axios.post(`${API}/marketing/campaign`, {
        name: form.name,
        segment: form.segment,
        subject: form.subject,
        body: form.body,
        targetEmails,
      });
      setSuccessMsg(`Campaign sent to ${targetEmails.length} recipients!`);
      setForm({ name: "", segment: "all", subject: "", body: "", customEmails: "" });
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {successMsg}
          <button onClick={() => setSuccessMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Campaign Manager</h1>
        <p className="text-sm text-zinc-500 mt-1">Send bulk email campaigns to customer segments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Campaign history */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">History</h2>
              <button onClick={fetchAll} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <RefreshCw size={13} />
              </button>
            </div>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 px-6">
                <Mail size={28} className="mx-auto mb-3 text-zinc-300" />
                <p className="text-sm font-medium">No campaigns sent yet</p>
                <p className="text-xs mt-1">Compose and send your first campaign using the form.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {campaigns.map(c => (
                  <button
                    key={c._id}
                    onClick={() => setSelectedCampaign(selectedCampaign?._id === c._id ? null : c)}
                    className="w-full text-left px-5 py-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{c.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ${
                        c.status === "sent" ? SENT_BADGE : DRAFT_BADGE
                      }`}>
                        {c.status || "sent"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{c.subject}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                      <span>{c.segment || "all"}</span>
                      {c.sentCount && <span>{c.sentCount} sent</span>}
                      <span>{fmtDate(c.sentAt || c.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Expanded campaign detail */}
          {selectedCampaign && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900">{selectedCampaign.name}</h3>
                <button onClick={() => setSelectedCampaign(null)}>
                  <X size={14} className="text-zinc-400" />
                </button>
              </div>
              <p className="text-xs font-semibold text-zinc-500">Subject: {selectedCampaign.subject}</p>
              <div className="text-xs text-zinc-600 bg-zinc-50 rounded-xl p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedCampaign.body}
              </div>
            </div>
          )}
        </div>

        {/* Right — Composer */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Compose Campaign</h2>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Campaign Name</label>
                <input
                  required
                  placeholder="e.g. Summer Re-engagement"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Target Segment</label>
                <select
                  value={form.segment}
                  onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none"
                >
                  {SEGMENTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-400 mt-1">
                  {form.segment !== "custom" && (
                    <span className="font-medium text-zinc-600">{targetEmails.length} recipient{targetEmails.length !== 1 ? "s" : ""}</span>
                  )} matched
                </p>
              </div>

              {form.segment === "custom" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Email Addresses</label>
                  <textarea
                    placeholder="Paste emails separated by commas, semicolons, or newlines"
                    rows={3}
                    value={form.customEmails}
                    onChange={e => setForm(f => ({ ...f, customEmails: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400 resize-none"
                  />
                  <p className="text-xs text-zinc-400 mt-1">{targetEmails.length} valid email{targetEmails.length !== 1 ? "s" : ""} detected</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Subject Line</label>
                <input
                  required
                  placeholder="e.g. Special offer just for you"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Message Body</label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(p => !p)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <Eye size={12} /> {showPreview ? "Hide" : "Preview"}
                  </button>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder={"Hi [name],\n\nWrite your message here...\n\nThanks,\nCleaniq Services"}
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400 resize-none font-mono"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Use [name] for the customer's first name. Plain text — line breaks are preserved.
                </p>
              </div>

              {/* Preview panel */}
              {showPreview && form.body && (
                <div className="border border-zinc-200 rounded-xl bg-zinc-50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-zinc-100 bg-white">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Preview</p>
                    {form.subject && (
                      <p className="text-sm font-semibold text-zinc-900 mt-1">{form.subject}</p>
                    )}
                  </div>
                  <div className="px-5 py-4 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {form.body.replace(/\[name\]/gi, "John")}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <><RefreshCw size={15} className="animate-spin" /> Sending…</>
                ) : (
                  <><Send size={15} /> Send Campaign {targetEmails.length > 0 && `(${targetEmails.length})`}</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
