import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DollarSign,
  Save,
  RefreshCw,
  Edit3,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import "./ServicePricing.css";

const ServicePricing = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [editMap, setEditMap] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const API_URL =
    import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api";

  // Fetch all services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/services`);
      setServices(res.data || []);
    } catch (err) {
      console.error("Error fetching services:", err);
      flash("error", "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const flash = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 3500);
  };

  // Start editing a service
  const startEdit = (service) => {
    setEditingId(service._id);
    setEditMap({
      ...editMap,
      [service._id]: {
        workerPaymentRate: service.workerPaymentRate || 0,
      },
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
  };

  // Update worker payment rate
  const handleRateChange = (serviceId, value) => {
    setEditMap({
      ...editMap,
      [serviceId]: {
        ...editMap[serviceId],
        workerPaymentRate: parseFloat(value) || 0,
      },
    });
  };

  // Save service pricing
  const handleSaveRate = async (serviceId) => {
    setSavingId(serviceId);
    try {
      const newRate = editMap[serviceId]?.workerPaymentRate || 0;
      await axios.put(`${API_URL}/services/${serviceId}`, {
        workerPaymentRate: newRate,
      });
      setServices(
        services.map((s) =>
          s._id === serviceId ? { ...s, workerPaymentRate: newRate } : s,
        ),
      );
      setEditingId(null);
      flash(
        "success",
        `✅ Worker payment updated for ${services.find((s) => s._id === serviceId).name}`,
      );
    } catch (err) {
      console.error("Error saving service:", err);
      flash("error", "Failed to save worker payment rate");
    } finally {
      setSavingId(null);
    }
  };

  // Group services by category
  const grouped = services.reduce((acc, service) => {
    const cat = service.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B2D22] border border-white/7 rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-black text-white">💰 Service Pricing</h1>
          <p className="text-white/40 text-sm mt-1">Set worker payment rates for each service</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          onClick={fetchServices}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Status Message */}
      {statusMsg.text && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold ${
          statusMsg.type === "success"
            ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
            : "bg-rose-500/15 border-rose-500/25 text-rose-400"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-white/40">
          <RefreshCw size={32} className="animate-spin mb-3 text-emerald-400" />
          <p className="font-semibold text-sm">Loading services...</p>
        </div>
      )}

      {/* Services by Category */}
      {!loading && Object.keys(grouped).length > 0 && (
        <div className="space-y-6">
          {Object.keys(grouped).map((category) => (
            <div key={category} className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
              <h2 className="flex items-center gap-3 text-white font-black text-lg px-6 py-4 border-b border-white/[0.04] bg-[#071D16]">
                <Briefcase size={20} className="text-emerald-400" />
                {category}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {grouped[category].map((service) => (
                  <div key={service._id} className="bg-white/[0.03] border border-white/[0.04] rounded-2xl p-5 hover:bg-white/[0.06] transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-white text-base">{service.name}</h3>
                        <p className="text-white/40 text-xs mt-1">
                          {service.type === "flat" ? "Flat rate" : "Hourly"} • £
                          {service.rate}/
                          {service.type === "flat" ? "service" : "hr"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {editingId === service._id ? (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-colors disabled:opacity-50"
                              onClick={() => handleSaveRate(service._id)}
                              disabled={savingId === service._id}
                              title="Save"
                            >
                              {savingId === service._id ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                              onClick={cancelEdit}
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                            onClick={() => startEdit(service)}
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rate Display/Edit */}
                    <div className="mt-4 pt-4 border-t border-white/[0.04]">
                      <label className="text-white/40 text-xs font-semibold uppercase tracking-wide block mb-2">Worker Payment</label>
                      {editingId === service._id ? (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                          <span className="text-white/40 font-black">£</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editMap[service._id]?.workerPaymentRate || 0}
                            onChange={(e) =>
                              handleRateChange(service._id, e.target.value)
                            }
                            placeholder="0.00"
                            className="flex-1 bg-transparent text-white font-bold text-sm focus:outline-none placeholder:text-white/20"
                          />
                          <span className="text-white/40 text-xs font-bold">/service</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black text-xl">
                            £{(service.workerPaymentRate || 0).toFixed(2)}
                          </span>
                          <span className="text-white/40 text-sm">/service</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-white/40 text-xs mt-3 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    {/* Info Box */}
                    <div className="flex items-center gap-2 mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-emerald-400 text-xs font-medium">
                      <AlertCircle size={14} />
                      <span>
                        Worker earns £
                        {(service.workerPaymentRate || 0).toFixed(2)} when this
                        service is completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center text-white/40">
          <DollarSign size={48} className="mb-4 text-white/25" />
          <p className="font-semibold">No services found</p>
          <p className="text-white/25 text-sm mt-2">
            Services will appear here once they're created
          </p>
        </div>
      )}
    </div>
  );
};

export default ServicePricing;
