import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DollarSign,
  Save,
  X,
  AlertCircle,
  Briefcase,
  Edit3,
} from "lucide-react";

const StaffPay = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [editMap, setEditMap] = useState({});
  const [editingId, setEditingId] = useState(null);

  const API_URL =
    import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api";

  // Force re-fetch when component mounts
  useEffect(() => {
    fetchServices();
  }, []);

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
        workerHourlyRate: service.workerHourlyRate || 0,
      },
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
  };

  // Update worker hourly rate
  const handleRateChange = (serviceId, value) => {
    setEditMap({
      ...editMap,
      [serviceId]: {
        ...editMap[serviceId],
        workerHourlyRate: parseFloat(value) || 0,
      },
    });
  };

  // Save service hourly rate
  const handleSaveRate = async (serviceId) => {
    setSavingId(serviceId);
    try {
      const newRate = editMap[serviceId]?.workerHourlyRate || 0;

      console.log(`💾 Saving ${serviceId} with rate: £${newRate}/hr`);

      const response = await axios.put(`${API_URL}/services/${serviceId}`, {
        workerHourlyRate: newRate,
      });

      console.log(
        `✅ Server response: ${response.data.name} now has rate £${response.data.workerHourlyRate}`,
      );

      // Use the returned data from server to ensure consistency
      const updatedService = response.data;
      setServices(
        services.map((s) => (s._id === serviceId ? updatedService : s)),
      );
      setEditingId(null);
      const serviceName = updatedService.name;

      flash(
        "success",
        `✅ Updated hourly rate for ${serviceName}: £${updatedService.workerHourlyRate.toFixed(2)}/hr`,
      );

      // Force refresh after short delay to ensure UI consistency
      setTimeout(() => {
        fetchServices();
      }, 800);
    } catch (err) {
      console.error("Error saving service:", err);
      flash(
        "error",
        `Failed to save: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setSavingId(null);
    }
  };

  // Group services by category
  const groupedByCategory = services.reduce((acc, service) => {
    const cat = service.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <DollarSign size={32} className="animate-pulse mb-3" />
        <p className="font-semibold text-sm">Loading services…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Briefcase size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Pay
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Set hourly rates for your cleaning services
          </p>
        </div>
      </div>

      {/* Status Message */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 shadow-sm ${statusMsg.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}
        >
          <p className="text-sm font-semibold">{statusMsg.text}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3 text-blue-700">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium">
          <strong className="font-bold">How it works:</strong> Set the hourly
          rate that workers earn for each service. When a job is completed,
          they earn: (hourly rate × duration in hours)
        </p>
      </div>

      {/* Services by Category */}
      <div className="space-y-8">
        {Object.entries(groupedByCategory).map(
          ([category, categoryServices]) => (
            <div key={category}>
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                {category}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service) => (
                  <div
                    key={service._id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {service.name}
                        </p>
                        <span className="text-[11px] font-medium text-slate-400">
                          {service.type === "hourly" ? "⏰ Hourly" : "📦 Flat"}
                        </span>
                      </div>

                      {editingId === service._id ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editMap[service._id]?.workerHourlyRate || 0}
                            onChange={(e) =>
                              handleRateChange(service._id, e.target.value)
                            }
                            placeholder="0.00"
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            autoFocus
                          />
                          <span className="text-[11px] font-semibold text-slate-400">
                            £/hr
                          </span>
                        </div>
                      ) : (
                        <div className="text-right flex-shrink-0">
                          <span className="text-lg font-bold text-slate-900 tabular-nums">
                            £{service.workerHourlyRate?.toFixed(2) || "0.00"}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            /hr
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-medium text-slate-400">
                        Customer: £{service.rate?.toFixed(2) || "0.00"}
                        {service.type === "hourly" ? "/hr" : ""}
                      </p>

                      <div className="flex items-center gap-1.5">
                        {editingId === service._id ? (
                          <>
                            <button
                              onClick={() => handleSaveRate(service._id)}
                              disabled={savingId === service._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all disabled:opacity-60"
                            >
                              <Save size={13} />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-all"
                            >
                              <X size={13} />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(service)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                          >
                            <Edit3 size={13} />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {/* Empty State */}
      {services.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
          <DollarSign size={40} className="mb-3" />
          <p className="font-semibold text-sm text-slate-400">
            No services found. Please add services first.
          </p>
        </div>
      )}
    </div>
  );
};

export default StaffPay;
