import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  Hash,
  User,
  MapPin,
  Clock,
  Car,
  Truck,
  Info,
  Home as HomeIcon,
  Briefcase,
  Star,
  Zap,
  Mail,
  Phone,
  DollarSign,
  X,
  Trash2,
  Edit3,
  Save,
  Plus,
  Minus,
  Download,
  Calendar,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import AdminCRM from "./AdminCRM";

export const LEAD_SOURCES = [
  "Bark",
  "Checkatrade",
  "MyJobQuote",
  "MyBuilder",
  "Instagram",
  "Facebook",
  "TikTok",
  "Google",
  "Referral",
  "Organic",
];

const AdminCalendar = ({ bookings, onToggleDate, onBookingsCreated }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState("month"); // "month" | "year"
  const [showRecurring, setShowRecurring] = useState(false);
  const [selectedDateForDetails, setSelectedDateForDetails] = useState(null);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringSuccess, setRecurringSuccess] = useState(null);
  const [recurringForm, setRecurringForm] = useState({
    frequency: "weekly",
    startDate: "",
    endDate: "",
    timeSlot: "Morning (8am-12pm)",
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    postcode: "",
    service: "Residential Cleaning",
    duration: 3,
    amount: "",
    region: "UK",
    notes: "",
  });

  const [servicesList, setServicesList] = useState([]);
  const [dynamicRates, setDynamicRates] = useState({});

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/services`);
        const data = await res.json();
        setServicesList(data || []);
        const ratesObj = {};
        data.forEach((s) => {
          ratesObj[(s.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")] =
            s.rate;
        });
        setDynamicRates(ratesObj);
      } catch (err) {
        console.error("Failed to load services for recurring calendar:", err);
      }
    };
    fetchServices();
  }, []);

  const createServiceOptions = useMemo(() => {
    const bases = servicesList.filter((s) => s.category === "Base");
    const keys = ["residential", "commercial", "move", "airbnb", "tenancy"];
    const optionAssets = {
      residential: {
        tag: "Reliable domestic cleaners",
        bullets: [
          "Dusting",
          "Vacuuming",
          "Kitchen degreasing",
          "Bathroom sanitization",
        ],
        icon: <HomeIcon />,
        defaultId: "Residential Cleaning",
        defaultTitle: "Residential Cleaning",
      },
      commercial: {
        tag: "Expert office cleaning",
        bullets: ["Workstation sanitization", "Communal area cleaning"],
        icon: <Briefcase />,
        defaultId: "Office Cleaning",
        defaultTitle: "Office Cleaning",
      },
      move: {
        tag: "Deep cleaning",
        bullets: ["Inside cabinets", "Baseboard scrubbing"],
        icon: <Zap />,
        defaultId: "Deep Clean",
        defaultTitle: "Deep Clean",
      },
      airbnb: {
        tag: "Short-let specialist",
        bullets: ["Linen & towel change", "Guest amenity restock"],
        icon: <Star />,
        defaultId: "Airbnb Cleaning",
        defaultTitle: "Airbnb Cleaning",
      },
      tenancy: {
        tag: "Moving out/in clean",
        bullets: ["Full property deep clean", "Appliance deep clean"],
        icon: <Truck />,
        defaultId: "End of Tenancy",
        defaultTitle: "End of Tenancy",
      },
    };

    const getLayoutKey = (name) => {
      const clean = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (
        clean.includes("residential") ||
        clean.includes("domestic") ||
        clean.includes("home")
      )
        return "residential";
      if (clean.includes("office") || clean.includes("commercial"))
        return "commercial";
      if (clean.includes("deep") || clean.includes("move")) return "move";
      if (clean.includes("airbnb") || clean.includes("short")) return "airbnb";
      if (clean.includes("tenancy") || clean.includes("moveout"))
        return "tenancy";
      return "residential";
    };

    const mapped = bases.map((s) => {
      const key = getLayoutKey(s.name);
      const assets = optionAssets[key];
      return {
        id: s.name,
        title: s.name,
        tag: assets.tag,
        bullets: assets.bullets,
        icon: assets.icon,
        layoutId: key,
      };
    });
    keys.forEach((k) => {
      if (!mapped.some((m) => m.layoutId === k))
        mapped.push({
          id: optionAssets[k].defaultId,
          title: optionAssets[k].defaultTitle,
          tag: optionAssets[k].tag,
          bullets: optionAssets[k].bullets,
          icon: optionAssets[k].icon,
          layoutId: k,
        });
    });
    return mapped;
  }, [servicesList]);

  // Set initial default calculated price when dynamicRates or service/duration are loaded/change
  useEffect(() => {
    if (Object.keys(dynamicRates).length > 0 && !recurringForm.amount) {
      const key = (recurringForm.service || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
      const rate = parseFloat(dynamicRates[key]) || 20;
      setRecurringForm((f) => ({ ...f, amount: String(rate * f.duration) }));
    }
  }, [dynamicRates]);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () =>
    setCurrentMonth(
      calendarView === "year"
        ? new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth())
        : new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      calendarView === "year"
        ? new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth())
        : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );

  const days = [];
  const totalDays = daysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
  );
  const startDay = startDayOfMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
  );

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++)
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return bookings.filter((b) => {
      if (!b.schedule?.date) return false;
      const bDate = new Date(b.schedule.date);
      const bStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}`;
      return bStr === dStr;
    });
  };

  // Real (non-blackout) bookings, used for revenue totals on the calendar.
  const isRealBooking = (b) =>
    b.status !== "Blackout" && b.customer?.firstName !== "ADMIN_BLOCK";

  const revenueForMonth = (year, month) =>
    bookings
      .filter((b) => {
        if (!b.schedule?.date || !isRealBooking(b)) return false;
        const d = new Date(b.schedule.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, b) => sum + Number(b.payment?.amount || 0), 0);

  // Returns the set of day-of-month numbers (1-31) that have at least one
  // real booking, used to render the mini day grid in Year view.
  const bookingDaysForMonth = (year, month) => {
    const set = new Set();
    bookings.forEach((b) => {
      if (!b.schedule?.date || !isRealBooking(b)) return;
      const d = new Date(b.schedule.date);
      if (d.getFullYear() === year && d.getMonth() === month)
        set.add(d.getDate());
    });
    return set;
  };

  const bookingCountForMonth = (year, month) =>
    bookings.filter((b) => {
      if (!b.schedule?.date || !isRealBooking(b)) return false;
      const d = new Date(b.schedule.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;

  const currentMonthRevenue = revenueForMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
  );

  const yearMonths = Array.from({ length: 12 }, (_, m) => ({
    month: m,
    label: new Date(currentMonth.getFullYear(), m, 1).toLocaleString(
      "default",
      { month: "long" },
    ),
    revenue: revenueForMonth(currentMonth.getFullYear(), m),
    count: bookingCountForMonth(currentMonth.getFullYear(), m),
  }));
  const yearTotalRevenue = yearMonths.reduce((s, m) => s + m.revenue, 0);

  // Calculate preview of dates that will be generated
  const getPreviewDates = () => {
    if (!recurringForm.startDate || !recurringForm.endDate) return [];
    const dates = [];
    const start = new Date(recurringForm.startDate);
    const end = new Date(recurringForm.endDate);
    if (start > end) return [];
    let current = new Date(start);
    const maxDates = 365;
    while (current <= end && dates.length < maxDates) {
      dates.push(new Date(current));
      if (recurringForm.frequency === "daily") {
        current.setDate(current.getDate() + 1);
      } else if (recurringForm.frequency === "weekly") {
        current.setDate(current.getDate() + 7);
      } else if (recurringForm.frequency === "fortnightly") {
        current.setDate(current.getDate() + 14);
      } else if (recurringForm.frequency === "monthly") {
        current.setMonth(current.getMonth() + 1);
      }
    }
    return dates;
  };

  const previewDates = getPreviewDates();

  const handleCreateRecurring = async () => {
    if (!recurringForm.startDate || !recurringForm.endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    if (!recurringForm.customerEmail || !recurringForm.customerFirstName) {
      alert("Customer name and email are required.");
      return;
    }
    if (!recurringForm.address) {
      alert("Service address is required.");
      return;
    }
    if (previewDates.length === 0) {
      alert("No dates would be generated with these settings.");
      return;
    }
    if (previewDates.length > 200) {
      alert(
        `This would create ${previewDates.length} bookings — please shorten the date range.`,
      );
      return;
    }

    setRecurringLoading(true);
    try {
      const bookingsToCreate = previewDates.map((date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
        return {
          bookingId: `BK-${rand}`,
          customer: {
            firstName: recurringForm.customerFirstName,
            lastName: recurringForm.customerLastName,
            email: recurringForm.customerEmail,
            phone: recurringForm.customerPhone,
          },
          service: recurringForm.service,
          details: {
            address: recurringForm.address,
            postcode: recurringForm.postcode,
            frequency:
              recurringForm.frequency.charAt(0).toUpperCase() +
              recurringForm.frequency.slice(1),
            duration: recurringForm.duration,
            extras: [],
            notes: recurringForm.notes,
          },
          schedule: {
            date: dateStr,
            timeSlot: recurringForm.timeSlot,
            preferredTime: "",
          },
          payment: {
            amount: parseFloat(recurringForm.amount) || 0,
            currency: "GBP",
            status: "Pending",
            method: "Bank Transfer",
          },
          region: recurringForm.region,
          status: "Confirmed",
          meta: { recurringGroup: `REC-${Date.now()}` },
        };
      });

      // Create all bookings sequentially
      let created = 0;
      for (const bk of bookingsToCreate) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bk),
        });
        if (res.ok) created++;
      }

      setRecurringSuccess(created);
      if (onBookingsCreated) onBookingsCreated();
      setRecurringForm({
        frequency: "weekly",
        startDate: "",
        endDate: "",
        timeSlot: "Morning (8am-12pm)",
        customerFirstName: "",
        customerLastName: "",
        customerEmail: "",
        customerPhone: "",
        address: "",
        postcode: "",
        service: "Residential Cleaning",
        duration: 3,
        amount: "",
        region: "UK",
        notes: "",
      });
    } catch (err) {
      alert("Error creating recurring bookings: " + err.message);
    } finally {
      setRecurringLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    color: "#0F172A",
    background: "white",
  };
  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "11px",
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  return (
    <div className="space-y-6">
      {/* ── MAIN CALENDAR ───────────────────────────────────── */}
      <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm animate-in fade-in">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div>
            <h3 className="text-2xl font-bold text-primary-dark tracking-tighter">
              {calendarView === "year" ? (
                <span className="text-primary">{currentMonth.getFullYear()}</span>
              ) : (
                <>
                  {currentMonth.toLocaleString("default", { month: "long" })}{" "}
                  <span className="text-primary">{currentMonth.getFullYear()}</span>
                </>
              )}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                £
                {(calendarView === "year"
                  ? yearTotalRevenue
                  : currentMonthRevenue
                ).toLocaleString("en-GB", { maximumFractionDigits: 0 })}{" "}
                {calendarView === "year" ? "this year" : "this month"}
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {calendarView === "year"
                  ? "Click a month to view its calendar"
                  : "Click any date to Block/Unblock"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {["month", "year"].map((v) => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all capitalize ${calendarView === v ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            {calendarView === "month" && (
              <button
                onClick={() => {
                  setShowRecurring(!showRecurring);
                  setRecurringSuccess(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all border-2"
                style={{
                  background: showRecurring
                    ? "linear-gradient(135deg,#0F172A,#1e3a5f)"
                    : "white",
                  color: showRecurring ? "#6EE7B7" : "#0F172A",
                  borderColor: showRecurring ? "#0F172A" : "#e2e8f0",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
                {showRecurring ? "Hide Recurring" : "Create Recurring Booking"}
              </button>
            )}
            <button
              onClick={handlePrevMonth}
              className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {calendarView === "year" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearMonths.map((m) => {
              const bookedDays = bookingDaysForMonth(
                currentMonth.getFullYear(),
                m.month,
              );
              const totalDays = daysInMonth(currentMonth.getFullYear(), m.month);
              const startDay = startDayOfMonth(currentMonth.getFullYear(), m.month);
              const cells = [];
              for (let i = 0; i < startDay; i++) cells.push(null);
              for (let d = 1; d <= totalDays; d++) cells.push(d);

              return (
                <div
                  key={m.month}
                  className={`text-left p-4 rounded-[20px] border-2 transition-all ${m.count > 0 ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-transparent"}`}
                >
                  <button
                    onClick={() => {
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), m.month, 1),
                      );
                      setCalendarView("month");
                    }}
                    className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity"
                  >
                    <span className="font-bold text-primary-dark text-sm">
                      {m.label}
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold text-slate-900 tabular-nums">
                        £{m.revenue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
                      </span>
                      <span className="block text-[10px] font-semibold text-slate-400">
                        {m.count} booking{m.count !== 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((d, i) => (
                      <div
                        key={i}
                        title={d && bookedDays.has(d) ? `${bookedDays.size ? "" : ""}Booking on ${m.label} ${d}` : undefined}
                        className={`aspect-square rounded-[5px] flex items-center justify-center text-[8px] font-bold
                          ${!d ? "" : bookedDays.has(d) ? "bg-emerald-400 text-white" : "bg-white text-slate-300 border border-slate-100"}
                        `}
                      >
                        {d || ""}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-bold text-slate-300 uppercase text-center py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {days.map((date, i) => {
                const dayBookings = getBookingsForDate(date);
                const isBlocked = dayBookings.some(
                  (b) =>
                    b.status === "Blackout" ||
                    b.customer?.firstName === "ADMIN_BLOCK",
                );
                const realDayBookings = dayBookings.filter(isRealBooking);
                const hasBookings = realDayBookings.length > 0;
                const dayRevenue = realDayBookings.reduce(
                  (s, b) => s + Number(b.payment?.amount || 0),
                  0,
                );
                // Highlight recurring bookings
                const hasRecurring = dayBookings.some(
                  (b) => b.meta?.recurringGroup,
                );

                return (
                  <div key={i} className="aspect-square">
                    {date ? (
                      <button
                        onClick={() =>
                          setSelectedDateForDetails({
                            date,
                            isBlocked,
                            bookingsOnDate: dayBookings,
                          })
                        }
                        className={`w-full h-full rounded-[24px] flex flex-col items-center justify-center transition-all relative border-2 group
                          ${isBlocked ? "bg-rose-50 border-rose-200 text-rose-500" : hasBookings ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-slate-50 border-transparent text-slate-400 hover:border-primary/30"}
                        `}
                      >
                        <span className="text-sm font-bold">{date.getDate()}</span>
                        {isBlocked && (
                          <span className="text-[7px] font-bold uppercase absolute bottom-2">
                            Blocked
                          </span>
                        )}
                        {hasBookings && !isBlocked && (
                          <span className="text-[7px] font-bold uppercase absolute bottom-1.5 text-center leading-tight">
                            {realDayBookings.length} Booking
                            {realDayBookings.length > 1 ? "s" : ""}
                            <br />£
                            {dayRevenue.toLocaleString("en-GB", {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        )}
                        {hasRecurring && !isBlocked && (
                          <span
                            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-400"
                            title="Recurring"
                          />
                        )}
                      </button>
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Legend */}
        {calendarView === "month" && (
        <div className="flex gap-6 mt-8 pt-6 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-300" />
            <span className="text-[11px] font-bold text-slate-400">
              Has Bookings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-300" />
            <span className="text-[11px] font-bold text-slate-400">
              Blocked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400" />
            <span className="text-[11px] font-bold text-slate-400">
              Recurring
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-200" />
            <span className="text-[11px] font-bold text-slate-400">
              Available
            </span>
          </div>
        </div>
        )}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
          {calendarView === "year"
            ? "💡 Click any month to jump straight to its calendar"
            : "💡 Click any date to view bookings and manage availability"}
        </p>
      </div>

      {/* Date Details Modal */}
      {selectedDateForDetails &&
        (() => {
          const { date, isBlocked, bookingsOnDate } = selectedDateForDetails;
          const dStr = date.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          const realBookings = bookingsOnDate.filter(
            (b) =>
              b.customer?.firstName !== "ADMIN_BLOCK" &&
              b.status !== "Blackout",
          );
          const statusColors = {
            Confirmed: "#059669",
            Pending: "#D97706",
            Completed: "#6366F1",
            Cancelled: "#EF4444",
            Accepted: "#0EA5E9",
          };
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.6)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget)
                  setSelectedDateForDetails(null);
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "32px",
                  width: "100%",
                  maxWidth: "560px",
                  maxHeight: "80vh",
                  overflow: "auto",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
                }}
              >
                {/* Modal Header */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #0F172A, #1e3a5f)",
                    padding: "28px 32px",
                    borderRadius: "32px 32px 0 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Schedule Details
                      </p>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 900,
                          color: "white",
                          lineHeight: 1.3,
                        }}
                      >
                        {dStr}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedDateForDetails(null)}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        borderRadius: "12px",
                        padding: "8px",
                        cursor: "pointer",
                        color: "white",
                        display: "flex",
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  {isBlocked && (
                    <div
                      style={{
                        marginTop: "12px",
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "10px",
                        padding: "8px 14px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#fca5a5",
                          textTransform: "uppercase",
                        }}
                      >
                        ⛔ Date is Blocked
                      </span>
                    </div>
                  )}
                </div>

                {/* Bookings List */}
                <div style={{ padding: "24px 32px" }}>
                  {realBookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#94a3b8",
                        }}
                      >
                        No bookings on this date
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#cbd5e1",
                        }}
                      >
                        {isBlocked
                          ? "This date is blocked for new bookings."
                          : "This date is available for booking."}
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginBottom: "20px" }}>
                      <p
                        style={{
                          margin: "0 0 12px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        {realBookings.length} Booking
                        {realBookings.length > 1 ? "s" : ""} Scheduled
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {realBookings.map((b, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#f8fafc",
                              borderRadius: "16px",
                              padding: "14px 16px",
                              border: "1px solid #e2e8f0",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: statusColors[b.status] || "#94a3b8",
                                marginTop: "5px",
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    fontWeight: 800,
                                    color: "#0F172A",
                                  }}
                                >
                                  {b.customer?.firstName} {b.customer?.lastName}
                                </p>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    color: statusColors[b.status] || "#94a3b8",
                                    background:
                                      (statusColors[b.status] || "#94a3b8") +
                                      "15",
                                    padding: "2px 8px",
                                    borderRadius: "20px",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {b.status}
                                </span>
                              </div>
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontSize: "12px",
                                  color: "#64748b",
                                  fontWeight: 600,
                                }}
                              >
                                {b.service}
                              </p>
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontSize: "11px",
                                  color: "#94a3b8",
                                }}
                              >
                                {b.schedule?.timeSlot || ""}
                                {b.schedule?.preferredTime
                                  ? " · " + b.schedule.preferredTime
                                  : ""}{" "}
                                · {b.bookingId}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Block / Unblock Action */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      paddingTop: "20px",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <button
                      onClick={() => {
                        onToggleDate(date, isBlocked);
                        setSelectedDateForDetails(null);
                      }}
                      style={{
                        flex: 1,
                        padding: "14px",
                        borderRadius: "16px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: "13px",
                        transition: "all 0.2s",
                        background: isBlocked
                          ? "linear-gradient(135deg, #ecfdf5, #d1fae5)"
                          : "linear-gradient(135deg, #fff1f2, #ffe4e6)",
                        color: isBlocked ? "#059669" : "#e11d48",
                      }}
                    >
                      {isBlocked ? "🔓 Unlock This Date" : "⛔ Block This Date"}
                    </button>
                    <button
                      onClick={() => setSelectedDateForDetails(null)}
                      style={{
                        padding: "14px 20px",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        background: "white",
                        color: "#64748b",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── RECURRING BOOKING PANEL ─────────────────────────── */}
      {showRecurring && (
        <div
          className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden"
          style={{ animation: "fadeIn 0.3s ease" }}
        >
          {/* Panel Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)",
              padding: "28px 40px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(110,231,183,0.15)",
                  border: "1px solid rgba(110,231,183,0.3)",
                  borderRadius: "14px",
                  padding: "12px",
                  display: "flex",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6EE7B7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
              </div>
              <div>
                <h3
                  style={{
                    margin: "0 0 4px",
                    fontSize: "20px",
                    fontWeight: 900,
                    color: "white",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Create Recurring Booking
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  Schedule Daily, Weekly, Fortnightly or Monthly cleaning
                  appointments
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: "36px 40px" }}>
            {/* Success banner */}
            {recurringSuccess !== null && (
              <div
                style={{
                  background: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
                  border: "2px solid #86efac",
                  borderRadius: "20px",
                  padding: "20px 24px",
                  marginBottom: "28px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <CheckCircle2
                  size={24}
                  style={{ color: "#059669", flexShrink: 0 }}
                />
                <div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "16px",
                      fontWeight: 900,
                      color: "#065f46",
                    }}
                  >
                    ✓ {recurringSuccess} recurring bookings created!
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#059669" }}>
                    All appointments are now visible in the bookings list and
                    calendar.
                  </p>
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "32px",
              }}
            >
              {/* LEFT COLUMN */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* FREQUENCY */}
                <div>
                  <label style={labelStyle}>Cleaning Frequency</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    {[
                      { val: "daily", label: "Daily", sub: "Every day" },
                      { val: "weekly", label: "Weekly", sub: "Every 7 days" },
                      {
                        val: "fortnightly",
                        label: "Fortnightly",
                        sub: "Every 2 weeks",
                      },
                      {
                        val: "monthly",
                        label: "Monthly",
                        sub: "Same day each month",
                      },
                    ].map(({ val, label, sub }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setRecurringForm((f) => ({ ...f, frequency: val }))
                        }
                        style={{
                          padding: "14px",
                          borderRadius: "14px",
                          border: `2px solid ${recurringForm.frequency === val ? "#6EE7B7" : "#e2e8f0"}`,
                          background:
                            recurringForm.frequency === val
                              ? "linear-gradient(135deg,#ecfdf5,#d1fae5)"
                              : "white",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 2px",
                            fontSize: "13px",
                            fontWeight: 800,
                            color:
                              recurringForm.frequency === val
                                ? "#065f46"
                                : "#0F172A",
                          }}
                        >
                          {label}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            color: "#94a3b8",
                            fontWeight: 600,
                          }}
                        >
                          {sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DATE RANGE */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Start Date</label>
                    <input
                      type="date"
                      style={inputStyle}
                      value={recurringForm.startDate}
                      onChange={(e) =>
                        setRecurringForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>End Date</label>
                    <input
                      type="date"
                      style={inputStyle}
                      value={recurringForm.endDate}
                      onChange={(e) =>
                        setRecurringForm((f) => ({
                          ...f,
                          endDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* PREVIEW */}
                {previewDates.length > 0 && (
                  <div
                    style={{
                      background: "linear-gradient(135deg,#0F172A,#1e3a5f)",
                      borderRadius: "16px",
                      padding: "16px 20px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Schedule Preview
                    </p>
                    <p
                      style={{
                        margin: "0 0 10px",
                        fontSize: "22px",
                        fontWeight: 900,
                        color: "#6EE7B7",
                      }}
                    >
                      {previewDates.length} appointments
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        maxHeight: "100px",
                        overflowY: "auto",
                      }}
                    >
                      {previewDates.slice(0, 12).map((d, i) => (
                        <span
                          key={i}
                          style={{
                            background: "rgba(110,231,183,0.15)",
                            border: "1px solid rgba(110,231,183,0.25)",
                            color: "#6EE7B7",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {d.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      ))}
                      {previewDates.length > 12 && (
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 6px",
                          }}
                        >
                          +{previewDates.length - 12} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* TIME & SERVICE */}
                <div>
                  <label style={labelStyle}>Time Slot</label>
                  <select
                    style={inputStyle}
                    value={recurringForm.timeSlot}
                    onChange={(e) =>
                      setRecurringForm((f) => ({
                        ...f,
                        timeSlot: e.target.value,
                      }))
                    }
                  >
                    <option>Morning (8am-12pm)</option>
                    <option>Afternoon (12pm-4pm)</option>
                    <option>Evening (4pm-8pm)</option>
                    <option>Flexible</option>
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Service</label>
                    <input
                      type="text"
                      style={inputStyle}
                      value={recurringForm.service}
                      onChange={(e) =>
                        setRecurringForm((f) => ({
                          ...f,
                          service: e.target.value,
                        }))
                      }
                      placeholder="e.g. Residential Cleaning"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Hours</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      style={inputStyle}
                      value={recurringForm.duration}
                      onChange={(e) =>
                        setRecurringForm((f) => ({
                          ...f,
                          duration: parseInt(e.target.value) || 2,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>£ / Visit</label>
                    <input
                      type="number"
                      min={0}
                      style={inputStyle}
                      value={recurringForm.amount}
                      onChange={(e) =>
                        setRecurringForm((f) => ({
                          ...f,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — CUSTOMER */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      ...labelStyle,
                      color: "#0F172A",
                      fontSize: "12px",
                    }}
                  >
                    Customer Details
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>First Name *</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={recurringForm.customerFirstName}
                        onChange={(e) =>
                          setRecurringForm((f) => ({
                            ...f,
                            customerFirstName: e.target.value,
                          }))
                        }
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={recurringForm.customerLastName}
                        onChange={(e) =>
                          setRecurringForm((f) => ({
                            ...f,
                            customerLastName: e.target.value,
                          }))
                        }
                        placeholder="Smith"
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={labelStyle}>Email *</label>
                    <input
                      type="email"
                      style={inputStyle}
                      value={recurringForm.customerEmail}
                      onChange={(e) =>
                        setRecurringForm((f) => ({
                          ...f,
                          customerEmail: e.target.value,
                        }))
                      }
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input
                      type="tel"
                      style={inputStyle}
                      value={recurringForm.customerPhone}
                      onChange={(e) =>
                        setRecurringForm((f) => ({
                          ...f,
                          customerPhone: e.target.value,
                        }))
                      }
                      placeholder="+44 7700 000000"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Service Address *</label>
                  <input
                    type="text"
                    style={{ ...inputStyle, marginBottom: "10px" }}
                    value={recurringForm.address}
                    onChange={(e) =>
                      setRecurringForm((f) => ({
                        ...f,
                        address: e.target.value,
                      }))
                    }
                    placeholder="123 High Street, London"
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Postcode</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={recurringForm.postcode}
                        onChange={(e) =>
                          setRecurringForm((f) => ({
                            ...f,
                            postcode: e.target.value,
                          }))
                        }
                        placeholder="SW1A 1AA"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Region</label>
                      <select
                        style={inputStyle}
                        value={recurringForm.region}
                        onChange={(e) =>
                          setRecurringForm((f) => ({
                            ...f,
                            region: e.target.value,
                          }))
                        }
                      >
                        <option value="UK">UK</option>
                        <option value="NG">NG</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Internal Notes (optional)</label>
                  <textarea
                    rows={3}
                    style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                    value={recurringForm.notes}
                    onChange={(e) =>
                      setRecurringForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="e.g. Customer prefers the cleaner to arrive 15 min early..."
                  />
                </div>

                {/* CREATE BUTTON */}
                <button
                  onClick={handleCreateRecurring}
                  disabled={recurringLoading || previewDates.length === 0}
                  style={{
                    width: "100%",
                    padding: "18px",
                    borderRadius: "18px",
                    border: "none",
                    background:
                      recurringLoading || previewDates.length === 0
                        ? "#94a3b8"
                        : "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)",
                    color:
                      recurringLoading || previewDates.length === 0
                        ? "white"
                        : "#6EE7B7",
                    fontWeight: 900,
                    fontSize: "15px",
                    cursor:
                      recurringLoading || previewDates.length === 0
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow:
                      recurringLoading || previewDates.length === 0
                        ? "none"
                        : "0 10px 25px rgba(15,23,42,0.3)",
                    transition: "all 0.2s",
                    marginTop: "auto",
                  }}
                >
                  {recurringLoading ? (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ animation: "spin 1s linear infinite" }}
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Creating {previewDates.length} Bookings...
                    </>
                  ) : (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 1l4 4-4 4" />
                        <path d="M3 11V9a4 4 0 014-4h14" />
                        <path d="M7 23l-4-4 4-4" />
                        <path d="M21 13v2a4 4 0 01-4 4H3" />
                      </svg>
                      Create{" "}
                      {previewDates.length > 0 ? previewDates.length : ""}{" "}
                      Recurring Booking{previewDates.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lightweight calendar for admin create booking (select date)
const CreateCalendar = ({ selectedDate, onDateSelect, bookedDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  const days = [];
  const totalDays = daysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
  );
  const startDay = startDayOfMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
  );
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++)
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isBooked = (date) => {
    if (!date) return false;
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return bookedDates.includes(dStr);
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const sel = new Date(selectedDate);
    return (
      date.getDate() === sel.getDate() &&
      date.getMonth() === sel.getMonth() &&
      date.getFullYear() === sel.getFullYear()
    );
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h3 className="font-bold text-primary-dark tracking-tighter text-base md:text-lg">
          {currentMonth.toLocaleString("default", { month: "long" })}{" "}
          <span className="text-primary">{currentMonth.getFullYear()}</span>
        </h3>
        <div className="flex gap-1 md:gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 md:p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 md:p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-[8px] md:text-[10px] font-bold text-slate-300 uppercase text-center py-2"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map((date, i) => {
          const booked = isBooked(date);
          const past = isPast(date);
          const disabled = booked; // Admin can select past dates!
          return (
            <div key={i} className="aspect-square">
              {date ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onDateSelect(
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
                    )
                  }
                  className={`w-full h-full rounded-xl text-center flex items-center justify-center relative font-bold text-sm transition-all ${isSelected(date) ? "bg-primary text-white shadow-lg" : booked ? "bg-rose-50 text-rose-300 cursor-not-allowed" : past ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary"}`}
                >
                  <span className="text-xs md:text-sm font-bold">
                    {date.getDate()}
                  </span>
                  {booked && (
                    <span className="text-[6px] md:text-[7px] font-bold uppercase text-rose-500 absolute top-0.5 md:top-1">
                      Taken
                    </span>
                  )}
                  {past && !booked && !isSelected(date) && (
                    <span className="text-[5px] md:text-[6px] font-bold uppercase text-amber-500 absolute top-0.5 md:top-1">
                      Past
                    </span>
                  )}
                  {isToday(date) && !isSelected(date) && (
                    <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full absolute bottom-1.5 md:bottom-2 bg-primary" />
                  )}
                </button>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Bookings = () => {
  const [view, setView] = useState("list"); // 'list' or 'availability'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [crmBooking, setCrmBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    customer: { firstName: "", lastName: "", email: "", phone: "" },
    service: "",
    details: {
      address: "",
      frequency: "Once",
      duration: 2,
      extras: [],
      Bedroom: 0,
      Bathroom: 0,
    },
    schedule: { date: "", timeSlot: "", preferredTime: "" },
    payment: { amount: 0, currency: "GBP", status: "Pending" },
    status: "Pending",
    leadSource: "Organic",
    suppliesProvidedBy: "Cleaniq",
  });
  const [createStep, setCreateStep] = useState(1);
  // When true, the booking is created already paid (cash/bank transfer taken
  // outside the system) — no Stripe link or bank details are emailed.
  const [noPaymentRequired, setNoPaymentRequired] = useState(false);
  const [servicesList, setServicesList] = useState([]);
  const [dynamicRates, setDynamicRates] = useState({});
  const [createTotal, setCreateTotal] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [bookedSlotsByDate, setBookedSlotsByDate] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [markingCompleteId, setMarkingCompleteId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [additionalHoursForm, setAdditionalHoursForm] = useState({
    hours: "",
    hourlyRate: "",
    isGenerating: false,
  });
  const [showAdditionalHoursModal, setShowAdditionalHoursModal] =
    useState(false);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(
        () => setStatusMessage({ type: "", text: "" }),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Fetch services and compute rates for admin create modal
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/services`);
        const data = await res.json();
        setServicesList(data || []);
        const ratesObj = {};
        data.forEach((s) => {
          ratesObj[(s.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")] =
            s.rate;
        });
        setDynamicRates(ratesObj);
      } catch (err) {
        console.error("Failed to load services for admin create:", err);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    // derive bookedDates from bookings - includes both standard slots and flexible times
    const fullyBooked = [];
    const slotsMap = {};
    bookings.forEach((b) => {
      if (b.schedule?.date) {
        const d = new Date(b.schedule.date);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        slotsMap[dStr] = slotsMap[dStr] || [];

        // Add standard time slot if present
        if (b.schedule?.timeSlot && b.schedule.timeSlot !== "Flexible") {
          if (!slotsMap[dStr].includes(b.schedule.timeSlot))
            slotsMap[dStr].push(b.schedule.timeSlot);
        }

        // Add flexible time slot if present
        if (b.schedule?.timeSlot === "Flexible" && b.schedule?.preferredTime) {
          if (!slotsMap[dStr].includes(b.schedule.preferredTime))
            slotsMap[dStr].push(b.schedule.preferredTime);
        }
      }
    });
    Object.keys(slotsMap).forEach((d) => {
      const s = slotsMap[d];
      const hasMorning = s.some((slot) => slot.includes("Morning"));
      const hasAfternoon = s.some((slot) => slot.includes("Afternoon"));
      const hasEvening = s.some((slot) => slot.includes("Evening"));
      if (hasMorning && hasAfternoon && hasEvening) fullyBooked.push(d);
    });
    console.log("[ADMIN AVAILABILITY] Booked slots map:", slotsMap);
    setBookedSlotsByDate(slotsMap);
    setBookedDates(fullyBooked);
  }, [bookings]);
  const editAvailability = useMemo(() => {
    const fullyBooked = [];
    const slotsMap = {};
    const excludeId = selectedBooking?._id;

    bookings.forEach((b) => {
      if (b._id === excludeId) return; // skip this booking's own current slot
      if (b.schedule?.date) {
        const d = new Date(b.schedule.date);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        slotsMap[dStr] = slotsMap[dStr] || [];
        if (b.schedule?.timeSlot && b.schedule.timeSlot !== "Flexible") {
          if (!slotsMap[dStr].includes(b.schedule.timeSlot))
            slotsMap[dStr].push(b.schedule.timeSlot);
        }
        if (b.schedule?.timeSlot === "Flexible" && b.schedule?.preferredTime) {
          if (!slotsMap[dStr].includes(b.schedule.preferredTime))
            slotsMap[dStr].push(b.schedule.preferredTime);
        }
      }
    });

    Object.keys(slotsMap).forEach((d) => {
      const s = slotsMap[d];
      const hasMorning = s.some((slot) => slot.includes("Morning"));
      const hasAfternoon = s.some((slot) => slot.includes("Afternoon"));
      const hasEvening = s.some((slot) => slot.includes("Evening"));
      if (hasMorning && hasAfternoon && hasEvening) fullyBooked.push(d);
    });

    return { fullyBookedDates: fullyBooked, slotsByDate: slotsMap };
  }, [bookings, selectedBooking]);
  const createServiceOptions = React.useMemo(() => {
    const bases = servicesList.filter((s) => s.category === "Base");
    const keys = ["residential", "commercial", "move", "airbnb", "tenancy"];
    const optionAssets = {
      residential: {
        tag: "Reliable domestic cleaners",
        bullets: [
          "Dusting",
          "Vacuuming",
          "Kitchen degreasing",
          "Bathroom sanitization",
        ],
        icon: <HomeIcon />,
        defaultId: "Residential Cleaning",
        defaultTitle: "Residential Cleaning",
      },
      commercial: {
        tag: "Expert office cleaning",
        bullets: ["Workstation sanitization", "Communal area cleaning"],
        icon: <Briefcase />,
        defaultId: "Office Cleaning",
        defaultTitle: "Office Cleaning",
      },
      move: {
        tag: "Deep cleaning",
        bullets: ["Inside cabinets", "Baseboard scrubbing"],
        icon: <Zap />,
        defaultId: "Deep Clean",
        defaultTitle: "Deep Clean",
      },
      airbnb: {
        tag: "Short-let specialist",
        bullets: ["Linen & towel change", "Guest amenity restock"],
        icon: <Star />,
        defaultId: "Airbnb Cleaning",
        defaultTitle: "Airbnb Cleaning",
      },
      tenancy: {
        tag: "Moving out/in clean",
        bullets: ["Full property deep clean", "Appliance deep clean"],
        icon: <Truck />,
        defaultId: "End of Tenancy",
        defaultTitle: "End of Tenancy",
      },
    };

    const getLayoutKey = (name) => {
      const clean = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (
        clean.includes("residential") ||
        clean.includes("domestic") ||
        clean.includes("home")
      )
        return "residential";
      if (clean.includes("office") || clean.includes("commercial"))
        return "commercial";
      if (clean.includes("deep") || clean.includes("move")) return "move";
      if (clean.includes("airbnb") || clean.includes("short")) return "airbnb";
      if (clean.includes("tenancy") || clean.includes("moveout"))
        return "tenancy";
      return "residential";
    };

    const mapped = bases.map((s) => {
      const key = getLayoutKey(s.name);
      const assets = optionAssets[key];
      return {
        id: s.name,
        title: s.name,
        tag: assets.tag,
        bullets: assets.bullets,
        icon: assets.icon,
        layoutId: key,
      };
    });
    keys.forEach((k) => {
      if (!mapped.some((m) => m.layoutId === k))
        mapped.push({
          id: optionAssets[k].defaultId,
          title: optionAssets[k].defaultTitle,
          tag: optionAssets[k].tag,
          bullets: optionAssets[k].bullets,
          icon: optionAssets[k].icon,
          layoutId: k,
        });
    });
    return mapped;
  }, [servicesList]);

  // Compute extra services (filter out base services)
  const extraServicesList = React.useMemo(() => {
    const baseServices = [
      ...createServiceOptions.map((o) => o.id),
      "Bedroom",
      "Bathroom",
      "Kitchen",
      "Living Room",
      "Cloakroom",
      "Utility Room",
      "Reception Room",
      "Conservatory",
    ];
    const cleanName = (str) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
    return (servicesList || []).filter(
      (s) =>
        !baseServices.some((base) => cleanName(base) === cleanName(s.name)),
    );
  }, [servicesList, createServiceOptions]);

  // Pricing for admin create form
  useEffect(() => {
    const fd = createData.details || {};
    if (!createData.service) {
      setCreateTotal(0);
      return;
    }
    let total = 0;
    const baseRate =
      dynamicRates[
        (createData.service || "").toLowerCase().replace(/[^a-z0-9]/g, "")
      ] || 20;
    total += (parseFloat(baseRate) || 20) * (fd.duration || 1);

    // Handle extras as objects with name and qty properties
    if (Array.isArray(fd.extras)) {
      fd.extras.forEach((ex) => {
        const qty = ex.qty || 1;
        const name = ex.name || "";
        total +=
          (dynamicRates[(name || "").toLowerCase().replace(/[^a-z0-9]/g, "")] ||
            0) * qty;
      });
    }
    setCreateTotal(Math.round(total * 100) / 100);
  }, [createData, dynamicRates]);

  // Validation functions
  const validateField = (fieldPath, value) => {
    // Customer fields
    if (fieldPath === "customer.firstName") {
      if (!value || value.trim().length < 2)
        return "First name must be at least 2 characters";
      if (!/^[a-zA-Z\s'-]+$/.test(value))
        return "First name must contain letters only";
      return "";
    }
    if (fieldPath === "customer.lastName") {
      if (!value || value.trim().length < 2)
        return "Last name must be at least 2 characters";
      if (!/^[a-zA-Z\s'-]+$/.test(value))
        return "Last name must contain letters only";
      return "";
    }
    if (fieldPath === "customer.email") {
      if (!value) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Invalid email address";
      return "";
    }
    if (fieldPath === "customer.phone") {
      if (!value) return "Phone is required";
      if (value.replace(/\D/g, "").length < 10)
        return "Phone must have at least 10 digits";
      return "";
    }

    // Service field
    if (fieldPath === "service") {
      if (!value) return "Service type must be selected";
      return "";
    }

    // Details fields
    if (fieldPath === "details.address") {
      if (!value || value.trim().length < 5)
        return "Address must be at least 5 characters";
      if (value.trim().length > 200)
        return "Address must not exceed 200 characters";
      return "";
    }
    if (fieldPath === "details.frequency") {
      if (!["Once", "Weekly", "Bi-weekly", "Monthly"].includes(value))
        return "Valid frequency must be selected";
      return "";
    }
    if (fieldPath === "details.duration") {
      if (!value || Number(value) < 0.5)
        return "Duration must be at least 0.5 hours";
      if (Number(value) > 8) return "Duration must not exceed 8 hours";
      return "";
    }
    if (fieldPath === "details.Bedroom") {
      if (!value && value !== 0) return "Bedrooms is required";
      if (Number(value) < 0 || Number(value) > 10)
        return "Bedrooms must be 0-10";
      return "";
    }
    if (fieldPath === "details.Bathroom") {
      if (!value && value !== 0) return "Bathrooms is required";
      if (Number(value) < 0 || Number(value) > 10)
        return "Bathrooms must be 0-10";
      return "";
    }

    // Schedule fields
    if (fieldPath === "schedule.date") {
      if (!value) return "Date is required";
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) return "Date cannot be in the past";
      return "";
    }
    if (fieldPath === "schedule.timeSlot") {
      if (!value) return "Time slot is required";
      if (!["Morning", "Afternoon", "Evening", "Flexible"].includes(value))
        return "Valid time slot must be selected";
      return "";
    }

    // Payment fields
    if (fieldPath === "payment.amount") {
      if (!value || Number(value) <= 0) return "Amount must be greater than 0";
      return "";
    }
    if (fieldPath === "payment.currency") {
      if (!value) return "Currency must be selected";
      if (value !== "GBP") return "Only GBP (Pounds) is accepted";
      return "";
    }

    return "";
  };

  const validateStep = (step) => {
    const errors = {};
    let isValid = true;

    if (step === 1) {
      // Step 1: Location & Service
      const addressErr = validateField(
        "details.address",
        createData.details?.address,
      );
      const frequencyErr = validateField(
        "details.frequency",
        createData.details?.frequency,
      );
      const serviceErr = validateField("service", createData.service);
      if (addressErr) {
        errors["details.address"] = addressErr;
        isValid = false;
      }
      if (frequencyErr) {
        errors["details.frequency"] = frequencyErr;
        isValid = false;
      }
      if (serviceErr) {
        errors.service = serviceErr;
        isValid = false;
      }
    } else if (step === 2) {
      // Step 2: Home & Duration
      const durationErr = validateField(
        "details.duration",
        createData.details?.duration,
      );
      const bedroomsErr = validateField(
        "details.Bedroom",
        createData.details?.Bedroom,
      );
      const bathroomsErr = validateField(
        "details.Bathroom",
        createData.details?.Bathroom,
      );
      if (durationErr) {
        errors["details.duration"] = durationErr;
        isValid = false;
      }
      if (bedroomsErr) {
        errors["details.Bedroom"] = bedroomsErr;
        isValid = false;
      }
      if (bathroomsErr) {
        errors["details.Bathroom"] = bathroomsErr;
        isValid = false;
      }
    } else if (step === 3) {
      // Step 3: Extras (optional)
      return { isValid: true, errors: {} };
    } else if (step === 4) {
      // Step 4: Payment & Schedule
      const dateErr = validateField("schedule.date", createData.schedule?.date);
      const slotErr = validateField(
        "schedule.timeSlot",
        createData.schedule?.timeSlot,
      );
      const firstErr = validateField(
        "customer.firstName",
        createData.customer?.firstName,
      );
      const lastErr = validateField(
        "customer.lastName",
        createData.customer?.lastName,
      );
      const emailErr = validateField(
        "customer.email",
        createData.customer?.email,
      );
      const phoneErr = validateField(
        "customer.phone",
        createData.customer?.phone,
      );
      const amountErr = validateField("payment.amount", createTotal);
      const currencyErr = validateField(
        "payment.currency",
        createData.payment?.currency,
      );

      if (dateErr) {
        errors["schedule.date"] = dateErr;
        isValid = false;
      }
      if (slotErr) {
        errors["schedule.timeSlot"] = slotErr;
        isValid = false;
      }
      if (firstErr) {
        errors["customer.firstName"] = firstErr;
        isValid = false;
      }
      if (lastErr) {
        errors["customer.lastName"] = lastErr;
        isValid = false;
      }
      if (emailErr) {
        errors["customer.email"] = emailErr;
        isValid = false;
      }
      if (phoneErr) {
        errors["customer.phone"] = phoneErr;
        isValid = false;
      }
      if (amountErr) {
        errors["payment.amount"] = amountErr;
        isValid = false;
      }
      if (currencyErr) {
        errors["payment.currency"] = currencyErr;
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  const handleNextStep = () => {
    const validation = validateStep(createStep);
    setFormErrors(validation.errors);

    if (validation.isValid) {
      setCreateStep(createStep + 1);
      setFieldTouched({});
    }
  };

  const handleFieldChange = (path, value) => {
    // Update createData
    const keys = path.split(".");
    setCreateData((prev) => {
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });

    // Mark field as touched
    setFieldTouched((prev) => ({ ...prev, [path]: true }));

    // Validate field
    const error = validateField(path, value);
    setFormErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[path] = error;
      } else {
        delete updated[path];
      }
      return updated;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.size === 0) return;

    try {
      const bookingIds = Array.from(selectedBookings);
      await Promise.all(
        bookingIds.map((id) =>
          fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}`, {
            method: "DELETE",
          }),
        ),
      );

      setSelectedBookings(new Set());
      setShowBulkDeleteModal(false);
      setStatusMessage({
        type: "success",
        text: `${bookingIds.length} booking(s) deleted successfully`,
      });
      fetchBookings();
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: "Failed to delete bookings",
      });
    }
  };

  const toggleBookingSelection = (bookingId) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredBookings.map((b) => b._id)));
    }
  };

  const toggleAvailability = async (date, isCurrentlyBlocked) => {
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (isCurrentlyBlocked) {
      const block = bookings.find((b) => {
        if (b.customer?.firstName !== "ADMIN_BLOCK") return false;
        const bDate = new Date(b.schedule.date);
        return (
          `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}` ===
          dStr
        );
      });
      if (block) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/bookings/${block._id}`, {
            method: "DELETE",
          });
          setStatusMessage({ type: "success", text: `Unlocked ${dStr}` });
          fetchBookings();
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      const payload = {
        bookingId: `LOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: {
          firstName: "ADMIN_BLOCK",
          lastName: "SYSTEM",
          email: "admin@cleaniq.com",
          phone: "000",
        },
        service: "Availability Block",
        status: "Blackout",
        schedule: { date: dStr, timeSlot: "All Day" },
        payment: { amount: 0, status: "N/A" },
      };
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setStatusMessage({ type: "success", text: `Blocked ${dStr}` });
        fetchBookings();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleMarkCompleted = async (booking) => {
    if (
      !window.confirm(
        `Mark booking ${booking.bookingId} as completed? If payment is authorized via Stripe, it will be captured now and the customer will be emailed their receipt.`,
      )
    )
      return;
    setMarkingCompleteId(booking._id);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${booking._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" }),
        },
      );
      if (res.ok) {
        const updated = await res.json();
        if (selectedBooking?._id === booking._id) setSelectedBooking(updated);
        setStatusMessage({
          type: "success",
          text: `Booking ${booking.bookingId} marked as completed`,
        });
        fetchBookings();
      } else {
        setStatusMessage({
          type: "error",
          text: "Failed to mark booking as completed",
        });
      }
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: "Failed to mark booking as completed",
      });
    } finally {
      setMarkingCompleteId(null);
    }
  };

  const handleDelete = async (id, bookingId) => {
    if (
      window.confirm(`Are you sure you want to delete booking ${bookingId}?`)
    ) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings/${id}`,
          { method: "DELETE" },
        );
        if (response.ok) {
          fetchBookings();
          if (selectedBooking?._id === id) setSelectedBooking(null);
          setStatusMessage({
            type: "success",
            text: "Booking deleted successfully",
          });
        }
      } catch (error) {
        setStatusMessage({ type: "error", text: "Failed to delete booking" });
      }
    }
  };

  const handleUpdate = async (dataOverride = null) => {
    try {
      const payload =
        dataOverride && !dataOverride.nativeEvent ? dataOverride : editData;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${selectedBooking._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error("Server rejected the update");
      fetchBookings();
      setIsEditing(false);
      setSelectedBooking(null);
      setStatusMessage({
        type: "success",
        text: "Booking synced successfully",
      });
    } catch (error) {
      setStatusMessage({ type: "error", text: `Failed: ${error.message}` });
    }
  };

  const LEAD_EXPORT_HEADERS = [
    "Booking ID",
    "Customer",
    "Email",
    "Phone",
    "Service",
    "Date",
    "Time Slot",
    "Price",
    "Currency",
    "Status",
    "Address",
    "Lead Source",
    "Supplies Provided By",
    "Created By Admin",
  ];

  const leadExportRows = () =>
    bookings
      .filter((b) => b.status !== "Blackout")
      .map((b) => [
        b.bookingId,
        `${b.customer?.firstName} ${b.customer?.lastName}`,
        b.customer?.email,
        b.customer?.phone,
        b.service,
        b.schedule?.date ? new Date(b.schedule.date).toLocaleDateString() : "",
        b.schedule?.timeSlot,
        b.payment?.amount,
        b.payment?.currency,
        b.status,
        b.details?.address?.replace(/,/g, " "),
        b.leadSource || "Organic",
        b.suppliesProvidedBy || "",
        b.createdByAdmin || "Customer (website)",
      ]);

  const exportToCSV = () => {
    const rows = leadExportRows();
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [LEAD_EXPORT_HEADERS.join(","), ...rows.map((r) => r.join(","))].join(
        "\n",
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `CleanIQ_Bookings_${new Date().toLocaleDateString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = leadExportRows();
    const worksheet = XLSX.utils.aoa_to_sheet([LEAD_EXPORT_HEADERS, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings & Leads");
    XLSX.writeFile(
      workbook,
      `CleanIQ_Bookings_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`,
    );
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status !== "Blackout" &&
        (b.customer?.firstName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          b.customer?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [bookings, searchTerm]);

  const getStatusColor = (status) => {
    const colors = {
      Confirmed: "bg-emerald-50 text-emerald-600 border-emerald-100",
      Pending: "bg-amber-50 text-amber-600 border-amber-100",
      Completed: "bg-blue-50 text-blue-600 border-blue-100",
      Cancelled: "bg-rose-50 text-rose-600 border-rose-100",
    };
    return colors[status] || "bg-slate-50 text-slate-600 border-slate-100";
  };

  const getPropertyData = (b) => {
    if (!b) return {};
    const data = {};
    const roomNames = [
      "Bedroom",
      "Bathroom",
      "Cloakroom",
      "Kitchen",
      "Utility Room",
      "Reception Room",
      "Conservatory",
      "Living Room",
    ];

    // Check details object directly for room properties
    roomNames.forEach((room) => {
      if (b.details?.[room] && b.details[room] > 0) {
        data[room] = b.details[room];
      }
    });

    return data;
  };

  const getExtrasData = (b) => {
    if (!b) return {};
    const data = {};
    const roomNames = [
      "Bedroom",
      "Bathroom",
      "Cloakroom",
      "Kitchen",
      "Utility Room",
      "Reception Room",
      "Conservatory",
      "Living Room",
    ];

    const extras = b.details?.extras;
    if (Array.isArray(extras)) {
      extras.forEach((item) => {
        if (typeof item === "object" && item.name) {
          // New format: {name, qty, rate}
          const isRoom = roomNames.some((rn) =>
            item.name.toLowerCase().includes(rn.toLowerCase()),
          );
          if (!isRoom) {
            data[item.name] = item.qty || 1;
          }
        } else if (typeof item === "string") {
          // Old format: "Service (xN)"
          const isRoom = roomNames.some((rn) =>
            item.toLowerCase().includes(rn.toLowerCase()),
          );
          if (!isRoom) {
            const name = item.split(" (x")[0];
            const qtyMatch = item.match(/\(x(\d+)\)/);
            data[name] = qtyMatch ? parseInt(qtyMatch[1]) : 1;
          }
        }
      });
    }
    return data;
  };

  const getPetInfo = (b) => {
    if (!b) return null;
    if (Array.isArray(b.details?.extras)) {
      const petEntry = b.details.extras.find(
        (e) =>
          typeof e === "string" &&
          e.toLowerCase().startsWith("pet on premises:"),
      );
      if (petEntry) return petEntry.split(":")[1]?.trim() || null;
    }
    return null;
  };

  const getNotes = (b) => {
    if (!b) return "";
    const baseNotes =
      b.details?.notes ||
      b.notes ||
      b.meta?.notes ||
      b.specialInstructions ||
      "";
    if (baseNotes) return baseNotes;

    if (Array.isArray(b.details?.extras)) {
      const noteTag = b.details.extras.find(
        (e) =>
          typeof e === "string" &&
          (e.includes("Instructions:") ||
            e.includes("DATA_NOTES:") ||
            e.includes("📝 NOTE:")),
      );
      if (noteTag) return noteTag.split(":")[1].trim();
    }
    return "";
  };

  // Search every possible path the preferredTime could have been saved
  const getPreferredTime = (b) => {
    if (!b) return "";
    return (
      b.schedule?.preferredTime ||
      b.details?.preferredTime ||
      b.meta?.preferredTime ||
      b.preferredTime ||
      ""
    );
  };

  const getLogistics = (b) => {
    if (!b) return { parking: "Not specified", access: "Not specified" };
    let parking = b.details?.parking || b.parking || "Not specified";
    let access = b.details?.keyAccess || b.keyAccess || "Not specified";
    if (Array.isArray(b.details?.extras)) {
      const pTag = b.details.extras.find(
        (e) =>
          typeof e === "string" &&
          (e.includes("DATA_PARKING:") || e.includes("🚗 PARKING:")),
      );
      const aTag = b.details.extras.find(
        (e) =>
          typeof e === "string" &&
          (e.includes("DATA_ACCESS:") || e.includes("🔑 ACCESS:")),
      );
      if (pTag) parking = pTag.split(":")[1].trim();
      if (aTag) access = aTag.split(":")[1].trim();
    }
    return { parking, access };
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* ── CRM MODAL ─────────────────────────────────────────── */}
      {crmBooking && (
        <AdminCRM booking={crmBooking} onClose={() => setCrmBooking(null)} />
      )}

      {statusMessage.text && (
        <div className="fixed top-6 right-6 z-100 px-6 py-4 rounded-2xl shadow-2xl bg-slate-900 text-white font-semibold text-sm animate-in slide-in-from-right">
          {statusMessage.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bookings
          </h1>
          <div className="flex gap-5 mt-2">
            <button
              onClick={() => setView("list")}
              className={`text-[11px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${view === "list" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              Booking List
            </button>
            <button
              onClick={() => setView("availability")}
              className={`text-[11px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${view === "availability" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              Manage Availability
            </button>
          </div>
        </div>
        <div className="flex gap-2.5">
          {view === "list" && (
            <>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <Download size={15} /> CSV
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                title="Export bookings & leads to Excel"
              >
                <Download size={15} /> Excel
              </button>
            </>
          )}
          <button
            onClick={() => {
              setNoPaymentRequired(false);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white text-primary border border-slate-200 hover:bg-slate-50 transition-all font-semibold text-sm"
          >
            Create Booking
          </button>
          <button
            onClick={() => {
              setNoPaymentRequired(true);
              setShowCreateModal(true);
            }}
            title="Create a booking that's already been paid (cash/bank transfer) — no Stripe link or bank details will be emailed"
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-all font-semibold text-sm"
          >
            Create Booking (No Payment)
          </button>
          <button
            onClick={fetchBookings}
            className="px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all font-semibold text-sm shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-5 border-b border-slate-100 flex items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 flex-1 min-w-60 focus-within:border-primary/50 transition-all">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium w-full text-slate-700"
              />
            </div>
            {selectedBookings.size > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                Delete ({selectedBookings.size})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] bg-slate-50/60">
                  <th className="px-4 py-3.5 w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedBookings.size === filteredBookings.length &&
                        filteredBookings.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer accent-primary"
                    />
                  </th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Worker</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-16 text-center font-semibold text-slate-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-16 text-center font-semibold text-slate-300"
                    >
                      No matching entries
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr
                      key={b._id}
                      className={`group hover:bg-slate-50/80 transition-colors ${
                        selectedBookings.has(b._id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(b._id)}
                          onChange={() => toggleBookingSelection(b._id)}
                          className="w-4 h-4 rounded border-2 border-slate-300 cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-sm">
                          {b.customer?.firstName} {b.customer?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {b.bookingId}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {b.service}
                        </p>
                        <p className="text-[10px] text-primary font-semibold">
                          {getPropertyData(b)["Bedroom"] || 0} Bed •{" "}
                          {b.details?.duration || 0}h Clean
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-semibold uppercase text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full">
                          {b.leadSource || "Organic"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {new Date(b.schedule?.date).toLocaleDateString()}
                        <br />
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {b.schedule?.timeSlot}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {b.assignedWorkerName ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                            {b.assignedWorkerName}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-300 italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wide ${getStatusColor(b.status)}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setEditData(b);
                              setIsEditing(false);
                              setShowRaw(false);
                            }}
                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                            title="View Booking"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setCrmBooking(b)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                            title="CRM Actions — Email, Invoice, Review, Payment Link"
                            style={{ position: "relative" }}
                          >
                            <Sparkles size={16} />
                          </button>
                          {b.status !== "Completed" &&
                            b.status !== "Cancelled" && (
                              <button
                                disabled={markingCompleteId === b._id}
                                onClick={() => handleMarkCompleted(b)}
                                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 transition-all disabled:opacity-50"
                                title="Mark as Completed — captures authorized payment & emails receipt"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                          <button
                            onClick={() => handleDelete(b._id, b.bookingId)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all"
                            title="Delete Booking"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminCalendar
          bookings={bookings}
          onToggleDate={toggleAvailability}
          onBookingsCreated={fetchBookings}
        />
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden border-4 border-white flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Hash size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary-dark tracking-tighter">
                    {isEditing ? "Edit Parameters" : "Entry Intelligence"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {selectedBooking.bookingId}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${getStatusColor(selectedBooking.status)}`}
                    >
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing &&
                  selectedBooking.status !== "Completed" &&
                  selectedBooking.status !== "Cancelled" && (
                    <button
                      disabled={markingCompleteId === selectedBooking._id}
                      onClick={() => handleMarkCompleted(selectedBooking)}
                      title="Mark the job as done — captures any authorized payment and emails the customer their receipt"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-60"
                    >
                      <CheckCircle2 size={15} />
                      {markingCompleteId === selectedBooking._id
                        ? "Completing..."
                        : "Mark as Completed"}
                    </button>
                  )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {isEditing ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 ml-4 uppercase">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editData.customer?.firstName || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            customer: {
                              ...editData.customer,
                              firstName: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 ml-4 uppercase">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editData.customer?.lastName || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            customer: {
                              ...editData.customer,
                              lastName: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 ml-4 uppercase">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={editData.customer?.phone || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            customer: {
                              ...editData.customer,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 ml-4 uppercase">
                        Status
                      </label>
                      <select
                        value={editData.status}
                        onChange={(e) =>
                          setEditData({ ...editData, status: e.target.value })
                        }
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-primary-dark uppercase tracking-widest">
                      Pricing & Logistics
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 ml-4 uppercase">
                          Total Price ({editData.payment?.currency})
                        </label>
                        <div className="relative">
                          <DollarSign
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                          />
                          <input
                            type="number"
                            value={editData.payment?.amount || 0}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                payment: {
                                  ...editData.payment,
                                  amount: parseFloat(e.target.value),
                                },
                              })
                            }
                            className="w-full p-4 pl-10 rounded-2xl bg-white border border-slate-200 font-bold text-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 ml-4 uppercase">
                          Worker Rate (£/hr)
                        </label>
                        <input
                          type="number"
                          value={editData.workerRate || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              workerRate: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white border border-slate-200 font-bold text-lg"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 ml-4 uppercase">
                          Worker Expected Hours
                        </label>
                        <input
                          type="number"
                          value={editData.workerDuration || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              workerDuration: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white border border-slate-200 font-bold text-lg"
                          placeholder="e.g. 2"
                        />
                      </div>
                      {(() => {
                        const editDateStr = editData.schedule?.date
                          ? (() => {
                              const d = new Date(editData.schedule.date);
                              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                            })()
                          : null;

                        return (
                          <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 space-y-4 md:col-span-2">
                            <h4 className="text-xs font-bold text-primary-dark uppercase tracking-widest">
                              Schedule
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase block mb-2">
                                  Booking Date
                                </label>
                                <CreateCalendar
                                  selectedDate={editData.schedule?.date}
                                  onDateSelect={(d) =>
                                    setEditData({
                                      ...editData,
                                      schedule: {
                                        ...editData.schedule,
                                        date: d,
                                      },
                                    })
                                  }
                                  bookedDates={
                                    editAvailability.fullyBookedDates
                                  }
                                />
                              </div>

                              <div className="space-y-3">
                                <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase block">
                                  Time Slot
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { value: "Morning", label: "Morning" },
                                    { value: "Afternoon", label: "Afternoon" },
                                    { value: "Evening", label: "Evening" },
                                  ].map((slot) => {
                                    const isTaken =
                                      editDateStr &&
                                      editAvailability.slotsByDate[
                                        editDateStr
                                      ]?.some((s) => s.includes(slot.value));
                                    return (
                                      <button
                                        key={slot.value}
                                        type="button"
                                        disabled={isTaken}
                                        onClick={() =>
                                          setEditData({
                                            ...editData,
                                            schedule: {
                                              ...editData.schedule,
                                              timeSlot: slot.value,
                                              preferredTime: "",
                                            },
                                          })
                                        }
                                        className={`py-3 px-2 rounded-lg border-2 text-[10px] font-bold uppercase transition-all ${
                                          editData.schedule?.timeSlot ===
                                          slot.value
                                            ? "border-primary bg-primary text-white shadow-md"
                                            : isTaken
                                              ? "border-rose-200 bg-rose-50 text-rose-300 cursor-not-allowed opacity-50"
                                              : "border-slate-200 bg-white text-slate-600 hover:border-primary/50"
                                        }`}
                                      >
                                        {slot.label}
                                        {isTaken && (
                                          <span className="block text-[8px] mt-0.5 text-rose-500 font-bold uppercase">
                                            Booked
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                <div>
                                  <label className="text-[9px] font-bold text-slate-400 ml-1 uppercase block mb-2">
                                    Or pick a flexible time
                                  </label>
                                  <div className="grid grid-cols-4 gap-2 mb-3">
                                    {(() => {
                                      const allQuickTimes = [
                                        "08:00",
                                        "08:30",
                                        "09:00",
                                        "09:30",
                                        "10:00",
                                        "10:30",
                                        "11:00",
                                        "11:30",
                                        "12:00",
                                        "12:30",
                                        "13:00",
                                        "13:30",
                                        "14:00",
                                        "14:30",
                                        "15:00",
                                        "15:30",
                                        "16:00",
                                        "16:30",
                                        "17:00",
                                        "17:30",
                                        "18:00",
                                        "18:30",
                                        "19:00",
                                        "19:30",
                                        "20:00",
                                      ];

                                      // fetch any flexible-time bookings already on this date, excluding this booking itself
                                      let bookedTimes = [];
                                      if (editDateStr) {
                                        bookedTimes = bookings
                                          .filter((b) => {
                                            if (b._id === selectedBooking?._id)
                                              return false;
                                            if (!b.schedule?.date) return false;
                                            const d = new Date(b.schedule.date);
                                            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                            return (
                                              dStr === editDateStr &&
                                              b.schedule?.timeSlot ===
                                                "Flexible"
                                            );
                                          })
                                          .map((b) => b.schedule.preferredTime)
                                          .filter(Boolean);
                                      }

                                      const isTodaySelected = (() => {
                                        if (!editDateStr) return false;
                                        const sel = new Date(editDateStr);
                                        const now = new Date();
                                        return (
                                          sel.getDate() === now.getDate() &&
                                          sel.getMonth() === now.getMonth() &&
                                          sel.getFullYear() ===
                                            now.getFullYear()
                                        );
                                      })();

                                      const now = new Date();
                                      const cutoffMinutes =
                                        now.getHours() * 60 +
                                        now.getMinutes() +
                                        30;

                                      const quickTimes = isTodaySelected
                                        ? allQuickTimes.filter((time) => {
                                            const [h, m] = time
                                              .split(":")
                                              .map(Number);
                                            return h * 60 + m > cutoffMinutes;
                                          })
                                        : allQuickTimes;

                                      return quickTimes.map((time) => {
                                        const isBooked =
                                          bookedTimes.includes(time);
                                        return (
                                          <button
                                            key={time}
                                            type="button"
                                            disabled={isBooked}
                                            onClick={() =>
                                              setEditData({
                                                ...editData,
                                                schedule: {
                                                  ...editData.schedule,
                                                  timeSlot: "Flexible",
                                                  preferredTime: time,
                                                },
                                              })
                                            }
                                            className={`py-3 px-2 rounded-xl border-2 text-[10px] font-bold transition-all ${
                                              editData.schedule?.timeSlot ===
                                                "Flexible" &&
                                              editData.schedule
                                                ?.preferredTime === time
                                                ? "border-primary bg-primary text-white shadow-lg scale-105"
                                                : isBooked
                                                  ? "border-rose-200 bg-rose-50 text-rose-300 cursor-not-allowed opacity-50"
                                                  : "border-slate-200 bg-white text-slate-600 hover:border-primary/50"
                                            }`}
                                          >
                                            {time}
                                          </button>
                                        );
                                      });
                                    })()}
                                  </div>

                                  <input
                                    type="time"
                                    min="08:00"
                                    max="20:00"
                                    value={
                                      editData.schedule?.timeSlot === "Flexible"
                                        ? editData.schedule?.preferredTime || ""
                                        : ""
                                    }
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        schedule: {
                                          ...editData.schedule,
                                          timeSlot: "Flexible",
                                          preferredTime: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full p-3 rounded-xl bg-white border-2 border-slate-200 font-bold text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="space-y-1 pt-4">
                      <label className="text-[9px] font-bold text-slate-400 ml-4 uppercase">
                        Special Instructions
                      </label>
                      <textarea
                        value={getNotes(editData)}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            details: {
                              ...editData.details,
                              notes: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 rounded-xl bg-white border border-slate-200 font-bold text-xs h-24 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                      <Mail size={20} className="text-primary mx-auto mb-2" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                        Email
                      </p>
                      <p className="text-xs font-bold text-primary-dark truncate">
                        {selectedBooking.customer?.email}
                      </p>
                    </div>
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                      <Phone size={20} className="text-primary mx-auto mb-2" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                        Contact
                      </p>
                      <p className="text-xs font-bold text-primary-dark">
                        {selectedBooking.customer?.phone}
                      </p>
                    </div>
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center relative group">
                      <DollarSign
                        size={20}
                        className="text-primary mx-auto mb-2"
                      />
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                        Payment
                      </p>
                      <p className="text-xs font-bold text-primary-dark">
                        {selectedBooking.payment?.currency === "GBP"
                          ? "£"
                          : "₦"}
                        {selectedBooking.payment?.amount}
                      </p>
                      <div className="flex gap-1 mt-2 flex-col sm:flex-row">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `${import.meta.env.VITE_API_URL}/bookings/${selectedBooking._id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    payment: {
                                      ...selectedBooking.payment,
                                      status: "Confirmed",
                                      confirmedAt: new Date().toISOString(),
                                    },
                                  }),
                                },
                              );
                              if (res.ok) {
                                setSelectedBooking((prev) => ({
                                  ...prev,
                                  payment: {
                                    ...prev.payment,
                                    status: "Confirmed",
                                    confirmedAt: new Date().toISOString(),
                                  },
                                }));
                                alert("✅ Payment confirmed!");
                                fetchBookings();
                              }
                            } catch (err) {
                              console.error("Failed to confirm payment:", err);
                              alert("❌ Failed to confirm payment");
                            }
                          }}
                          className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setAdditionalHoursForm({
                              hours: "",
                              hourlyRate: "",
                              isGenerating: false,
                            });
                            setShowAdditionalHoursModal(true);
                          }}
                          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[8px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          + Extra Hours
                        </button>
                      </div>
                    </div>
                  </div>

                  {(selectedBooking.assignedWorker ||
                    selectedBooking.assignedWorkerName) && (
                    <div className="bg-emerald-50 rounded-[32px] p-6 border border-emerald-100 flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-emerald-100">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <User size={24} className="text-emerald-700" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                              Assigned Worker
                            </p>
                            <p className="text-sm font-bold text-emerald-900">
                              {selectedBooking.assignedWorker?.firstName
                                ? `${selectedBooking.assignedWorker.firstName} ${selectedBooking.assignedWorker.lastName}`
                                : selectedBooking.assignedWorkerName}
                            </p>
                          </div>
                        </div>

                        {selectedBooking.assignedWorker && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Phone
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                {selectedBooking.assignedWorker.phone}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Email
                              </p>
                              <p
                                className="text-xs font-bold text-emerald-800 truncate"
                                title={selectedBooking.assignedWorker.email}
                              >
                                {selectedBooking.assignedWorker.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Worker ID
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                {selectedBooking.assignedWorker.workerId}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Region
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                {selectedBooking.assignedWorker.region}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Assigned Rate
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                £{selectedBooking.workerRate || 0}/hr
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Expected Hours
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                {selectedBooking.workerDuration || 0} hrs
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Cleaner Progress Timeline */}
                      <div className="w-full md:w-80 bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
                        <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Live Cleaner Progress
                        </h5>

                        <div className="space-y-4 relative pl-3 border-l-2 border-slate-100">
                          {/* Step 1: Arrived */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                selectedBooking.jobArrivedTime
                                  ? "bg-emerald-500 border-emerald-200"
                                  : "bg-white border-slate-300"
                              }`}
                            />
                            <p className="text-xs font-bold text-primary-dark">
                              Arrived at Customer
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {selectedBooking.jobArrivedTime
                                ? `Completed at ${new Date(selectedBooking.jobArrivedTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : "Pending arrival..."}
                            </p>
                          </div>

                          {/* Step 2: Commenced */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                selectedBooking.jobStartTime
                                  ? "bg-emerald-500 border-emerald-200"
                                  : "bg-white border-slate-300"
                              }`}
                            />
                            <p className="text-xs font-bold text-primary-dark">
                              Cleaning Commenced
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {selectedBooking.jobStartTime
                                ? `Started at ${new Date(selectedBooking.jobStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : "Awaiting start..."}
                            </p>
                          </div>

                          {/* Step 3: Finished */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                selectedBooking.jobEndTime
                                  ? "bg-emerald-500 border-emerald-200"
                                  : "bg-white border-slate-300"
                              }`}
                            />
                            <p className="text-xs font-bold text-primary-dark">
                              Cleaning Finished
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {selectedBooking.jobEndTime
                                ? `Done: ${selectedBooking.jobDurationActual || 0} mins actual clean`
                                : "Awaiting completion..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mt-1 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Full Address
                          </h4>
                          <p className="font-bold text-primary-dark leading-tight">
                            {selectedBooking.details?.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Booking Date
                          </h4>
                          <p className="font-bold text-primary-dark">
                            {selectedBooking.schedule?.date
                              ? new Date(
                                  selectedBooking.schedule.date,
                                ).toLocaleDateString("en-GB", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Duration & Arrival Timing
                          </h4>
                          <p className="font-bold text-primary-dark">
                            {selectedBooking.details?.duration || 0}h Clean (
                            {selectedBooking.service})
                          </p>
                          <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">
                            Slot:{" "}
                            {{
                              Morning: "Morning (8am – 12pm)",
                              Afternoon: "Afternoon (12pm – 4pm)",
                              Evening: "Evening (4pm – 8pm)",
                            }[selectedBooking.schedule?.timeSlot] ||
                              selectedBooking.schedule?.timeSlot ||
                              "Not set"}
                          </p>
                          <p className="text-[11px] font-bold text-primary uppercase mt-1">
                            Requested Arrival:{" "}
                            {getPreferredTime(selectedBooking) ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 mt-1">
                          <Info size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Customer Notes / Instructions
                          </h4>
                          <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                            "
                            {getNotes(selectedBooking) ||
                              "No instructions provided"}
                            "
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {/* Property Rooms Section */}
                      {Object.keys(getPropertyData(selectedBooking)).length >
                        0 && (
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-[24px] border-2 border-indigo-200 space-y-4">
                          <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <HomeIcon size={16} className="text-indigo-600" />
                            Property Rooms
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {Object.entries(
                              getPropertyData(selectedBooking),
                            ).map(([key, qty]) =>
                              qty > 0 ? (
                                <div
                                  key={key}
                                  className="bg-white rounded-lg border-2 border-indigo-200 p-3 text-center hover:shadow-md transition-shadow"
                                >
                                  <p className="text-[10px] font-bold text-indigo-600">
                                    {qty}x
                                  </p>
                                  <p className="text-[9px] font-bold text-slate-700 mt-1 line-clamp-2">
                                    {key}
                                  </p>
                                </div>
                              ) : null,
                            )}
                          </div>
                        </div>
                      )}

                      {/* Extra Services Section */}
                      {Object.keys(getExtrasData(selectedBooking)).length >
                        0 && (
                        <div className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 rounded-[24px] border-2 border-rose-200 space-y-4">
                          <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={16} className="text-rose-600" /> Extra
                            Services
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(getExtrasData(selectedBooking)).map(
                              ([name, qty]) => (
                                <div
                                  key={name}
                                  className="bg-white rounded-lg border-2 border-rose-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">
                                      {name}
                                    </p>
                                    <p className="text-xs text-slate-600 font-semibold">
                                      Qty: {qty}
                                    </p>
                                  </div>
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-rose-600 text-white rounded-full text-xs font-bold">
                                    ✓
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pet Info */}
                      {getPetInfo(selectedBooking) && (
                        <div
                          className={`p-5 rounded-[24px] border-2 flex items-center gap-4 ${
                            getPetInfo(selectedBooking) === "Yes"
                              ? "bg-amber-50 border-amber-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className="text-2xl">
                            {getPetInfo(selectedBooking) === "Yes"
                              ? "🐶"
                              : "🚫"}
                          </span>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              Pet on Premises
                            </p>
                            <p
                              className={`font-bold text-sm ${getPetInfo(selectedBooking) === "Yes" ? "text-amber-600" : "text-slate-500"}`}
                            >
                              {getPetInfo(selectedBooking) === "Yes"
                                ? "Yes — pet-friendly cleaning required"
                                : "No pets"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => handleUpdate()}
                    className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <Save size={18} /> Sync Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (window.confirm("Cancel this booking?"))
                        handleUpdate({
                          ...selectedBooking,
                          status: "Cancelled",
                        });
                    }}
                    className="flex-1 py-5 rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold uppercase tracking-widest hover:bg-rose-100 transition-all"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                  >
                    <Edit3 size={18} /> Modify Entry
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Hours Payment Link Modal */}
      {showAdditionalHoursModal && selectedBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setShowAdditionalHoursModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Zap size={20} className="text-white" />
                  Additional Cleaning Hours
                </h3>
                <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mt-1">
                  Create a payment link for extra hours
                </p>
              </div>
              <button
                onClick={() => setShowAdditionalHoursModal(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Current Hours Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">
                  Current Booking Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-600 font-bold">Original Hours:</p>
                    <p className="text-blue-700 font-bold text-lg">
                      {selectedBooking.details?.duration || 0}h
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-bold">Current Total:</p>
                    <p className="text-blue-700 font-bold text-lg">
                      {(selectedBooking.details?.additionalHoursPurchased ||
                        0) + (selectedBooking.details?.duration || 0)}
                      h
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Hours Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  📝 Additional Hours Needed
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g., 2"
                  value={additionalHoursForm.hours}
                  onChange={(e) =>
                    setAdditionalHoursForm((prev) => ({
                      ...prev,
                      hours: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl bg-white border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-slate-400"
                />
              </div>

              {/* Hourly Rate Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  💷 Hourly Rate (£)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 25"
                  value={additionalHoursForm.hourlyRate}
                  onChange={(e) =>
                    setAdditionalHoursForm((prev) => ({
                      ...prev,
                      hourlyRate: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl bg-white border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-slate-400"
                />
              </div>

              {/* Calculate Total */}
              {additionalHoursForm.hours && additionalHoursForm.hourlyRate && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
                    💰 Payment Amount
                  </p>
                  <p className="text-3xl font-bold text-emerald-700">
                    £
                    {(
                      parseFloat(additionalHoursForm.hours || 0) *
                      parseFloat(additionalHoursForm.hourlyRate || 0)
                    ).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">
                    {additionalHoursForm.hours}h × £
                    {additionalHoursForm.hourlyRate}/hr
                  </p>
                </div>
              )}

              {/* Send Link Button */}
              <button
                onClick={async () => {
                  if (
                    !additionalHoursForm.hours ||
                    !additionalHoursForm.hourlyRate
                  ) {
                    alert("Please enter both hours and hourly rate");
                    return;
                  }

                  setAdditionalHoursForm((prev) => ({
                    ...prev,
                    isGenerating: true,
                  }));

                  try {
                    const response = await fetch(
                      `${import.meta.env.VITE_API_URL}/payments/additional-hours-checkout`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bookingId: selectedBooking._id,
                          additionalHours: parseFloat(
                            additionalHoursForm.hours,
                          ),
                          hourlyRate: parseFloat(
                            additionalHoursForm.hourlyRate,
                          ),
                        }),
                      },
                    );

                    if (!response.ok) {
                      throw new Error("Failed to create payment link");
                    }

                    const data = await response.json();

                    // Send email with payment link
                    const emailResponse = await fetch(
                      `${import.meta.env.VITE_API_URL}/payments/send-additional-hours-email`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bookingId: selectedBooking._id,
                          customerEmail: selectedBooking.customer.email,
                          customerName: selectedBooking.customer.firstName,
                          checkoutUrl: data.checkoutUrl,
                          additionalHours: parseFloat(
                            additionalHoursForm.hours,
                          ),
                          additionalAmount: data.additionalAmount,
                          bookingRef: selectedBooking.bookingId,
                        }),
                      },
                    );

                    if (emailResponse.ok) {
                      alert(
                        `✅ Payment link sent to ${selectedBooking.customer.email}!\n\nAmount: £${data.additionalAmount.toFixed(2)}`,
                      );
                      setShowAdditionalHoursModal(false);
                    } else {
                      alert(
                        "✅ Payment link created, but email failed to send",
                      );
                    }
                  } catch (error) {
                    console.error("Error:", error);
                    alert(`❌ ${error.message}`);
                  } finally {
                    setAdditionalHoursForm((prev) => ({
                      ...prev,
                      isGenerating: false,
                    }));
                  }
                }}
                disabled={
                  additionalHoursForm.isGenerating ||
                  !additionalHoursForm.hours ||
                  !additionalHoursForm.hourlyRate
                }
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                {additionalHoursForm.isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Link...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Send Payment Link to Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => {
              setShowCreateModal(false);
              setNoPaymentRequired(false);
            }}
          />
          <div className="relative w-full max-w-7xl bg-white rounded-[32px] overflow-hidden shadow-2xl overflow-y-auto max-h-[92vh] border border-slate-100 animate-in fade-in zoom-in-95">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <Plus size={24} className="text-white" />
                  </div>
                  New Booking
                  {noPaymentRequired && (
                    <span className="bg-emerald-400 text-emerald-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      No Payment
                    </span>
                  )}
                </h3>
                <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mt-2">
                  Step {createStep} of 4 •{" "}
                  {noPaymentRequired
                    ? "Already paid — confirmation email only, no payment link"
                    : "Create and assign a cleaning service"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNoPaymentRequired(false);
                }}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-4 sm:px-6 lg:px-10 pt-6">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                        step <= createStep
                          ? "bg-primary text-white shadow-lg scale-110"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step < createStep ? <CheckCircle2 size={20} /> : step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          step < createStep ? "bg-primary" : "bg-slate-100"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 mb-6">
                {["Location", "Home & Hours", "Add-ons", "Payment"].map(
                  (t, idx) => (
                    <div
                      key={t}
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        createStep === idx + 1
                          ? "text-primary"
                          : idx + 1 < createStep
                            ? "text-slate-500"
                            : "text-slate-300"
                      }`}
                    >
                      {t}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 px-4 sm:px-6 lg:px-10 py-6">
              <div className="lg:col-span-8">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 sm:p-8 rounded-[28px] border border-slate-200/50">
                  {/* Step content */}
                  {createStep === 1 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
                          <MapPin size={24} className="text-primary" />
                          Cleaning Location
                        </h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
                          Where and what type of cleaning?
                        </p>
                      </div>

                      {/* Address and Postcode */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            📍 Full Address{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            placeholder="Enter complete address"
                            className={`w-full p-4 rounded-2xl bg-white border-2 transition-all text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                              formErrors["details.address"]
                                ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                                : "border-slate-200 focus:ring-primary/30 focus:border-primary"
                            }`}
                            value={createData.details.address || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "details.address",
                                e.target.value,
                              )
                            }
                            onBlur={() =>
                              setFieldTouched((prev) => ({
                                ...prev,
                                "details.address": true,
                              }))
                            }
                          />
                          {(formErrors["details.address"] ||
                            fieldTouched["details.address"]) &&
                            formErrors["details.address"] && (
                              <p className="text-rose-500 text-[10px] font-bold mt-1">
                                {formErrors["details.address"]}
                              </p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                              📬 Postcode
                            </label>
                            <input
                              placeholder="e.g., M1 1AA"
                              className="w-full p-4 rounded-2xl bg-white border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium placeholder:text-slate-400"
                              value={createData.details.postcode || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  "details.postcode",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                              🔄 Frequency{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={createData.details.frequency}
                              onChange={(e) =>
                                handleFieldChange(
                                  "details.frequency",
                                  e.target.value,
                                )
                              }
                              className={`w-full p-4 rounded-2xl bg-white border-2 transition-all text-sm font-medium focus:outline-none focus:ring-2 ${
                                formErrors["details.frequency"]
                                  ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                                  : "border-slate-200 focus:ring-primary/30 focus:border-primary"
                              }`}
                            >
                              <option>Once</option>
                              <option>Weekly</option>
                              <option>Bi-weekly</option>
                              <option>Monthly</option>
                            </select>
                            {(formErrors["details.frequency"] ||
                              fieldTouched["details.frequency"]) &&
                              formErrors["details.frequency"] && (
                                <p className="text-rose-500 text-[10px] font-bold mt-1">
                                  {formErrors["details.frequency"]}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Lead Source & Supplies */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                            📣 Where did this booking come from?
                          </label>
                          <select
                            value={createData.leadSource || "Organic"}
                            onChange={(e) =>
                              handleFieldChange("leadSource", e.target.value)
                            }
                            className="w-full p-4 rounded-2xl bg-white border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium"
                          >
                            {LEAD_SOURCES.map((src) => (
                              <option key={src} value={src}>
                                {src}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                            🧴 Who provides cleaning supplies & equipment?
                          </label>
                          <select
                            value={createData.suppliesProvidedBy || "Cleaniq"}
                            onChange={(e) =>
                              handleFieldChange(
                                "suppliesProvidedBy",
                                e.target.value,
                              )
                            }
                            className="w-full p-4 rounded-2xl bg-white border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium"
                          >
                            <option value="Cleaniq">Cleaniq provides</option>
                            <option value="Customer">Customer provides</option>
                          </select>
                        </div>
                      </div>

                      {/* Service Selection */}
                      <div className="pt-2">
                        <h5 className="font-bold text-lg text-primary-dark mb-4 flex items-center gap-2">
                          🧹 Select Service Type{" "}
                          <span className="text-rose-500">*</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {createServiceOptions.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleFieldChange("service", s.id)}
                              className={`p-4 rounded-2xl border-2 transition-all text-left transform hover:scale-105 ${
                                createData.service === s.id
                                  ? "border-primary bg-gradient-to-br from-primary/10 to-blue-50 shadow-lg scale-105"
                                  : formErrors.service
                                    ? "border-rose-200 bg-white hover:shadow-md"
                                    : "border-slate-200 bg-white hover:shadow-md hover:border-primary/30"
                              }`}
                            >
                              <div className="font-extrabold text-base text-primary-dark">
                                {s.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-2 font-bold">
                                {s.tag}
                              </div>
                              {createData.service === s.id && (
                                <div className="text-primary text-sm font-bold mt-2">
                                  ✓ Selected
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        {(formErrors.service || fieldTouched.service) &&
                          formErrors.service && (
                            <p className="text-rose-500 text-[10px] font-bold mt-2">
                              {formErrors.service}
                            </p>
                          )}
                      </div>
                    </div>
                  )}

                  {createStep === 2 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
                          <HomeIcon size={24} className="text-primary" />
                          Home Details & Duration
                        </h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
                          Specify property rooms and cleaning hours
                        </p>
                      </div>

                      {/* Duration and Pet */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-1">
                            ⏱️ Duration (Hours){" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[2, 3, 4, 5, 6, 7, 8].map((hours) => (
                              <button
                                key={hours}
                                onClick={() =>
                                  handleFieldChange("details.duration", hours)
                                }
                                type="button"
                                className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all transform hover:scale-105 ${
                                  createData.details.duration === hours
                                    ? "border-primary bg-primary text-white shadow-lg"
                                    : "border-slate-200 bg-white text-primary hover:border-primary/50"
                                }`}
                              >
                                {hours}h
                              </button>
                            ))}
                          </div>
                          {formErrors["details.duration"] && (
                            <p className="text-rose-500 text-[10px] font-bold mt-2">
                              {formErrors["details.duration"]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                            🐾 Has Pet
                          </label>
                          <select
                            value={createData.details.hasPet || "No"}
                            onChange={(e) =>
                              handleFieldChange(
                                "details.hasPet",
                                e.target.value,
                              )
                            }
                            className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-bold"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>

                      {/* Property Rooms */}
                      <div
                        className={`p-4 bg-white rounded-2xl border-2 ${
                          formErrors["details.Bedroom"] ||
                          formErrors["details.Bathroom"]
                            ? "border-rose-400 bg-rose-50"
                            : "border-slate-200"
                        }`}
                      >
                        <h5 className="font-bold text-base text-primary-dark mb-4 flex items-center gap-2">
                          🛏️ Property Rooms
                          <span className="text-rose-500">*</span>
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {[
                            "Bedroom",
                            "Bathroom",
                            "Kitchen",
                            "Living Room",
                            "Utility Room",
                            "Reception Room",
                            "Conservatory",
                            "Cloakroom",
                          ].map((r) => (
                            <div
                              key={r}
                              className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 flex flex-col items-center gap-2 hover:shadow-md transition-all"
                            >
                              <div className="font-bold text-sm text-primary-dark text-center line-clamp-2">
                                {r}
                              </div>
                              <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 border border-slate-200">
                                <button
                                  onClick={() => {
                                    const cur = createData.details[r] || 0;
                                    handleFieldChange(
                                      `details.${r}`,
                                      Math.max(0, cur - 1),
                                    );
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                                >
                                  <Minus size={16} />
                                </button>
                                <div className="w-6 text-center font-bold text-primary text-sm">
                                  {createData.details[r] || 0}
                                </div>
                                <button
                                  onClick={() => {
                                    const cur = createData.details[r] || 0;
                                    handleFieldChange(`details.${r}`, cur + 1);
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {(formErrors["details.Bedroom"] ||
                          formErrors["details.Bathroom"]) && (
                          <div className="mt-4 p-3 bg-rose-100 border-l-4 border-rose-500 rounded">
                            {formErrors["details.Bedroom"] && (
                              <p className="text-rose-700 text-[10px] font-bold mb-1">
                                ⚠️ {formErrors["details.Bedroom"]}
                              </p>
                            )}
                            {formErrors["details.Bathroom"] && (
                              <p className="text-rose-700 text-[10px] font-bold">
                                ⚠️ {formErrors["details.Bathroom"]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {createStep === 3 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
                          <Zap size={24} className="text-primary" />
                          Extra Services
                        </h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
                          Add optional services to boost the booking value
                        </p>
                      </div>
                      {extraServicesList.length === 0 ? (
                        <div className="text-center py-12 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                          <Zap
                            size={40}
                            className="mx-auto text-slate-300 mb-3"
                          />
                          <p className="text-sm font-bold text-slate-500">
                            No extra services available
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {extraServicesList.map((extra) => {
                            const currentQty =
                              createData.details.extras?.find(
                                (e) => e.name === extra.name,
                              )?.qty || 0;
                            return (
                              <div
                                key={extra._id}
                                className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                                  currentQty > 0
                                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-md"
                                    : "bg-white border-slate-200 hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="p-3 bg-white rounded-xl border-2 border-slate-200">
                                      <Zap
                                        size={20}
                                        className="text-amber-500"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-primary-dark">
                                        {extra.name}
                                      </p>
                                      <p className="text-xs font-bold text-slate-500 mt-1">
                                        £{extra.rate} per unit
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 bg-white rounded-xl p-2 border-2 border-slate-200">
                                    <button
                                      onClick={() => {
                                        setCreateData((prev) => {
                                          const extras = Array.isArray(
                                            prev.details.extras,
                                          )
                                            ? [...prev.details.extras]
                                            : [];
                                          const idx = extras.findIndex(
                                            (e) => e.name === extra.name,
                                          );
                                          if (idx !== -1) {
                                            if (extras[idx].qty > 1) {
                                              extras[idx].qty--;
                                            } else {
                                              extras.splice(idx, 1);
                                            }
                                          }
                                          return {
                                            ...prev,
                                            details: {
                                              ...prev.details,
                                              extras,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors font-bold"
                                    >
                                      −
                                    </button>
                                    <span className="text-lg font-bold text-primary w-8 text-center">
                                      {currentQty}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setCreateData((prev) => {
                                          const extras = Array.isArray(
                                            prev.details.extras,
                                          )
                                            ? [...prev.details.extras]
                                            : [];
                                          const idx = extras.findIndex(
                                            (e) => e.name === extra.name,
                                          );
                                          if (idx !== -1) {
                                            extras[idx].qty++;
                                          } else {
                                            extras.push({
                                              name: extra.name,
                                              qty: 1,
                                            });
                                          }
                                          return {
                                            ...prev,
                                            details: {
                                              ...prev.details,
                                              extras,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-colors font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {createStep === 4 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="text-2xl font-bold text-primary-dark flex items-center gap-3">
                          <DollarSign size={24} className="text-primary" />
                          Payment & Schedule
                        </h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
                          Set date, time, and customer details
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Calendar and Time */}
                        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-1">
                            📅 Select Date{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <CreateCalendar
                            selectedDate={createData.schedule.date}
                            onDateSelect={(d) =>
                              handleFieldChange("schedule.date", d)
                            }
                            bookedDates={bookedDates}
                          />
                          {(formErrors["schedule.date"] ||
                            fieldTouched["schedule.date"]) &&
                            formErrors["schedule.date"] && (
                              <p className="text-rose-500 text-[10px] font-bold mt-2">
                                {formErrors["schedule.date"]}
                              </p>
                            )}

                          <div className="mt-4 space-y-3">
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                                🕐 Time Slot Selection
                              </label>

                              <div className="p-3 bg-white rounded-xl border-2 border-slate-200">
                                <p className="text-[9px] font-bold text-slate-500 mb-2">
                                  Traditional Slots
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                  {(() => {
                                    const slots = [
                                      {
                                        value: "Morning",
                                        label: "Morning (8am-12pm)",
                                        limit: 12,
                                      },
                                      {
                                        value: "Afternoon",
                                        label: "Afternoon (12pm-4pm)",
                                        limit: 16,
                                      },
                                      {
                                        value: "Evening",
                                        label: "Evening (4pm-8pm)",
                                        limit: 20,
                                      },
                                    ];

                                    const selectedDateStr =
                                      createData.schedule.date;
                                    let availableSlots = slots;

                                    if (selectedDateStr) {
                                      const selectedDate = new Date(
                                        selectedDateStr,
                                      );
                                      const today = new Date();
                                      if (
                                        selectedDate.getDate() ===
                                          today.getDate() &&
                                        selectedDate.getMonth() ===
                                          today.getMonth() &&
                                        selectedDate.getFullYear() ===
                                          today.getFullYear()
                                      ) {
                                        const currentHour = today.getHours();
                                        const currentMinute =
                                          today.getMinutes();
                                        const effectiveHour =
                                          currentMinute >= 30
                                            ? currentHour + 1
                                            : currentHour;
                                        availableSlots = slots.filter(
                                          (slot) => effectiveHour < slot.limit,
                                        );
                                        if (availableSlots.length === 0) {
                                          availableSlots = [];
                                        }
                                      }
                                    }

                                    return availableSlots.map((slot) => {
                                      const isSlotBooked =
                                        selectedDateStr &&
                                        bookedSlotsByDate[
                                          selectedDateStr
                                        ]?.some((s) => s.includes(slot.value));
                                      return (
                                        <button
                                          key={slot.value}
                                          disabled={isSlotBooked}
                                          onClick={() =>
                                            handleFieldChange(
                                              "schedule.timeSlot",
                                              slot.value,
                                            )
                                          }
                                          type="button"
                                          className={`py-3 px-2 rounded-lg border-2 text-[10px] font-bold uppercase transition-all ${
                                            createData.schedule.timeSlot ===
                                            slot.value
                                              ? "border-primary bg-primary text-white shadow-md"
                                              : isSlotBooked
                                                ? "border-rose-200 bg-rose-50 text-rose-300 cursor-not-allowed opacity-50 font-bold text-xs"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-primary/50"
                                          }`}
                                        >
                                          {slot.label.split("(")[0].trim()}
                                          {isSlotBooked && (
                                            <span className="block text-[8px] mt-0.5 text-rose-500 font-bold uppercase tracking-wider">
                                              Booked
                                            </span>
                                          )}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>

                              <div className="p-6 bg-white rounded-xl border-2 border-slate-200 space-y-4">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Clock size={16} className="text-primary" />
                                    Choose Your Flexible Time
                                  </p>
                                  <p className="text-[9px] text-slate-400 mb-4">
                                    Available: 8:00 AM - 8:00 PM
                                  </p>
                                </div>

                                {/* Quick Select Buttons */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                  {(() => {
                                    const allQuickTimes = [
                                      "08:00",
                                      "08:30",
                                      "09:00",
                                      "09:30",
                                      "10:00",
                                      "10:30",
                                      "11:00",
                                      "11:30",
                                      "12:00",
                                      "12:30",
                                      "13:00",
                                      "13:30",
                                      "14:00",
                                      "14:30",
                                      "15:00",
                                      "15:30",
                                      "16:00",
                                      "16:30",
                                      "17:00",
                                      "17:30",
                                      "18:00",
                                      "18:30",
                                      "19:00",
                                      "19:30",
                                      "20:00",
                                    ];

                                    // Get booked times for the selected date
                                    const selectedDateStr =
                                      createData.schedule.date;
                                    let bookedTimes = [];
                                    if (selectedDateStr && bookedDates) {
                                      // Find bookings for this date
                                      bookedTimes = bookings
                                        .filter((b) => {
                                          if (!b.schedule?.date) return false;
                                          const d = new Date(b.schedule.date);
                                          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                          return (
                                            dStr === selectedDateStr &&
                                            b.schedule?.timeSlot === "Flexible"
                                          );
                                        })
                                        .map((b) => b.schedule.preferredTime)
                                        .filter(Boolean);
                                    }

                                    const isTodaySelected = (() => {
                                      if (!selectedDateStr) return false;
                                      const sel = new Date(selectedDateStr);
                                      const now = new Date();
                                      return (
                                        sel.getDate() === now.getDate() &&
                                        sel.getMonth() === now.getMonth() &&
                                        sel.getFullYear() === now.getFullYear()
                                      );
                                    })();

                                    const now = new Date();
                                    const cutoffMinutes =
                                      now.getHours() * 60 +
                                      now.getMinutes() +
                                      30;

                                    const quickTimes = isTodaySelected
                                      ? allQuickTimes.filter((time) => {
                                          const [h, m] = time
                                            .split(":")
                                            .map(Number);
                                          return h * 60 + m > cutoffMinutes;
                                        })
                                      : allQuickTimes;

                                    return quickTimes.map((time) => {
                                      const isBooked =
                                        bookedTimes.includes(time);
                                      return (
                                        <button
                                          key={time}
                                          disabled={isBooked}
                                          onClick={() => {
                                            handleFieldChange(
                                              "schedule.timeSlot",
                                              "Flexible",
                                            );
                                            handleFieldChange(
                                              "schedule.preferredTime",
                                              time,
                                            );
                                            console.log(
                                              `[DEV] Admin quick selected time: ${time}`,
                                            );
                                          }}
                                          type="button"
                                          className={`py-3 px-2 rounded-xl border-2 text-[10px] font-bold transition-all transform hover:scale-105 ${
                                            createData.schedule
                                              .preferredTime === time
                                              ? "border-primary bg-primary text-white shadow-lg scale-110"
                                              : isBooked
                                                ? "border-rose-200 bg-rose-50 text-rose-300 cursor-not-allowed opacity-50"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-primary/50"
                                          }`}
                                        >
                                          {time}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>

                                {/* Custom Time Input */}
                                <div className="border-t-2 border-slate-100 pt-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      ⏰ Custom Time
                                    </p>
                                    {/* <button
                                      type="button"
                                      onClick={() => {
                                        const testDate = new Date();
                                        testDate.setDate(
                                          testDate.getDate() + 1,
                                        );
                                        const dateStr = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, "0")}-${String(testDate.getDate()).padStart(2, "0")}`;
                                        setCreateData({
                                          ...createData,
                                          schedule: {
                                            date: dateStr,
                                            timeSlot: "Flexible",
                                            preferredTime: "14:00",
                                          },
                                          firstName: "Test",
                                          lastName: "Admin Test",
                                          email: "test@example.com",
                                          phone: "07700000000",
                                        });
                                        console.log(
                                          "[DEV TEST] Admin form populated with test data - NO PAYMENT REQUIRED",
                                        );
                                      }}
                                      className="text-[8px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition"
                                    >
                                      🧪 Dev Test Fill
                                    </button> */}
                                  </div>
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="time"
                                      value={
                                        createData.schedule.preferredTime &&
                                        createData.schedule.timeSlot ===
                                          "Flexible"
                                          ? createData.schedule.preferredTime.includes(
                                              ":",
                                            )
                                            ? createData.schedule.preferredTime
                                            : "12:30"
                                          : ""
                                      }
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleFieldChange(
                                            "schedule.timeSlot",
                                            "Flexible",
                                          );
                                          handleFieldChange(
                                            "schedule.preferredTime",
                                            e.target.value,
                                          );
                                          console.log(
                                            `[DEV] Admin custom time entered: ${e.target.value}`,
                                          );
                                        } else {
                                          console.log(
                                            "[DEV MODE] Admin - No time entered - using default: 12:30",
                                          );
                                          handleFieldChange(
                                            "schedule.preferredTime",
                                            "12:30",
                                          );
                                          handleFieldChange(
                                            "schedule.timeSlot",
                                            "Flexible",
                                          );
                                        }
                                      }}
                                      onBlur={() => {
                                        // If empty on blur, set to 12:30
                                        if (
                                          !createData.schedule.preferredTime
                                        ) {
                                          console.log(
                                            "[DEV] Admin - Blur event - setting default to 12:30",
                                          );
                                          handleFieldChange(
                                            "schedule.preferredTime",
                                            "12:30",
                                          );
                                          handleFieldChange(
                                            "schedule.timeSlot",
                                            "Flexible",
                                          );
                                        }
                                      }}
                                      className="flex-1 p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-primary focus:bg-white shadow-sm outline-none font-bold text-sm text-slate-700"
                                      min="08:00"
                                      max="20:00"
                                    />
                                    <span className="text-[9px] font-bold text-slate-500 text-center whitespace-nowrap">
                                      {createData.schedule.preferredTime &&
                                      createData.schedule.timeSlot ===
                                        "Flexible"
                                        ? "✓ Selected"
                                        : "Click to set"}
                                    </span>
                                  </div>
                                  <p className="text-[8px] text-slate-400">
                                    💡 If left empty, we'll default to 12:30 PM
                                  </p>
                                </div>
                              </div>
                            </div>

                            {formErrors["schedule.timeSlot"] && (
                              <p className="text-rose-500 text-[10px] font-bold">
                                {formErrors["schedule.timeSlot"]}
                              </p>
                            )}

                            {createData.schedule.timeSlot &&
                              createData.schedule.timeSlot !== "Flexible" && (
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                    ⏰ Preferred Arrival Time (Optional)
                                  </label>
                                  <input
                                    placeholder="e.g. 10:00 AM"
                                    value={
                                      createData.schedule.preferredTime || ""
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        "schedule.preferredTime",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                                  />
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 space-y-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            👤 Customer Information
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <input
                                placeholder="First name"
                                value={createData.customer.firstName}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "customer.firstName",
                                    e.target.value,
                                  )
                                }
                                onBlur={() =>
                                  setFieldTouched((prev) => ({
                                    ...prev,
                                    "customer.firstName": true,
                                  }))
                                }
                                className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm focus:outline-none focus:ring-2 ${
                                  formErrors["customer.firstName"]
                                    ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300"
                                    : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                                }`}
                              />
                              {formErrors["customer.firstName"] && (
                                <p className="text-rose-500 text-[9px] font-bold mt-1">
                                  {formErrors["customer.firstName"]}
                                </p>
                              )}
                            </div>
                            <div>
                              <input
                                placeholder="Last name"
                                value={createData.customer.lastName}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "customer.lastName",
                                    e.target.value,
                                  )
                                }
                                onBlur={() =>
                                  setFieldTouched((prev) => ({
                                    ...prev,
                                    "customer.lastName": true,
                                  }))
                                }
                                className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm focus:outline-none focus:ring-2 ${
                                  formErrors["customer.lastName"]
                                    ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300"
                                    : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                                }`}
                              />
                              {formErrors["customer.lastName"] && (
                                <p className="text-rose-500 text-[9px] font-bold mt-1">
                                  {formErrors["customer.lastName"]}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <input
                              placeholder="Email"
                              value={createData.customer.email}
                              onChange={(e) =>
                                handleFieldChange(
                                  "customer.email",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                setFieldTouched((prev) => ({
                                  ...prev,
                                  "customer.email": true,
                                }))
                              }
                              className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm focus:outline-none focus:ring-2 ${
                                formErrors["customer.email"]
                                  ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300"
                                  : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                              }`}
                            />
                            {formErrors["customer.email"] && (
                              <p className="text-rose-500 text-[9px] font-bold mt-1">
                                {formErrors["customer.email"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              placeholder="Phone"
                              value={createData.customer.phone}
                              onChange={(e) =>
                                handleFieldChange(
                                  "customer.phone",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                setFieldTouched((prev) => ({
                                  ...prev,
                                  "customer.phone": true,
                                }))
                              }
                              className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm focus:outline-none focus:ring-2 ${
                                formErrors["customer.phone"]
                                  ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300"
                                  : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                              }`}
                            />
                            {formErrors["customer.phone"] && (
                              <p className="text-rose-500 text-[9px] font-bold mt-1">
                                {formErrors["customer.phone"]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Final Summary */}
                      <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">
                              💰 Estimated Total
                            </p>
                            <p className="text-3xl font-bold text-emerald-700 mt-1">
                              £{createTotal}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">
                              📊 Status
                            </p>
                            <p className="font-bold text-emerald-700 text-lg mt-1">
                              {noPaymentRequired ? "Completed" : createData.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Summary */}
              <div className="lg:col-span-4">
                <div className="sticky top-6 bg-gradient-to-br from-primary via-blue-600 to-indigo-600 rounded-[28px] p-6 text-white shadow-xl border border-indigo-400/30 space-y-4">
                  <h5 className="font-bold text-lg flex items-center gap-2">
                    📋 Booking Summary
                  </h5>

                  {/* Service Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      🧹 Service
                    </p>
                    <div className="font-bold text-lg mt-2">
                      {createData.service || "Not selected"}
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      📍 Address
                    </p>
                    <div className="text-sm font-bold mt-2 line-clamp-2">
                      {createData.details.address || "Not provided"}
                    </div>
                  </div>

                  {/* Date & Time Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      📅 Date & Time
                    </p>
                    <div className="text-sm font-bold mt-2">
                      {createData.schedule.date || "Not selected"}
                      <br />
                      <span className="text-xs text-white/80">
                        {createData.schedule.timeSlot || "Select time"}
                      </span>
                    </div>
                  </div>

                  {/* Customer Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      👤 Customer
                    </p>
                    <div className="text-sm font-bold mt-2">
                      {createData.customer.firstName &&
                      createData.customer.lastName
                        ? `${createData.customer.firstName} ${createData.customer.lastName}`
                        : "Not provided"}
                    </div>
                  </div>

                  {/* Duration Card */}
                  {createData.details.duration && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        ⏱️ Duration
                      </p>
                      <div className="text-sm font-bold mt-2">
                        {createData.details.duration} hours
                      </div>
                    </div>
                  )}

                  {/* Price Divider */}
                  <div className="h-px bg-white/20"></div>

                  {/* Total Price Card */}
                  <div className="bg-white rounded-xl p-5 text-primary shadow-lg">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      💰 Estimated Total
                    </p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      £{createTotal}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 font-bold">
                      Ready to create this booking?
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-4 sm:px-6 lg:px-10 py-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-3 flex-1 sm:flex-initial">
                {createStep > 1 && (
                  <button
                    onClick={() => setCreateStep((s) => Math.max(1, s - 1))}
                    className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors border-2 border-slate-200"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="flex gap-3 flex-1 justify-end">
                {createStep < 4 && (
                  <button
                    onClick={handleNextStep}
                    disabled={Object.keys(formErrors).length > 0}
                    className={`px-8 py-3 rounded-xl transition-all transform font-bold border-2 flex items-center gap-2 ${
                      Object.keys(formErrors).length > 0
                        ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg text-white hover:scale-105 border-primary"
                    }`}
                  >
                    Next →
                  </button>
                )}
                {createStep === 4 && (
                  <button
                    onClick={async () => {
                      const validation = validateStep(4);
                      setFormErrors(validation.errors);
                      if (!validation.isValid) {
                        setStatusMessage({
                          type: "error",
                          text: "Please fill all required fields correctly",
                        });
                        return;
                      }
                      try {
                        const extrasWithRates = (
                          createData.details.extras || []
                        ).map((extra) => {
                          const rate =
                            dynamicRates[
                              (extra.name || "")
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "")
                            ] || 0;
                          return {
                            ...extra,
                            rate,
                          };
                        });
                        const payload = {
                          ...createData,
                          bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
                          details: {
                            ...createData.details,
                            extras: extrasWithRates,
                          },
                          payment: {
                            amount: createTotal,
                            currency: createData.payment?.currency || "GBP",
                            status: noPaymentRequired ? "Completed" : "Pending",
                          },
                          status: noPaymentRequired ? "Completed" : createData.status,
                          noPaymentRequired,
                          createdByAdmin: localStorage.getItem("adminUser") || null,
                        };
                        const res = await fetch(
                          `${import.meta.env.VITE_API_URL}/bookings`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          },
                        );
                        if (!res.ok)
                          throw new Error("Failed to create booking");
                        const newBooking = await res.json();
                        setSuccessBooking(newBooking);
                        setShowSuccessModal(true);
                        setShowCreateModal(false);
                        setFormErrors({});
                        setFieldTouched({});
                        setNoPaymentRequired(false);
                        fetchBookings();
                      } catch (err) {
                        console.error(err);
                        setStatusMessage({
                          type: "error",
                          text: "Failed to create booking",
                        });
                      }
                    }}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-xl text-white font-bold transition-all transform hover:scale-105 border-2 border-emerald-600 flex items-center gap-2"
                  >
                    <CheckCircle2 size={20} />
                    Create Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Booking Created Successfully!
              </h2>
              <p className="text-sm text-slate-500">
                Payment link has been sent to customer email
              </p>
            </div>

            {/* Booking Details - 2 Column Layout */}
            <div className="space-y-6 mb-8">
              {/* Row 1: Reference & Customer */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Booking Reference */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    📋 Booking Reference
                  </p>
                  <p className="text-2xl font-bold text-slate-900 font-mono">
                    {successBooking.bookingId}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    👤 Customer
                  </p>
                  <p className="text-lg font-bold text-slate-900 mb-1">
                    {successBooking.customer.firstName}{" "}
                    {successBooking.customer.lastName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {successBooking.customer.email}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    📱 {successBooking.customer.phone}
                  </p>
                </div>
              </div>

              {/* Row 2: Service & Schedule */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Service Type */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    🧹 Service Type
                  </p>
                  <p className="text-lg font-bold text-slate-900 mb-1">
                    {successBooking.service}
                  </p>
                  <p className="text-xs text-slate-600">
                    Duration: {successBooking.details.duration} hours
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Frequency: {successBooking.details.frequency || "Once"}
                  </p>
                </div>

                {/* Schedule */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    📅 Schedule
                  </p>
                  <p className="text-lg font-bold text-slate-900 mb-2">
                    {new Date(successBooking.schedule.date).toDateString()}
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    🕐 {successBooking.schedule.timeSlot}
                  </p>
                </div>
              </div>

              {/* Row 3: Location */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  📍 Location
                </p>
                <p className="text-lg font-bold text-slate-900 mb-2">
                  {successBooking.details.address}
                </p>
                <p className="text-sm text-slate-700">
                  Postcode:{" "}
                  <span className="font-bold">
                    {successBooking.details.postcode}
                  </span>
                </p>
              </div>

              {/* Row 4: Property Rooms */}
              {(() => {
                const roomTypes = [
                  "Bedroom",
                  "Bathroom",
                  "Kitchen",
                  "Living Room",
                  "Utility Room",
                  "Reception Room",
                  "Conservatory",
                ];
                const rooms = roomTypes.filter(
                  (r) =>
                    successBooking.details[r] && successBooking.details[r] > 0,
                );
                return rooms.length > 0 ? (
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      🏠 Property Rooms
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {rooms.map((room) => (
                        <div
                          key={room}
                          className="bg-white rounded-xl p-3 border border-indigo-200 flex flex-col items-center justify-center"
                        >
                          <p className="text-xs font-bold text-indigo-600">
                            {successBooking.details[room]}x
                          </p>
                          <p className="text-xs font-bold text-slate-700 text-center mt-1">
                            {room}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Row 5: Extra Services */}
              {successBooking.details.extras &&
                successBooking.details.extras.length > 0 && (
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 border border-rose-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      ⭐ Extra Services
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {successBooking.details.extras.map((extra, idx) => {
                        const displayText =
                          typeof extra === "string"
                            ? extra
                            : `${extra.name} (x${extra.qty})`;
                        const extraPrice =
                          typeof extra === "string" ? null : extra.rate;
                        return (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-4 border border-rose-200 flex items-start justify-between"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {displayText}
                              </p>
                              {extraPrice && (
                                <p className="text-xs text-slate-600 mt-1">
                                  £{extraPrice} each
                                </p>
                              )}
                            </div>
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                              ✓
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Row 6: Payment */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      💰 Total Amount
                    </p>
                    <p className="text-xs text-slate-600 mb-1">
                      Status:{" "}
                      <span className="font-bold text-amber-600">
                        Pending Payment
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-green-600">
                      {successBooking.payment.currency === "GBP" ? "£" : "₦"}
                      {successBooking.payment.amount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-blue-900 mb-2">
                ✓ Payment Link Sent
              </p>
              <p className="text-xs text-blue-800">
                A secure payment link has been sent to{" "}
                <span className="font-bold">
                  {successBooking.customer.email}
                </span>
                . Once the customer pays, the booking status will automatically
                update to Confirmed and the worker will be notified.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessBooking(null);
                  setCreateData({
                    customer: {
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                    },
                    service: "",
                    details: {
                      address: "",
                      frequency: "Once",
                      duration: 2,
                      extras: [],
                    },
                    schedule: { date: "", timeSlot: "", preferredTime: "" },
                    payment: { amount: 0, currency: "GBP", status: "Pending" },
                    status: "Pending",
                  });
                  setCreateStep(1);
                }}
                className="w-full py-3 px-6 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
              >
                Close & Create New Booking
              </button> */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 px-6 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setShowBulkDeleteModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border-4 border-white p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary-dark tracking-tighter">
                  Delete {selectedBookings.size} Bookings?
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  This action cannot be undone. All selected bookings will be
                  permanently deleted.
                </p>
              </div>
              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  Warning: {selectedBookings.size} bookings will be deleted
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all border-2 border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold hover:shadow-lg transition-all border-2 border-rose-600"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
