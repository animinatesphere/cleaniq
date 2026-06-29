import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Download,
  X,
  Edit3,
  Save,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [savingPriceId, setSavingPriceId] = useState(null);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(
        () => setStatusMessage({ type: "", text: "" }),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/customers`);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected && !isEditing) {
      const fetchHistory = async () => {
        setLoadingBookings(true);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/customers/${selected.email}/bookings`,
          );
          const data = await res.json();
          setCustomerBookings(data);
        } catch {
          // Error fetching bookings
        } finally {
          setLoadingBookings(false);
        }
      };
      fetchHistory();
    } else {
      setCustomerBookings([]);
    }
  }, [selected, isEditing]);

  const handleUpdate = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/customers/${selected.email}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        },
      );
      if (res.ok) {
        fetchCustomers();
        setIsEditing(false);
        setSelected(null);
        setStatusMessage({ type: "success", text: "Client info updated" });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Failed to update client" });
    }
  };

  const handleSaveBookingPrice = async (bookingId) => {
    const amount = parseFloat(editingPriceValue);
    if (isNaN(amount) || amount < 0) {
      setStatusMessage({ type: "error", text: "Enter a valid price" });
      return;
    }
    setSavingPriceId(bookingId);
    try {
      const booking = customerBookings.find((b) => b._id === bookingId);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment: { ...booking?.payment, amount },
          }),
        },
      );
      if (res.ok) {
        setCustomerBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId
              ? { ...b, payment: { ...b.payment, amount } }
              : b,
          ),
        );
        setEditingPriceId(null);
        setStatusMessage({ type: "success", text: "Price updated" });
      } else {
        setStatusMessage({ type: "error", text: "Failed to update price" });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Failed to update price" });
    } finally {
      setSavingPriceId(null);
    }
  };

  const downloadCSV = () => {
    if (customers.length === 0) return;
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Region",
      "Total Bookings",
      "Total Spent",
    ];
    const rows = filtered.map((c) => [
      c.firstName + " " + c.lastName,
      c.email,
      c.phone,
      c.region,
      c.totalBookings,
      c.totalSpent,
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute(
      "download",
      `cleaniq_customers_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedCustomers);
      await Promise.all(
        ids.map((customerId) =>
          fetch(`${import.meta.env.VITE_API_URL}/customers/${customerId}`, {
            method: "DELETE",
          }),
        ),
      );
      fetchCustomers();
      setSelectedCustomers(new Set());
      setShowBulkDeleteModal(false);
      setStatusMessage({
        type: "success",
        text: `${ids.length} client(s) deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting customers:", error);
      setStatusMessage({ type: "error", text: "Failed to delete clients" });
    }
  };

  const toggleCustomerSelection = (customerId) => {
    const newSet = new Set(selectedCustomers);
    if (newSet.has(customerId)) {
      newSet.delete(customerId);
    } else {
      newSet.add(customerId);
    }
    setSelectedCustomers(newSet);
  };

  const toggleSelectAllCustomers = () => {
    if (selectedCustomers.size === filtered.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filtered.map((c) => c.email)));
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this customer?")) {
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/customers/${customerId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        fetchCustomers();
        setSelected(null);
        setStatusMessage({ type: "success", text: "Customer deleted successfully" });
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      setStatusMessage({ type: "error", text: "Failed to delete customer" });
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [customers, search]);

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Notifications */}
      {statusMessage.text && (
        <div
          className={`fixed top-6 right-6 z-9999 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm transition-all duration-300 ${
            statusMessage.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <XCircle size={18} />
          )}
          {statusMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Customers
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Manage your client base
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={async () => {
              if (
                window.confirm("⚠️ DELETE ALL CUSTOMERS? This is dangerous.")
              ) {
                await fetch(
                  `${import.meta.env.VITE_API_URL}/customers/all/delete`,
                  { method: "DELETE" },
                );
                fetchCustomers();
              }
            }}
            className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-all border border-rose-100"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-wrap divide-y sm:divide-y-0 divide-x divide-slate-100">
        {[
          {
            label: "Total Clients",
            value: customers.length,
          },
          {
            label: "UK Region",
            value: customers.filter((c) => c.region === "UK").length,
          },
        ].map((s, i) => (
          <div key={i} className="flex-1 min-w-[140px] px-6 py-5">
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
              {s.label}
            </p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 w-full md:w-80 focus-within:border-primary/50 transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium w-full text-slate-700"
            />
          </div>
          {selectedCustomers.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all flex items-center gap-2 text-sm whitespace-nowrap"
            >
              Delete ({selectedCustomers.size})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] bg-slate-50/60">
                <th className="px-4 py-3.5 w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedCustomers.size === filtered.length &&
                      filtered.length > 0
                    }
                    onChange={toggleSelectAllCustomers}
                    className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer accent-primary"
                  />
                </th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Activity</th>
                <th className="px-4 py-3.5">Total Spent</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr
                  key={c.email}
                  className={`transition-colors ${
                    selectedCustomers.has(c._id)
                      ? "bg-blue-50"
                      : "hover:bg-slate-50/80"
                  } group`}
                >
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(c.email)}
                      onChange={() => toggleCustomerSelection(c.email)}
                      className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer accent-primary"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {c.firstName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {c.firstName} {c.lastName}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${c.region === "UK" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}
                        >
                          {c.region}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-slate-600">
                      {c.email}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      {c.phone}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={13} className="text-slate-400" />
                      <span className="font-medium text-slate-600 text-sm">
                        {c.totalBookings} bookings
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-900 text-sm tabular-nums">
                    £{c.totalSpent?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelected(c);
                        setEditData(c);
                        setIsEditing(false);
                      }}
                      className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c.email)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                      title="Delete customer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-primary/5 via-slate-50 to-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Client" : "Client Profile"}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto no-scrollbar">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 ml-3">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) =>
                        setEditData({ ...editData, firstName: e.target.value })
                      }
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 ml-3">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) =>
                        setEditData({ ...editData, lastName: e.target.value })
                      }
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 ml-3">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editData.email}
                      disabled
                      className="w-full p-3.5 rounded-xl bg-slate-100 border border-slate-200 font-medium text-sm text-slate-400 cursor-not-allowed"
                      title="Email cannot be changed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 ml-3">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData({ ...editData, phone: e.target.value })
                      }
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-primary/20">
                      {selected.firstName[0]}
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                      {selected.firstName} {selected.lastName}
                    </h4>
                    <p className="text-slate-400 font-medium text-sm mt-1">
                      Customer Profile
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">
                      Contact Information
                    </h4>
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Mail size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400">
                            Email Address
                          </p>
                          <p className="font-semibold text-slate-800 text-sm mt-0.5">
                            {selected.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Phone size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400">
                            Phone Number
                          </p>
                          <p className="font-semibold text-slate-800 text-sm mt-0.5">
                            {selected.phone || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400">
                            Region
                          </p>
                          <p className="font-semibold text-slate-800 text-sm mt-0.5">
                            {selected.region || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      <p className="text-[11px] font-semibold text-blue-600 mb-1">
                        Total Bookings
                      </p>
                      <p className="text-2xl font-bold text-blue-700 tabular-nums">
                        {selected.totalBookings}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[11px] font-semibold text-emerald-600 mb-1">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                        £{selected.totalSpent?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>

                  {/* Booking History */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-800">
                        Recent Bookings
                      </h4>
                      {customerBookings.length > 0 && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                          {customerBookings.length} total
                        </span>
                      )}
                    </div>
                    {loadingBookings ? (
                      <p className="text-sm text-slate-400 font-medium animate-pulse">
                        Loading history...
                      </p>
                    ) : customerBookings.length > 0 ? (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {customerBookings.slice(0, 5).map((b) => {
                          const currencySymbol =
                            b.payment?.currency === "GBP" ? "£" : "₦";
                          const isEditingPrice = editingPriceId === b._id;
                          return (
                            <div
                              key={b._id}
                              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-800 truncate">
                                    {b.service}
                                  </p>
                                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    {new Date(
                                      b.schedule?.date || b.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  {isEditingPrice ? (
                                    <div className="flex items-center gap-1">
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                          {currencySymbol}
                                        </span>
                                        <input
                                          type="number"
                                          autoFocus
                                          value={editingPriceValue}
                                          onChange={(e) =>
                                            setEditingPriceValue(
                                              e.target.value,
                                            )
                                          }
                                          className="w-20 pl-5 pr-1 py-1 rounded-lg bg-white border-2 border-primary text-sm font-bold tabular-nums focus:outline-none"
                                        />
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleSaveBookingPrice(b._id)
                                        }
                                        disabled={savingPriceId === b._id}
                                        className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                        title="Save price"
                                      >
                                        <Save size={13} />
                                      </button>
                                      <button
                                        onClick={() => setEditingPriceId(null)}
                                        className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                        title="Cancel"
                                      >
                                        <X size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingPriceId(b._id);
                                        setEditingPriceValue(
                                          String(b.payment?.amount ?? ""),
                                        );
                                      }}
                                      className="group flex items-center gap-1.5 hover:bg-primary/5 rounded-lg px-2 py-1 -mr-2 transition-colors"
                                      title="Edit price"
                                    >
                                      <p className="font-bold text-slate-900 text-sm tabular-nums">
                                        {currencySymbol}
                                        {b.payment?.amount}
                                      </p>
                                      <Edit3
                                        size={11}
                                        className="text-slate-300 group-hover:text-primary transition-colors"
                                      />
                                    </button>
                                  )}
                                  <span
                                    className={`text-[9px] font-semibold uppercase inline-block mt-1 px-2 py-0.5 rounded-full ${b.status === "Completed" ? "bg-emerald-50 text-emerald-600" : b.status === "Cancelled" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}
                                  >
                                    {b.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {customerBookings.length > 5 && (
                          <p className="text-xs text-slate-400 text-center pt-2">
                            +{customerBookings.length - 5} more bookings
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 font-medium">
                        No bookings yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-all"
                  >
                    <Save size={16} /> Update Client
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-all"
                  >
                    <Edit3 size={16} /> Modify Profile
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(selected.email)}
                    className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold border border-rose-200 hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Delete Customer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowBulkDeleteModal(false)}
          ></div>
          <div className="relative bg-white rounded-[28px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
              Delete {selectedCustomers.size} Client(s)?
            </h3>
            <p className="text-slate-400 font-medium text-sm mb-6">
              This action cannot be undone. The selected clients will be
              permanently removed from your database.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-rose-700 transition-all"
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

export default Customers;
