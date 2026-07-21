import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Download, Eye, Pencil, Send, Trash2, X,
  RefreshCw, Plus, MoreHorizontal, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { FREQUENCY_OPTIONS } from "./QuoteBuilder";

const API = import.meta.env.VITE_API_URL;
export const QUOTE_EDIT_DRAFT_KEY = "cleaniq_quote_edit_draft";
const PAGE_SIZE = 20;

const QUOTE_EXPORT_HEADERS = [
  "Quote Ref", "Company", "Contact", "Email", "Phone",
  "Frequency", "Subtotal", "VAT", "Total", "Status",
  "Date Sent", "Accepted At", "Declined At",
];

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  if (status === "accepted")
    return <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Accepted</span>;
  if (status === "declined")
    return <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">Declined</span>;
  return <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/10">Sent</span>;
};

// ── Row ⋯ menu ────────────────────────────────────────────────────────────────
function RowMenu({ quote, onView, onEdit, onResend, onDelete, resending }) {
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
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/25 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-44 bg-[#0B2D22] border border-white/10 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => { setOpen(false); onView(quote); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <Eye size={13} /> View Details
          </button>
          <button
            onClick={() => { setOpen(false); onEdit(quote); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <Pencil size={13} /> Edit & Duplicate
          </button>
          <button
            onClick={() => { setOpen(false); onResend(quote); }}
            disabled={resending}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            {resending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
            Resend Email
          </button>
          <div className="border-t border-white/[0.07]" />
          <button
            onClick={() => { setOpen(false); onDelete(quote); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Quote detail drawer ───────────────────────────────────────────────────────
function QuoteDrawer({ quote, onClose, onEdit, onResend, onDelete, resending }) {
  if (!quote) return null;
  const freq = FREQUENCY_OPTIONS.find(f => f.value === quote.frequency)?.label || quote.frequency;
  const fmtCcy = (n) => `£${Number(n || 0).toFixed(2)}`;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-125 bg-[#0B2D22] border-l border-white/10 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/[0.07] shrink-0">
          <div className="min-w-0 pr-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Quote</p>
            <h2 className="text-base font-bold text-white">{quote.companyName}</h2>
            <p className="text-xs text-white/40 mt-0.5">{quote.quoteRef} · {quote.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { onResend(quote); }}
              disabled={resending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all font-semibold text-xs disabled:opacity-50"
            >
              {resending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
              Resend
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status + date strip */}
        <div className="px-6 py-3 border-b border-white/[0.04] flex flex-wrap items-center gap-3 shrink-0">
          <StatusBadge status={quote.status} />
          {quote.createdAt && (
            <span className="text-xs text-white/40 font-medium">
              Sent {new Date(quote.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {quote.acceptedAt && (
            <span className="text-xs text-emerald-400 font-semibold">
              Accepted {new Date(quote.acceptedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          )}
          {quote.declinedAt && (
            <span className="text-xs text-rose-400 font-semibold">
              Declined {new Date(quote.declinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Contact info */}
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Contact</p>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] space-y-1.5 text-sm">
              {[
                { label: "Company",  value: quote.companyName },
                { label: "Contact",  value: quote.contactName || "—" },
                { label: "Email",    value: quote.email },
                { label: "Phone",    value: quote.phone || "—" },
                { label: "Address",  value: quote.address || "—" },
                { label: "Frequency",value: freq },
              ].map(r => (
                <div key={r.label} className="flex justify-between gap-3">
                  <span className="text-white/40 text-xs shrink-0">{r.label}</span>
                  <span className="font-semibold text-white/80 text-xs text-right wrap-break-word">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line items */}
          {quote.items?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Line Items</p>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.05] overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] font-bold text-white/40 uppercase tracking-wider border-b border-white/[0.05]">
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {quote.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-white/80 font-medium">{item.description}</td>
                        <td className="px-3 py-2 text-white/40 text-right tabular-nums">{item.quantity}</td>
                        <td className="px-3 py-2 text-white/40 text-right tabular-nums">{fmtCcy(item.unitPrice)}</td>
                        <td className="px-4 py-2 font-bold text-white text-right tabular-nums">{fmtCcy(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="bg-[#071D16] rounded-xl p-4 border border-white/[0.05] space-y-2">
            {[
              { label: "Subtotal", value: fmtCcy(quote.subtotal) },
              { label: `VAT (${quote.vatRate ?? 20}%)`, value: fmtCcy(quote.vat) },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-white/40">{r.label}</span>
                <span className="font-semibold tabular-nums text-white/80">{r.value}</span>
              </div>
            ))}
            <div className="border-t border-white/[0.07] pt-2 flex justify-between">
              <span className="text-sm font-bold text-white">Total</span>
              <span className="text-lg font-black tabular-nums text-white">{fmtCcy(quote.grandTotal)}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Notes</p>
              <p className="text-sm text-white/80 bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-white/[0.07] shrink-0 flex gap-2">
          <button
            onClick={() => { onEdit(quote); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 h-9 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
          >
            <Pencil size={13} /> Edit & Duplicate
          </button>
          <button
            onClick={() => { onDelete(quote); onClose(); }}
            className="flex items-center justify-center gap-2 h-9 px-4 bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 rounded-xl text-sm font-semibold transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const QuoteHistory = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingQuote, setViewingQuote] = useState(null);
  const [selected, setSelected]     = useState(new Set());
  const [toast, setToast]           = useState(null);
  const [resendingRef, setResendingRef] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchQuotes = () => {
    setLoading(true);
    fetch(`${API}/quotes?limit=500`)
      .then(r => r.json())
      .then(res => { if (res.success) setQuotes(res.data); })
      .catch(() => showToast("Failed to load quotes", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuotes(); }, []);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [search, statusFilter]);

  const stats = useMemo(() => {
    const accepted     = quotes.filter(q => q.status === "accepted");
    const declined     = quotes.filter(q => q.status === "declined");
    const totalValue   = quotes.reduce((s, q) => s + (q.grandTotal || 0), 0);
    const acceptedVal  = accepted.reduce((s, q) => s + (q.grandTotal || 0), 0);
    const responded    = accepted.length + declined.length;
    return {
      total: quotes.length,
      acceptedCount: accepted.length,
      declinedCount: declined.length,
      pendingCount: quotes.length - responded,
      totalValue,
      acceptedValue: acceptedVal,
      acceptanceRate: responded > 0 ? (accepted.length / responded) * 100 : 0,
    };
  }, [quotes]);

  const filtered = useMemo(() => {
    let list = quotes;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(q =>
        q.companyName?.toLowerCase().includes(s) ||
        q.email?.toLowerCase().includes(s) ||
        q.quoteRef?.toLowerCase().includes(s)
      );
    }
    if (statusFilter === "accepted") list = list.filter(q => q.status === "accepted");
    if (statusFilter === "declined") list = list.filter(q => q.status === "declined");
    if (statusFilter === "sent")     list = list.filter(q => q.status !== "accepted" && q.status !== "declined");
    return list;
  }, [quotes, search, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Selection (scoped to current page)
  const allSelected  = pageItems.length > 0 && pageItems.every(q => selected.has(q.quoteRef));
  const someSelected = selected.size > 0;

  const toggleRow = (ref) => {
    setSelected(prev => { const n = new Set(prev); n.has(ref) ? n.delete(ref) : n.add(ref); return n; });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); pageItems.forEach(q => n.delete(q.quoteRef)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); pageItems.forEach(q => n.add(q.quoteRef)); return n; });
    }
  };

  // Actions
  const handleEdit = (quote) => {
    sessionStorage.setItem(QUOTE_EDIT_DRAFT_KEY, JSON.stringify(quote));
    navigate("/admin/quotes");
  };

  const handleResend = async (quote) => {
    if (!window.confirm(`Resend quote ${quote.quoteRef} to ${quote.email}?`)) return;
    setResendingRef(quote.quoteRef);
    try {
      const res = await fetch(`${API}/quotes/resend/${quote.quoteRef}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      showToast(`Quote resent to ${quote.email}`);
    } catch {
      showToast("Failed to resend quote", "error");
    } finally {
      setResendingRef(null);
    }
  };

  const handleDelete = async (quote) => {
    if (!window.confirm(`Permanently delete quote ${quote.quoteRef} for ${quote.companyName}?`)) return;
    try {
      const res = await fetch(`${API}/quotes/${quote.quoteRef}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setQuotes(prev => prev.filter(q => q.quoteRef !== quote.quoteRef));
      setSelected(prev => { const n = new Set(prev); n.delete(quote.quoteRef); return n; });
      showToast("Quote deleted");
    } catch {
      showToast("Failed to delete quote", "error");
    }
  };

  const handleBulkDelete = async () => {
    const refs = [...selected];
    if (!window.confirm(`Permanently delete ${refs.length} quote${refs.length !== 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    try {
      await fetch(`${API}/quotes/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refs }),
      });
      setQuotes(prev => prev.filter(q => !refs.includes(q.quoteRef)));
      setSelected(new Set());
      showToast(`${refs.length} quote${refs.length !== 1 ? "s" : ""} deleted`);
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Export helpers
  const exportRows = () => filtered.map(q => [
    q.quoteRef, q.companyName, q.contactName || "", q.email, q.phone || "",
    FREQUENCY_OPTIONS.find(f => f.value === q.frequency)?.label || q.frequency,
    q.subtotal, q.vat, q.grandTotal, q.status,
    q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "",
    q.acceptedAt ? new Date(q.acceptedAt).toLocaleDateString() : "",
    q.declinedAt ? new Date(q.declinedAt).toLocaleDateString() : "",
  ]);

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      [QUOTE_EXPORT_HEADERS.join(","), ...exportRows().map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Cleaniq_Quotes_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([QUOTE_EXPORT_HEADERS, ...exportRows()]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quote History");
    XLSX.writeFile(wb, `Cleaniq_Quotes_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`);
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
          <button onClick={() => setToast(null)} className="ml-auto opacity-70 hover:opacity-100"><X size={13} /></button>
        </div>
      )}

      {/* Quote drawer */}
      <QuoteDrawer
        quote={viewingQuote}
        onClose={() => setViewingQuote(null)}
        onEdit={handleEdit}
        onResend={handleResend}
        onDelete={handleDelete}
        resending={resendingRef === viewingQuote?.quoteRef}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Quote History</h2>
          <p className="text-sm text-white/40 font-medium mt-1">
            {loading ? "Loading…" : `${quotes.length} quotes sent in total`}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">
            <Download size={14} /> CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">
            <Download size={14} /> Excel
          </button>
          <button onClick={() => navigate("/admin/quotes")} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold shadow-sm transition-all">
            <Plus size={14} /> New Quote
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl flex flex-wrap divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
        {[
          { label: "Total Quoted",       value: `£${stats.totalValue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}` },
          { label: "Accepted Value",     value: `£${stats.acceptedValue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}` },
          { label: "Acceptance Rate",    value: `${stats.acceptanceRate.toFixed(0)}%` },
          { label: "Accepted",           value: stats.acceptedCount },
          { label: "Declined",           value: stats.declinedCount },
          { label: "Awaiting Response",  value: stats.pendingCount },
        ].map(m => (
          <div key={m.label} className="flex-1 min-w-32.5 px-5 py-4">
            <p className="text-[11px] font-semibold text-white/40 mb-1">{m.label}</p>
            <p className="text-xl font-bold text-white tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, email, or ref…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: "all",      label: "All" },
            { key: "accepted", label: "Accepted" },
            { key: "declined", label: "Declined" },
            { key: "sent",     label: "Awaiting" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                statusFilter === f.key
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0B2D22] border border-white/10 text-white rounded-xl">
          <p className="text-sm font-semibold">{selected.size} quote{selected.size !== 1 ? "s" : ""} selected</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="text-xs text-white/40 hover:text-white/80 transition-colors px-2 py-1">
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
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
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-white/20 accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5">Company</th>
                <th className="px-4 py-3.5">Reference</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Frequency</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 hidden sm:table-cell">Date</th>
                <th className="px-5 py-3.5 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-white/40 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-white/25 font-semibold">
                    No quotes found
                  </td>
                </tr>
              ) : (
                pageItems.map(q => {
                  const isSelected = selected.has(q.quoteRef);
                  return (
                    <tr
                      key={q.quoteRef}
                      onClick={() => setViewingQuote(q)}
                      className={`transition-colors cursor-pointer border-b border-white/[0.04] ${isSelected ? "bg-white/[0.05]" : "hover:bg-white/[0.04]"}`}
                    >
                      <td className="pl-5 pr-2 py-4 w-10" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(q.quoteRef)}
                          className="rounded border-white/20 accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white text-sm leading-tight">{q.companyName}</p>
                        <p className="text-[11px] text-white/40 font-medium mt-0.5">{q.email}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white/60">{q.quoteRef}</td>
                      <td className="px-4 py-4 text-sm font-medium text-white/60 hidden md:table-cell">
                        {FREQUENCY_OPTIONS.find(f => f.value === q.frequency)?.label.split(" ")[0] || q.frequency}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-white tabular-nums">
                        £{Number(q.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={q.status} /></td>
                      <td className="px-4 py-4 text-[11px] font-semibold text-white/40 hidden sm:table-cell">
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                      </td>
                      <td className="px-5 py-4 w-12">
                        <RowMenu
                          quote={q}
                          onView={setViewingQuote}
                          onEdit={handleEdit}
                          onResend={handleResend}
                          onDelete={handleDelete}
                          resending={resendingRef === q.quoteRef}
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
              {filtered.length} quote{filtered.length !== 1 ? "s" : ""}
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
              {(() => {
                const range = [];
                for (let i = Math.max(1, safePage - 2); i <= Math.min(totalPages, safePage + 2); i++) range.push(i);
                return range.map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      p === safePage ? "bg-emerald-500 text-white" : "border border-white/10 text-white/40 hover:bg-white/[0.06]"
                    }`}
                  >{p}</button>
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

export default QuoteHistory;
