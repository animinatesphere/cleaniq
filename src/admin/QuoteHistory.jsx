import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  Eye,
  Pencil,
  Send,
  Trash2,
  X,
  RefreshCw,
  Plus,
} from "lucide-react";
import { QuoteDetailModal, FREQUENCY_OPTIONS } from "./QuoteBuilder";

const API = import.meta.env.VITE_API_URL;
export const QUOTE_EDIT_DRAFT_KEY = "cleaniq_quote_edit_draft";

const QUOTE_EXPORT_HEADERS = [
  "Quote Ref",
  "Company",
  "Contact",
  "Email",
  "Phone",
  "Frequency",
  "Subtotal",
  "VAT",
  "Total",
  "Status",
  "Date Sent",
  "Accepted At",
  "Declined At",
];

const Toast = ({ msg, type, onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
  >
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
      <X size={15} />
    </button>
  </div>
);

const StatusBadge = ({ status }) => {
  if (status === "accepted")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
        Accepted
      </span>
    );
  if (status === "declined")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
        Declined
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
      Sent
    </span>
  );
};

const QuoteHistory = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [toast, setToast] = useState(null);
  const [resendingRef, setResendingRef] = useState(null);

  const fetchQuotes = () => {
    setLoading(true);
    fetch(`${API}/quotes?limit=500`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setQuotes(res.data);
      })
      .catch(() => setToast({ msg: "Failed to load quotes", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return quotes;
    const s = search.toLowerCase();
    return quotes.filter(
      (q) =>
        q.companyName?.toLowerCase().includes(s) ||
        q.email?.toLowerCase().includes(s) ||
        q.quoteRef?.toLowerCase().includes(s),
    );
  }, [quotes, search]);

  const handleEdit = (quote) => {
    sessionStorage.setItem(QUOTE_EDIT_DRAFT_KEY, JSON.stringify(quote));
    navigate("/admin/quotes");
  };

  const handleResend = async (quote) => {
    if (!window.confirm(`Resend quote ${quote.quoteRef} to ${quote.email}?`))
      return;
    setResendingRef(quote.quoteRef);
    try {
      const res = await fetch(`${API}/quotes/resend/${quote.quoteRef}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      setToast({ msg: `Quote resent to ${quote.email}`, type: "success" });
    } catch {
      setToast({ msg: "Failed to resend quote", type: "error" });
    } finally {
      setResendingRef(null);
    }
  };

  const handleDelete = async (quote) => {
    if (
      !window.confirm(
        `Permanently delete quote ${quote.quoteRef} for ${quote.companyName}?`,
      )
    )
      return;
    try {
      const res = await fetch(`${API}/quotes/${quote.quoteRef}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setQuotes((prev) => prev.filter((q) => q.quoteRef !== quote.quoteRef));
      setToast({ msg: "Quote deleted", type: "success" });
    } catch {
      setToast({ msg: "Failed to delete quote", type: "error" });
    }
  };

  const exportRows = () =>
    filtered.map((q) => [
      q.quoteRef,
      q.companyName,
      q.contactName || "",
      q.email,
      q.phone || "",
      FREQUENCY_OPTIONS.find((f) => f.value === q.frequency)?.label ||
        q.frequency,
      q.subtotal,
      q.vat,
      q.grandTotal,
      q.status,
      q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "",
      q.acceptedAt ? new Date(q.acceptedAt).toLocaleDateString() : "",
      q.declinedAt ? new Date(q.declinedAt).toLocaleDateString() : "",
    ]);

  const exportCSV = () => {
    const rows = exportRows();
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [QUOTE_EXPORT_HEADERS.join(","), ...rows.map((r) => r.join(","))].join(
        "\n",
      );
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Cleaniq_Quotes_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = exportRows();
    const worksheet = XLSX.utils.aoa_to_sheet([QUOTE_EXPORT_HEADERS, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quote History");
    XLSX.writeFile(
      workbook,
      `Cleaniq_Quotes_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quote History
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {loading ? "Loading…" : `${quotes.length} quotes sent in total`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Download size={15} /> CSV
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Download size={15} /> Excel
          </button>
          <button
            onClick={() => navigate("/admin/quotes")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-dark transition-all"
          >
            <Plus size={15} /> New Quote
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 w-full md:w-80 focus-within:border-primary/50 transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, email, or ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium w-full text-slate-700"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] bg-slate-50/60">
                <th className="px-6 py-3.5">Company</th>
                <th className="px-4 py-3.5">Reference</th>
                <th className="px-4 py-3.5">Frequency</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-semibold">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-300 font-semibold">
                    No quotes found
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.quoteRef} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-sm">
                        {q.companyName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {q.email}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-600">
                      {q.quoteRef}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-600">
                      {FREQUENCY_OPTIONS.find((f) => f.value === q.frequency)
                        ?.label.split(" ")[0] || q.frequency}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 tabular-nums">
                      £{Number(q.grandTotal || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-4 text-[11px] font-semibold text-slate-400">
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedQuote(q)}
                          title="View"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEdit(q)}
                          title="Edit & resend as new quote"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleResend(q)}
                          disabled={resendingRef === q.quoteRef}
                          title="Resend email"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all disabled:opacity-50"
                        >
                          {resendingRef === q.quoteRef ? (
                            <RefreshCw size={15} className="animate-spin" />
                          ) : (
                            <Send size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(q)}
                          title="Delete"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuoteHistory;
