import { useState, useEffect } from "react";
import axios from "axios";
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight, Copy, RefreshCw,
  Users, User, CheckCircle, XCircle, Zap, Clock,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api";

const authHeader = () => {
  const token = localStorage.getItem("adminToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const badge = (coupon) => {
  if (coupon.type === "personal" && coupon.usedCount >= 1) {
    return { label: "Expired", color: "bg-rose-500/15 text-rose-400 border-rose-500/20" };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { label: "Limit Reached", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" };
  }
  if (!coupon.isActive) {
    return { label: "Inactive", color: "bg-white/10 text-white/40 border-white/10" };
  }
  return { label: "Active", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "general", code: "", discountPercent: "", maxUses: "", note: "" });
  const [copiedId, setCopiedId] = useState(null);

  const showFlash = (type, text) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/coupons`, { headers: authHeader() });
      setCoupons(res.data);
    } catch {
      showFlash("error", "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.discountPercent) return showFlash("error", "Discount % is required");
    if (form.type === "general" && !form.code.trim()) return showFlash("error", "Coupon code is required for general coupons");
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/coupons`, form, { headers: authHeader() });
      setCoupons(prev => [res.data, ...prev]);
      setForm({ type: "general", code: "", discountPercent: "", maxUses: "", note: "" });
      setShowForm(false);
      showFlash("success", form.type === "personal" ? `Personal code generated: ${res.data.code}` : "Coupon created!");
    } catch (err) {
      showFlash("error", err.response?.data?.error || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      const res = await axios.put(`${API_URL}/coupons/${coupon._id}`, { isActive: !coupon.isActive }, { headers: authHeader() });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? res.data : c));
    } catch {
      showFlash("error", "Failed to update coupon");
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`${API_URL}/coupons/${id}`, { headers: authHeader() });
      setCoupons(prev => prev.filter(c => c._id !== id));
      showFlash("success", "Coupon deleted");
    } catch {
      showFlash("error", "Failed to delete coupon");
    }
  };

  const copyCode = (coupon) => {
    navigator.clipboard.writeText(coupon.code);
    setCopiedId(coupon._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const general = coupons.filter(c => c.type === "general");
  const personal = coupons.filter(c => c.type === "personal");

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B2D22] border border-white/7 rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Tag size={22} className="text-emerald-400" />
            Coupon Codes
          </h1>
          <p className="text-white/40 text-sm mt-1">Create discount codes for ads or individual customers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl font-bold text-sm transition-all">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button onClick={() => { setShowForm(v => !v); setForm({ type: "general", code: "", discountPercent: "", maxUses: "", note: "" }); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all">
            <Plus size={16} />
            New Coupon
          </button>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold ${flash.type === "success" ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-rose-500/15 border-rose-500/25 text-rose-400"}`}>
          {flash.text}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6">
          <h2 className="text-white font-black text-lg mb-5">Create New Coupon</h2>
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Type */}
            <div className="grid grid-cols-2 gap-3">
              {["general", "personal"].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t, code: "" }))}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${form.type === t ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
                  {t === "general" ? <Users size={20} className={form.type === t ? "text-emerald-400" : "text-white/40"} /> : <User size={20} className={form.type === t ? "text-emerald-400" : "text-white/40"} />}
                  <div>
                    <p className={`font-black text-sm ${form.type === t ? "text-white" : "text-white/60"}`}>
                      {t === "general" ? "General" : "Personal"}
                    </p>
                    <p className="text-white/30 text-xs">
                      {t === "general" ? "Everyone can use (ads)" : "One-time, one person only"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Code — only for general */}
              {form.type === "general" && (
                <div>
                  <label className="text-white/40 text-xs font-black uppercase tracking-wide block mb-2">Coupon Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SUMMER20"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              )}

              {/* Discount % */}
              <div>
                <label className="text-white/40 text-xs font-black uppercase tracking-wide block mb-2">Discount %</label>
                <input
                  type="number"
                  min="1" max="100"
                  value={form.discountPercent}
                  onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Max Uses — only for general */}
              {form.type === "general" && (
                <div>
                  <label className="text-white/40 text-xs font-black uppercase tracking-wide block mb-2">Max Uses <span className="text-white/20 normal-case font-normal">(leave blank = unlimited)</span></label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="e.g. 500"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              )}

              {/* Note */}
              <div className={form.type === "personal" ? "sm:col-span-2" : ""}>
                <label className="text-white/40 text-xs font-black uppercase tracking-wide block mb-2">Note <span className="text-white/20 normal-case font-normal">(optional label)</span></label>
                <input
                  type="text"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Instagram ad — Sept 2026"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {form.type === "personal" && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm font-medium">
                <Zap size={16} />
                A unique code will be auto-generated. It can only be used once.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-sm transition-all disabled:opacity-50">
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                {form.type === "personal" ? "Generate Code" : "Create Coupon"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 rounded-xl font-bold text-sm transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="py-20 flex flex-col items-center text-white/40">
          <RefreshCw size={28} className="animate-spin mb-3 text-emerald-400" />
          <p className="font-semibold text-sm">Loading coupons...</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {/* General Coupons */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users size={18} className="text-emerald-400" />
              <h2 className="text-white font-black text-lg">General Coupons</h2>
              <span className="text-[10px] font-black text-white/30 bg-white/5 px-2 py-1 rounded-full">{general.length}</span>
            </div>
            {general.length === 0 ? (
              <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-8 text-center">
                <Tag size={32} className="mx-auto mb-3 text-white/20" />
                <p className="text-white/30 text-sm font-semibold">No general coupons yet</p>
                <p className="text-white/20 text-xs mt-1">Create one for your ads campaigns</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {general.map(c => <CouponCard key={c._id} coupon={c} onToggle={toggleActive} onDelete={deleteCoupon} onCopy={copyCode} copiedId={copiedId} />)}
              </div>
            )}
          </section>

          {/* Personal Coupons */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <User size={18} className="text-emerald-400" />
              <h2 className="text-white font-black text-lg">Personal Codes</h2>
              <span className="text-[10px] font-black text-white/30 bg-white/5 px-2 py-1 rounded-full">{personal.length}</span>
            </div>
            {personal.length === 0 ? (
              <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-8 text-center">
                <User size={32} className="mx-auto mb-3 text-white/20" />
                <p className="text-white/30 text-sm font-semibold">No personal codes yet</p>
                <p className="text-white/20 text-xs mt-1">Generate a one-time code for a specific customer</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personal.map(c => <CouponCard key={c._id} coupon={c} onToggle={null} onDelete={deleteCoupon} onCopy={copyCode} copiedId={copiedId} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CouponCard({ coupon, onToggle, onDelete, onCopy, copiedId }) {
  const { label, color } = badge(coupon);
  const isExpired = (coupon.type === "personal" && coupon.usedCount >= 1) ||
    (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses);

  return (
    <div className={`bg-[#0B2D22] border rounded-2xl p-5 transition-all ${isExpired ? "border-white/5 opacity-60" : "border-white/7 hover:border-white/12"}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`font-black text-lg tracking-widest text-white font-mono ${isExpired ? "line-through opacity-50" : ""}`}>
            {coupon.code}
          </div>
          <button onClick={() => onCopy(coupon)} title="Copy code"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
            {copiedId === coupon._id ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border ${color}`}>
          {label}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-emerald-400 font-black text-sm">
          {coupon.discountPercent}% off
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white/60 text-xs font-bold flex items-center gap-1.5">
          <Users size={12} />
          {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ""} used
        </div>
        {coupon.type === "personal" && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <User size={12} /> One-time
          </div>
        )}
      </div>

      {coupon.note && (
        <p className="text-white/30 text-xs mb-4 leading-relaxed">{coupon.note}</p>
      )}

      {coupon.usedBy?.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-wide">Used by</p>
          {coupon.usedBy.slice(-3).map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-white/40 font-medium">
              <Clock size={11} />
              {u.email}
              {u.usedAt && <span className="text-white/20">{new Date(u.usedAt).toLocaleDateString()}</span>}
            </div>
          ))}
          {coupon.usedBy.length > 3 && (
            <p className="text-white/20 text-xs">+{coupon.usedBy.length - 3} more</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-white/[0.04]">
        {onToggle && coupon.type === "general" && !isExpired && (
          <button onClick={() => onToggle(coupon)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${coupon.isActive ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"}`}>
            {coupon.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {coupon.isActive ? "On — Click to Turn Off" : "Off — Click to Turn On"}
          </button>
        )}
        <button onClick={() => onDelete(coupon._id)}
          className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
