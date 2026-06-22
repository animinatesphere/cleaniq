import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  Eye,
  Download,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const EmailHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  const [viewingHtml, setViewingHtml] = useState("");
  const [loadingView, setLoadingView] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    fetch(`${API}/email-logs`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const s = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.to?.toLowerCase().includes(s) ||
        l.subject?.toLowerCase().includes(s),
    );
  }, [logs, search]);

  const openView = async (log) => {
    setViewing(log);
    setLoadingView(true);
    try {
      const res = await fetch(`${API}/email-logs/${log._id}`);
      const data = await res.json();
      setViewingHtml(data.html || "");
    } catch {
      setViewingHtml("<p>Failed to load email content.</p>");
    } finally {
      setLoadingView(false);
    }
  };

  const handleDownload = async (log) => {
    const res = await fetch(`${API}/email-logs/${log._id}`);
    const data = await res.json();
    const blob = new Blob([data.html || ""], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(log.subject || "email").replace(/[^a-z0-9]+/gi, "-")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail size={22} className="text-primary" /> Email History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Every email the system has sent — invoices, receipts, booking
            confirmations and more
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all font-semibold text-sm shadow-sm self-start"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by recipient or subject..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] bg-slate-50/60">
                <th className="px-6 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Sent</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center font-semibold text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center font-semibold text-slate-300">
                    No emails found
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {log.to}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-700 max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400 font-semibold whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={11} /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                          <XCircle size={11} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openView(log)}
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownload(log)}
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                          title="Download"
                        >
                          <Download size={16} />
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

      {viewing && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setViewing(null)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-[28px] shadow-2xl overflow-hidden border-4 border-white flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">
                  {viewing.subject}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  To: {viewing.to}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(viewing)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-all font-semibold text-xs"
                >
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={() => setViewing(null)}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-100">
              {loadingView ? (
                <p className="p-10 text-center text-sm text-slate-400">
                  Loading...
                </p>
              ) : (
                <iframe
                  title="Email preview"
                  srcDoc={viewingHtml}
                  className="w-full h-[70vh] bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailHistory;
