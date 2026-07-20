import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  Receipt,
  CalendarRange,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Menu,
  X,
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
  History,
  Building2,
  UserPlus,
  ListChecks,
  Repeat,
  Trash2,
  Mail,
  CalendarDays,
  FileSignature,
  Zap,
  KanbanSquare,
  ClipboardList,
  AlertTriangle,
  FileCheck,
  BarChart2,
  Share2,
  Megaphone,
  Tag,
  ChevronDown,
  Home,
} from "lucide-react";
import Login from "./Login";
import logo from "../assets/logo DP2.jpg";
const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("adminToken"),
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("adminSidebarCollapsed") === "true",
  );
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("adminSidebarOpenGroups");
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(["Overview"]);
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      localStorage.setItem("adminSidebarOpenGroups", JSON.stringify([...next]));
      return next;
    });
  };
  const location = useLocation();
  const navigate = useNavigate();

  const adminRole = localStorage.getItem("adminRole") || "superadmin";
  const isBookingAgent = adminRole === "restricted";
  const adminPermissions = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminPermissions") || "[]");
    } catch {
      return [];
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminPermissions");
    setIsAuthenticated(false);
  };

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem("adminSidebarCollapsed", String(!prev));
      return !prev;
    });
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
    if (isAuthenticated && !isBookingAgent) fetchNotifications();
  }, [isAuthenticated, isBookingAgent]);

  if (!isAuthenticated)
    return <Login onLogin={() => setIsAuthenticated(true)} />;

  const fullMenuGroups = [
    {
      label: "Overview",
      groupIcon: <LayoutDashboard size={14} />,
      items: [
        {
          name: "Dashboard",
          path: "/admin",
          key: "dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          name: "Analytics",
          path: "/admin/analytics",
          key: "analytics",
          icon: <Globe size={20} />,
        },
        {
          name: "Expense Tracker",
          path: "/admin/expenses",
          key: "expenses",
          icon: <Receipt size={20} />,
        },
      ],
    },
    {
      label: "Operations",
      groupIcon: <ClipboardList size={14} />,
      items: [
        {
          name: "Job Tracker",
          path: "/admin/jobs",
          key: "jobs",
          icon: <ClipboardList size={20} />,
        },
        {
          name: "Bookings",
          path: "/admin/bookings",
          key: "bookings",
          icon: <Calendar size={20} />,
        },
        {
          name: "Calendar",
          path: "/admin/calendar",
          key: "calendar",
          icon: <CalendarDays size={20} />,
        },
        {
          name: "Rota",
          path: "/admin/rota",
          key: "rota",
          icon: <CalendarRange size={20} />,
        },
        {
          name: "Quotes",
          path: "/admin/quotes",
          key: "quotes",
          exact: true,
          icon: <FileText size={20} />,
        },
        {
          name: "Quote History",
          path: "/admin/quotes/history",
          key: "quotes",
          icon: <History size={20} />,
        },
        {
          name: "Services",
          path: "/admin/services",
          key: "services",
          icon: <ShieldCheck size={20} />,
        },
        {
          name: "Leads",
          path: "/admin/leads",
          key: "leads",
          icon: <UserPlus size={20} />,
        },
        {
          name: "Pipeline",
          path: "/admin/pipeline",
          key: "pipeline",
          icon: <KanbanSquare size={20} />,
        },
        {
          name: "Campaigns",
          path: "/admin/campaigns",
          key: "campaigns",
          icon: <Megaphone size={20} />,
        },
        {
          name: "Checklist",
          path: "/admin/checklist",
          key: "checklist",
          icon: <ListChecks size={20} />,
        },
        {
          name: "Recurring",
          path: "/admin/recurring",
          key: "recurring",
          icon: <Repeat size={20} />,
        },
        {
          name: "Email History",
          path: "/admin/email-history",
          key: "email-history",
          icon: <Mail size={20} />,
        },
        {
          name: "Automations",
          path: "/admin/automations",
          key: "automations",
          icon: <Zap size={20} />,
        },
        {
          name: "SMS Automation",
          path: "/admin/sms-automation",
          key: "sms-automation",
          icon: <MessageSquare size={20} />,
        },
        {
          name: "Invoice ",
          path: "/admin/invoice-builder",
          key: "invoice-builder",
          icon: <FileSignature size={20} />,
        },
        {
          name: "Commercial Hub",
          path: "/admin/commercial",
          key: "commercial",
          icon: <Building2 size={20} />,
        },
        {
          name: "Property Report",
          path: "/admin/property-report",
          key: "property-report",
          icon: <ClipboardList size={20} />,
        },
        {
          name: "Property Condition",
          path: "/admin/domestic",
          key: "Property-condition",
          icon: <Home size={20} />,
        },
        {
          name: "Price List",
          path: "/admin/pricelist",
          key: "pricelist",
          icon: <Tag size={20} />,
        },
      ],
    },
    {
      label: "CRM",
      groupIcon: <Users size={14} />,
      items: [
        {
          name: "Tasks",
          path: "/admin/tasks",
          key: "tasks",
          icon: <ClipboardList size={20} />,
        },
        {
          name: "Complaints",
          path: "/admin/complaints",
          key: "complaints",
          icon: <AlertTriangle size={20} />,
        },
        {
          name: "Contracts",
          path: "/admin/contracts",
          key: "contracts",
          icon: <FileCheck size={20} />,
        },
        {
          name: "Worker Performance",
          path: "/admin/worker-performance",
          key: "worker-performance",
          icon: <BarChart2 size={20} />,
        },
        {
          name: "Referrals",
          path: "/admin/referrals",
          key: "referrals",
          icon: <Share2 size={20} />,
        },
      ],
    },
    {
      label: "Finance",
      groupIcon: <DollarSign size={14} />,
      items: [
        {
          name: "Staff Pay",
          path: "/admin/staff-pay",
          key: "staff-pay",
          icon: <DollarSign size={20} />,
        },
        {
          name: "Payment Approvals",
          path: "/admin/payments",
          key: "payments",
          icon: <CheckCircle2 size={20} />,
        },
        {
          name: "Disbursement",
          path: "/admin/withdrawals",
          key: "withdrawals",
          icon: <Wallet size={20} />,
        },
      ],
    },
    {
      label: "People",
      groupIcon: <Briefcase size={14} />,
      items: [
        {
          name: "Staff",
          path: "/admin/workers",
          key: "workers",
          icon: <Briefcase size={20} />,
        },
        {
          name: "Applicants",
          path: "/admin/applicants",
          key: "applicants",
          icon: <Users size={20} />,
        },
        {
          name: "Customers",
          path: "/admin/customers",
          key: "customers",
          icon: <User size={20} />,
        },
      ],
    },
    {
      label: "Content & Support",
      groupIcon: <MessageSquare size={14} />,
      items: [
        {
          name: "Blog",
          path: "/admin/blog",
          key: "blog",
          icon: <BookOpen size={20} />,
        },
        {
          name: "Chat Support",
          path: "/admin/chat",
          key: "chat",
          icon: <MessageSquare size={20} />,
        },
      ],
    },
    {
      label: "System",
      groupIcon: <Settings size={14} />,
      items: [
        {
          name: "Organization Chart",
          path: "/admin/org-chart",
          key: "org-chart",
          icon: <Building2 size={20} />,
        },
        {
          name: "Bin",
          path: "/admin/bin",
          key: "bin",
          icon: <Trash2 size={20} />,
        },
        {
          name: "Settings",
          path: "/admin/settings",
          key: "settings",
          icon: <Settings size={20} />,
        },
      ],
    },
  ];

  // Restricted accounts only see the pages their permissions list grants —
  // Dashboard (revenue) and Settings are never shown to them, full stop.
  const menuGroups = isBookingAgent
    ? fullMenuGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            adminPermissions.includes(item.key),
          ),
        }))
        .filter((group) => group.items.length > 0)
    : fullMenuGroups;

  const allowedPaths = menuGroups.flatMap((g) => g.items.map((i) => i.path));

  // Redirect a restricted account away from any route it isn't allowed to see.
  useEffect(() => {
    if (!isAuthenticated || !isBookingAgent) return;
    const isAllowed = allowedPaths.some((p) =>
      p === "/admin"
        ? location.pathname === "/admin"
        : location.pathname.startsWith(p),
    );
    if (!isAllowed) {
      navigate(allowedPaths[0] || "/admin/bookings", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isBookingAgent, location.pathname]);

  // Auto-open the group that contains the current active route
  useEffect(() => {
    const pathname = location.pathname;
    fullMenuGroups.forEach((group) => {
      const hasActive = group.items.some((item) =>
        item.path === "/admin" || item.exact
          ? pathname === item.path
          : pathname.startsWith(item.path),
      );
      if (hasActive) {
        setOpenGroups((prev) => {
          if (prev.has(group.label)) return prev;
          const next = new Set(prev);
          next.add(group.label);
          localStorage.setItem("adminSidebarOpenGroups", JSON.stringify([...next]));
          return next;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#061A13] print:bg-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-72 ${isCollapsed ? "lg:w-22 lg:px-3" : ""} bg-[#05201A] border-r border-white/[0.08] text-white/50 p-6 flex flex-col transition-all duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex items-center pb-5 mb-5 border-b border-white/[0.08] ${isCollapsed ? "lg:justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/10 flex-shrink-0 overflow-hidden">
              <img src={logo} alt="" className="w-full h-full object-cover" />
            </div>
            <div className={isCollapsed ? "lg:hidden" : ""}>
              <h1 className="font-black text-base leading-none tracking-tighter text-white whitespace-nowrap">
                Cleaniq Services
              </h1>
              <span className="text-[10px] text-white/35 font-semibold uppercase tracking-widest whitespace-nowrap">
                Business Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden text-white/40 hover:text-white/70 ${isCollapsed ? "lg:hidden" : ""}`}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scrollbar pr-1 space-y-0.5">
          {/* Desktop collapsed: icon-only flat list (hidden on mobile) */}
          {isCollapsed &&
            menuGroups.flatMap((g) => g.items).map((item) => {
              const isActive =
                item.path === "/admin" || item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={item.name}
                  className={`hidden lg:flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:bg-white/[0.07] hover:text-white/70"
                  }`}
                >
                  {item.icon}
                </Link>
              );
            })}

          {/* Expanded: collapsible groups (always on mobile, on desktop when not collapsed) */}
          <div className={isCollapsed ? "lg:hidden" : ""}>
            {menuGroups.map((group) => {
              const isOpen = openGroups.has(group.label);
              const hasActiveItem = group.items.some((item) =>
                item.path === "/admin" || item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path),
              );
              return (
                <div key={group.label} className="mb-1">
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-200 group ${
                      hasActiveItem
                        ? "text-emerald-400 bg-white/[0.07]"
                        : "text-white/30 hover:text-white/55 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          hasActiveItem
                            ? "text-emerald-400"
                            : "text-white/30 group-hover:text-white/50"
                        }
                      >
                        {group.groupIcon}
                      </span>
                      <span>{group.label}</span>
                    </div>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      } ${hasActiveItem ? "text-emerald-400/60" : "text-white/15"}`}
                    />
                  </button>

                  {/* Group items */}
                  {isOpen && (
                    <div className="mt-0.5 mb-2 space-y-0.5 pl-3 border-l-2 border-white/10 ml-3">
                      {group.items.map((item) => {
                        const isActive =
                          item.path === "/admin" || item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-lg transition-all duration-150 border-l-2 ${
                              isActive
                                ? "bg-white/10 text-white border-emerald-400"
                                : "text-white/45 hover:bg-white/[0.07] hover:text-white/80 border-transparent"
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 ${isActive ? "text-emerald-400" : "text-white/35"}`}
                            >
                              {item.icon}
                            </span>
                            <span
                              className={`text-sm whitespace-nowrap leading-none ${
                                isActive ? "font-bold" : "font-medium"
                              }`}
                            >
                              {item.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <button
          onClick={toggleCollapsed}
          className={`hidden lg:flex items-center gap-3 p-3 mt-2 rounded-xl text-white/30 hover:text-white/65 hover:bg-white/[0.07] transition-all ${isCollapsed ? "justify-center" : ""}`}
        >
          {isCollapsed ? (
            <ChevronsRight size={18} />
          ) : (
            <>
              <ChevronsLeft size={18} />
              <span className="font-semibold text-sm">Collapse</span>
            </>
          )}
        </button>

        <div className="mt-auto border-t border-white/[0.08] pt-4">
          {/* Expanded: full profile card */}
          <div className={`${isCollapsed ? "lg:hidden" : ""}`}>
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors group">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-[11px] flex-shrink-0 ring-2 ring-white/10">
                {(localStorage.getItem("adminUser") || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 font-bold text-[13px] leading-tight truncate">
                  {localStorage.getItem("adminUser") || "Admin"}
                </p>
                <p className="text-white/35 text-[10px] font-medium uppercase tracking-wider mt-0.5">
                  {isBookingAgent ? "Booking Agent" : "Manager"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
          {/* Collapsed: icon-only logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            className={`hidden ${isCollapsed ? "lg:flex" : ""} items-center justify-center w-full p-3 rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors`}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="print:hidden sticky top-0 z-30 bg-[#05201A]/95 backdrop-blur-md border-b border-white/[0.06] px-6 lg:px-10 py-3.5 flex items-center justify-between shadow-sm shadow-black/30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/10 text-white/70"
          >
            <Menu size={24} />
          </button>

          <div>
            <p className="text-[15px] font-black text-white tracking-tight">
              Welcome back, {localStorage.getItem("adminUser") || "Admin"}
            </p>
            <p className="text-[11px] text-white/40 font-medium hidden sm:block mt-0.5">
              Here's what's happening with your business today
            </p>
          </div>

          <div
            className="flex items-center gap-2 sm:gap-3 lg:gap-6 relative"
            ref={notifRef}
          >
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-xl border transition-all ${isNotifOpen ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/[0.06] border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"}`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#05201A]" />
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-3 w-[85vw] sm:w-80 bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-5 border-b border-white/[0.08] flex justify-between items-center">
                  <h3 className="font-black text-white text-sm">
                    Notifications
                  </h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full">
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
                      className="p-4 border-b border-white/[0.05] hover:bg-white/[0.05] transition-colors cursor-pointer group"
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === "booking" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}
                        >
                          {n.type === "booking" ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <Users size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white/80 truncate">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-white/40 font-medium line-clamp-2">
                            {n.desc}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-white/30 font-bold uppercase tracking-wider">
                            <Clock size={10} /> {n.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/admin/bookings")}
                  className="w-full py-4 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-white/[0.05] transition-all border-t border-white/[0.08]"
                >
                  View All Activities
                </button>
              </div>
            )}

            <div
              className={`flex items-center gap-3 pl-2 group ${isBookingAgent ? "" : "cursor-pointer"}`}
              onClick={() => !isBookingAgent && navigate("/admin/settings")}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-white/80 leading-tight group-hover:text-white transition-colors">
                  {localStorage.getItem("adminUser") || "Admin"}
                </p>
                <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest">
                  {isBookingAgent ? "Booking Agent" : "Manager"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-white/[0.08] flex items-center justify-center text-white/60 border border-white/10 shadow-sm group-hover:bg-white/[0.12] transition-all">
                <User size={22} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-400 mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
