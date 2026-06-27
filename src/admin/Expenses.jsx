import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  X,
  Wallet,
  Calendar,
  TrendingDown,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const CATEGORIES = [
  "Supplies & Equipment",
  "Fuel & Transport",
  "Marketing",
  "Rent & Utilities",
  "Insurance",
  "Software & Subscriptions",
  "Wages & Bonuses",
  "Other",
];

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "Other"];

const emptyForm = () => ({
  description: "",
  category: "Supplies & Equipment",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "Bank Transfer",
  notes: "",
});

const CATEGORY_COLORS = {
  "Supplies & Equipment": "bg-emerald-50 text-emerald-600",
  "Fuel & Transport": "bg-blue-50 text-blue-600",
  Marketing: "bg-violet-50 text-violet-600",
  "Rent & Utilities": "bg-amber-50 text-amber-600",
  Insurance: "bg-cyan-50 text-cyan-600",
  "Software & Subscriptions": "bg-indigo-50 text-indigo-600",
  "Wages & Bonuses": "bg-pink-50 text-pink-600",
  Other: "bg-slate-100 text-slate-600",
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

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchExpenses = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/expenses`).then((r) => r.json()),
      fetch(`${API}/expenses/stats`).then((r) => r.json()),
    ])
      .then(([list, statsRes]) => {
        setExpenses(Array.isArray(list) ? list : []);
        setStats(statsRes);
      })
      .catch(() => setToast({ msg: "Failed to load expenses", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => categoryFilter === "all" || e.category === categoryFilter)
      .filter((e) =>
        search
          ? e.description.toLowerCase().includes(search.toLowerCase())
          : true,
      );
  }, [expenses, search, categoryFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (expense) => {
    setEditingId(expense._id);
    setForm({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().slice(0, 10),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount || Number(form.amount) <= 0) {
      setToast({ msg: "Add a description and a valid amount", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `${API}/expenses/${editingId}`
        : `${API}/expenses`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) throw new Error("Failed to save expense");
      setShowModal(false);
      setToast({
        msg: editingId ? "Expense updated" : "Expense added",
        type: "success",
      });
      fetchExpenses();
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.description}"? You can restore it from the Bin within 30 days.`))
      return;
    try {
      await fetch(`${API}/expenses/${expense._id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e._id !== expense._id));
      setToast({ msg: "Expense moved to Bin", type: "success" });
    } catch {
      setToast({ msg: "Failed to delete expense", type: "error" });
    }
  };

  const topCategory = stats?.byCategory
    ? Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt size={22} className="text-primary" /> Expense Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Log and track business expenses — supplies, fuel, marketing, and
            more
          </p>
        </div>
        <div className="flex gap-2.5 self-start">
          <button
            onClick={fetchExpenses}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all font-semibold text-sm shadow-sm"
          >
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <Calendar size={16} />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            £{(stats?.thisMonth || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            This Month
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <TrendingDown size={16} />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            £{(stats?.thisYear || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            This Year
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
            <Wallet size={16} />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            £{(stats?.allTime || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            All Time
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Receipt size={16} />
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">
            {topCategory ? topCategory[0] : "—"}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Top Category
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] bg-slate-50/60">
                <th className="px-6 py-3.5">Description</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center font-semibold text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center font-semibold text-slate-300">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {e.description}
                      {e.notes && (
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {e.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${CATEGORY_COLORS[e.category] || "bg-slate-100 text-slate-500"}`}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-500">
                      {e.paymentMethod}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-slate-900 tabular-nums">
                      £{e.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(e)}
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(e)}
                          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all"
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

      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden border-4 border-white">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-primary-dark">
                {editingId ? "Edit Expense" : "Add Expense"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="e.g. Cleaning supplies restock"
                  className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Amount (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({ ...form, paymentMethod: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary-dark font-bold text-sm transition-all disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
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

export default Expenses;
