import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, X, Trash2, CheckSquare, Square, Pencil, Check, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_FILTERS = ["All", "Open", "In Progress", "Done", "Overdue"];
const PRIORITIES = ["All", "High", "Medium", "Low"];

const PRIORITY_STYLES = {
  High:   "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low:    "bg-blue-50 text-blue-700 border-blue-200",
};

const PRIORITY_DOT = {
  High:   "bg-red-500",
  Medium: "bg-amber-500",
  Low:    "bg-blue-500",
};

const TYPE_STYLES = {
  note:       "bg-zinc-100 text-zinc-600 border-zinc-200",
  call:       "bg-purple-50 text-purple-700 border-purple-200",
  "follow-up":"bg-green-50 text-green-700 border-green-200",
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Tasks & Notes</h1>
          <p className="text-sm text-zinc-500 mt-1">Internal team tasks, calls, and follow-ups.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
        >
          <Plus size={15} /> New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open",    val: openCount,    bg: "bg-blue-50",   color: "text-blue-700" },
          { label: "Overdue", val: overdueCount, bg: "bg-red-50",    color: "text-red-700" },
          { label: "Done",    val: doneCount,    bg: "bg-green-50",  color: "text-green-700" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4 border border-zinc-100`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New Task Form */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">New Task</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-zinc-400" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required
              placeholder="Title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400"
            />
            <textarea
              placeholder="Description"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400 resize-none"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none"
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="follow-up">Follow-up</option>
              </select>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none"
              />
              <input
                placeholder="Customer name"
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none"
              />
              <input
                placeholder="Assigned to"
                value={form.assignedTo}
                onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Create Task"}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-4">
        {/* Left panel — filters */}
        <div className="w-44 flex-shrink-0 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Status</p>
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {s}
                {s === "Overdue" && overdueCount > 0 && (
                  <span className="ml-1 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">{overdueCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Priority</p>
            {PRIORITIES.map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  priorityFilter === p ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50"
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
              <RefreshCw size={20} className="animate-spin text-zinc-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl py-16 text-center text-zinc-400">
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
                  className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                    overdue ? "border-red-300 border-l-4 border-l-red-500" : "border-zinc-200"
                  } ${done ? "opacity-60" : ""}`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editForm.title}
                        onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm font-semibold outline-none"
                      />
                      <textarea
                        rows={2}
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none resize-none"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <select
                          value={editForm.type}
                          onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                          className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs outline-none"
                        >
                          <option value="note">Note</option>
                          <option value="call">Call</option>
                          <option value="follow-up">Follow-up</option>
                        </select>
                        <select
                          value={editForm.priority}
                          onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
                          className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs outline-none"
                        >
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                        <input
                          type="date"
                          value={editForm.dueDate}
                          onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
                          className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs outline-none"
                        />
                        <input
                          placeholder="Customer"
                          value={editForm.customerName}
                          onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))}
                          className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs outline-none"
                        />
                        <input
                          placeholder="Assigned to"
                          value={editForm.assignedTo}
                          onChange={e => setEditForm(f => ({ ...f, assignedTo: e.target.value }))}
                          className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(task._id)}
                          className="flex items-center gap-1 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 transition-colors"
                        >
                          <Check size={12} /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
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
                          className={`flex-shrink-0 mt-0.5 ${done ? "text-green-500" : "text-zinc-300 hover:text-zinc-600"} transition-colors`}
                        >
                          {done ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-bold text-zinc-900 ${done ? "line-through text-zinc-400" : ""}`}>
                              {task.title}
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${TYPE_STYLES[task.type] || TYPE_STYLES.note}`}>
                              {task.type || "note"}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium}`}>
                              {task.priority || "Medium"}
                            </span>
                            {overdue && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">Overdue</span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-zinc-500 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400 flex-wrap">
                            {task.dueDate && <span>Due {fmtDate(task.dueDate)}</span>}
                            {task.customerName && <span>Customer: <span className="font-medium text-zinc-600">{task.customerName}</span></span>}
                            {task.assignedTo && <span>Assigned: <span className="font-medium text-zinc-600">{task.assignedTo}</span></span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEdit(task)}
                            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="p-1.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
  );
}
