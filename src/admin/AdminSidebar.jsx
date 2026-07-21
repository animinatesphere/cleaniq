import { Link, useLocation } from "react-router-dom";
import {
  ChevronsLeft, ChevronsRight, ChevronDown, X, LogOut,
} from "lucide-react";
import logo from "../assets/logo DP2.jpg";

const AdminSidebar = ({
  isCollapsed,
  isSidebarOpen,
  setSidebarOpen,
  toggleCollapsed,
  openGroups,
  toggleGroup,
  menuGroups,
  handleLogout,
  isBookingAgent,
}) => {
  const location = useLocation();

  const isActive = (item) =>
    item.path === "/admin" || item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  return (
    <aside
      className={`print:hidden fixed inset-y-0 left-0 z-50 w-72 ${
        isCollapsed ? "lg:w-22 lg:px-3" : ""
      } bg-[#05201A] border-r border-white/[0.08] text-white/50 p-6 flex flex-col transition-all duration-300 lg:translate-x-0 lg:static ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo + brand */}
      <div
        className={`flex items-center pb-5 mb-5 border-b border-white/[0.08] ${
          isCollapsed ? "lg:justify-center" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/10 shrink-0 overflow-hidden">
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scrollbar pr-1 space-y-0.5">
        {/* Collapsed desktop: icon-only flat list */}
        {isCollapsed &&
          menuGroups
            .flatMap((g) => g.items)
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={item.name}
                className={`hidden lg:flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                  isActive(item)
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:bg-white/[0.07] hover:text-white/70"
                }`}
              >
                {item.icon}
              </Link>
            ))}

        {/* Expanded: collapsible groups */}
        <div className={isCollapsed ? "lg:hidden" : ""}>
          {menuGroups.map((group) => {
            const isOpen = openGroups.has(group.label);
            const hasActive = group.items.some((item) => isActive(item));
            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-200 group ${
                    hasActive
                      ? "text-primary bg-white/[0.07]"
                      : "text-white/30 hover:text-white/55 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={hasActive ? "text-primary" : "text-white/30 group-hover:text-white/50"}>
                      {group.groupIcon}
                    </span>
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    } ${hasActive ? "text-primary/60" : "text-white/15"}`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-0.5 mb-2 space-y-0.5 pl-3 border-l-2 border-white/10 ml-3">
                    {group.items.map((item) => {
                      const active = isActive(item);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-lg transition-all duration-150 border-l-2 ${
                            active
                              ? "bg-white/10 text-white border-primary"
                              : "text-white/45 hover:bg-white/[0.07] hover:text-white/80 border-transparent"
                          }`}
                        >
                          <span className={`shrink-0 ${active ? "text-primary" : "text-white/35"}`}>
                            {item.icon}
                          </span>
                          <span className={`text-sm whitespace-nowrap leading-none ${active ? "font-bold" : "font-medium"}`}>
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

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={toggleCollapsed}
        className={`hidden lg:flex items-center gap-3 p-3 mt-2 rounded-xl text-white/30 hover:text-white/65 hover:bg-white/[0.07] transition-all ${
          isCollapsed ? "justify-center" : ""
        }`}
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

      {/* User profile + logout */}
      <div className="mt-auto border-t border-white/[0.08] pt-4">
        {/* Expanded */}
        <div className={isCollapsed ? "lg:hidden" : ""}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors group">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-[11px] shrink-0 ring-2 ring-white/10">
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
              className="p-1.5 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
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
  );
};

export default AdminSidebar;
