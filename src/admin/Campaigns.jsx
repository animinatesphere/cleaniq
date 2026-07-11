import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Send, X, RefreshCw, Eye, Mail, Upload, Clock } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SEGMENTS = [
  { value: "all", label: "All Customers" },
  { value: "vip", label: "VIP" },
  { value: "regular", label: "Regular" },
  { value: "new", label: "New Customers" },
  { value: "at-risk", label: "At Risk" },
  { value: "custom", label: "Custom (paste or upload)" },
];

const STATUS_STYLES = {
  sent:     "bg-green-50 text-green-700 border-green-200",
  sending:  "bg-blue-50 text-blue-700 border-blue-200",
  queued:   "bg-amber-50 text-amber-700 border-amber-200",
  draft:    "bg-zinc-100 text-zinc-600 border-zinc-200",
  failed:   "bg-red-50 text-red-700 border-red-200",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function ProgressBar({ sent, total }) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
        <span>{sent} / {total} sent</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function extractEmailsFromCsv(text) {
  const lines = text.split(/\r?\n/);
  const emails = [];
  for (const line of lines) {
    // Try each comma/tab-separated cell, pick the one that looks like an email
    const cells = line.split(/[,\t]/);
    for (const cell of cells) {
      const val = cell.trim().replace(/^["']|["']$/g, "");
      if (val.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        emails.push(val.toLowerCase());
      }
    }
  }
  return [...new Set(emails)];
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
  const [fileEmails, setFileEmails] = useState([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    segment: "all",
    subject: "",
    body: "",
    customEmails: "",
  });

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/marketing/campaigns`).catch(() => ({ data: [] }));
      const data = Array.isArray(res.data) ? res.data : [];
      setCampaigns(data);
      // Stop polling when no active campaigns
      const hasActive = data.some(c => c.status === "sending" || c.status === "queued");
      if (!hasActive && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {
      // silently ignore
    }
  }, []);

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
      // silently handle
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]);

  // Start polling when campaigns have active sends
  useEffect(() => {
    const hasActive = campaigns.some(c => c.status === "sending" || c.status === "queued");
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(fetchHistory, 30000); // refresh every 30s
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [campaigns, fetchHistory]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const emails = extractEmailsFromCsv(ev.target.result);
      setFileEmails(emails);
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setFileEmails([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const getTargetEmails = () => {
    if (form.segment === "custom") {
      const pasted = form.customEmails
        .split(/[\n,;]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e.includes("@"));
      return [...new Set([...pasted, ...fileEmails])];
    }
    const seg = form.segment;
    return customers
      .filter(c => {
        if (seg === "all") return true;
        const tag = (c.segment || c.tags || "").toString().toLowerCase();
        if (seg === "vip")     return tag.includes("vip");
        if (seg === "regular") return tag.includes("regular");
        if (seg === "new")     return tag.includes("new");
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
      setError("No recipients found — paste emails, upload a file, or pick a segment with customers");
      return;
    }
    const estimatedMins = targetEmails.length;
    if (!window.confirm(
      `Queue campaign to ${targetEmails.length} recipient${targetEmails.length !== 1 ? "s" : ""}?\n\n` +
      `Emails will be sent at 1 per minute (~${estimatedMins} min total).\n\n` +
      `You can close this tab — sending continues in the background.`
    )) return;

    setSending(true);
    setError("");
    try {
      const res = await axios.post(`${API}/marketing/campaign`, {
        name: form.name,
        segment: form.segment,
        subject: form.subject,
        body: form.body,
        targetEmails,
      });
      setSuccessMsg(res.data?.message || `Campaign queued for ${targetEmails.length} recipients — sending 1/min.`);
      setForm({ name: "", segment: "all", subject: "", body: "", customEmails: "" });
      clearFile();
      fetchAll();
      // Start polling immediately after queuing
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchHistory, 30000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to queue campaign");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Clock size={14} /> {successMsg}</span>
          <button onClick={() => setSuccessMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Campaign Manager</h1>
        <p className="text-sm text-zinc-500 mt-1">Bulk email campaigns — queued and sent at 1 email per minute.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Campaign history */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">History</h2>
              <button onClick={fetchAll} title="Refresh" className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} />
              </button>
            </div>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 px-6">
                <Mail size={28} className="mx-auto mb-3 text-zinc-300" />
                <p className="text-sm font-medium">No campaigns yet</p>
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
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ${STATUS_STYLES[c.status] || STATUS_STYLES.draft}`}>
                        {c.status || "sent"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{c.subject}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400 flex-wrap">
                      <span>{c.segment || "all"}</span>
                      <span>{fmtDate(c.sentAt || c.createdAt)}</span>
                    </div>
                    {/* Progress bar for active campaigns */}
                    {(c.status === "sending" || c.status === "queued") && (
                      <ProgressBar sent={c.sentCount || 0} total={c.totalCount || c.recipientCount || 0} />
                    )}
                    {c.status === "sent" && c.totalCount > 0 && (
                      <p className="text-[11px] text-green-600 font-semibold mt-1">
                        {c.sentCount || c.recipientCount || c.totalCount} emails sent
                      </p>
                    )}
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
                {selectedCampaign.body || selectedCampaign.message}
              </div>
              {selectedCampaign.recipients?.length > 0 && (
                <p className="text-xs text-zinc-400">{selectedCampaign.recipients.length} recipients</p>
              )}
            </div>
          )}
        </div>

        {/* Right — Composer */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Compose Campaign</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Emails are queued and sent at 1 per minute.</p>
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
                {form.segment !== "custom" && (
                  <p className="text-xs text-zinc-400 mt-1">
                    <span className="font-medium text-zinc-600">{targetEmails.length} recipient{targetEmails.length !== 1 ? "s" : ""}</span> matched
                  </p>
                )}
              </div>

              {form.segment === "custom" && (
                <div className="space-y-3">
                  {/* CSV file upload */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Upload CSV / Text File</label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-zinc-300 rounded-xl bg-zinc-50 hover:bg-zinc-100 cursor-pointer text-xs font-semibold text-zinc-600 transition-colors">
                        <Upload size={13} />
                        {fileName ? `${fileName} (${fileEmails.length} emails)` : "Choose file…"}
                        <input
                          ref={fileRef}
                          type="file"
                          accept=".csv,.txt,.tsv"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                      {fileName && (
                        <button type="button" onClick={clearFile} className="text-zinc-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {fileEmails.length > 0 && (
                      <p className="text-xs text-zinc-400 mt-1">{fileEmails.length} emails loaded from file</p>
                    )}
                  </div>

                  {/* Manual paste */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Or Paste Emails</label>
                    <textarea
                      placeholder="Paste emails separated by commas, semicolons, or newlines"
                      rows={3}
                      value={form.customEmails}
                      onChange={e => setForm(f => ({ ...f, customEmails: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400 resize-none"
                    />
                  </div>

                  <p className="text-xs text-zinc-500 font-medium">
                    Total: <span className="text-zinc-900">{targetEmails.length} unique valid email{targetEmails.length !== 1 ? "s" : ""}</span>
                    {targetEmails.length > 0 && (
                      <span className="text-zinc-400"> · ~{targetEmails.length} min to send all</span>
                    )}
                  </p>
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

              {targetEmails.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                  <span className="font-semibold">Rate-limited:</span> {targetEmails.length} emails will be sent at 1 per minute (~{targetEmails.length} min). Sending continues in the background after you close this page.
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <><RefreshCw size={15} className="animate-spin" /> Queuing…</>
                ) : (
                  <><Send size={15} /> Queue Campaign {targetEmails.length > 0 && `(${targetEmails.length})`}</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
