import { NavLink, Outlet } from "react-router-dom";
import { Bot, LayoutDashboard, MessageCircle, PhoneCall, BookOpen, SlidersHorizontal } from "lucide-react";

const TABS = [
  { to: "/admin/ai", label: "Overview", icon: LayoutDashboard, end: true },
  { label: "WhatsApp Inbox", icon: MessageCircle, soon: true },
  { label: "Call Log", icon: PhoneCall, soon: true },
  { to: "/admin/ai/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/admin/ai/settings", label: "AI Settings", icon: SlidersHorizontal },
];

export default function AiReceptionistLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
          <Bot size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Receptionist</h1>
          <p className="text-sm text-white/40">Answers WhatsApp messages and phone calls using your business information.</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 border-b border-white/[0.07]">
        {TABS.map(({ to, label, icon: Icon, end, soon }) =>
          soon ? (
            <span
              key={label}
              title="Coming in a later step"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white/20 whitespace-nowrap cursor-not-allowed"
            >
              <Icon size={15} />
              {label}
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 text-white/30 px-1.5 py-0.5 rounded">Soon</span>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-emerald-400 text-white"
                    : "border-transparent text-white/40 hover:text-white/75"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ),
        )}
      </nav>

      <Outlet />
    </div>
  );
}
