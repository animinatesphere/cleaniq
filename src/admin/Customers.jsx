import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Download, X, Edit3, Save, CheckCircle2, XCircle,
  Trash2, Mail, Phone, MapPin, ShoppingBag, LogIn, LogOut,
  Calendar, Clock, RefreshCw, User, Activity,
  CreditCard, Globe, AlertTriangle, UserPlus, Eye, EyeOff, Building2,
} from "lucide-react";
import StatDetailDrawer from "./StatDetailDrawer";

const Badge = ({ children, variant = "default" }) => {
  const cls = {
    default:     "bg-white/10    text-white/60    border-white/20",
    success:     "bg-emerald-500/30 text-emerald-300 border-emerald-400/60",
    warning:     "bg-amber-500/30   text-amber-300   border-amber-400/60",
    destructive: "bg-rose-500/30    text-rose-300     border-rose-400/60",
    blue:        "bg-blue-500/30    text-blue-300     border-blue-400/60",
    purple:      "bg-purple-500/30  text-purple-300   border-purple-400/60",
    orange:      "bg-orange-500/30  text-orange-300   border-orange-400/60",
    sky:         "bg-sky-500/30     text-sky-300      border-sky-400/60",
    indigo:      "bg-indigo-500/30  text-indigo-300   border-indigo-400/60",
    teal:        "bg-teal-500/30    text-teal-300     border-teal-400/60",
  }[variant] || "bg-white/10 text-white/60 border-white/20";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
      {children}
    </span>
  );
};

const Btn = ({ children, variant = "default", size = "md", className = "", ...props }) => {
  const base = "inline-flex items-center gap-1.5 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs rounded-xl", md: "px-4 py-2 text-sm rounded-xl", lg: "px-5 py-2.5 text-sm rounded-xl" };
  const variants = {
    default:     "bg-emerald-500 text-white hover:bg-emerald-400",
    outline:     "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10",
    ghost:       "text-white/60 hover:bg-white/10 hover:text-white",
    destructive: "bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25",
    success:     "bg-emerald-500 text-white hover:bg-emerald-400",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-medium text-white/60">{label}</label>}
    <input
      className="w-full h-9 px-3 text-sm bg-[#071D16] border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:outline-none focus:border-emerald-500/50 transition"
      {...props}
    />
  </div>
);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "Never";
const timeSince = (d) => {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)    return "Just now";
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 7)    return `${days}d ago`;
  return fmtDate(d);
};

const Customers = () => {
  const [customers,       setCustomers]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [search,          setSearch]          = useState("");
  const [statusFilter,    setStatusFilter]    = useState("all");
  const [selected,        setSelected]        = useState(null);
  const [isEditing,       setIsEditing]       = useState(false);
  const [editData,        setEditData]        = useState({});
  const [saving,          setSaving]          = useState(false);
  const [customerBookings,setCustomerBookings]= useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [toast,           setToast]           = useState(null);
  const [selectedIds,     setSelectedIds]     = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCreate,      setShowCreate]      = useState(false);
  const [createData,      setCreateData]      = useState({ firstName:"", lastName:"", email:"", phone:"", password:"" });
  const [showCreatePw,    setShowCreatePw]    = useState(false);
  const [creating,        setCreating]        = useState(false);
  const [showCreateCompany,   setShowCreateCompany]   = useState(false);
  const [companyData,         setCompanyData]         = useState({ companyName:"", firstName:"", lastName:"", email:"", phone:"", password:"" });
  const [showCompanyPw,       setShowCompanyPw]       = useState(false);
  const [creatingCompany,     setCreatingCompany]     = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("overview");
  const [drawer, setDrawer] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCustomers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/customers`);
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load customers", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    if (!selected) { setCustomerBookings([]); return; }
    const go = async () => {
      setLoadingBookings(true);
      try {
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/customers/${selected.email}/bookings`);
        const data = await res.json();
        setCustomerBookings(Array.isArray(data) ? data : []);
      } catch { setCustomerBookings([]); }
      finally  { setLoadingBookings(false); }
    };
    go();
  }, [selected]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/customers/${selected.email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        await fetchCustomers(true);
        setSelected({ ...selected, ...editData });
        setIsEditing(false);
        showToast("Customer updated");
      } else {
        showToast("Failed to update customer", "error");
      }
    } catch {
      showToast("Failed to update customer", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (email) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/customers/${email}`, { method: "DELETE" });
      if (res.ok) {
        await fetchCustomers(true);
        if (selected?.email === email) setSelected(null);
        showToast("Customer deleted");
      } else {
        showToast("Failed to delete customer", "error");
      }
    } catch {
      showToast("Failed to delete customer", "error");
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleCreate = async () => {
    const { firstName, lastName, email, password } = createData;
    if (!firstName || !lastName || !email || !password) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/customers/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchCustomers(true);
        setShowCreate(false);
        setCreateData({ firstName:"", lastName:"", email:"", phone:"", password:"" });
        showToast("Account created — login details sent to customer");
      } else {
        showToast(data.message || "Failed to create account", "error");
      }
    } catch {
      showToast("Failed to create account", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCompany = async () => {
    const { companyName, firstName, lastName, email, password } = companyData;
    if (!companyName || !firstName || !lastName || !email || !password) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    setCreatingCompany(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/customers/create-company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchCustomers(true);
        setShowCreateCompany(false);
        setCompanyData({ companyName:"", firstName:"", lastName:"", email:"", phone:"", password:"" });
        showToast("Company account created — login details sent");
      } else {
        showToast(data.message || "Failed to create company account", "error");
      }
    } catch {
      showToast("Failed to create company account", "error");
    } finally {
      setCreatingCompany(false);
    }
  };

  const downloadCSV = () => {
    const headers = ["Name","Email","Phone","Region","Bookings","Total Spent","Last Login","Created"];
    const rows    = filtered.map(c => [
      `${c.firstName} ${c.lastName}`, c.email, c.phone || "", c.region || "",
      c.totalBookings || 0, c.totalSpent || 0,
      c.lastLoginAt ? new Date(c.lastLoginAt).toISOString() : "",
      c.createdAt   ? new Date(c.createdAt).toISOString()   : "",
    ]);
    const csv  = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `customers_${Date.now()}.csv` });
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    let list = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      );
    }
    if (statusFilter !== "all") {
      if (statusFilter === "active")   list = list.filter(c => c.lastLoginAt);
      if (statusFilter === "inactive") list = list.filter(c => !c.lastLoginAt);
    }
    return list;
  }, [customers, search, statusFilter]);

  const stats = useMemo(() => ({
    total:     customers.length,
    active:    customers.filter(c => c.lastLoginAt).length,
    newToday:  customers.filter(c => c.createdAt && new Date(c.createdAt) > new Date(Date.now() - 86400000)).length,
    totalSpent:customers.reduce((s, c) => s + (c.totalSpent || 0), 0),
  }), [customers]);

  const openCustomer = (c) => {
    setSelected(c);
    setEditData(c);
    setIsEditing(false);
    setActiveDetailTab("overview");
  };

  const customerDrawerItem = (c) => (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/4 transition-colors">
      <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-semibold text-emerald-400">
          {((c.firstName?.[0]||"")+(c.lastName?.[0]||"")).toUpperCase()||"?"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate">{c.firstName} {c.lastName}</p>
        <p className="text-xs text-white/40 truncate">{c.email}</p>
      </div>
      <span className="text-[11px] font-semibold text-white/50 shrink-0">{c.totalBookings || 0} bookings</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#061A13]">

      {toast && (
        <div className={`fixed top-4 right-4 z-9999 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border
          ${toast.type === "success" ? "bg-[#0B2D22] border-emerald-500/25 text-emerald-400" : "bg-[#0B2D22] border-rose-500/25 text-rose-400"}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} className="text-emerald-400"/> : <XCircle size={16} className="text-rose-400"/>}
          {toast.msg}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-9998 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B2D22] rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/15 mx-auto mb-4">
              <AlertTriangle size={22} className="text-rose-400"/>
            </div>
            <h3 className="text-base font-semibold text-white text-center mb-1">Delete customer?</h3>
            <p className="text-sm text-white/70 text-center mb-6">This action cannot be undone. All their data will be permanently removed.</p>
            <div className="flex gap-3">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowDeleteConfirm(null)}>Cancel</Btn>
              <Btn variant="destructive" className="flex-1 justify-center" onClick={() => handleDelete(showDeleteConfirm)}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-9998 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B2D22] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <UserPlus size={15} className="text-white"/>
                </div>
                <h3 className="text-base font-semibold text-white">Create Customer Account</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-md text-white/40 hover:bg-white/10">
                <X size={16}/>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-white/70">The customer will receive an email with their login credentials.</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name *" placeholder="Jane" value={createData.firstName} onChange={e => setCreateData({...createData, firstName:e.target.value})}/>
                <Input label="Last Name *"  placeholder="Smith" value={createData.lastName}  onChange={e => setCreateData({...createData, lastName:e.target.value})}/>
              </div>
              <Input label="Email Address *" type="email" placeholder="jane@example.com" value={createData.email} onChange={e => setCreateData({...createData, email:e.target.value})}/>
              <Input label="Phone (optional)" type="tel" placeholder="+44 7700 000000" value={createData.phone} onChange={e => setCreateData({...createData, phone:e.target.value})}/>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60">Password *</label>
                <div className="relative">
                  <input
                    type={showCreatePw ? "text" : "password"}
                    placeholder="Set a temporary password"
                    value={createData.password}
                    onChange={e => setCreateData({...createData, password:e.target.value})}
                    className="w-full h-9 px-3 pr-10 text-sm bg-[#071D16] border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:outline-none focus:border-emerald-500/50 transition"
                  />
                  <button type="button" onClick={() => setShowCreatePw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showCreatePw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
              <Btn variant="outline" onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn onClick={handleCreate} disabled={creating}>
                {creating ? <RefreshCw size={12} className="animate-spin"/> : <Mail size={12}/>}
                Create &amp; Send Email
              </Btn>
            </div>
          </div>
        </div>
      )}

      {showCreateCompany && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B2D22] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                  <Building2 size={15} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">Create Company Account</h3>
              </div>
              <button onClick={() => setShowCreateCompany(false)} className="p-1.5 rounded-md text-white/40 hover:bg-white/10">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-white/70">The company will receive login credentials by email and can post jobs from the customer app.</p>
              <Input label="Company Name *" placeholder="e.g. Sparkle Cleaning Ltd" value={companyData.companyName} onChange={e => setCompanyData({...companyData, companyName: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Contact First Name *" placeholder="Jane" value={companyData.firstName} onChange={e => setCompanyData({...companyData, firstName: e.target.value})} />
                <Input label="Last Name *" placeholder="Smith" value={companyData.lastName} onChange={e => setCompanyData({...companyData, lastName: e.target.value})} />
              </div>
              <Input label="Email Address *" type="email" placeholder="jane@company.com" value={companyData.email} onChange={e => setCompanyData({...companyData, email: e.target.value})} />
              <Input label="Phone (optional)" type="tel" placeholder="+44 7700 000000" value={companyData.phone} onChange={e => setCompanyData({...companyData, phone: e.target.value})} />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60">Password *</label>
                <div className="relative">
                  <input
                    type={showCompanyPw ? "text" : "password"}
                    placeholder="Set a temporary password"
                    value={companyData.password}
                    onChange={e => setCompanyData({...companyData, password: e.target.value})}
                    className="w-full h-9 px-3 pr-10 text-sm bg-[#071D16] border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:outline-none focus:border-emerald-500/50 transition"
                  />
                  <button type="button" onClick={() => setShowCompanyPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showCompanyPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
              <Btn variant="outline" onClick={() => setShowCreateCompany(false)}>Cancel</Btn>
              <Btn onClick={handleCreateCompany} disabled={creatingCompany} className="bg-sky-500 hover:bg-sky-400">
                {creatingCompany ? <RefreshCw size={12} className="animate-spin" /> : <Building2 size={12} />}
                Create Company &amp; Send Email
              </Btn>
            </div>
          </div>
        </div>
      )}

      <div className={`flex h-screen overflow-hidden transition-all`}>

        <div className={`flex flex-col overflow-hidden transition-all ${selected ? "w-0 md:w-1/2 lg:w-[55%]" : "w-full"}`}>

          <div className="bg-[#0B2D22] border-b border-white/10 px-6 py-5 shrink-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-semibold text-white">Customers</h1>
                <p className="text-sm text-white/40 mt-0.5">{customers.length.toLocaleString()} total accounts</p>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="outline" size="sm" onClick={() => fetchCustomers(true)} disabled={refreshing}>
                  <RefreshCw size={13} className={refreshing ? "animate-spin" : ""}/>
                  Refresh
                </Btn>
                <Btn variant="outline" size="sm" onClick={downloadCSV}>
                  <Download size={13}/> Export
                </Btn>
                <Btn size="sm" onClick={() => setShowCreate(true)}>
                  <UserPlus size={13}/> Create Account
                </Btn>
                <Btn size="sm" variant="outline" onClick={() => setShowCreateCompany(true)}>
                  <Building2 size={13}/> Create Company
                </Btn>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label:"Total",     value: stats.total,                            color:"text-white",       drawerTitle:"All Customers",     drawerSub:`${stats.total} total`,                               drawerItems:customers,                                                                                                      accent:"emerald" },
                { label:"Active",    value: stats.active,                           color:"text-emerald-400", drawerTitle:"Active Customers",  drawerSub:`${stats.active} with login activity`,                drawerItems:customers.filter(c => c.lastLoginAt),                                                                          accent:"emerald" },
                { label:"New today", value: stats.newToday,                         color:"text-blue-400",    drawerTitle:"New Today",         drawerSub:`${stats.newToday} registered in the last 24h`,      drawerItems:customers.filter(c => c.createdAt && new Date(c.createdAt) > new Date(Date.now() - 86400000)),                  accent:"blue"    },
                { label:"Revenue",   value:`£${stats.totalSpent.toLocaleString()}`, color:"text-white",       drawerTitle:"Revenue Breakdown", drawerSub:`£${stats.totalSpent.toLocaleString()} total spent`,  drawerItems:[...customers].sort((a,b) => (b.totalSpent||0) - (a.totalSpent||0)),                                           accent:"emerald" },
              ].map(s => (
                <div
                  key={s.label}
                  onClick={() => setDrawer({ title: s.drawerTitle, subtitle: s.drawerSub, items: s.drawerItems, accentColor: s.accent, renderItem: customerDrawerItem })}
                  className="bg-[#071D16] border border-white/10 rounded-xl px-3 py-3 cursor-pointer"
                >
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1">{s.label}</p>
                  <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 text-sm bg-[#071D16] border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:outline-none focus:border-emerald-500/50 transition"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-sm bg-[#071D16] border border-white/10 text-white rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Never logged in</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={20} className="animate-spin text-white/40"/>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/40">
                <User size={32} strokeWidth={1.5} className="mb-3"/>
                <p className="text-sm font-medium">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 bg-[#071D16] border-b border-white/10 z-10">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox"
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={() => selectedIds.size === filtered.length
                          ? setSelectedIds(new Set())
                          : setSelectedIds(new Set(filtered.map(c => c.email)))
                        }
                        className="rounded border-white/20 accent-emerald-500"
                      />
                    </th>
                    <th className="px-4 py-3 font-bold text-white/40 text-[10px] uppercase tracking-widest">Customer</th>
                    <th className="px-4 py-3 font-bold text-white/40 text-[10px] uppercase tracking-widest hidden md:table-cell">Contact</th>
                    <th className="px-4 py-3 font-bold text-white/40 text-[10px] uppercase tracking-widest hidden lg:table-cell">Last Login</th>
                    <th className="px-4 py-3 font-bold text-white/40 text-[10px] uppercase tracking-widest">Bookings</th>
                    <th className="px-4 py-3 font-bold text-white/40 text-[10px] uppercase tracking-widest text-right">Spent</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {filtered.map(c => (
                    <tr
                      key={c.email}
                      onClick={() => openCustomer(c)}
                      className={`cursor-pointer hover:bg-[#0A2A1F] transition-colors ${selected?.email === c.email ? "bg-emerald-500/8" : ""}`}
                    >
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <input type="checkbox"
                          checked={selectedIds.has(c.email)}
                          onChange={() => {
                            const s = new Set(selectedIds);
                            s.has(c.email) ? s.delete(c.email) : s.add(c.email);
                            setSelectedIds(s);
                          }}
                          className="rounded border-white/20 accent-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {(c.firstName?.[0] || "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-white/40 mt-0.5">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-white/70">{c.phone || "—"}</p>
                        {c.region && <Badge variant="blue">{c.region}</Badge>}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {c.lastLoginAt ? (
                          <div>
                            <p className="text-white/70 text-xs">{timeSince(c.lastLoginAt)}</p>
                            <p className="text-white/30 text-[11px]">{fmtDate(c.lastLoginAt)}</p>
                          </div>
                        ) : (
                          <Badge variant="warning">Never logged in</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-white">{c.totalBookings || 0}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-white tabular-nums">
                        £{(c.totalSpent || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setShowDeleteConfirm(c.email)}
                          className="p-1.5 rounded-md text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col border-l border-white/10 bg-[#0B2D22] overflow-hidden">

            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                  {(selected.firstName?.[0] || "?").toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{selected.firstName} {selected.lastName}</p>
                  <p className="text-xs text-white/40">Joined {fmtDate(selected.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Btn variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Btn>
                    <Btn size="sm" onClick={handleUpdate} disabled={saving}>
                      {saving ? <RefreshCw size={12} className="animate-spin"/> : <Save size={12}/>}
                      Save
                    </Btn>
                  </>
                ) : (
                  <Btn variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 size={12}/> Edit
                  </Btn>
                )}
                <button
                  onClick={() => { setSelected(null); setIsEditing(false); }}
                  className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  <X size={16}/>
                </button>
              </div>
            </div>

            <div className="flex border-b border-white/10 px-6 shrink-0">
              {[
                { key:"overview", label:"Overview" },
                { key:"activity", label:"Login Activity" },
                { key:"bookings", label:"Bookings" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveDetailTab(t.key)}
                  className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-all ${
                    activeDetailTab === t.key
                      ? "border-emerald-500 text-white"
                      : "border-transparent text-white/40 hover:text-white/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">

              {activeDetailTab === "overview" && (
                <div className="space-y-6">

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label:"Bookings",    value: selected.totalBookings || 0 },
                      { label:"Total Spent", value: `£${(selected.totalSpent||0).toLocaleString()}` },
                      { label:"Region",      value: selected.region || "—" },
                    ].map(s => (
                      <div key={s.label} className="bg-[#071D16] border border-white/10 rounded-xl p-3">
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1">{s.label}</p>
                        <p className="text-base font-bold text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide">Personal Information</h3>
                    </div>
                    <div className="border border-white/10 rounded-xl divide-y divide-white/6">
                      {isEditing ? (
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="First Name" value={editData.firstName || ""} onChange={e => setEditData({...editData, firstName:e.target.value})}/>
                            <Input label="Last Name"  value={editData.lastName  || ""} onChange={e => setEditData({...editData, lastName:e.target.value})}/>
                          </div>
                          <Input label="Email"   type="email" value={editData.email   || ""} onChange={e => setEditData({...editData, email:e.target.value})}/>
                          <Input label="Phone"   type="tel"   value={editData.phone   || ""} onChange={e => setEditData({...editData, phone:e.target.value})}/>
                          <Input label="Address"              value={editData.address || ""} onChange={e => setEditData({...editData, address:e.target.value})}/>
                          <Input label="Region"               value={editData.region  || ""} onChange={e => setEditData({...editData, region:e.target.value})}/>
                        </div>
                      ) : (
                        <>
                          {[
                            { Icon:User,     label:"Full name",    value:`${selected.firstName} ${selected.lastName}` },
                            { Icon:Mail,     label:"Email",        value:selected.email },
                            { Icon:Phone,    label:"Phone",        value:selected.phone  || "Not set" },
                            { Icon:MapPin,   label:"Address",      value:selected.address || "Not set" },
                            { Icon:Globe,    label:"Region",       value:selected.region  || "Not set" },
                            { Icon:Calendar, label:"Registered",   value:fmtDate(selected.createdAt) },
                          ].map(({Icon,label,value}) => (
                            <div key={label} className="flex items-center gap-3 px-4 py-3">
                              <Icon size={14} className="text-white/40 shrink-0"/>
                              <span className="text-xs text-white/40 w-24 shrink-0">{label}</span>
                              <span className="text-sm text-white/70 font-medium truncate">{value}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Account Status</h3>
                    <div className="border border-white/10 rounded-xl divide-y divide-white/6">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <LogIn size={14} className="text-white/40"/>
                        <span className="text-xs text-white/40 w-24">Last login</span>
                        <span className="text-sm font-medium text-white/70">{fmtDateTime(selected.lastLoginAt)}</span>
                        {selected.lastLoginAt && (
                          <Badge variant="success">{timeSince(selected.lastLoginAt)}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <LogOut size={14} className="text-white/40"/>
                        <span className="text-xs text-white/40 w-24">Last logout</span>
                        <span className="text-sm font-medium text-white/70">{fmtDateTime(selected.lastLogoutAt)}</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Activity size={14} className="text-white/40"/>
                        <span className="text-xs text-white/40 w-24">Total logins</span>
                        <span className="text-sm font-medium text-white/70">{selected.loginCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === "activity" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-[#071D16] border border-white/10 rounded-xl">
                    <Activity size={14} className="text-white/40"/>
                    <p className="text-xs text-white/60 font-medium">
                      Login history shows the last 50 sessions for this customer.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#071D16] border border-white/10 rounded-xl p-3">
                      <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1">Last Login</p>
                      <p className="text-sm font-semibold text-white">{timeSince(selected.lastLoginAt) || "Never"}</p>
                      <p className="text-[11px] text-white/30">{fmtDateTime(selected.lastLoginAt)}</p>
                    </div>
                    <div className="bg-[#071D16] border border-white/10 rounded-xl p-3">
                      <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1">Last Logout</p>
                      <p className="text-sm font-semibold text-white">{timeSince(selected.lastLogoutAt) || "Never"}</p>
                      <p className="text-[11px] text-white/30">{fmtDateTime(selected.lastLogoutAt)}</p>
                    </div>
                  </div>

                  {selected.loginHistory?.length > 0 ? (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Session History</h3>
                      {selected.loginHistory.slice().reverse().map((session, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-white/6 bg-[#071D16] hover:border-white/10 transition-all">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            session.action === "logout" ? "bg-white/10" : "bg-emerald-500/15"
                          }`}>
                            {session.action === "logout"
                              ? <LogOut size={13} className="text-white/40"/>
                              : <LogIn  size={13} className="text-emerald-400"/>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-white capitalize">{session.action || "Login"}</p>
                              <p className="text-[11px] text-white/30">{timeSince(session.timestamp)}</p>
                            </div>
                            <p className="text-xs text-white/40 mt-0.5">{fmtDateTime(session.timestamp)}</p>
                            {session.device && <p className="text-[11px] text-white/30 mt-0.5">{session.device}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-white/40">
                      <Clock size={28} strokeWidth={1.5} className="mb-3"/>
                      <p className="text-sm font-medium">No login history available</p>
                      <p className="text-xs mt-1">Sessions are recorded when the customer logs in or out</p>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === "bookings" && (
                <div>
                  {loadingBookings ? (
                    <div className="flex items-center justify-center h-40">
                      <RefreshCw size={18} className="animate-spin text-white/40"/>
                    </div>
                  ) : customerBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/40">
                      <ShoppingBag size={28} strokeWidth={1.5} className="mb-3"/>
                      <p className="text-sm font-medium">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-white/40 mb-3">{customerBookings.length} booking{customerBookings.length !== 1 ? "s" : ""} found</p>
                      {customerBookings.map(b => {
                        const statusColor = {
                          confirmed:            "success",
                          completed:            "blue",
                          "completed - unpaid": "purple",
                          "in progress":        "orange",
                          pending:              "warning",
                          cancelled:            "destructive",
                          accepted:             "sky",
                          assigned:             "indigo",
                          arrived:              "teal",
                        }[b.status?.toLowerCase()] || "default";
                        return (
                          <div key={b._id} className="border border-white/10 rounded-xl p-4 bg-[#071D16] hover:border-white/20 transition-all">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <p className="font-medium text-white text-sm">{b.service || "Cleaning Service"}</p>
                              <Badge variant={statusColor}>{b.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-white/40">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={11}/>
                                <span>{fmtDate(b.schedule?.date || b.preferredDate)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CreditCard size={11}/>
                                <span className="font-semibold text-white/70">£{b.payment?.amount?.toFixed(2) || "0.00"}</span>
                              </div>
                              {b.details?.address && (
                                <div className="flex items-center gap-1.5 col-span-2">
                                  <MapPin size={11}/>
                                  <span className="truncate">{b.details.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isEditing && (
              <div className="px-6 py-4 border-t border-white/10 shrink-0">
                <Btn variant="outline" size="sm" className="text-rose-400 border-rose-500/25 hover:bg-rose-500/15 hover:border-rose-500/40"
                  onClick={() => setShowDeleteConfirm(selected.email)}>
                  <Trash2 size={12}/> Delete account
                </Btn>
              </div>
            )}
          </div>
        )}
      </div>
      <StatDetailDrawer
        isOpen={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.title || ""}
        subtitle={drawer?.subtitle || ""}
        items={drawer?.items || []}
        renderItem={drawer?.renderItem}
        onViewAll={drawer?.onViewAll}
        accentColor={drawer?.accentColor || "emerald"}
      />
    </div>
  );
};

export default Customers;
