import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, Mail, Phone, Trash2, X, Send, RefreshCw,
  Download, Users, UserPlus, MoreHorizontal,
  Calendar, MessageSquare, Globe, User,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 25;

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {msg}
    <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
  </div>
);

// ── Per-row actions dropdown ──────────────────────────────────────────────────
function RowMenu({ lead, onEmail, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden">
          <button
            onClick={() => { onEmail(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
          >
            <Mail size={13} className="text-slate-400" /> Send Email
          </button>
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              <Phone size={13} className="text-slate-400" /> Call
            </a>
          )}
          <div className="border-t border-slate-100" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-medium transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function LeadDrawer({ lead, onClose, onEmail, onDelete }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {(lead.name?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">{lead.name}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {lead.source || "Contact Form"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Contact info */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</p>

            <div className="flex items-center gap-3">
              <User size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-800">{lead.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={14} className="text-slate-400 flex-shrink-0" />
              <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline truncate">
                {lead.email}
              </a>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-slate-400 flex-shrink-0" />
                <a href={`tel:${lead.phone}`} className="text-sm text-slate-700 hover:text-primary transition-colors">
                  {lead.phone}
                </a>
              </div>
            )}

            {lead.source && (
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-600">{lead.source}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-500">Submitted {fmtDate(lead.createdAt)}</span>
            </div>
          </div>

          {/* Message */}
          {lead.message && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={11} /> Message
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{lead.message}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 space-y-2.5">
          <button
            onClick={onEmail}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
          >
            <Mail size={14} /> Send Email
          </button>
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Phone size={14} /> Call {lead.phone}
            </a>
          )}
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors"
          >
            <Trash2 size={14} /> Delete Lead
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [selectedLead, setSelectedLead] = useState(null); // drawer
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [adding, setAdding] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeads = () => {
    setLoading(true);
    fetch(`${API}/contact/leads`)
      .then(r => r.json())
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .catch(() => showToast("Failed to load leads", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) { showToast("Name and email are required", "error"); return; }
    setAdding(true);
    try {
      const res = await fetch(`${API}/contact/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Failed"); }
      showToast("Lead added");
      setShowAddModal(false);
      setAddForm({ name: "", email: "", phone: "", message: "" });
      fetchLeads();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete lead from ${lead.name}?`)) return;
    await fetch(`${API}/contact/leads/${lead._id}`, { method: "DELETE" });
    setLeads(prev => prev.filter(l => l._id !== lead._id));
    if (selectedLead?._id === lead._id) setSelectedLead(null);
    showToast("Lead deleted");
  };

  const openEmail = (target) => {
    setEmailTarget(target);
    setEmailForm({ subject: "", message: "" });
    setSelectedLead(null);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject || !emailForm.message) return;
    setSending(true);
    try {
      const recipients = emailTarget === "bulk"
        ? leads.filter(l => selected.has(l._id)).map(l => l.email)
        : [emailTarget.email];
      const res = await fetch(`${API}/marketing/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: emailForm.subject, message: emailForm.message, recipientType: "custom", recipients }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Email sent!");
        setEmailTarget(null);
        setSelected(new Set());
      } else {
        showToast(data.message || "Failed to send", "error");
      }
    } catch {
      showToast("Failed to send email", "error");
    } finally {
      setSending(false);
    }
  };

  const exportCSV = () => {
    const rows = filtered.map(l => [
      l.name, l.email, l.phone, l.source,
      (l.message || "").replace(/,/g, " ").replace(/\n/g, " "),
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csv = "data:text/csv;charset=utf-8," + [
      ["Name","Email","Phone","Source","Message","Date"].join(","),
      ...rows.map(r => r.join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.setAttribute("href", encodeURI(csv));
    a.setAttribute("download", `Cleaniq_Leads_${new Date().toLocaleDateString().replace(/\//g,"-")}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const filtered = useMemo(() => {
    if (!search) return leads;
    const s = search.toLowerCase();
    return leads.filter(l =>
      l.name?.toLowerCase().includes(s) ||
      l.email?.toLowerCase().includes(s) ||
      l.phone?.includes(s)
    );
  }, [leads, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => pageItems.every(l => selected.has(l._id)) && pageItems.length > 0
    ? setSelected(new Set())
    : setSelected(new Set(pageItems.map(l => l._id)));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Leads</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {loading ? "Loading…" : `${leads.length} lead${leads.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-dark transition-all">
            <UserPlus size={15} /> Add Lead
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
            <Download size={15} /> Export
          </button>
          {selected.size > 0 && (
            <button onClick={() => openEmail("bulk")}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-dark transition-all">
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
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-sm font-medium w-full text-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] bg-slate-50/60">
                <th className="px-4 py-3.5 w-12">
                  <input type="checkbox"
                    checked={pageItems.length > 0 && pageItems.every(l => selected.has(l._id))}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer accent-primary" />
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
                <tr><td colSpan={7} className="py-16 text-center">
                  <RefreshCw size={18} className="animate-spin inline text-slate-400" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-300 font-semibold">
                  <Users size={32} className="mx-auto mb-3 text-slate-200" />
                  No leads yet
                </td></tr>
              ) : (
                pageItems.map(l => (
                  <tr
                    key={l._id}
                    onClick={() => setSelectedLead(l)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4 w-12" onClick={e => e.stopPropagation()}>
                      <input type="checkbox"
                        checked={selected.has(l._id)}
                        onChange={() => toggleSelect(l._id)}
                        className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer accent-primary" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {(l.name?.[0] || "?").toUpperCase()}
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">{l.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-600">{l.email}</p>
                      {l.phone && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{l.phone}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        {l.source || "Form"}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-[200px]">
                      <p className="text-[12px] text-slate-500 truncate">{l.message || "—"}</p>
                    </td>
                    <td className="px-4 py-4 text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                      {fmtDate(l.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <RowMenu
                        lead={l}
                        onEmail={() => openEmail(l)}
                        onDelete={() => handleDelete(l)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/40">
            <p className="text-xs text-slate-400 font-medium">
              {filtered.length} leads · Page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors ${
                        n === safePage
                          ? "bg-primary text-white shadow-sm"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onEmail={() => openEmail(selectedLead)}
          onDelete={() => handleDelete(selectedLead)}
        />
      )}

      {/* Email modal */}
      {emailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">
                {emailTarget === "bulk" ? `Email ${selected.size} Leads` : `Email ${emailTarget.name}`}
              </h3>
              <button onClick={() => setEmailTarget(null)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <input type="text" required placeholder="Subject"
                value={emailForm.subject}
                onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              <textarea required placeholder="Message" rows={6}
                value={emailForm.message}
                onChange={e => setEmailForm({ ...emailForm, message: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm resize-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              <button type="submit" disabled={sending}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? "Sending…" : "Send Email"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add lead modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <input type="text" required placeholder="Name"
                value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              <input type="email" required placeholder="Email"
                value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              <input type="text" placeholder="Phone (optional)"
                value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              <textarea placeholder="Notes (optional)" rows={4}
                value={addForm.message} onChange={e => setAddForm({ ...addForm, message: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm resize-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              <button type="submit" disabled={adding}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {adding ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {adding ? "Adding…" : "Add Lead"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
