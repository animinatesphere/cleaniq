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

  const statusBadgeClass = (status) => {
    const map = {
      upcoming:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
      pending:    "bg-amber-500/15 text-amber-400 border-amber-500/25",
      approved:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      processing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      completed:  "bg-white/10 text-white/60 border-white/10",
      rejected:   "bg-rose-500/15 text-rose-400 border-rose-500/25",
    };
    return `inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${map[status] || "bg-white/10 text-white/60 border-white/10"}`;
  };

  return (
    <div className="min-h-screen bg-[#071D16] p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">💰 Payment Management</h1>
        <p className="text-sm text-white/40">Manage worker payouts and withdrawals</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        <button
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            payoutTab === "upcoming"
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
          }`}
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
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            payoutTab === "approved"
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
          }`}
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
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            payoutTab === "completed"
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
          }`}
          onClick={() => setPayoutTab("completed")}
        >
          Completed (
          {withdrawals.filter((w) => w.status === "completed").length})
        </button>
      </div>

      {/* Bulk Actions */}
      {payoutTab === "upcoming" && selectedPayouts.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0B2D22] border border-white/10 rounded-xl">
          <span className="text-sm font-semibold text-white/80">{selectedPayouts.size} selected</span>
          <button
            className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            onClick={handleBulkApprove}
          >
            Approve & Pay All
          </button>
        </div>
      )}

      {/* Payouts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-white/40 font-medium">Loading...</div>
        ) : filteredPayouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/40 font-medium">No payouts to display</p>
          </div>
        ) : (
          filteredPayouts.map((payout) => (
            <div key={payout._id} className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">
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
                      className="w-4 h-4 rounded border-white/20 accent-emerald-500"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm">{payout.workerName}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{payout.workerEmail}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      📅 {payoutTab === "upcoming" ? "Will Pay: " : ""}
                      {payout.status === "completed"
                        ? `Paid: ${new Date(payout.completedAt).toLocaleDateString()}`
                        : `${new Date(payout.expectedPayoutDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-lg font-bold text-white tabular-nums">
                    £{payout.amount?.toFixed(2) || "0.00"}
                  </span>
                  <span className={statusBadgeClass(payout.status)}>
                    {payout.status}
                  </span>
                </div>
              </div>

              {expandedId === payout._id && (
                <div className="border-t border-white/[0.07] px-5 py-5 space-y-5 bg-white/[0.03]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Payment Type:</span>
                      <span className="text-sm text-white/80 font-medium">{payout.payoutType}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Expected Payout:</span>
                      <span className="text-sm text-white/80 font-medium">
                        {new Date(payout.expectedPayoutDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Created:</span>
                      <span className="text-sm text-white/80 font-medium">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Phone:</span>
                      <span className="text-sm text-white/80 font-medium">
                        {payout.workerPhone || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div>
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3">Bank Details</h4>
                    <div className="grid grid-cols-2 gap-3 bg-[#071D16] rounded-xl p-4 border border-white/[0.05]">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Account Name:</span>
                        <span className="text-sm text-white/80 font-medium">
                          {payout.bankDetails?.accountName}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Account Number:</span>
                        <span className="text-sm font-mono text-white/80">
                          {payout.bankDetails?.accountNumber
                            ?.slice(-4)
                            .padStart(8, "*")}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Sort Code:</span>
                        <span className="text-sm font-mono text-white/80">
                          {payout.bankDetails?.sortCode
                            ?.slice(-2)
                            .padStart(6, "*")}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Bank:</span>
                        <span className="text-sm text-white/80 font-medium">
                          {payout.bankDetails?.bankName || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Jobs List */}
                  {payout.completedJobs?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3">
                        Completed Services ({payout.completedJobs.length})
                      </h4>
                      <div className="space-y-2">
                        {payout.completedJobs.map((job, idx) => (
                          <div key={idx} className="flex items-center justify-between px-4 py-3 bg-[#071D16] rounded-xl border border-white/[0.05]">
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-white/80 block">📋 {job.service}</span>
                              <span className="text-xs text-white/40 mt-0.5 block">
                                Completed:{" "}
                                {new Date(job.completedDate).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-white tabular-nums shrink-0">
                              £{job.amount?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction Reference (if completed) */}
                  {payout.transactionRef && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#071D16] rounded-xl border border-white/[0.05]">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide shrink-0">Transaction Ref:</span>
                      <span className="text-sm font-mono text-white/80">
                        {payout.transactionRef}
                      </span>
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {["upcoming", "pending"].includes(payout.status) && (
                      <>
                        <button
                          className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                          onClick={() => handleAprovePayout(payout._id)}
                          disabled={approvalLoading === payout._id}
                        >
                          {approvalLoading === payout._id
                            ? "Processing..."
                            : "✓ Approve & Pay"}
                        </button>
                        <button
                          className="bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 rounded-xl px-5 py-2 text-sm font-semibold transition-colors"
                          onClick={() => handleRejectPayout(payout._id)}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                    {payout.status === "completed" && (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
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
                className="w-full py-3 text-xs font-semibold text-white/40 hover:text-white/80 hover:bg-white/[0.04] border-t border-white/[0.07] transition-colors"
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
