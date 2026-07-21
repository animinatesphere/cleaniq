import React, { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  RotateCcw,
  Search,
  RefreshCw,
  AlertTriangle,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const TYPE_LABELS = {
  Booking: "Booking",
  Lead: "Lead",
  Customer: "Customer",
  Worker: "Staff",
  Quote: "Quote",
  BlogPost: "Blog Post",
  Service: "Service",
  Expense: "Expense",
};

const TYPE_COLORS = {
  Booking:  "bg-blue-500/15 text-blue-400 border border-blue-500/25",
  Lead:     "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  Customer: "bg-purple-500/15 text-purple-400 border border-purple-500/25",
  Worker:   "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  Quote:    "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25",
  BlogPost: "bg-pink-500/15 text-pink-400 border border-pink-500/25",
  Service:  "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25",
  Expense:  "bg-orange-500/15 text-orange-400 border border-orange-500/25",
};

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

const Bin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    fetch(`${API}/trash`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setToast({ msg: "Failed to load bin", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((i) => typeFilter === "all" || i.entityType === typeFilter)
      .filter((i) =>
        search ? i.label?.toLowerCase().includes(search.toLowerCase()) : true,
      );
  }, [items, search, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts = {};
    items.forEach((i) => {
      counts[i.entityType] = (counts[i.entityType] || 0) + 1;
    });
    return counts;
  }, [items]);

  const handleRestore = async (item) => {
    setBusyId(item._id);
    try {
      const res = await fetch(`${API}/trash/${item._id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      setToast({
        msg: `${TYPE_LABELS[item.entityType]} restored successfully`,
        type: "success",
      });
    } catch (err) {
      setToast({ msg: err.message || "Restore failed", type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const handlePurge = async (item) => {
    if (
      !window.confirm(
        `Permanently delete "${item.label}"? This cannot be undone.`,
      )
    )
      return;
    setBusyId(item._id);
    try {
      await fetch(`${API}/trash/${item._id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      setToast({ msg: "Permanently deleted", type: "success" });
    } catch {
      setToast({ msg: "Failed to delete", type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const handleEmptyBin = async () => {
    if (
      !window.confirm(
        `Permanently delete all ${items.length} item(s) in the bin? This cannot be undone.`,
      )
    )
      return;
    try {
      await fetch(`${API}/trash`, { method: "DELETE" });
      setItems([]);
      setToast({ msg: "Bin emptied", type: "success" });
    } catch {
      setToast({ msg: "Failed to empty bin", type: "error" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trash2 size={22} className="text-emerald-400" /> Bin
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Deleted items are kept here for 30 days before being permanently
            removed
          </p>
        </div>
        <div className="flex gap-2.5 self-start">
          {items.length > 0 && (
            <button
              onClick={handleEmptyBin}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 transition-all font-semibold text-sm"
            >
              <Trash2 size={15} /> Empty Bin
            </button>
          )}
          <button
            onClick={fetchItems}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-all font-semibold text-sm shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-50">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deleted items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 focus:border-emerald-500/50 focus:outline-none text-sm font-semibold"
        >
          <option value="all">All types ({items.length})</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label} ({typeCounts[key] || 0})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-white/40">
            Loading bin...
          </p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/25 flex flex-col items-center gap-2">
            <Trash2 size={28} className="text-white/10" />
            Bin is empty
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-b-0"
            >
              <div className="min-w-0 flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${TYPE_COLORS[item.entityType] || "bg-white/10 text-white/60 border border-white/10"}`}
                >
                  {TYPE_LABELS[item.entityType] || item.entityType}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {item.label || item.originalId}
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Deleted{" "}
                    {new Date(item.deletedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={busyId === item._id}
                  onClick={() => handleRestore(item)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all font-semibold text-xs disabled:opacity-50"
                  title="Restore to where it came from"
                >
                  <RotateCcw size={13} /> Restore
                </button>
                <button
                  disabled={busyId === item._id}
                  onClick={() => handlePurge(item)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-rose-500/15 hover:border-rose-500/25 hover:text-rose-400 transition-all font-semibold text-xs disabled:opacity-50"
                  title="Permanently delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <p className="flex items-center gap-2 text-[11px] text-white/40 font-medium">
          <AlertTriangle size={12} />
          Items are permanently and automatically removed 30 days after
          deletion.
        </p>
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Bin;
