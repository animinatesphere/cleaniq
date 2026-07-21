import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, User, CheckCircle2, Users, Clock } from "lucide-react";

const AdminHeader = ({ setSidebarOpen, isBookingAgent }) => {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (isBookingAgent) return;
    const fetchNotifications = async () => {
      try {
        const [bookingsRes, applicantsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/bookings`),
          fetch(`${import.meta.env.VITE_API_URL}/recruitment`),
        ]);
        const bookings = await bookingsRes.json();
        const applicants = await applicantsRes.json();
        const combined = [
          ...bookings.slice(0, 5).map((b) => ({
            id: b._id,
            type: "booking",
            title: "New Booking Received",
            desc: `${b.customer.firstName} booked ${b.service}`,
            time: new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
    fetchNotifications();
  }, [isBookingAgent]);

  return (
    <header className="print:hidden sticky top-0 z-30 bg-[#05201A]/95 backdrop-blur-md border-b border-white/[0.06] px-6 lg:px-10 py-3.5 flex items-center justify-between shadow-sm shadow-black/30">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 rounded-xl bg-white/10 text-white/70"
      >
        <Menu size={24} />
      </button>

      {/* Welcome text */}
      <div>
        <p className="text-[15px] font-black text-white tracking-tight">
          Welcome back, {localStorage.getItem("adminUser") || "Admin"}
        </p>
        <p className="text-[11px] text-white/40 font-medium hidden sm:block mt-0.5">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 relative" ref={notifRef}>
        {/* Bell */}
        <button
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className={`relative p-2 rounded-xl border transition-all ${
            isNotifOpen
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              : "bg-white/[0.06] border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#05201A]" />
          )}
        </button>

        {/* Notification dropdown */}
        {isNotifOpen && (
          <div className="absolute top-full right-0 mt-3 w-[85vw] sm:w-80 bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-5 border-b border-white/[0.08] flex justify-between items-center">
              <h3 className="font-black text-white text-sm">Notifications</h3>
              <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full">
                {notifications.length} New
              </span>
            </div>
            <div className="max-h-100 overflow-y-auto">
              {notifications.map((n, i) => (
                <div
                  key={i}
                  onClick={() => { navigate(n.path); setIsNotifOpen(false); }}
                  className="p-4 border-b border-white/[0.05] hover:bg-white/[0.05] transition-colors cursor-pointer group"
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        n.type === "booking"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {n.type === "booking" ? <CheckCircle2 size={18} /> : <Users size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white/80 truncate">{n.title}</p>
                      <p className="text-[11px] text-white/40 font-medium line-clamp-2">{n.desc}</p>
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

        {/* Avatar / settings link */}
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
  );
};

export default AdminHeader;
