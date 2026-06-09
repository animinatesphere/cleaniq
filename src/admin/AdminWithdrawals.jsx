import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  Filter,
  RefreshCw,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
  Calendar,
} from "lucide-react";
import "../styles/adminWithdrawals.css";

const AdminWithdrawals = () => {
  const API = import.meta.env.VITE_API_URL;
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending"); // pending, approved, failed, all
  const [expandedId, setExpandedId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch withdrawals
  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/payments/admin/withdrawals/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch withdrawals");
      }

      const data = await response.json();
      setWithdrawals(data);
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
      setError(err.message || "Failed to fetch withdrawals");
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Filter withdrawals
  const filteredWithdrawals =
    filter === "all"
      ? withdrawals
      : withdrawals.filter((w) => w.status === filter);

  // Approve withdrawal
  const handleApprove = async (withdrawalId, workerId) => {
    setActionLoading((prev) => ({ ...prev, [withdrawalId]: true }));
    try {
      const response = await fetch(
        `${API}/payments/admin/withdrawals/${withdrawalId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            adminId: localStorage.getItem("adminId"),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve withdrawal");
      }

      setSuccessMsg("✅ Withdrawal approved! Email sent to worker.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchWithdrawals();
    } catch (err) {
      console.error("Error approving withdrawal:", err);
      alert(err.message || "Failed to approve withdrawal");
    } finally {
      setActionLoading((prev) => ({ ...prev, [withdrawalId]: false }));
    }
  };

  // Reject withdrawal
  const handleReject = async (withdrawalId) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setActionLoading((prev) => ({ ...prev, [withdrawalId]: true }));
    try {
      const response = await fetch(
        `${API}/payments/admin/withdrawals/${withdrawalId}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            reason: rejectReason,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to reject withdrawal");
      }

      setSuccessMsg("❌ Withdrawal rejected! Email sent to worker.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setRejectingId(null);
      setRejectReason("");
      fetchWithdrawals();
    } catch (err) {
      console.error("Error rejecting withdrawal:", err);
      alert(err.message || "Failed to reject withdrawal");
    } finally {
      setActionLoading((prev) => ({ ...prev, [withdrawalId]: false }));
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "status-badge status-pending",
      approved: "status-badge status-approved",
      processing: "status-badge status-processing",
      completed: "status-badge status-completed",
      failed: "status-badge status-failed",
    };

    return statusStyles[status] || "status-badge";
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={18} />;
      case "approved":
      case "completed":
        return <CheckCircle2 size={18} />;
      case "failed":
        return <XCircle size={18} />;
      case "processing":
        return <RefreshCw size={18} className="spin" />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  return (
    <div className="admin-withdrawals">
      <div className="withdrawals-header">
        <div className="header-top">
          <h1>💰 Withdrawal Requests Management</h1>
          <button onClick={fetchWithdrawals} className="btn-refresh">
            <RefreshCw size={20} /> Refresh
          </button>
        </div>

        {successMsg && <div className="success-message">{successMsg}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="filter-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by worker name or ID..."
            // Add search functionality if needed
          />
          <div className="filter-buttons">
            {["pending", "approved", "failed", "all"].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                <Filter size={16} />
                {status.charAt(0).toUpperCase() + status.slice(1)} (
                {
                  withdrawals.filter(
                    (w) => status === "all" || w.status === status,
                  ).length
                }
                )
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading withdrawal requests...</div>
      ) : filteredWithdrawals.length === 0 ? (
        <div className="empty-state">
          <Wallet size={48} />
          <p>No {filter !== "all" ? filter : ""} withdrawal requests found</p>
        </div>
      ) : (
        <div className="withdrawals-list">
          {filteredWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal._id}
              className={`withdrawal-card ${withdrawal.status}`}
            >
              <div
                className="card-header"
                onClick={() =>
                  setExpandedId(
                    expandedId === withdrawal._id ? null : withdrawal._id,
                  )
                }
              >
                <div className="header-left">
                  <div className={getStatusBadge(withdrawal.status)}>
                    {getStatusIcon(withdrawal.status)}
                    <span>{withdrawal.status.toUpperCase()}</span>
                  </div>

                  <div className="worker-summary">
                    <h3>{withdrawal.workerName}</h3>
                    <p className="amount">£{withdrawal.amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="header-right">
                  <span className="date">
                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                  </span>
                  {expandedId === withdrawal._id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>

              {expandedId === withdrawal._id && (
                <div className="card-content">
                  <div className="section">
                    <h4>
                      <User size={16} /> Worker Details
                    </h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Name:</span>
                        <span className="value">{withdrawal.workerName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Worker ID:</span>
                        <span className="value">{withdrawal.workerId}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Email:</span>
                        <span className="value">
                          <Mail size={14} /> {withdrawal.workerEmail || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Phone:</span>
                        <span className="value">
                          <Phone size={14} />
                          {withdrawal.workerPhone || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Address:</span>
                        <span className="value">
                          <MapPin size={14} />{" "}
                          {withdrawal.workerAddress || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Postcode:</span>
                        <span className="value">
                          {withdrawal.workerPostcode || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <h4>
                      <DollarSign size={16} /> Withdrawal Information
                    </h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Amount:</span>
                        <span className="value highlight">
                          £{withdrawal.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Status:</span>
                        <span className={`value ${withdrawal.status}`}>
                          {withdrawal.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Requested:</span>
                        <span className="value">
                          <Calendar size={14} />
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {withdrawal.approvedAt && (
                        <div className="detail-item">
                          <span className="label">Approved:</span>
                          <span className="value">
                            <Calendar size={14} />
                            {new Date(
                              withdrawal.approvedAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="section">
                    <h4>
                      <CreditCard size={16} /> Bank Account Details
                    </h4>
                    <div className="bank-details-box">
                      <div className="detail-item">
                        <span className="label">Account Holder:</span>
                        <span className="value">
                          {withdrawal.bankDetails?.accountName || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Account Number:</span>
                        <div className="copy-field">
                          <span className="value">
                            ****
                            {withdrawal.bankDetails?.accountNumber?.slice(-4) ||
                              "XXXX"}
                          </span>
                          <button
                            className="copy-btn"
                            onClick={() =>
                              copyToClipboard(
                                withdrawal.bankDetails?.accountNumber,
                                `acc-${withdrawal._id}`,
                              )
                            }
                          >
                            {copiedId === `acc-${withdrawal._id}` ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="label">Sort Code:</span>
                        <div className="copy-field">
                          <span className="value">
                            {withdrawal.bankDetails?.sortCode || "N/A"}
                          </span>
                          <button
                            className="copy-btn"
                            onClick={() =>
                              copyToClipboard(
                                withdrawal.bankDetails?.sortCode,
                                `sort-${withdrawal._id}`,
                              )
                            }
                          >
                            {copiedId === `sort-${withdrawal._id}` ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="label">Bank Name:</span>
                        <span className="value">
                          {withdrawal.bankDetails?.bankName || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {withdrawal.status === "pending" && (
                    <div className="action-section">
                      <h4>Approval Actions</h4>
                      <div className="actions">
                        <button
                          className="btn btn-approve"
                          onClick={() =>
                            handleApprove(withdrawal._id, withdrawal.workerId)
                          }
                          disabled={actionLoading[withdrawal._id]}
                        >
                          <CheckCircle2 size={18} />
                          {actionLoading[withdrawal._id]
                            ? "Processing..."
                            : "Approve & Send Money"}
                        </button>

                        <div className="reject-section">
                          {rejectingId === withdrawal._id ? (
                            <>
                              <textarea
                                placeholder="Enter reason for rejection (will be sent to worker)..."
                                value={rejectReason}
                                onChange={(e) =>
                                  setRejectReason(e.target.value)
                                }
                                className="reject-textarea"
                              />
                              <div className="reject-buttons">
                                <button
                                  className="btn btn-reject-confirm"
                                  onClick={() => handleReject(withdrawal._id)}
                                  disabled={actionLoading[withdrawal._id]}
                                >
                                  {actionLoading[withdrawal._id]
                                    ? "Processing..."
                                    : "Confirm Rejection"}
                                </button>
                                <button
                                  className="btn btn-cancel"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason("");
                                  }}
                                  disabled={actionLoading[withdrawal._id]}
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              className="btn btn-reject"
                              onClick={() => setRejectingId(withdrawal._id)}
                            >
                              <XCircle size={18} />
                              Reject Request
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {withdrawal.reason && (
                    <div className="section rejection-reason">
                      <h4>Rejection Reason</h4>
                      <p>{withdrawal.reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
