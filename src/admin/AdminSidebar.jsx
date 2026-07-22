import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, ChevronDown, X, LogOut } from "lucide-react";
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

  const adminName = localStorage.getItem("adminUser") || "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <aside
      className={`
        print:hidden fixed inset-y-0 left-0 z-50 flex flex-col
        bg-[#05201A] border-r border-white/[0.07]
        transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isCollapsed ? "lg:w-[72px]" : "w-72"}
        ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full"}
      `}
    >
      {/* ── Logo / Brand ─────────────────────────────── */}
      <div className={`shrink-0 flex items-center gap-3 px-5 py-5 border-b border-white/[0.07] ${isCollapsed ? "lg:justify-center lg:px-0" : ""}`}>
        <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0 shadow-lg shadow-black/30">
          <img src={logo} alt="Cleaniq" className="w-full h-full object-cover" />
        </div>

        <div className={`flex-1 min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
          <p className="text-white font-black text-sm leading-tight tracking-tight truncate">
            Cleaniq Services
          </p>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">
            Business Portal
          </p>
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Nav links (scrollable) ────────────────────── */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-3 space-y-0.5 sidebar-scrollbar">

        {/* Collapsed: icon-only */}
        {isCollapsed && (
          <div className="hidden lg:flex flex-col gap-0.5">
            {menuGroups.flatMap((g) => g.items).map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={item.name}
                  className={`flex items-center justify-center w-full h-10 rounded-xl transition-all duration-150 ${
                    active
                      ? "bg-primary/20 text-primary"
                      : "text-white/35 hover:bg-white/[0.07] hover:text-white/70"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Expanded: grouped */}
        <div className={isCollapsed ? "lg:hidden" : ""}>
          {menuGroups.map((group) => {
            const isOpen = openGroups.has(group.label);
            const hasActive = group.items.some((item) => isActive(item));

            return (
              <div key={group.label} className="mb-1">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.16em] transition-all duration-150 group ${
                    hasActive
                      ? "text-primary/80 bg-primary/[0.08]"
                      : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`transition-colors ${hasActive ? "text-primary/70" : "text-white/20 group-hover:text-white/40"}`}>
                      {group.groupIcon}
                    </span>
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown
                    size={12}
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"} ${hasActive ? "text-primary/40" : "text-white/15"}`}
                  />
                </button>

                {/* Group items */}
                {isOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-white/[0.08] space-y-0.5 mb-2">
                    {group.items.map((item) => {
                      const active = isActive(item);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                            active
                              ? "bg-white/[0.09] text-white font-bold"
                              : "text-white/40 hover:bg-white/[0.05] hover:text-white/75 font-medium"
                          }`}
                        >
                          <span className={`shrink-0 transition-colors ${active ? "text-primary" : "text-white/30"}`}>
                            {item.icon}
                          </span>
                          <span className="truncate leading-none">{item.name}</span>
                          {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
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

      {/* ── Collapse toggle (desktop only) ───────────── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/[0.07]">
        <button
          onClick={toggleCollapsed}
          className={`hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/30 hover:text-white/65 hover:bg-white/[0.06] transition-all duration-150 ${isCollapsed ? "justify-center" : ""}`}
        >
          {isCollapsed ? (
            <ChevronsRight size={16} />
          ) : (
            <>
              <ChevronsLeft size={16} />
              <span className="text-sm font-semibold">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* ── User / logout ─────────────────────────────── */}
      <div className="shrink-0 px-3 pb-4">
        {/* Expanded */}
        <div className={`${isCollapsed ? "lg:hidden" : ""}`}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group cursor-default">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-xs shrink-0">
              {adminInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 font-bold text-[13px] leading-tight truncate">
                {adminName}
              </p>
              <p className="text-white/30 text-[10px] font-medium uppercase tracking-wider mt-0.5">
                {isBookingAgent ? "Booking Agent" : "Manager"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0 opacity-0 group-hover:opacity-100"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Collapsed: icon-only logout */}
        {isCollapsed && (
          <button
            onClick={handleLogout}
            title="Logout"
            className="hidden lg:flex items-center justify-center w-full p-3 rounded-xl text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
