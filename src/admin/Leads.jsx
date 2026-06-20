import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Mail,
  Phone,
  Trash2,
  X,
  Send,
  RefreshCw,
  Download,
  Users,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

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

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [emailTarget, setEmailTarget] = useState(null); // lead, or "bulk"
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchLeads = () => {
    setLoading(true);
    fetch(`${API}/contact/leads`)
      .then((r) => r.json())
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch(() => setToast({ msg: "Failed to load leads", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return leads;
    const s = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.includes(s),
    );
  }, [leads, search]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l._id)));
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete the lead from ${lead.name}?`)) return;
    await fetch(`${API}/contact/leads/${lead._id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l._id !== lead._id));
  };

  const openEmail = (target) => {
    setEmailTarget(target);
    setEmailForm({ subject: "", message: "" });
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject || !emailForm.message) return;
    setSending(true);
    try {
      const recipients =
        emailTarget === "bulk"
          ? leads.filter((l) => selected.has(l._id)).map((l) => l.email)
          : [emailTarget.email];
      const res = await fetch(`${API}/marketing/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailForm.subject,
          message: emailForm.message,
          recipientType: "custom",
          recipients,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: data.message || "Email sent!", type: "success" });
        setEmailTarget(null);
        setSelected(new Set());
      } else {
        setToast({ msg: data.message || "Failed to send email", type: "error" });
      }
    } catch {
      setToast({ msg: "Failed to send email", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Source", "Message", "Date"];
    const rows = filtered.map((l) => [
      l.name,
      l.email,
      l.phone,
      l.source,
      (l.message || "").replace(/,/g, " ").replace(/\n/g, " "),
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Cleaniq_Leads_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Leads
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {loading ? "Loading…" : `${leads.length} leads captured from Contact Us`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Download size={15} /> Export
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => openEmail("bulk")}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-dark transition-all"
            >
              <Send size={15} /> Email {selected.size} Selected
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 w-full md:w-80 focus-within:border-primary/50 transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
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
                <th className="px-4 py-3.5 w-12">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer accent-primary"
                  />
                </th>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Source</th>
                <th className="px-4 py-3.5">Message</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-semibold">
                    <RefreshCw size={18} className="animate-spin inline" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-300 font-semibold">
                    <Users size={32} className="mx-auto mb-3 text-slate-200" />
                    No leads yet
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selected.has(l._id)}
                        onChange={() => toggleSelect(l._id)}
                        className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-sm">{l.name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-600">{l.email}</p>
                      {l.phone && (
                        <p className="text-[11px] text-slate-400 font-medium">{l.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        {l.source}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-[220px]">
                      <p className="text-[12px] text-slate-500 truncate">{l.message}</p>
                    </td>
                    <td className="px-4 py-4 text-[11px] font-semibold text-slate-400">
                      {new Date(l.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEmail(l)}
                          title="Send email"
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <Mail size={15} />
                        </button>
                        {l.phone && (
                          <a
                            href={`tel:${l.phone}`}
                            title="Call"
                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                          >
                            <Phone size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(l)}
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

      {emailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">
                {emailTarget === "bulk"
                  ? `Email ${selected.size} Leads`
                  : `Email ${emailTarget.name}`}
              </h3>
              <button
                onClick={() => setEmailTarget(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <input
                type="text"
                required
                placeholder="Subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <textarea
                required
                placeholder="Message"
                rows={6}
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm resize-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? "Sending…" : "Send Email"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
