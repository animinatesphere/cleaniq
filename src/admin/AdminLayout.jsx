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
          name: "Domestic Hub",
          path: "/admin/domestic",
          key: "domestic",
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
    <div className="flex min-h-screen bg-[#F8FAFC] print:bg-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-50 w-72 ${isCollapsed ? "lg:w-22 lg:px-3" : ""} bg-white border-r border-slate-200 text-slate-600 p-6 flex flex-col transition-all duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex items-center mb-10 ${isCollapsed ? "lg:justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <img src={logo} alt="" />
            </div>
            <div className={isCollapsed ? "lg:hidden" : ""}>
              <h1 className="font-black text-base leading-none  tracking-tighter text-slate-900 whitespace-nowrap">
                Cleaniq Services
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest whitespace-nowrap">
                Business Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden text-slate-400 hover:text-slate-600 ${isCollapsed ? "lg:hidden" : ""}`}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-0.5">
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
                      ? "bg-primary/10 text-primary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
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
                        ? "text-primary bg-primary/5"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          hasActiveItem
                            ? "text-primary"
                            : "text-slate-400 group-hover:text-slate-500"
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
                      } ${hasActiveItem ? "text-primary" : "text-slate-300"}`}
                    />
                  </button>

                  {/* Group items */}
                  {isOpen && (
                    <div className="mt-0.5 mb-2 space-y-0.5 pl-3 border-l-2 border-slate-100 ml-3">
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
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 ${isActive ? "text-primary" : "text-slate-400"}`}
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
          className={`hidden lg:flex items-center gap-3 p-3 mt-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all ${isCollapsed ? "justify-center" : ""}`}
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

        <div className="mt-auto border-t border-slate-100 pt-4 space-y-2">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ${isCollapsed ? "lg:justify-center" : ""}`}
          >
            <LogOut size={19} className="flex-shrink-0" />
            <span
              className={`font-semibold text-sm ${isCollapsed ? "lg:hidden" : ""}`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="print:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600"
          >
            <Menu size={24} />
          </button>

          <div>
            <p className="text-base font-bold text-slate-900">
              Welcome back, {localStorage.getItem("adminUser") || "Admin"}
            </p>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Here's what's happening with your business today
            </p>
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
              className={`flex items-center gap-3 pl-2 group ${isBookingAgent ? "" : "cursor-pointer"}`}
              onClick={() => !isBookingAgent && navigate("/admin/settings")}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-primary-dark leading-tight group-hover:text-primary transition-colors">
                  {localStorage.getItem("adminUser") || "Admin"}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {isBookingAgent ? "Booking Agent" : "Manager"}
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
