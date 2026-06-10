import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DollarSign,
  Save,
  X,
  AlertCircle,
  Clock,
  Briefcase,
  Edit3,
} from "lucide-react";
import "./StaffPay.css";

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
      const response = await axios.put(`${API_URL}/services/${serviceId}`, {
        workerHourlyRate: newRate,
      });

      // Use the returned data from server to ensure consistency
      const updatedService = response.data;
      setServices(
        services.map((s) => (s._id === serviceId ? updatedService : s)),
      );
      setEditingId(null);
      const serviceName = services.find((s) => s._id === serviceId)?.name;
      flash(
        "success",
        `✅ Updated hourly rate for ${serviceName}: £${newRate.toFixed(2)}/hr`,
      );

      // Force refresh after short delay to ensure database is updated
      setTimeout(() => {
        fetchServices();
      }, 500);
    } catch (err) {
      console.error("Error saving service:", err);
      flash("error", "Failed to save hourly rate");
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
      <div className="staff-pay-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-pay-container">
      {/* Header */}
      <div className="staff-pay-header">
        <div className="header-content">
          <Briefcase size={32} className="header-icon" />
          <div>
            <h1>Staff Pay</h1>
            <p>Set hourly rates for your cleaning services</p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {statusMsg.text && (
        <div className={`status-message status-${statusMsg.type}`}>
          {statusMsg.type === "success" ? "✅" : "❌"} {statusMsg.text}
        </div>
      )}

      {/* Info Box */}
      <div className="info-box">
        <AlertCircle size={20} />
        <div>
          <strong>How it works:</strong> Set the hourly rate that workers earn
          for each service. When a job is completed, they earn: (hourly rate ×
          duration in hours)
        </div>
      </div>

      {/* Services by Category */}
      <div className="categories-grid">
        {Object.entries(groupedByCategory).map(
          ([category, categoryServices]) => (
            <div key={category} className="category-section">
              <h3 className="category-title">{category}</h3>

              <div className="services-list">
                {categoryServices.map((service) => (
                  <div key={service._id} className="service-card">
                    <div className="service-header">
                      <div className="service-name">
                        <p className="name">{service.name}</p>
                        <span className="service-type">
                          {service.type === "hourly" ? "⏰ Hourly" : "📦 Flat"}
                        </span>
                      </div>

                      {editingId === service._id ? (
                        <div className="edit-mode">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editMap[service._id]?.workerHourlyRate || 0}
                            onChange={(e) =>
                              handleRateChange(service._id, e.target.value)
                            }
                            placeholder="0.00"
                            className="rate-input"
                            autoFocus
                          />
                          <span className="input-label">£/hr</span>
                        </div>
                      ) : (
                        <div className="rate-display">
                          <span className="rate-value">
                            £{service.workerHourlyRate?.toFixed(2) || "0.00"}
                          </span>
                          <span className="rate-label">/hr</span>
                        </div>
                      )}
                    </div>

                    <div className="service-footer">
                      <p className="customer-rate">
                        Customer price: £{service.rate?.toFixed(2) || "0.00"}
                        {service.type === "hourly" ? "/hr" : ""}
                      </p>

                      <div className="action-buttons">
                        {editingId === service._id ? (
                          <>
                            <button
                              className="btn-save"
                              onClick={() => handleSaveRate(service._id)}
                              disabled={savingId === service._id}
                            >
                              {savingId === service._id ? (
                                <span className="spinner-small"></span>
                              ) : (
                                <Save size={16} />
                              )}
                              Save
                            </button>
                            <button className="btn-cancel" onClick={cancelEdit}>
                              <X size={16} />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-edit"
                            onClick={() => startEdit(service)}
                          >
                            <Edit3 size={16} />
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
        <div className="empty-state">
          <DollarSign size={48} />
          <p>No services found. Please add services first.</p>
        </div>
      )}
    </div>
  );
};

export default StaffPay;
