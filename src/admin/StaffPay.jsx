import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  DollarSign, Save, X, AlertCircle, Briefcase, Edit3,
  RefreshCw, Settings, TrendingUp, Users, Check,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api";

const authHeaders = () => {
  const token = localStorage.getItem("adminToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const StaffPay = () => {
  const [services, setServices]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [savingId, setSavingId]       = useState(null);
  const [statusMsg, setStatusMsg]     = useState({ type: "", text: "" });
  const [editMap, setEditMap]         = useState({});
  const [editingId, setEditingId]     = useState(null);
  const [defaultRate, setDefaultRate] = useState("");
  const [savingRate, setSavingRate]   = useState(false);
  const [editingRate, setEditingRate] = useState(false);

  const flash = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 3500);
  };

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/services`, { headers: authHeaders() });
      setServices(res.data || []);
    } catch (err) {
      flash("error", "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDefaultRate = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`, { headers: authHeaders() });
      const settings = res.data || [];
      const found = settings.find(s => s.key === "defaultWorkerRate");
      setDefaultRate(found ? String(found.value) : "13");
    } catch {}
  }, []);

  useEffect(() => {
    fetchServices();
    fetchDefaultRate();
  }, [fetchServices, fetchDefaultRate]);

  const handleSaveDefaultRate = async () => {
    setSavingRate(true);
    try {
      await axios.post(`${API_URL}/settings`, {
        key: "defaultWorkerRate",
        value: parseFloat(defaultRate) || 13,
      }, { headers: authHeaders() });
      flash("success", `Standard rate updated to £${parseFloat(defaultRate).toFixed(2)}/hr`);
      setEditingRate(false);
    } catch {
      flash("error", "Failed to save standard rate");
    } finally {
      setSavingRate(false);
    }
  };

  const startEdit = (service) => {
    setEditingId(service._id);
    setEditMap(prev => ({
      ...prev,
      [service._id]: { workerHourlyRate: service.workerHourlyRate ?? 0 },
    }));
  };

  const handleSaveRate = async (serviceId) => {
    setSavingId(serviceId);
    try {
      const newRate = parseFloat(editMap[serviceId]?.workerHourlyRate) || 0;
      const res = await axios.put(
        `${API_URL}/services/${serviceId}`,
        { workerHourlyRate: newRate },
        { headers: authHeaders() },
      );
      setServices(prev => prev.map(s => s._id === serviceId ? res.data : s));
      setEditingId(null);
      flash("success", `${res.data.name}: worker rate set to £${res.data.workerHourlyRate?.toFixed(2)}/hr`);
    } catch (err) {
      flash("error", `Failed to save: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const groupedByCategory = services.reduce((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const totalServices   = services.length;
  const avgMargin       = services.length
    ? services.reduce((sum, s) => {
        const margin = (s.rate || 0) - (s.workerHourlyRate || 0);
        return sum + margin;
      }, 0) / services.length
    : 0;
  const rateSet = services.filter(s => (s.workerHourlyRate || 0) > 0).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <Briefcase size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Staff Pay</h1>
            <p className="text-sm text-white/40 mt-0.5">Set worker rates per service and global defaults</p>
          </div>
        </div>
        <button
          onClick={() => { fetchServices(); fetchDefaultRate(); }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/10 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Flash message */}
      {statusMsg.text && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold ${
          statusMsg.type === "success"
            ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
            : "bg-rose-500/15 border-rose-500/25 text-rose-400"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Briefcase size={16} />, label: "Services", value: totalServices, color: "text-blue-400", bg: "bg-blue-500/10" },
          { icon: <Users size={16} />, label: "Rates Set", value: `${rateSet}/${totalServices}`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { icon: <TrendingUp size={16} />, label: "Avg Margin/hr", value: `£${avgMargin.toFixed(2)}`, color: avgMargin >= 0 ? "text-emerald-400" : "text-rose-400", bg: avgMargin >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0B2D22] rounded-2xl p-5 border border-white/7">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-2xl font-black mt-1 tabular-nums ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Standard rate card */}
      <div className="bg-[#071D16] rounded-2xl p-6 border border-emerald-500/25">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <Settings size={17} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Standard Worker Rate</p>
              <p className="text-xs text-white/40 mt-0.5">Default applied to all new bookings</p>
            </div>
          </div>

          {editingRate ? (
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm font-bold">£</span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={defaultRate}
                onChange={e => setDefaultRate(e.target.value)}
                className="w-24 px-3 py-2 rounded-xl bg-white/5 border border-emerald-500/40 text-white text-lg font-black text-center focus:outline-none"
                autoFocus
              />
              <span className="text-white/40 text-sm font-bold">/hr</span>
              <button
                onClick={handleSaveDefaultRate}
                disabled={savingRate}
                className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all disabled:opacity-60"
              >
                {savingRate ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button
                onClick={() => { setEditingRate(false); fetchDefaultRate(); }}
                className="p-2 rounded-xl bg-white/10 text-white/40 hover:bg-white/20 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-3xl font-black text-emerald-400 tabular-nums">
                £{parseFloat(defaultRate || 13).toFixed(2)}
                <span className="text-base font-semibold text-white/40">/hr</span>
              </p>
              <button
                onClick={() => setEditingRate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all"
              >
                <Edit3 size={12} />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p>
          <strong>Worker pay</strong> = hourly rate × job duration.
          The margin shown is the customer price minus the worker cost per hour.
        </p>
      </div>

      {/* Services by category */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/40 gap-3">
          <RefreshCw size={24} className="animate-spin text-emerald-400" />
          <p className="text-sm font-semibold">Loading services…</p>
        </div>
      ) : services.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/20 gap-3">
          <DollarSign size={40} />
          <p className="text-sm font-semibold text-white/40">No services found. Add services first.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByCategory).map(([category, catServices]) => (
            <div key={category}>
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 ml-1">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catServices.map(service => {
                  const isEditing   = editingId === service._id;
                  const editVal     = editMap[service._id]?.workerHourlyRate ?? service.workerHourlyRate ?? 0;
                  const workerRate  = service.workerHourlyRate || 0;
                  const customerRate = service.rate || 0;
                  const margin       = customerRate - workerRate;
                  const marginPct    = customerRate > 0 ? Math.round((margin / customerRate) * 100) : 0;

                  return (
                    <div
                      key={service._id}
                      className="bg-[#0B2D22] border border-white/7 rounded-2xl p-5 hover:border-white/[0.12] transition-all group"
                    >
                      {/* Service name + type */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <p className="font-bold text-white text-sm leading-snug">{service.name}</p>
                          <span className="text-[10px] font-semibold text-white/30 mt-0.5 block">
                            {service.type === "hourly" ? "Hourly service" : "Flat rate service"}
                          </span>
                        </div>
                        {!isEditing && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            marginPct >= 40
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                              : marginPct >= 20
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/25"
                          }`}>
                            {marginPct}% margin
                          </span>
                        )}
                      </div>

                      {/* Rate row */}
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Customer</p>
                          <p className="font-black text-white/70 tabular-nums">
                            £{customerRate.toFixed(2)}{service.type === "hourly" ? "/hr" : ""}
                          </p>
                        </div>
                        <div className="text-white/20 text-xs">→</div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Worker</p>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-white/40 text-xs">£</span>
                              <input
                                type="number"
                                step="0.50"
                                min="0"
                                value={editVal}
                                onChange={e => setEditMap(prev => ({
                                  ...prev,
                                  [service._id]: { workerHourlyRate: e.target.value },
                                }))}
                                className="w-20 px-2 py-1 rounded-lg bg-[#071D16] border border-emerald-500/40 text-white font-black text-sm text-center focus:outline-none"
                                autoFocus
                              />
                              <span className="text-white/30 text-xs">/hr</span>
                            </div>
                          ) : (
                            <p className={`font-black tabular-nums ${workerRate > 0 ? "text-emerald-400" : "text-white/30 italic"}`}>
                              {workerRate > 0 ? `£${workerRate.toFixed(2)}/hr` : "Not set"}
                            </p>
                          )}
                        </div>
                        {!isEditing && margin > 0 && (
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Margin</p>
                            <p className="font-black text-emerald-400 tabular-nums">+£{margin.toFixed(2)}</p>
                          </div>
                        )}
                      </div>

                      {/* Action row */}
                      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveRate(service._id)}
                              disabled={savingId === service._id}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition-all disabled:opacity-60"
                            >
                              {savingId === service._id
                                ? <RefreshCw size={12} className="animate-spin" />
                                : <Save size={12} />
                              }
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/10 transition-all"
                            >
                              <X size={12} />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(service)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold opacity-0 group-hover:opacity-100 hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all"
                          >
                            <Edit3 size={12} />
                            Set Rate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffPay;
