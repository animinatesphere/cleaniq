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
    <div className="service-pricing-container">
      {/* Header */}
      <div className="pricing-header">
        <div>
          <h1>💰 Service Pricing</h1>
          <p>Set worker payment rates for each service</p>
        </div>
        <button
          className="btn-refresh"
          onClick={fetchServices}
          disabled={loading}
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Status Message */}
      {statusMsg.text && (
        <div className={`status-message status-${statusMsg.type}`}>
          {statusMsg.type === "success" && "✅ "}
          {statusMsg.type === "error" && "❌ "}
          {statusMsg.text}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <RefreshCw size={32} className="spinner" />
          <p>Loading services...</p>
        </div>
      )}

      {/* Services by Category */}
      {!loading && Object.keys(grouped).length > 0 && (
        <div className="categories-list">
          {Object.keys(grouped).map((category) => (
            <div key={category} className="category-section">
              <h2 className="category-title">
                <Briefcase size={20} />
                {category}
              </h2>

              <div className="services-grid">
                {grouped[category].map((service) => (
                  <div key={service._id} className="service-card">
                    <div className="card-header">
                      <div>
                        <h3 className="service-name">{service.name}</h3>
                        <p className="service-meta">
                          {service.type === "flat" ? "Flat rate" : "Hourly"} • £
                          {service.rate}/
                          {service.type === "flat" ? "service" : "hr"}
                        </p>
                      </div>
                      <div className="card-actions">
                        {editingId === service._id ? (
                          <>
                            <button
                              className="btn-icon btn-save"
                              onClick={() => handleSaveRate(service._id)}
                              disabled={savingId === service._id}
                              title="Save"
                            >
                              {savingId === service._id ? (
                                <RefreshCw size={16} className="spinner" />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>
                            <button
                              className="btn-icon btn-cancel"
                              onClick={cancelEdit}
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => startEdit(service)}
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rate Display/Edit */}
                    <div className="rate-section">
                      <label>Worker Payment</label>
                      {editingId === service._id ? (
                        <div className="rate-input-group">
                          <span className="currency">£</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editMap[service._id]?.workerPaymentRate || 0}
                            onChange={(e) =>
                              handleRateChange(service._id, e.target.value)
                            }
                            placeholder="0.00"
                            className="rate-input"
                          />
                          <span className="unit">/service</span>
                        </div>
                      ) : (
                        <div className="rate-display">
                          <span className="rate-value">
                            £{(service.workerPaymentRate || 0).toFixed(2)}
                          </span>
                          <span className="rate-unit">/service</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="service-description">
                        {service.description}
                      </p>
                    )}

                    {/* Info Box */}
                    <div className="info-box">
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
        <div className="empty-state">
          <DollarSign size={48} />
          <p>No services found</p>
          <p className="subtext">
            Services will appear here once they're created
          </p>
        </div>
      )}
    </div>
  );
};

export default ServicePricing;
