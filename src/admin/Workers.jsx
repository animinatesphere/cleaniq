import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  ShieldCheck,
  X,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  KeyRound,
  RefreshCw,
  User,
} from "lucide-react";
import { useRegion } from "../context/RegionContext";

const Workers = () => {
  const { region } = useRegion();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [workerDetailModal, setWorkerDetailModal] = useState(null);
  const [newPassword, setNewPassword]               = useState("");
  const [showNewPwd, setShowNewPwd]                 = useState(false);
  const [showStoredPwd, setShowStoredPwd]           = useState(false);
  const [updatingPwd, setUpdatingPwd]               = useState(false);
  const [pwdSuccess, setPwdSuccess]                 = useState(false);

  const ROLE_OPTIONS = [
    "Cleaner",
    "Team Leader",
    "Supervisor",
    "Quality Assurance",
    "Driver",
    "Office Staff",
    "Other",
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    region: region.id,
    role: "Cleaner",
    customRole: "",
  });

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workers`);
      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [region]);

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        role:
          formData.role === "Other"
            ? formData.customRole.trim() || "Cleaner"
            : formData.role,
      };
      delete payload.customRole;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        setWorkers([data, ...workers]);
        setShowAddModal(false);
        setNewCredentials({
          email: data.email,
          tempPassword: data.tempPassword,
        });
        setShowCredsModal(true);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          region: region.id,
          role: "Cleaner",
          customRole: "",
        });
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error adding worker:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this worker?")) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/workers/${id}`, {
          method: "DELETE",
        });
        setWorkers(workers.filter((w) => w._id !== id));
      } catch (error) {
        console.error("Error deleting worker:", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedWorkers.size === 0) return;

    try {
      const workerIds = Array.from(selectedWorkers);
      await Promise.all(
        workerIds.map((id) =>
          fetch(`${import.meta.env.VITE_API_URL}/workers/${id}`, {
            method: "DELETE",
          }),
        ),
      );

      setSelectedWorkers(new Set());
      setShowBulkDeleteModal(false);
      setWorkers(workers.filter((w) => !selectedWorkers.has(w._id)));
    } catch (error) {
      console.error("Error deleting workers:", error);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || !workerDetailModal?._id) return;
    setUpdatingPwd(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/workers/${workerDetailModal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      const updated = { ...workerDetailModal, tempPassword: newPassword };
      setWorkers((prev) => prev.map((w) => w._id === workerDetailModal._id ? updated : w));
      setWorkerDetailModal(updated);
      setNewPassword("");
      setShowNewPwd(false);
      setPwdSuccess(true);
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingPwd(false);
    }
  };

  const toggleWorkerSelection = (workerId) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(workerId)) {
      newSelected.delete(workerId);
    } else {
      newSelected.add(workerId);
    }
    setSelectedWorkers(newSelected);
  };

  const toggleSelectAllWorkers = () => {
    if (selectedWorkers.size === filteredWorkers.length) {
      setSelectedWorkers(new Set());
    } else {
      setSelectedWorkers(new Set(filteredWorkers.map((w) => w._id)));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openDetail = (w) => {
    setWorkerDetailModal(w);
    setNewPassword("");
    setShowNewPwd(false);
    setShowStoredPwd(false);
    setPwdSuccess(false);
  };

  const statusStyle = (s) =>
    s === "Active"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
      : s === "Pending"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
      : "bg-rose-500/15 text-rose-400 border-rose-500/25";

  const avatarColor = (s) =>
    s === "Active" ? "bg-emerald-600" : s === "Pending" ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Staff Management
          </h1>
          <p className="text-white/40 font-medium text-sm mt-1">
            Click any worker card to view account details &amp; credentials
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={16} /> Add Worker
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Staff", value: workers.length, icon: <Briefcase size={18} />, color: "bg-emerald-500/15 text-emerald-400" },
          { label: "Active", value: workers.filter((w) => w.status === "Active" || w.appAccessGranted).length, icon: <ShieldCheck size={18} />, color: "bg-emerald-500/15 text-emerald-400" },
          { label: "Pending Setup", value: workers.filter((w) => w.status === "Pending").length, icon: <AlertCircle size={18} />, color: "bg-amber-500/15 text-amber-400" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-[#0B2D22] border border-white/7 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</p>
              <p className="text-2xl font-black text-white leading-none mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + bulk delete */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0B2D22] rounded-2xl border border-white/10 focus-within:border-emerald-500/50 flex-1">
          <Search size={16} className="text-white/40 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email…"
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-white placeholder:text-white/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {selectedWorkers.size > 0 && (
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className="px-5 py-3 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 size={14} /> Delete {selectedWorkers.size} selected
          </button>
        )}
      </div>

      {/* Worker cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/[0.03] rounded-lg w-3/4" />
                  <div className="h-3 bg-white/[0.03] rounded-lg w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-white/[0.03] rounded-lg w-full" />
              <div className="h-3 bg-white/[0.03] rounded-lg w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-white/25" />
          </div>
          <p className="font-black text-white/40 text-lg">No staff found</p>
          <p className="text-white/25 text-sm font-medium mt-1">Try a different search or add a new worker</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkers.map((w) => (
            <div
              key={w._id}
              onClick={() => openDetail(w)}
              className={`bg-[#0B2D22] rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden
                ${selectedWorkers.has(w._id) ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/7 hover:border-white/20"}`}
            >
              {/* Status accent strip */}
              <div className={`h-1.5 w-full ${w.status === "Active" ? "bg-emerald-400" : w.status === "Pending" ? "bg-amber-400" : "bg-rose-400"}`} />

              <div className="p-5">
                {/* Avatar + name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white uppercase shrink-0 ${avatarColor(w.status)}`}>
                    {w.firstName?.[0]}{w.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-base leading-tight truncate">
                      {w.firstName} {w.lastName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {w.role || "Cleaner"}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusStyle(w.status)}`}>
                        {w.status}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedWorkers.has(w._id)}
                    onChange={(e) => { e.stopPropagation(); toggleWorkerSelection(w._id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-2 border-white/25 cursor-pointer accent-emerald-500 shrink-0 mt-1"
                  />
                </div>

                <div className="border-t border-white/[0.04] my-3" />

                {/* Contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <span className="font-semibold truncate">{w.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <span className="font-semibold">{w.phone || "—"}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
                    <p className="text-sm font-black text-white/80">{w.jobsCompleted ?? 0}</p>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-0.5">Jobs</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
                    <p className="text-sm font-black text-white/80">⭐ {w.rating ?? "—"}</p>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-0.5">Rating</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-2.5 text-center overflow-hidden">
                    <p className="text-[10px] font-black text-white/60 truncate">{w.region || "—"}</p>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-0.5">Region</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                  <span className="text-[10px] font-black text-white/25 uppercase tracking-widest">{w.workerId}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(w._id); }}
                    className="p-1.5 rounded-lg text-white/25 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                    title="Remove worker"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          ></div>
          <div className="relative bg-[#0B2D22] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:bg-rose-500/15 hover:text-rose-400 transition-all"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 rounded-2xl flex items-center justify-center">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Onboard New Worker
                </h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                  Generate App Credentials
                </p>
              </div>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold text-sm"
                />
                <input
                  required
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold text-sm"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold text-sm"
              />
              <input
                required
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold text-sm"
              />
              <input
                type="text"
                placeholder="Country / Region (e.g. United Kingdom)"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold text-sm"
              />
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 ml-1 block">
                  Job Position / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-[#071D16] border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none font-bold text-sm"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-[#0B2D22]">
                      {r}
                    </option>
                  ))}
                </select>
                {formData.role === "Other" && (
                  <input
                    type="text"
                    required
                    placeholder="Enter job position / role"
                    value={formData.customRole}
                    onChange={(e) =>
                      setFormData({ ...formData, customRole: e.target.value })
                    }
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold text-sm mt-2"
                  />
                )}
              </div>
              <button
                type="submit"
                className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Generate Credentials
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal (Shown after adding) */}
      {showCredsModal && newCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCredsModal(false)}
          ></div>
          <div className="relative bg-[#0B2D22] border border-white/10 rounded-2xl p-6 md:p-10 w-full max-w-md animate-in zoom-in-95 duration-200 text-center text-balance">
            <div className="w-20 h-20 bg-emerald-500/15 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              Worker Added Successfully
            </h3>
            <p className="text-white/40 font-medium text-sm mb-8">
              Share these temporary credentials with the worker so they can log
              into the CleanIQ App.
            </p>

            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 text-left space-y-4 mb-8">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                  Login ID (Email)
                </p>
                <p className="font-bold text-white">
                  {newCredentials.email}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                  Temporary Password
                </p>
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="font-mono font-bold text-emerald-400 tracking-wider">
                    {newCredentials.tempPassword}
                  </span>
                  <button
                    onClick={() => copyToClipboard(newCredentials.tempPassword)}
                    className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                  >
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCredsModal(false)}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Worker Account Detail Modal */}
      {workerDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setWorkerDetailModal(null)} />
          <div className="relative bg-[#0B2D22] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-lg animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setWorkerDetailModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:bg-rose-500/15 hover:text-rose-400 transition-all"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black text-lg uppercase shrink-0">
                {workerDetailModal.firstName?.[0]}{workerDetailModal.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {workerDetailModal.firstName} {workerDetailModal.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">{workerDetailModal.role || "Cleaner"}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${workerDetailModal.status === "Active" ? "bg-emerald-500/15 text-emerald-400" : workerDetailModal.status === "Pending" ? "bg-amber-500/15 text-amber-400" : "bg-rose-500/15 text-rose-400"}`}>
                    {workerDetailModal.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white/[0.03] rounded-2xl p-5 space-y-3 mb-6">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Profile Details</p>
              {[
                { label: "Worker ID", value: workerDetailModal.workerId },
                { label: "Email", value: workerDetailModal.email },
                { label: "Phone", value: workerDetailModal.phone },
                { label: "Region", value: workerDetailModal.region },
                { label: "Jobs Completed", value: workerDetailModal.jobsCompleted ?? 0 },
                { label: "Rating", value: workerDetailModal.rating ? `⭐ ${workerDetailModal.rating}` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-white/40 font-semibold">{label}</span>
                  <span className="font-bold text-white/80">{value || "—"}</span>
                </div>
              ))}
            </div>

            {/* App Credentials */}
            <div className="border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">App Login Credentials</p>

              {/* Email (login ID) */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Login Email</p>
                <div className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                  <span className="font-bold text-sm text-white">{workerDetailModal.email}</span>
                  <button onClick={() => copyToClipboard(workerDetailModal.email)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 transition-colors">
                    {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Stored password */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Current Password</p>
                <div className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                  <span className="font-mono font-bold text-sm text-emerald-400 tracking-wider">
                    {workerDetailModal.tempPassword
                      ? (showStoredPwd ? workerDetailModal.tempPassword : "•".repeat(workerDetailModal.tempPassword.length))
                      : <span className="text-white/40 font-medium not-italic text-xs">Not stored — set a new password below</span>}
                  </span>
                  {workerDetailModal.tempPassword && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowStoredPwd((p) => !p)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 transition-colors">
                        {showStoredPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => copyToClipboard(workerDetailModal.tempPassword)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 transition-colors">
                        {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Update Password */}
            <div className="border border-amber-500/25 bg-amber-500/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound size={14} className="text-amber-400" />
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Update Password</p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-amber-500/25 px-4 py-3">
                <input
                  type={showNewPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password…"
                  className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-white/20"
                />
                <button onClick={() => setShowNewPwd((p) => !p)} className="text-white/40 hover:text-emerald-400 transition-colors">
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdSuccess && (
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Password updated successfully
                </p>
              )}
              <button
                onClick={handleUpdatePassword}
                disabled={!newPassword.trim() || updatingPwd}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingPwd ? <RefreshCw size={13} className="animate-spin" /> : <KeyRound size={13} />}
                {updatingPwd ? "Updating…" : "Save New Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBulkDeleteModal(false)}
          ></div>
          <div className="relative bg-[#0B2D22] border border-white/10 rounded-2xl p-6 md:p-10 w-full max-w-md animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-rose-500/15 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              Delete {selectedWorkers.size} Staff Member(s)?
            </h3>
            <p className="text-white/40 font-medium text-sm mb-8">
              This action cannot be undone. The selected workers will be
              permanently removed from your database.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-3 bg-rose-500/15 border border-rose-500/25 text-rose-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-500/25 transition-all"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
