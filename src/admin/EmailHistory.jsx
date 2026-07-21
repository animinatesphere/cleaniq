import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Mail, Search, RefreshCw, Eye, Download, X,
  CheckCircle2, XCircle, Trash2, ChevronLeft, ChevronRight,
  AlertCircle, MoreHorizontal,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 25;

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Email detail drawer ───────────────────────────────────────────────────────
function EmailDrawer({ log, onClose, onDelete }) {
  const [html, setHtml]       = useState("");
  const [htmlLoading, setHtmlLoading] = useState(false);

  useEffect(() => {
    if (!log) return;
    setHtml("");
    setHtmlLoading(true);
    fetch(`${API}/email-logs/${log._id}`)
      .then(r => r.json())
      .then(d => setHtml(d.html || "<p style='padding:20px;color:#888'>No HTML content stored.</p>"))
      .catch(() => setHtml("<p style='padding:20px;color:#888'>Failed to load content.</p>"))
      .finally(() => setHtmlLoading(false));
  }, [log]);

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${(log.subject || "email").replace(/[^a-z0-9]+/gi, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!log) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[520px] bg-[#0B2D22] border-l border-white/10 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.07] shrink-0 bg-white/[0.03]">
          <div className="min-w-0 pr-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Email</p>
            <p className="text-sm font-bold text-white leading-snug">{log.subject}</p>
            <p className="text-xs text-white/40 mt-0.5">To: {log.to}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all font-semibold text-xs"
            >
              <Download size={12} /> Download
            </button>
            <button
              onClick={() => { onDelete(log._id); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/25 transition-all font-semibold text-xs"
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Meta strip */}
        <div className="px-6 py-3 border-b border-white/[0.04] flex flex-wrap items-center gap-3 shrink-0">
          {log.success ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={10} /> Sent
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 rounded-full">
              <XCircle size={10} /> Failed
            </span>
          )}
          <span className="text-xs text-white/40 font-medium">{fmtDate(log.sentAt)}</span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-[#071D16]">
          {htmlLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : (
            <iframe
              title="Email preview"
              srcDoc={html}
              className="w-full h-full bg-white"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>
    </>
  );
}

// ── Row actions ⋯ dropdown ────────────────────────────────────────────────────
function RowMenu({ log, onView, onDownload, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 bg-[#0B2D22] border border-white/10 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => { setOpen(false); onView(log); }}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <Eye size={13} /> View Email
          </button>
          <button
            onClick={() => { setOpen(false); onDownload(log); }}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <Download size={13} /> Download
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(log._id); }}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const EmailHistory = () => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(new Set());
  const [viewing, setViewing]     = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState(null);

  const handleDownload = async (log) => {
    try {
      const res  = await fetch(`${API}/email-logs/${log._id}`);
      const data = await res.json();
      const blob = new Blob([data.html || ""], { type: "text/html" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${(log.subject || "email").replace(/[^a-z0-9]+/gi, "-")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showToast("Download failed", "error");
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLogs = () => {
    setLoading(true);
    fetch(`${API}/email-logs?limit=500`)
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setSelected(new Set()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  // Reset to page 1 on search/filter change
  useEffect(() => { setPage(1); setSelected(new Set()); }, [search, statusFilter]);

  const filtered = useMemo(() => {
    let list = logs;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(l =>
        l.to?.toLowerCase().includes(s) || l.subject?.toLowerCase().includes(s)
      );
    }
    if (statusFilter === "sent")   list = list.filter(l => l.success);
    if (statusFilter === "failed") list = list.filter(l => !l.success);
    return list;
  }, [logs, search, statusFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageItems   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageIds     = pageItems.map(l => l._id);

  // Stats
  const sentCount   = logs.filter(l => l.success).length;
  const failedCount = logs.filter(l => !l.success).length;

  // Selection helpers
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const someSelected    = selected.size > 0;

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allPageSelected) {
      setSelected(prev => { const n = new Set(prev); pageIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); pageIds.forEach(id => n.add(id)); return n; });
    }
  };

  const handleDeleteSingle = async (id) => {
    if (!window.confirm("Delete this email log? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`${API}/email-logs/${id}`, { method: "DELETE" });
      setLogs(prev => prev.filter(l => l._id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      showToast("Email log deleted");
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (!window.confirm(`Delete ${ids.length} email log${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`${API}/email-logs/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setLogs(prev => prev.filter(l => !ids.includes(l._id)));
      setSelected(new Set());
      showToast(`${ids.length} log${ids.length !== 1 ? "s" : ""} deleted`);
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-72 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 ${
          toast.type === "error" ? "bg-rose-600" : "bg-[#0B2D22] border border-white/10"
        }`}>
          {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Email viewer drawer */}
      <EmailDrawer
        log={viewing}
        onClose={() => setViewing(null)}
        onDelete={handleDeleteSingle}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail size={22} className="text-emerald-400" /> Email History
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Every email the system has sent — confirmations, invoices, campaigns and more
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-all font-semibold text-sm shadow-sm self-start shrink-0"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Sent",    val: logs.length,  color: "text-white",        bg: "bg-[#0B2D22] border border-white/[0.07]" },
          { label: "Delivered",     val: sentCount,    color: "text-emerald-400",  bg: "bg-emerald-500/10 border border-emerald-500/20" },
          { label: "Failed",        val: failedCount,  color: "text-rose-400",     bg: "bg-rose-500/10 border border-rose-500/20" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3`}>
            <p className={`text-2xl font-black ${s.color} leading-none`}>{s.val}</p>
            <p className="text-[11px] text-white/40 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipient or subject…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "sent", "failed"].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                statusFilter === f
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
              }`}
            >
              {f === "all" ? "All" : f === "sent" ? "Delivered" : "Failed"}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0B2D22] border border-white/10 text-white rounded-xl">
          <p className="text-sm font-semibold">
            {selected.size} email{selected.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-white/40 hover:text-white/80 transition-colors px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Trash2 size={12} /> Delete {selected.size} selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-white/40 text-xs font-semibold uppercase tracking-wide bg-white/[0.03]">
                <th className="pl-5 pr-2 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="rounded border-white/20 accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5 hidden sm:table-cell">Sent</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-sm text-white/40">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-sm text-white/25 font-semibold">
                    No emails found
                  </td>
                </tr>
              ) : (
                pageItems.map(log => {
                  const isSelected = selected.has(log._id);
                  return (
                    <tr
                      key={log._id}
                      className={`transition-colors cursor-pointer border-b border-white/[0.04] ${
                        isSelected ? "bg-white/[0.05]" : "hover:bg-white/[0.04]"
                      }`}
                      onClick={() => setViewing(log)}
                    >
                      <td className="pl-5 pr-2 py-3.5 w-10" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(log._id)}
                          className="rounded border-white/20 accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-white max-w-[140px] truncate">
                        {log.to}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-white/60 max-w-xs truncate">
                        {log.subject}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-white/40 font-medium whitespace-nowrap hidden sm:table-cell">
                        {fmtDate(log.sentAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        {log.success ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 rounded-full">
                            <XCircle size={10} /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <RowMenu
                          log={log}
                          onView={setViewing}
                          onDownload={handleDownload}
                          onDelete={handleDeleteSingle}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/[0.07] flex items-center justify-between gap-3 bg-white/[0.02]">
            <p className="text-xs text-white/40 font-medium">
              {filtered.length} email{filtered.length !== 1 ? "s" : ""}
              {someSelected ? ` · ${selected.size} selected` : ""}
              {" "}· Page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page numbers — show up to 5 around current */}
              {(() => {
                const range = [];
                const delta = 2;
                for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) {
                  range.push(i);
                }
                return range.map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      p === safePage
                        ? "bg-emerald-500 text-white"
                        : "border border-white/10 text-white/40 hover:bg-white/[0.06]"
                    }`}
                  >
                    {p}
                  </button>
                ));
              })()}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailHistory;
