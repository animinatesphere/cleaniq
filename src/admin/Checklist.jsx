import React, { useState, useEffect, useMemo } from "react";
import {
  Search, ListChecks, CheckCircle2, Circle, RefreshCw,
  Calendar, User, Send, Plus, Pencil, Trash2, Check, X, Mail,
  ChevronDown, ChevronUp,
} from "lucide-react";
import logo from "../assets/logo DP.jpg";

const API = import.meta.env.VITE_API_URL;

const getDefaultTasks = (service) => {
  const name = (service || "").toLowerCase();
  if (name.includes("tenancy") || name.includes("deep")) {
    return [
      "Dust ceiling corners & light fixtures",
      "Deep clean inside cupboards & oven",
      "Scrub bath, tiles & shower cabin",
      "Clean inside windows & window sills",
      "Clean doors, skirting boards & door frames",
      "Vacuum and mop all floor surfaces",
      "Descale taps, showerhead & toilet",
      "Empty and clean all bins",
      "Check all rooms for any items left behind",
    ];
  }
  if (name.includes("airbnb") || name.includes("commercial")) {
    return [
      "Replace all bed linen and towels",
      "Restock bathroom consumables (soap, toilet roll)",
      "Dust all surfaces and furniture",
      "Clean bathroom — scrub toilet, sink, bath/shower",
      "Wipe kitchen worktops, hob & appliances",
      "Vacuum all carpets and rugs",
      "Mop hard floor surfaces",
      "Empty all bins and replace bin liners",
      "Check for lost property and damage",
      "Take before and after photos",
    ];
  }
  return [
    "Dust and polish all hard surfaces",
    "Empty bins and replace liners",
    "Vacuum all rugs and carpets",
    "Scrub toilet, sink and shower/bath",
    "Wipe down kitchen exterior worktops",
    "Clean kitchen appliance exteriors",
    "Mop hard floors",
  ];
};

const isRealBooking = (b) =>
  b.status !== "Blackout" && b.customer?.firstName !== "ADMIN_BLOCK";

const Toast = ({ msg, type, onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold transition-all ${
      type === "error" ? "bg-rose-600" : "bg-emerald-600"
    }`}
  >
    {msg}
    <button onClick={onClose} className="opacity-60 hover:opacity-100">
      <X size={14} />
    </button>
  </div>
);

const Checklist = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Edit state: which cell is being edited
  const [editKey, setEditKey] = useState(null); // { bookingId, idx }
  const [editText, setEditText] = useState("");

  // Add task state per booking
  const [addingTo, setAddingTo] = useState(null); // bookingId
  const [newTaskText, setNewTaskText] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const tasksFor = (booking) =>
    booking.checklist && booking.checklist.length > 0
      ? booking.checklist
      : getDefaultTasks(booking.service).map((task) => ({ task, done: false }));

  // ── Persist checklist to API ──────────────────────────────────────────────
  const saveChecklist = async (bookingId, tasks) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: tasks }),
      });
      const updated = await res.json();
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
    } catch {
      showToast("Failed to save — check your connection", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle done ───────────────────────────────────────────────────────────
  const toggleTask = (booking, idx) => {
    const tasks = tasksFor(booking).map((t, i) =>
      i === idx ? { ...t, done: !t.done } : t
    );
    saveChecklist(booking._id, tasks);
  };

  // ── Edit task text ────────────────────────────────────────────────────────
  const startEdit = (booking, idx) => {
    setEditKey({ bookingId: booking._id, idx });
    setEditText(tasksFor(booking)[idx].task);
  };
  const confirmEdit = (booking) => {
    if (!editText.trim()) { cancelEdit(); return; }
    const tasks = tasksFor(booking).map((t, i) =>
      i === editKey.idx ? { ...t, task: editText.trim() } : t
    );
    saveChecklist(booking._id, tasks);
    cancelEdit();
  };
  const cancelEdit = () => { setEditKey(null); setEditText(""); };

  // ── Delete task ───────────────────────────────────────────────────────────
  const deleteTask = (booking, idx) => {
    if (!window.confirm(`Remove task: "${tasksFor(booking)[idx].task}"?`)) return;
    const tasks = tasksFor(booking).filter((_, i) => i !== idx);
    saveChecklist(booking._id, tasks);
  };

  // ── Add task ──────────────────────────────────────────────────────────────
  const startAdd = (bookingId) => {
    setAddingTo(bookingId);
    setNewTaskText("");
  };
  const confirmAdd = (booking) => {
    if (!newTaskText.trim()) { setAddingTo(null); return; }
    const tasks = [...tasksFor(booking), { task: newTaskText.trim(), done: false }];
    saveChecklist(booking._id, tasks);
    setAddingTo(null);
    setNewTaskText("");
  };

  // ── Send checklist to customer by email ──────────────────────────────────
  const sendChecklist = async (booking) => {
    setSendingId(booking._id);
    const tasks = tasksFor(booking);
    const doneCount = tasks.filter((t) => t.done).length;

    const taskRows = tasks
      .map(
        (t, i) =>
          `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">
            <td style="padding:10px 20px;font-size:13px;color:${t.done ? "#94a3b8" : "#1e293b"};${t.done ? "text-decoration:line-through;" : ""}">
              ${t.done ? "✅" : "⬜"} ${t.task}
            </td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;color:#1e293b;background:#f1f5f9;">
  <div style="background:#0A5C43;padding:28px 36px;border-radius:14px 14px 0 0;display:flex;align-items:center;gap:16px;">
    <div>
      <h2 style="color:#fff;margin:0;font-size:20px;font-weight:900;">Cleaning Checklist</h2>
      <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;">Booking ${booking.bookingId} &middot; ${booking.service}</p>
    </div>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:28px 36px;border-radius:0 0 14px 14px;">
    <p style="font-size:14px;color:#475569;margin:0 0 6px;">
      Dear <strong>${booking.customer?.firstName || "Customer"}</strong>,
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">
      Here is the cleaning checklist for your booking on
      <strong>${booking.schedule?.date ? new Date(booking.schedule.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "your scheduled date"}</strong>.
      ${doneCount > 0 ? `<br/><br/><strong>${doneCount} of ${tasks.length}</strong> tasks have been completed so far.` : ""}
    </p>
    <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr style="background:#0A5C43;">
        <th style="padding:10px 20px;text-align:left;color:#fff;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;">Task</th>
      </tr>
      ${taskRows}
    </table>
    <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:10px;border:1px solid #d1fae5;">
      <p style="margin:0;font-size:13px;color:#166534;font-weight:600;">
        Progress: ${doneCount}/${tasks.length} tasks completed ${doneCount === tasks.length ? "✅ All done!" : ""}
      </p>
    </div>
    <p style="font-size:11px;color:#94a3b8;margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;">
      Cleaniq Services &middot; info@cleaniqservices.com &middot; +44 7752 476368
    </p>
  </div>
</body></html>`;

    try {
      const recipients = [booking.customer?.email].filter(Boolean);
      await Promise.all(
        recipients.map((to) =>
          fetch(`${API}/email-logs/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to,
              subject: `Your Cleaning Checklist — ${booking.bookingId}`,
              html,
            }),
          })
        )
      );
      showToast(`Checklist sent to ${booking.customer?.email || "customer"}`);
    } catch {
      showToast("Failed to send checklist", "error");
    } finally {
      setSendingId(null);
    }
  };

  const fetchBookings = () => {
    setLoading(true);
    fetch(`${API}/bookings`)
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const upcoming = useMemo(() => {
    return bookings
      .filter(isRealBooking)
      .filter((b) => b.status !== "Cancelled")
      .filter((b) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          b.bookingId?.toLowerCase().includes(s) ||
          b.customer?.firstName?.toLowerCase().includes(s) ||
          b.customer?.lastName?.toLowerCase().includes(s) ||
          b.service?.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => new Date(a.schedule?.date) - new Date(b.schedule?.date));
  }, [bookings, search]);

  return (
    <div className="space-y-6 pb-24">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B2D22] border border-white/7 p-8">
        <div className="absolute inset-0 opacity-[0.06]">
          <ListChecks size={300} className="absolute -right-10 -bottom-10 text-white" />
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <img src={logo} alt="Cleaniq Services" className="h-14 rounded-2xl shadow-lg shadow-black/30 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Cleaning Checklists</h1>
              <p className="text-sm text-white/40 mt-1">Edit tasks per booking and send directly to customers</p>
            </div>
          </div>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-sm font-bold transition-all flex-shrink-0"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by booking, customer or service…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {/* ── Booking list ─────────────────────────────────────── */}
      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl divide-y divide-white/[0.04] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-white/40 flex items-center justify-center gap-2">
            <RefreshCw size={15} className="animate-spin" /> Loading bookings…
          </div>
        ) : upcoming.length === 0 ? (
          <p className="p-12 text-center text-sm text-white/40">No bookings found</p>
        ) : (
          upcoming.map((booking) => {
            const tasks = tasksFor(booking);
            const doneCount = tasks.filter((t) => t.done).length;
            const isOpen = openId === booking._id;
            const allDone = doneCount === tasks.length;
            const isAdding = addingTo === booking._id;

            return (
              <div key={booking._id}>
                {/* Row header */}
                <button
                  onClick={() => setOpenId(isOpen ? null : booking._id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-md">
                        {booking.bookingId}
                      </span>
                      <span className="text-white/80 font-semibold">{booking.service}</span>
                    </p>
                    <p className="text-[11px] text-white/40 mt-1.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {booking.schedule?.date
                          ? new Date(booking.schedule.date).toLocaleDateString("en-GB")
                          : "No date"}
                      </span>
                      {booking.customer?.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={10} />
                          {booking.customer.email}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Progress pill */}
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${allDone ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-white/10 text-white/60"}`}>
                      {doneCount}/{tasks.length} done
                    </span>

                    {/* Progress bar mini */}
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: tasks.length ? `${(doneCount / tasks.length) * 100}%` : "0%" }}
                      />
                    </div>

                    {/* Send to customer */}
                    <button
                      onClick={(e) => { e.stopPropagation(); sendChecklist(booking); }}
                      disabled={sendingId === booking._id}
                      title="Send checklist to customer by email"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
                    >
                      <Send size={12} className={sendingId === booking._id ? "animate-pulse" : ""} />
                      Send
                    </button>

                    {/* Expand chevron */}
                    {isOpen
                      ? <ChevronUp size={16} className="text-white/40" />
                      : <ChevronDown size={16} className="text-white/40" />
                    }
                  </div>
                </button>

                {/* Expanded checklist */}
                {isOpen && (
                  <div className="px-5 pb-5">
                    {/* Progress bar full */}
                    <div className="h-1.5 w-full bg-white/10 rounded-full mb-4 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: tasks.length ? `${(doneCount / tasks.length) * 100}%` : "0%" }}
                      />
                    </div>

                    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.04] overflow-hidden">
                      {tasks.map((t, idx) => {
                        const isEditing = editKey?.bookingId === booking._id && editKey?.idx === idx;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 transition-colors ${t.done && !isEditing ? "bg-emerald-500/10" : "hover:bg-white/[0.04]"}`}
                          >
                            {isEditing ? (
                              /* Edit mode */
                              <>
                                <input
                                  autoFocus
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmEdit(booking);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-500/50 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                                />
                                <button
                                  onClick={() => confirmEdit(booking)}
                                  disabled={saving}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white transition-colors flex-shrink-0"
                                >
                                  <Check size={14} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors flex-shrink-0"
                                >
                                  <X size={14} strokeWidth={2.5} />
                                </button>
                              </>
                            ) : (
                              /* Normal mode */
                              <>
                                <button
                                  onClick={() => toggleTask(booking, idx)}
                                  disabled={saving}
                                  className="flex-shrink-0 disabled:opacity-50"
                                >
                                  {t.done
                                    ? <CheckCircle2 size={19} className="text-emerald-500" />
                                    : <Circle size={19} className="text-white/25 hover:text-emerald-400 transition-colors" />
                                  }
                                </button>
                                <span className={`flex-1 text-sm font-medium ${t.done ? "text-white/40 line-through" : "text-white/80"}`}>
                                  {t.task}
                                </span>
                                <button
                                  onClick={() => startEdit(booking, idx)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex-shrink-0"
                                  title="Edit task"
                                >
                                  <Pencil size={13} strokeWidth={2} />
                                </button>
                                <button
                                  onClick={() => deleteTask(booking, idx)}
                                  disabled={saving}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
                                  title="Delete task"
                                >
                                  <Trash2 size={13} strokeWidth={2} />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}

                      {/* Add task row */}
                      {isAdding ? (
                        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border-t border-white/[0.04]">
                          <div className="w-5 h-5 rounded-full border-2 border-dashed border-emerald-500/30 flex-shrink-0" />
                          <input
                            autoFocus
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmAdd(booking);
                              if (e.key === "Escape") setAddingTo(null);
                            }}
                            placeholder="Type a new task…"
                            className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-500/50 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                          />
                          <button
                            onClick={() => confirmAdd(booking)}
                            disabled={saving}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white transition-colors flex-shrink-0"
                          >
                            <Check size={14} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => setAddingTo(null)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors flex-shrink-0"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startAdd(booking._id)}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors border-t border-white/[0.04]"
                        >
                          <Plus size={15} strokeWidth={2.5} />
                          Add task
                        </button>
                      )}
                    </div>

                    {/* Send button */}
                    <div className="flex items-center justify-between mt-3 pt-3">
                      <p className="text-[11px] text-white/40">
                        {doneCount}/{tasks.length} tasks completed
                        {allDone && <span className="ml-1 text-emerald-400 font-bold">— All done! 🎉</span>}
                      </p>
                      <button
                        onClick={() => sendChecklist(booking)}
                        disabled={sendingId === booking._id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all disabled:opacity-60"
                      >
                        {sendingId === booking._id
                          ? <RefreshCw size={13} className="animate-spin" />
                          : <Send size={13} />
                        }
                        {sendingId === booking._id ? "Sending…" : "Send Checklist to Customer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Checklist;
