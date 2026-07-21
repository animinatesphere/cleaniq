import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, X, Trash2, CheckSquare, Square, Pencil, Check, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_FILTERS = ["All", "Open", "In Progress", "Done", "Overdue"];
const PRIORITIES = ["All", "High", "Medium", "Low"];

const PRIORITY_STYLES = {
  High:   "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Low:    "bg-sky-500/15 text-sky-400 border-sky-500/25",
};

const PRIORITY_DOT = {
  High:   "bg-red-500",
  Medium: "bg-amber-500",
  Low:    "bg-blue-500",
};

const TYPE_STYLES = {
  note:       "bg-white/10 text-white/60 border-white/10",
  call:       "bg-violet-500/15 text-violet-400 border-violet-500/25",
  "follow-up":"bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(task) {
  if (task.status === "Done") return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

const BLANK_FORM = {
  title: "", description: "", type: "note", priority: "Medium",
  dueDate: "", customerName: "", assignedTo: "",
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/tasks`);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = tasks.filter(t => {
    const statusMatch = statusFilter === "All" ? true :
      statusFilter === "Overdue" ? isOverdue(t) :
      (t.status || "Open") === statusFilter;
    const priorityMatch = priorityFilter === "All" ? true : (t.priority || "Medium") === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/tasks`, { ...form, status: "Open" });
      setTasks(prev => [res.data, ...prev]);
      setForm(BLANK_FORM);
      setShowForm(false);
    } catch {
      setError("Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (task) => {
    try {
      await axios.patch(`${API}/tasks/${task._id}/complete`);
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: "Done" } : t));
    } catch {
      setError("Failed to update task");
    }
  };

  const handleUnComplete = async (task) => {
    try {
      await axios.patch(`${API}/tasks/${task._id}`, { status: "Open" });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: "Open" } : t));
    } catch {
      setError("Failed to update task");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`${API}/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch {
      setError("Failed to delete task");
    }
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      type: task.type || "note",
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      customerName: task.customerName || "",
      assignedTo: task.assignedTo || "",
    });
  };

  const saveEdit = async (id) => {
    try {
      await axios.patch(`${API}/tasks/${id}`, editForm);
      setTasks(prev => prev.map(t => t._id === id ? { ...t, ...editForm } : t));
      setEditingId(null);
    } catch {
      setError("Failed to save changes");
    }
  };

  const openCount = tasks.filter(t => (t.status || "Open") === "Open").length;
  const overdueCount = tasks.filter(isOverdue).length;
  const doneCount = tasks.filter(t => t.status === "Done").length;

  return (
    <div className="min-h-screen bg-[#061A13] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            {error}
            <button onClick={() => setError("")}><X size={14} /></button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Tasks & Notes</h1>
            <p className="text-sm text-white/40 mt-1">Internal team tasks, calls, and follow-ups.</p>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Plus size={15} /> New Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Open",    val: openCount,    bg: "bg-sky-500/15",     color: "text-sky-400"     },
            { label: "Overdue", val: overdueCount, bg: "bg-rose-500/15",    color: "text-rose-400"    },
            { label: "Done",    val: doneCount,    bg: "bg-emerald-500/15", color: "text-emerald-400" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4 border border-white/10`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* New Task Form */}
        {showForm && (
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">New Task</h2>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-white/40" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                placeholder="Title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm"
              />
              <textarea
                placeholder="Description"
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm resize-none"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="px-3 py-2.5 bg-[#071D16] border border-white/10 text-white/80 focus:outline-none focus:border-emerald-500/50 rounded-xl text-sm"
                >
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="follow-up">Follow-up</option>
                </select>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="px-3 py-2.5 bg-[#071D16] border border-white/10 text-white/80 focus:outline-none focus:border-emerald-500/50 rounded-xl text-sm"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="px-3 py-2.5 bg-[#071D16] border border-white/10 text-white/80 focus:outline-none focus:border-emerald-500/50 rounded-xl text-sm"
                />
                <input
                  placeholder="Customer name"
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  className="px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 rounded-xl text-sm"
                />
                <input
                  placeholder="Assigned to"
                  value={form.assignedTo}
                  onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  className="px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Create Task"}
              </button>
            </form>
          </div>
        )}

        <div className="flex gap-4">
          {/* Left panel — filters */}
          <div className="w-44 flex-shrink-0 space-y-4">
            <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Status</p>
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    statusFilter === s ? "bg-emerald-500 text-white" : "text-white/40 hover:bg-white/5"
                  }`}
                >
                  {s}
                  {s === "Overdue" && overdueCount > 0 && (
                    <span className="ml-1 text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-full px-1.5 py-0.5">{overdueCount}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Priority</p>
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    priorityFilter === p ? "bg-emerald-500 text-white" : "text-white/40 hover:bg-white/5"
                  }`}
                >
                  {p !== "All" && (
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${PRIORITY_DOT[p]}`} />
                  )}
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="flex-1 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw size={20} className="animate-spin text-white/40" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-[#0B2D22] border border-white/7 rounded-2xl py-16 text-center text-white/40">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm font-medium">No tasks found</p>
              </div>
            ) : (
              filtered.map(task => {
                const overdue = isOverdue(task);
                const done = task.status === "Done";
                const isEditing = editingId === task._id;

                return (
                  <div
                    key={task._id}
                    className={`bg-[#0B2D22] border rounded-2xl p-5 transition-all ${
                      overdue ? "border-rose-500/25 border-l-4 border-l-rose-500" : "border-white/7"
                    } ${done ? "opacity-60" : ""}`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 rounded-xl text-sm font-semibold"
                        />
                        <textarea
                          rows={2}
                          value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 rounded-xl text-sm resize-none"
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <select
                            value={editForm.type}
                            onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                            className="px-3 py-2 bg-[#071D16] border border-white/10 text-white/80 focus:outline-none rounded-xl text-xs"
                          >
                            <option value="note">Note</option>
                            <option value="call">Call</option>
                            <option value="follow-up">Follow-up</option>
                          </select>
                          <select
                            value={editForm.priority}
                            onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
                            className="px-3 py-2 bg-[#071D16] border border-white/10 text-white/80 focus:outline-none rounded-xl text-xs"
                          >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
                            className="px-3 py-2 bg-[#071D16] border border-white/10 text-white/80 focus:outline-none rounded-xl text-xs"
                          />
                          <input
                            placeholder="Customer"
                            value={editForm.customerName}
                            onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))}
                            className="px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none rounded-xl text-xs"
                          />
                          <input
                            placeholder="Assigned to"
                            value={editForm.assignedTo}
                            onChange={e => setEditForm(f => ({ ...f, assignedTo: e.target.value }))}
                            className="px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none rounded-xl text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(task._id)}
                            className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            <Check size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => done ? handleUnComplete(task) : handleComplete(task)}
                            className={`flex-shrink-0 mt-0.5 ${done ? "text-emerald-400" : "text-white/25 hover:text-white/60"} transition-colors`}
                          >
                            {done ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-bold ${done ? "line-through text-white/40" : "text-white"}`}>
                                {task.title}
                              </p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${TYPE_STYLES[task.type] || TYPE_STYLES.note}`}>
                                {task.type || "note"}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium}`}>
                                {task.priority || "Medium"}
                              </span>
                              {overdue && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 font-bold">Overdue</span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-white/40 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-white/40 flex-wrap">
                              {task.dueDate && <span>Due {fmtDate(task.dueDate)}</span>}
                              {task.customerName && <span>Customer: <span className="font-medium text-white/80">{task.customerName}</span></span>}
                              {task.assignedTo && <span>Assigned: <span className="font-medium text-white/80">{task.assignedTo}</span></span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => startEdit(task)}
                              className="p-1.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(task._id)}
                              className="p-1.5 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
