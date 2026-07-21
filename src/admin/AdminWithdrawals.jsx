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
    const map = {
      pending:    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-amber-500/15 text-amber-400 border-amber-500/25",
      approved:   "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      processing: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      completed:  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-white/10 text-white/60 border-white/10",
      failed:     "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-rose-500/15 text-rose-400 border-rose-500/25",
    };
    return map[status] || "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-white/10 text-white/60 border-white/10";
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
    <div className="min-h-screen bg-[#071D16] p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">💰 Withdrawal Requests Management</h1>
          </div>
          <button
            onClick={fetchWithdrawals}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw size={20} /> Refresh
          </button>
        </div>

        {successMsg && (
          <div className="px-4 py-3 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-xl text-sm font-semibold">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 bg-rose-500/15 border border-rose-500/25 text-rose-400 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by worker name or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm"
              // Add search functionality if needed
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {["pending", "approved", "failed", "all"].map((status) => (
              <button
                key={status}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  filter === status
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                }`}
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
        <div className="flex items-center justify-center py-16 text-white/40 font-medium">
          Loading withdrawal requests...
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/25 gap-3">
          <Wallet size={48} />
          <p className="font-medium">No {filter !== "all" ? filter : ""} withdrawal requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal._id}
              className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden"
            >
              <div
                className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                onClick={() =>
                  setExpandedId(
                    expandedId === withdrawal._id ? null : withdrawal._id,
                  )
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={getStatusBadge(withdrawal.status)}>
                    {getStatusIcon(withdrawal.status)}
                    <span>{withdrawal.status.toUpperCase()}</span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm">{withdrawal.workerName}</h3>
                    <p className="text-sm font-bold text-white/80 tabular-nums mt-0.5">£{withdrawal.amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-white/40 font-medium">
                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                  </span>
                  {expandedId === withdrawal._id ? (
                    <ChevronUp size={20} className="text-white/40" />
                  ) : (
                    <ChevronDown size={20} className="text-white/40" />
                  )}
                </div>
              </div>

              {expandedId === withdrawal._id && (
                <div className="border-t border-white/[0.07] px-5 py-5 space-y-5 bg-white/[0.03]">
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-wide mb-3">
                      <User size={16} /> Worker Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Name:</span>
                        <span className="text-sm text-white/80 font-medium">{withdrawal.workerName}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Worker ID:</span>
                        <span className="text-sm text-white/80 font-medium">{withdrawal.workerId}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Email:</span>
                        <span className="text-sm text-white/80 font-medium flex items-center gap-1">
                          <Mail size={14} /> {withdrawal.workerEmail || "N/A"}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Phone:</span>
                        <span className="text-sm text-white/80 font-medium flex items-center gap-1">
                          <Phone size={14} />
                          {withdrawal.workerPhone || "N/A"}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Address:</span>
                        <span className="text-sm text-white/80 font-medium flex items-center gap-1">
                          <MapPin size={14} />{" "}
                          {withdrawal.workerAddress || "N/A"}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Postcode:</span>
                        <span className="text-sm text-white/80 font-medium">
                          {withdrawal.workerPostcode || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-wide mb-3">
                      <DollarSign size={16} /> Withdrawal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Amount:</span>
                        <span className="text-lg font-bold text-emerald-400 tabular-nums">
                          £{withdrawal.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Status:</span>
                        <span className={getStatusBadge(withdrawal.status)}>
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Requested:</span>
                        <span className="text-sm text-white/80 font-medium flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {withdrawal.approvedAt && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide block">Approved:</span>
                          <span className="text-sm text-white/80 font-medium flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(withdrawal.approvedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-wide mb-3">
                      <CreditCard size={16} /> Bank Account Details
                    </h4>
                    <div className="space-y-3 bg-[#071D16] rounded-xl p-4 border border-white/[0.05]">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">Account Holder:</span>
                        <span className="text-sm text-white/80 font-medium">
                          {withdrawal.bankDetails?.accountName || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide shrink-0">Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-white/80">
                            ****
                            {withdrawal.bankDetails?.accountNumber?.slice(-4) ||
                              "XXXX"}
                          </span>
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
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
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide shrink-0">Sort Code:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-white/80">
                            {withdrawal.bankDetails?.sortCode || "N/A"}
                          </span>
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
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
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">Bank Name:</span>
                        <span className="text-sm text-white/80 font-medium">
                          {withdrawal.bankDetails?.bankName || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {withdrawal.status === "pending" && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wide">Approval Actions</h4>
                      <div className="space-y-3">
                        <button
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
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

                        <div>
                          {rejectingId === withdrawal._id ? (
                            <>
                              <textarea
                                placeholder="Enter reason for rejection (will be sent to worker)..."
                                value={rejectReason}
                                onChange={(e) =>
                                  setRejectReason(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm resize-none mb-2"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  className="bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                                  onClick={() => handleReject(withdrawal._id)}
                                  disabled={actionLoading[withdrawal._id]}
                                >
                                  {actionLoading[withdrawal._id]
                                    ? "Processing..."
                                    : "Confirm Rejection"}
                                </button>
                                <button
                                  className="bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
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
                              className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
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
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wide">Rejection Reason</h4>
                      <p className="text-sm text-white/80 bg-[#071D16] rounded-xl p-4 border border-white/[0.05]">{withdrawal.reason}</p>
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
