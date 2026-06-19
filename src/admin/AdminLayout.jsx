import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  Search,
  Bell,
  User,
  Clock,
  CheckCircle2,
  Briefcase,
  MessageSquare,
  BookOpen,
  Wallet,
  DollarSign,
  FileText,
} from "lucide-react";
import Login from "./Login";

const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("adminToken"),
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setIsAuthenticated(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch recent activities for notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [bookingsRes, applicantsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/bookings`),
          fetch(`${import.meta.env.VITE_API_URL}/recruitment`),
        ]);
        const bookings = await bookingsRes.json();
        const applicants = await applicantsRes.json();

        // Combine and sort by date
        const combined = [
          ...bookings.slice(0, 5).map((b) => ({
            id: b._id,
            type: "booking",
            title: "New Booking Received",
            desc: `${b.customer.firstName} booked ${b.service}`,
            time: new Date(b.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            path: "/admin/bookings",
          })),
          ...applicants.slice(0, 3).map((a) => ({
            id: a._id,
            type: "applicant",
            title: "New Job Application",
            desc: `${a.fullName} applied as cleaner`,
            time: "Recently",
            path: "/admin/applicants",
          })),
        ].slice(0, 8);
        setNotifications(combined);
      } catch (err) {
        console.error(err);
      }
    };
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated]);

  if (!isAuthenticated)
    return <Login onLogin={() => setIsAuthenticated(true)} />;

  const menuGroups = [
    {
      label: "Overview",
      items: [
        {
          name: "Dashboard",
          path: "/admin",
          icon: <LayoutDashboard size={20} />,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          name: "Bookings",
          path: "/admin/bookings",
          icon: <Calendar size={20} />,
        },
        {
          name: "Quotes",
          path: "/admin/quotes",
          icon: <FileText size={20} />,
        },
        {
          name: "Services",
          path: "/admin/services",
          icon: <ShieldCheck size={20} />,
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          name: "Staff Pay",
          path: "/admin/staff-pay",
          icon: <DollarSign size={20} />,
        },
        {
          name: "Payment Approvals",
          path: "/admin/payments",
          icon: <CheckCircle2 size={20} />,
        },
        {
          name: "Disbursement",
          path: "/admin/withdrawals",
          icon: <Wallet size={20} />,
        },
      ],
    },
    {
      label: "People",
      items: [
        {
          name: "Staff",
          path: "/admin/workers",
          icon: <Briefcase size={20} />,
        },
        {
          name: "Applicants",
          path: "/admin/applicants",
          icon: <Users size={20} />,
        },
        {
          name: "Customers",
          path: "/admin/customers",
          icon: <User size={20} />,
        },
      ],
    },
    {
      label: "Content & Support",
      items: [
        { name: "Blog", path: "/admin/blog", icon: <BookOpen size={20} /> },
        {
          name: "Chat Support",
          path: "/admin/chat",
          icon: <MessageSquare size={20} />,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          name: "Settings",
          path: "/admin/settings",
          icon: <Settings size={20} />,
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-primary-dark/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-primary-dark text-white p-6 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20">
              <ShieldCheck className="text-primary-dark" size={24} />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none uppercase tracking-tighter">
                Cleaniq
              </h1>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                Business Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/50 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
          {menuGroups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="px-4 text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive =
                  item.path === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 border-l-[3px] ${isActive ? "bg-secondary text-primary-dark shadow-lg border-secondary" : "hover:bg-white/5 text-slate-400 hover:text-white border-transparent"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span className="font-bold text-sm">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={16} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-6 space-y-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-4 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600"
          >
            <Menu size={24} />
          </button>

          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 focus-within:border-primary/50 transition-all">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm font-medium w-64 text-slate-700"
            />
          </div>

          <div
            className="flex items-center gap-2 sm:gap-3 lg:gap-6 relative"
            ref={notifRef}
          >
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2.5 rounded-xl border transition-all ${isNotifOpen ? "bg-primary/10 border-primary text-primary" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-4 w-[85vw] sm:w-80 bg-white border border-slate-200 rounded-4xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-primary-dark text-sm">
                    Notifications
                  </h3>
                  <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                    {notifications.length} New
                  </span>
                </div>
                <div className="max-h-100 overflow-y-auto">
                  {notifications.map((n, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        navigate(n.path);
                        setIsNotifOpen(false);
                      }}
                      className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === "booking" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                        >
                          {n.type === "booking" ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <Users size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-primary-dark truncate">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2">
                            {n.desc}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <Clock size={10} /> {n.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/admin/bookings")}
                  className="w-full py-4 text-[10px] font-black text-primary uppercase tracking-widest bg-slate-50/50 hover:bg-slate-100 transition-all border-t border-slate-100"
                >
                  View All Activities
                </button>
              </div>
            )}

            <div
              className="flex items-center gap-3 pl-2 group cursor-pointer"
              onClick={() => navigate("/admin/settings")}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-primary-dark leading-tight group-hover:text-primary transition-colors">
                  Admin
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Manager
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-white shadow-sm group-hover:border-primary/20 transition-all">
                <User size={22} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-400 mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
