import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Calendar, Mail, Phone, Tag, X, Plus, RefreshCw,
  CheckCircle2, Clock, FileText, Star
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ALL_TAGS = ["VIP", "Regular", "Commercial", "At Risk", "Residential", "Referred", "Loyal"];

const TAG_STYLES = {
  VIP:         "bg-amber-50 text-amber-700 border-amber-200",
  Regular:     "bg-blue-50 text-blue-700 border-blue-200",
  Commercial:  "bg-purple-50 text-purple-700 border-purple-200",
  "At Risk":   "bg-red-50 text-red-700 border-red-200",
  Residential: "bg-green-50 text-green-700 border-green-200",
  Referred:    "bg-cyan-50 text-cyan-700 border-cyan-200",
  Loyal:       "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const SEGMENT_STYLES = {
  VIP:      "bg-amber-50 text-amber-700 border-amber-200",
  Regular:  "bg-blue-50 text-blue-700 border-blue-200",
  New:      "bg-green-50 text-green-700 border-green-200",
  "At Risk":"bg-red-50 text-red-700 border-red-200",
};

const BOOKING_STATUS_STYLES = {
  Confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  Completed:  "bg-green-50 text-green-700 border-green-200",
  Cancelled:  "bg-red-50 text-red-700 border-red-200",
  Pending:    "bg-amber-50 text-amber-700 border-amber-200",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(v) {
  if (!v && v !== 0) return "—";
  return `£${Number(v).toFixed(2)}`;
}

function TimelineIcon({ type }) {
  const base = "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0";
  if (type === "booking") return <div className={`${base} bg-blue-50 text-blue-600`}><Calendar size={14} /></div>;
  if (type === "email")   return <div className={`${base} bg-green-50 text-green-600`}><Mail size={14} /></div>;
  if (type === "quote")   return <div className={`${base} bg-amber-50 text-amber-600`}><FileText size={14} /></div>;
  if (type === "review")  return <div className={`${base} bg-purple-50 text-purple-600`}><Star size={14} /></div>;
  return <div className={`${base} bg-zinc-100 text-zinc-500`}><Clock size={14} /></div>;
}

export default function CustomerProfile() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("timeline");
  const [editingTags, setEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [savingTags, setSavingTags] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        axios.get(`${API}/customers/${id}`),
        axios.get(`${API}/customers/${id}/timeline`).catch(() => ({ data: [] })),
      ]);
      setCustomer(cRes.data);
      setSelectedTags(cRes.data?.tags || []);
      setTimeline(Array.isArray(tRes.data) ? tRes.data : []);
    } catch {
      setError("Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tasks?customerId=${id}`);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch {
      // tasks endpoint may not support customerId filter — graceful degradation
      setTasks([]);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (tab === "notes") fetchTasks(); }, [tab, fetchTasks]);

  const handleSaveTags = async () => {
    setSavingTags(true);
    try {
      await axios.patch(`${API}/customers/${id}/tags`, { tags: selectedTags });
      setCustomer(c => ({ ...c, tags: selectedTags }));
      setEditingTags(false);
    } catch {
      setError("Failed to save tags");
    } finally {
      setSavingTags(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await axios.post(`${API}/tasks`, {
        title: noteText,
        type: "note",
        customerName: `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
        customerId: id,
        status: "Open",
        priority: "Low",
      });
      setTasks(prev => [res.data, ...prev]);
      setNoteText("");
    } catch {
      setError("Failed to add note");
    } finally {
      setSavingNote(false);
    }
  };

  // Extract bookings from timeline
  const bookings = timeline.filter(e => e.type === "booking" || e.bookingRef);

  // Total spent calculation from bookings
  const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.totalPrice || b.amount || 0)), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">Customer not found.</p>
        <Link to="/admin/customers" className="text-sm text-zinc-700 underline mt-2 block">Back to Customers</Link>
      </div>
    );
  }

  const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.name || "—";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Back link */}
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Customers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar — customer card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl font-black text-zinc-400">
              {fullName.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-lg font-black text-zinc-900">{fullName}</h2>
              {customer.segment && (
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-bold mt-1 ${SEGMENT_STYLES[customer.segment] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                  {customer.segment}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {customer.email && (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Mail size={13} className="text-zinc-400 flex-shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Phone size={13} className="text-zinc-400 flex-shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.createdAt && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Calendar size={13} className="text-zinc-400 flex-shrink-0" />
                  <span>Since {fmtDate(customer.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-lg font-black text-zinc-900">{bookings.length}</p>
                <p className="text-[10px] text-zinc-400 font-medium">Bookings</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-base font-black text-zinc-900">{fmtCurrency(customer.totalSpent || totalSpent)}</p>
                <p className="text-[10px] text-zinc-400 font-medium">Spent</p>
              </div>
            </div>

            {/* Tags */}
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <Tag size={11} /> Tags
                </div>
                <button
                  onClick={() => setEditingTags(e => !e)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {editingTags ? "Cancel" : "Edit"}
                </button>
              </div>

              {editingTags ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] px-2 py-1 rounded-full border font-bold transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveTags}
                    disabled={savingTags}
                    className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    {savingTags ? "Saving…" : "Save Tags"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(customer.tags || []).length > 0 ? (
                    customer.tags.map(tag => (
                      <span
                        key={tag}
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${TAG_STYLES[tag] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400">No tags</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — tabs area */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-zinc-100 px-6 flex gap-1 pt-2">
              {[
                { key: "timeline", label: "Timeline" },
                { key: "bookings", label: `Bookings (${bookings.length})` },
                { key: "notes",    label: "Notes" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                    tab === t.key
                      ? "border-zinc-900 text-zinc-900"
                      : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={fetchAll} className="py-2 px-3 text-zinc-400 hover:text-zinc-700 transition-colors">
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Timeline tab */}
            {tab === "timeline" && (
              <div className="p-6">
                {timeline.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400">
                    <Clock size={28} className="mx-auto mb-3 text-zinc-300" />
                    <p className="text-sm font-medium">No timeline activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((entry, i) => (
                      <div key={entry._id || i} className="flex items-start gap-4">
                        <TimelineIcon type={entry.type} />
                        <div className="flex-1 min-w-0 pb-4 border-b border-zinc-50 last:border-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{entry.title || entry.service || entry.type}</p>
                              {entry.description && (
                                <p className="text-xs text-zinc-500 mt-0.5">{entry.description}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {entry.status && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${BOOKING_STATUS_STYLES[entry.status] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                  {entry.status}
                                </span>
                              )}
                              <p className="text-[11px] text-zinc-400 mt-1">{fmtDate(entry.date || entry.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bookings tab */}
            {tab === "bookings" && (
              <div className="p-6">
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400">
                    <Calendar size={28} className="mx-auto mb-3 text-zinc-300" />
                    <p className="text-sm font-medium">No bookings yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b, i) => (
                      <div key={b._id || i} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-zinc-900">{b.service || b.title || "Booking"}</p>
                            {b.status && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${BOOKING_STATUS_STYLES[b.status] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                {b.status}
                              </span>
                            )}
                          </div>
                          {b.bookingRef && (
                            <p className="text-xs font-mono text-zinc-400 mt-0.5">{b.bookingRef}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {(b.totalPrice || b.amount) && (
                            <p className="text-sm font-black text-zinc-900">{fmtCurrency(b.totalPrice || b.amount)}</p>
                          )}
                          <p className="text-xs text-zinc-400">{fmtDate(b.date || b.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes tab */}
            {tab === "notes" && (
              <div className="p-6 space-y-4">
                {/* Add note form */}
                <form onSubmit={handleAddNote} className="flex gap-3">
                  <input
                    placeholder="Add a note about this customer…"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !noteText.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    <Plus size={14} /> {savingNote ? "…" : "Add"}
                  </button>
                </form>

                {/* Notes list */}
                {tasks.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400">
                    <FileText size={24} className="mx-auto mb-2 text-zinc-300" />
                    <p className="text-sm font-medium">No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map(t => (
                      <div key={t._id} className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <CheckCircle2 size={15} className={t.status === "Done" ? "text-green-500 flex-shrink-0 mt-0.5" : "text-zinc-300 flex-shrink-0 mt-0.5"} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${t.status === "Done" ? "text-zinc-400 line-through" : "text-zinc-800"}`}>
                            {t.title}
                          </p>
                          {t.description && <p className="text-xs text-zinc-500 mt-0.5">{t.description}</p>}
                          <p className="text-[11px] text-zinc-400 mt-1">{fmtDate(t.createdAt)}</p>
                        </div>
                        {t.assignedTo && (
                          <span className="text-[10px] text-zinc-400 font-medium flex-shrink-0">{t.assignedTo}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
