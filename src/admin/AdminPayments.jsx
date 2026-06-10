import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPayments.css";

const AdminPayments = () => {
  const [payoutTab, setPayoutTab] = useState("upcoming"); // upcoming, approved, completed
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(null);
  const [selectedPayouts, setSelectedPayouts] = useState(new Set());

  const API_URL =
    import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api";

  // Fetch all withdrawals
  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/payments/admin/withdrawals/all`,
      );
      setWithdrawals(response.data || []);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  // Filter withdrawals by status
  const getFilteredWithdrawals = () => {
    const statusMap = {
      upcoming: ["upcoming", "pending"],
      approved: ["approved", "processing"],
      completed: ["completed"],
    };
    return withdrawals.filter((w) => statusMap[payoutTab]?.includes(w.status));
  };

  // Approve single payout
  const handleAprovePayout = async (withdrawalId) => {
    setApprovalLoading(withdrawalId);
    try {
      const response = await axios.put(
        `${API_URL}/payments/admin/withdrawals/${withdrawalId}/approve`,
        { adminId: localStorage.getItem("adminId"), action: "complete" },
      );
      alert("✅ Payout approved and transferred successfully!");
      fetchWithdrawals();
    } catch (error) {
      alert(
        "❌ Error approving payout: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setApprovalLoading(null);
    }
  };

  // Reject payout
  const handleRejectPayout = async (withdrawalId) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    try {
      await axios.put(
        `${API_URL}/payments/admin/withdrawals/${withdrawalId}/reject`,
        {
          reason,
        },
      );
      alert("✅ Payout rejected successfully!");
      fetchWithdrawals();
    } catch (error) {
      alert(
        "❌ Error rejecting payout: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  // Bulk approve selected payouts
  const handleBulkApprove = async () => {
    if (selectedPayouts.size === 0) {
      alert("Please select payouts to approve");
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedPayouts).map((id) =>
          axios.put(`${API_URL}/payments/admin/withdrawals/${id}/approve`, {
            adminId: localStorage.getItem("adminId"),
            action: "complete",
          }),
        ),
      );
      alert(`✅ ${selectedPayouts.size} payouts approved successfully!`);
      setSelectedPayouts(new Set());
      fetchWithdrawals();
    } catch (error) {
      alert("❌ Error approving payouts: " + error.message);
    }
  };

  const filteredPayouts = getFilteredWithdrawals();

  return (
    <div className="admin-payments-container">
      <div className="admin-payments-header">
        <h1>💰 Payment Management</h1>
        <p>Manage worker payouts and withdrawals</p>
      </div>

      {/* Tab Navigation */}
      <div className="payment-tabs">
        <button
          className={`tab-btn ${payoutTab === "upcoming" ? "active" : ""}`}
          onClick={() => setPayoutTab("upcoming")}
        >
          Upcoming (
          {
            withdrawals.filter((w) =>
              ["upcoming", "pending"].includes(w.status),
            ).length
          }
          )
        </button>
        <button
          className={`tab-btn ${payoutTab === "approved" ? "active" : ""}`}
          onClick={() => setPayoutTab("approved")}
        >
          Processing (
          {
            withdrawals.filter((w) =>
              ["approved", "processing"].includes(w.status),
            ).length
          }
          )
        </button>
        <button
          className={`tab-btn ${payoutTab === "completed" ? "active" : ""}`}
          onClick={() => setPayoutTab("completed")}
        >
          Completed (
          {withdrawals.filter((w) => w.status === "completed").length})
        </button>
      </div>

      {/* Bulk Actions */}
      {payoutTab === "upcoming" && selectedPayouts.size > 0 && (
        <div className="bulk-actions">
          <span>{selectedPayouts.size} selected</span>
          <button className="btn-bulk-approve" onClick={handleBulkApprove}>
            Approve & Pay All
          </button>
        </div>
      )}

      {/* Payouts List */}
      <div className="payouts-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredPayouts.length === 0 ? (
          <div className="empty-state">
            <p>No payouts to display</p>
          </div>
        ) : (
          filteredPayouts.map((payout) => (
            <div key={payout._id} className="payout-card">
              <div className="payout-card-header">
                <div className="payout-main-info">
                  <div className="selection-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedPayouts.has(payout._id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedPayouts);
                        if (e.target.checked) {
                          newSet.add(payout._id);
                        } else {
                          newSet.delete(payout._id);
                        }
                        setSelectedPayouts(newSet);
                      }}
                      disabled={
                        payout.status !== "upcoming" &&
                        payout.status !== "pending"
                      }
                    />
                  </div>
                  <div>
                    <h3>{payout.workerName}</h3>
                    <p className="worker-email">{payout.workerEmail}</p>
                    <p className="payout-date">
                      📅 {payoutTab === "upcoming" ? "Will Pay: " : ""}
                      {payout.status === "completed"
                        ? `Paid: ${new Date(payout.completedAt).toLocaleDateString()}`
                        : `${new Date(payout.expectedPayoutDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="payout-amount">
                  <span className="amount">
                    £{payout.amount?.toFixed(2) || "0.00"}
                  </span>
                  <span className={`status-badge status-${payout.status}`}>
                    {payout.status}
                  </span>
                </div>
              </div>

              {expandedId === payout._id && (
                <div className="payout-details">
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Payment Type:</span>
                      <span className="value">{payout.payoutType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Expected Payout:</span>
                      <span className="value">
                        {new Date(
                          payout.expectedPayoutDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Created:</span>
                      <span className="value">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Phone:</span>
                      <span className="value">
                        {payout.workerPhone || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bank-details">
                    <h4>Bank Details</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Account Name:</span>
                        <span className="value">
                          {payout.bankDetails?.accountName}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Account Number:</span>
                        <span className="value code">
                          {payout.bankDetails?.accountNumber
                            ?.slice(-4)
                            .padStart(8, "*")}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Sort Code:</span>
                        <span className="value code">
                          {payout.bankDetails?.sortCode
                            ?.slice(-2)
                            .padStart(6, "*")}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Bank:</span>
                        <span className="value">
                          {payout.bankDetails?.bankName || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Jobs List */}
                  {payout.completedJobs?.length > 0 && (
                    <div className="jobs-section">
                      <h4>
                        Completed Services ({payout.completedJobs.length})
                      </h4>
                      <div className="jobs-list">
                        {payout.completedJobs.map((job, idx) => (
                          <div key={idx} className="job-item">
                            <div className="job-details">
                              <span className="service">📋 {job.service}</span>
                              <span className="job-date">
                                Completed:{" "}
                                {new Date(
                                  job.completedDate,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="job-amount">
                              £{job.amount?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction Reference (if completed) */}
                  {payout.transactionRef && (
                    <div className="transaction-info">
                      <span className="label">Transaction Ref:</span>
                      <span className="value code">
                        {payout.transactionRef}
                      </span>
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="payout-actions">
                    {["upcoming", "pending"].includes(payout.status) && (
                      <>
                        <button
                          className="btn-approve"
                          onClick={() => handleAprovePayout(payout._id)}
                          disabled={approvalLoading === payout._id}
                        >
                          {approvalLoading === payout._id
                            ? "Processing..."
                            : "✓ Approve & Pay"}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectPayout(payout._id)}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                    {payout.status === "completed" && (
                      <div className="completed-info">
                        <p>
                          ✓ Paid on{" "}
                          {new Date(payout.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                className="expand-btn"
                onClick={() =>
                  setExpandedId(expandedId === payout._id ? null : payout._id)
                }
              >
                {expandedId === payout._id ? "▼ Collapse" : "▶ Details"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
