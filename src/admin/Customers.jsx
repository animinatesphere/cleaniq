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
    // eslint-disable-next-line
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
      {/* Notifications - Fixed to viewport for maximum visibility */}
      {statusMessage.text && (
        <div
          className={`fixed top-10 right-10 z-9999 px-8 py-5 rounded-[32px] border shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 font-black text-sm uppercase tracking-widest transition-all duration-500 transform translate-x-0 ${
            statusMessage.type === "success"
              ? "bg-emerald-500 text-white border-emerald-400"
              : "bg-rose-500 text-white border-rose-400"
          }`}
        >
          <div className="bg-white/20 p-2 rounded-xl">
            {statusMessage.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <XCircle size={20} />
            )}
          </div>
          {statusMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary-dark tracking-tighter">
            Customer Intelligence
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">
            Manage Your Client Base
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadCSV}
            className="btn-secondary px-6 py-3 rounded-2xl flex items-center gap-2"
          >
            <Download size={18} /> Export CSV
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
            className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: "Total Clients",
            value: customers.length,
            sub: "All regions",
          },
          {
            label: "UK Region",
            value: customers.filter((c) => c.region === "UK").length,
            sub: "United Kingdom",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {s.label}
            </p>
            <h3 className="text-3xl font-black text-primary-dark mt-1">
              {s.value}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Search and Table */}
      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 w-full md:w-96 group focus-within:border-primary/50 transition-all">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                <th className="px-8 py-5">Customer</th>
                <th className="px-4 py-5">Contact</th>
                <th className="px-4 py-5">Activity</th>
                <th className="px-4 py-5">Total Spent</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr
                  key={c.email}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                        {c.firstName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-primary-dark tracking-tight">
                          {c.firstName} {c.lastName}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${c.region === "UK" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}
                        >
                          {c.region}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-medium text-slate-600">
                      {c.email}
                    </p>
                    <p className="text-xs font-black text-primary mt-0.5">
                      {c.phone}
                    </p>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-blue-500" />
                      <span className="font-black text-primary-dark">
                        {c.totalBookings} Bookings
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-6 font-black text-primary-dark">
                    {c.region === "UK" ? "£" : "₦"}
                    {c.totalSpent?.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => {
                        setSelected(c);
                        setEditData(c);
                        setIsEditing(false);
                      }}
                      className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                    >
                      <Eye size={18} />
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
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-white">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-primary-dark">
                {isEditing ? "Edit Client" : "Client Profile"}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) =>
                        setEditData({ ...editData, firstName: e.target.value })
                      }
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) =>
                        setEditData({ ...editData, lastName: e.target.value })
                      }
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editData.email}
                      disabled
                      className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-100 font-bold text-slate-400 cursor-not-allowed"
                      title="Email cannot be changed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData({ ...editData, phone: e.target.value })
                      }
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-[32px] bg-primary/10 text-primary flex items-center justify-center text-4xl font-black mx-auto mb-6">
                      {selected.firstName[0]}
                    </div>
                    <h4 className="text-3xl font-black text-primary-dark tracking-tighter">
                      {selected.firstName} {selected.lastName}
                    </h4>
                    <p className="text-slate-400 font-bold text-sm mt-2">
                      Customer Profile
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <h4 className="text-sm font-black text-primary-dark uppercase tracking-widest mb-4">
                      Contact Information
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Mail size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Email Address
                          </p>
                          <p className="font-bold text-primary-dark mt-1">
                            {selected.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Phone size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Phone Number
                          </p>
                          <p className="font-bold text-primary-dark mt-1">
                            {selected.phone || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Region
                          </p>
                          <p className="font-bold text-primary-dark mt-1">
                            {selected.region || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                        Total Bookings
                      </p>
                      <p className="text-3xl font-black text-blue-600">
                        {selected.totalBookings}
                      </p>
                    </div>
                    <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">
                        Total Spent
                      </p>
                      <p className="text-2xl font-black text-emerald-600">
                        {selected.region === "UK" ? "£" : "₦"}
                        {selected.totalSpent?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>

                  {/* Booking History */}
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <h4 className="text-sm font-black text-primary-dark mb-4 uppercase tracking-widest">
                      Recent Bookings
                    </h4>
                    {loadingBookings ? (
                      <p className="text-sm text-slate-400 font-bold animate-pulse">
                        Loading history...
                      </p>
                    ) : customerBookings.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {customerBookings.slice(0, 5).map((b) => (
                          <div
                            key={b._id}
                            className="p-4 rounded-2xl bg-white border border-slate-200 flex justify-between items-center hover:border-primary/30 transition-all"
                          >
                            <div>
                              <p className="font-bold text-sm text-primary-dark">
                                {b.service}
                              </p>
                              <p className="text-xs text-slate-400 font-bold mt-1">
                                {new Date(
                                  b.schedule?.date || b.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-primary-dark">
                                {b.payment?.currency === "GBP" ? "£" : "₦"}
                                {b.payment?.amount}
                              </p>
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest inline-block mt-1 px-2 py-1 rounded-lg ${b.status === "Completed" ? "bg-emerald-50 text-emerald-600" : b.status === "Cancelled" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}
                              >
                                {b.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {customerBookings.length > 5 && (
                          <p className="text-xs text-slate-400 text-center pt-2">
                            +{customerBookings.length - 5} more bookings
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 font-bold">
                        No bookings yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <Save size={18} /> Update Client
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                >
                  <Edit3 size={18} /> Modify Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
