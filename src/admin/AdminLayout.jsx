import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./admin.css";
import { fullMenuGroups } from "./menuConfig";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import Login from "./Login";

const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("adminToken"),
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("adminSidebarCollapsed") === "true",
  );
  const [adminTheme, setAdminTheme] = useState(
    () => localStorage.getItem("adminTheme") || "dark",
  );
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("adminSidebarOpenGroups");
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(["Overview"]);
  });

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

  // Automatically attach Authorization header to all admin API requests
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL;
    const orig = window.fetch;
    window.fetch = (url, opts) => {
      opts = opts || {};
      if (typeof url === "string" && url.startsWith(API)) {
        const token = localStorage.getItem("adminToken") || "";
        if (token) {
          opts = {
            ...opts,
            headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
          };
        }
      }
      return orig.call(window, url, opts);
    };
    return () => { window.fetch = orig; };
  }, []);

  // Keep <html> data-admin-theme in sync so CSS overrides apply before React paints
  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", adminTheme);
    return () => document.documentElement.removeAttribute("data-admin-theme");
  }, [adminTheme]);

  const toggleTheme = () => {
    setAdminTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("adminTheme", next);
      return next;
    });
  };

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem("adminSidebarCollapsed", String(!prev));
      return !prev;
    });
  };

  const toggleGroup = (label) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      localStorage.setItem("adminSidebarOpenGroups", JSON.stringify([...next]));
      return next;
    });
  };

  // Filter menu for restricted accounts
  const menuGroups = isBookingAgent
    ? fullMenuGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => adminPermissions.includes(item.key)),
        }))
        .filter((group) => group.items.length > 0)
    : fullMenuGroups;

  const allowedPaths = menuGroups.flatMap((g) => g.items.map((i) => i.path));

  // Redirect restricted accounts away from unauthorised routes
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

  // Auto-open the group containing the active route
  useEffect(() => {
    fullMenuGroups.forEach((group) => {
      const hasActive = group.items.some((item) =>
        item.path === "/admin" || item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path),
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

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div data-admin-theme={adminTheme} className="flex h-screen overflow-hidden bg-[#061A13] text-white print:bg-white">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        isCollapsed={isCollapsed}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        toggleCollapsed={toggleCollapsed}
        openGroups={openGroups}
        toggleGroup={toggleGroup}
        menuGroups={menuGroups}
        handleLogout={handleLogout}
        isBookingAgent={isBookingAgent}
      />

      {/* Right panel — scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          setSidebarOpen={setSidebarOpen}
          isBookingAgent={isBookingAgent}
          adminTheme={adminTheme}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full">
            <div className="min-h-full rounded-2xl sm:rounded-[32px] bg-[#05201A] border border-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-3 sm:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
