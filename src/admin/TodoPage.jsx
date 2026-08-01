import React, { useState, useEffect, useRef } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Flag,
  X,
  GripVertical,
} from "lucide-react";

const PRIORITIES = [
  { key: "high",   label: "High",   color: "text-rose-400",   bg: "bg-rose-500/15 border-rose-400/30"   },
  { key: "medium", label: "Medium", color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-400/30"  },
  { key: "low",    label: "Low",    color: "text-sky-400",    bg: "bg-sky-500/15 border-sky-400/30"    },
];

const STORAGE_KEY = "cleaniq_todos";

const loadTodos = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const saveTodos = (todos) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function TodoPage() {
  const [todos, setTodos] = useState(loadTodos);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const inputRef = useRef(null);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const add = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      { id: uid(), text: trimmed, priority, done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setText("");
    inputRef.current?.focus();
  };

  const toggle = (id) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const remove = (id) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  const clearDone = () =>
    setTodos((prev) => prev.filter((t) => !t.done));

  const displayed = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const doneCount   = todos.filter((t) => t.done).length;
  const activeCount = todos.filter((t) => !t.done).length;

  const prioMeta = (key) => PRIORITIES.find((p) => p.key === key) || PRIORITIES[1];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <CheckSquare size={22} className="text-emerald-400" />
          To-Do List
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {activeCount} task{activeCount !== 1 ? "s" : ""} remaining
          {doneCount > 0 && ` · ${doneCount} done`}
        </p>
      </div>

      {/* Add task */}
      <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-4 space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/50 focus:outline-none text-sm font-medium"
          />
          <button
            onClick={add}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Priority picker */}
        <div className="flex items-center gap-2">
          <Flag size={13} className="text-white/30 shrink-0" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider mr-1">Priority:</span>
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              onClick={() => setPriority(p.key)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                priority === p.key
                  ? `${p.bg} ${p.color}`
                  : "bg-white/5 text-white/30 border-white/10 hover:bg-white/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[
            { key: "all",    label: "All",    count: todos.length },
            { key: "active", label: "Active", count: activeCount },
            { key: "done",   label: "Done",   count: doneCount   },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filter === f.key
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60"
              }`}
            >
              {f.label} {f.count > 0 && <span className="opacity-60">({f.count})</span>}
            </button>
          ))}
        </div>
        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="text-[11px] font-semibold text-white/30 hover:text-rose-400 transition-colors"
          >
            Clear done
          </button>
        )}
      </div>

      {/* Todo list */}
      <div className="space-y-2">
        {displayed.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">
              {filter === "done" ? "🎉" : "📝"}
            </div>
            <p className="text-white/30 font-semibold text-sm">
              {filter === "done" ? "Nothing completed yet" : "No tasks here"}
            </p>
            {filter === "all" && (
              <p className="text-white/20 text-xs mt-1">Add your first task above</p>
            )}
          </div>
        )}

        {displayed.map((todo) => {
          const pMeta = prioMeta(todo.priority);
          return (
            <div
              key={todo.id}
              className={`group flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                todo.done
                  ? "bg-white/[0.02] border-white/[0.04] opacity-50"
                  : "bg-[#0B2D22] border-white/[0.07] hover:border-white/[0.12]"
              }`}
            >
              <button
                onClick={() => toggle(todo.id)}
                className="mt-0.5 shrink-0 text-white/40 hover:text-emerald-400 transition-colors"
              >
                {todo.done
                  ? <CheckSquare size={18} className="text-emerald-400" />
                  : <Square size={18} />
                }
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${todo.done ? "line-through text-white/30" : "text-white/85"}`}>
                  {todo.text}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${pMeta.bg} ${pMeta.color}`}>
                    {pMeta.label}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {new Date(todo.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => remove(todo.id)}
                className="shrink-0 mt-0.5 p-1.5 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {todos.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-wider">
            <span>Progress</span>
            <span>{doneCount}/{todos.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${todos.length ? (doneCount / todos.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
