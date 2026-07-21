import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  Eye,
  Hash,
  User,
  MapPin,
  Clock,
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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  FileText,
  Camera,
  RefreshCw,
} from "lucide-react";
import AdminCRM from "./AdminCRM";
import { buildBookedRanges, overlapsExistingRange } from "../utils/timeOverlap";

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

// Module-level utility — used by both AdminCalendar and the main Bookings component.
const fmtTimeRange = (b) => {
  const start =
    b?.schedule?.preferredTime ||
    b?.details?.preferredTime ||
    b?.meta?.preferredTime ||
    b?.preferredTime ||
    (b?.schedule?.time?.includes(":") ? b.schedule.time : null) ||
    (b?.schedule?.timeSlot?.includes(":") ? b.schedule.timeSlot : null);
  const dur = b?.details?.duration;
  if (!start || !dur) return start || "";
  const [h, m] = String(start).split(":").map(Number);
  const fmt = (min) => {
    const hr = Math.floor(min / 60) % 24;
    const mn = min % 60;
    return `${hr % 12 || 12}:${String(mn).padStart(2, "0")} ${hr >= 12 ? "PM" : "AM"}`;
  };
  const s = h * 60 + m;
  return `${fmt(s)} — ${fmt(s + Number(dur) * 60)}`;
};

export const AdminCalendar = ({ bookings, onToggleDate, onToggleTimeSlot }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState("month"); // "month" | "year"
  const [selectedDateForDetails, setSelectedDateForDetails] = useState(null);

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

  return (
    <div className="space-y-6">
      {/* â"€â"€ MAIN CALENDAR â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className="bg-[#0B2D22] rounded-[28px] sm:rounded-[40px] p-4 sm:p-10 border border-white/10 shadow-sm animate-in fade-in">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-10">
          <div>
            <h3 className="text-2xl font-bold text-white/85 tracking-tighter">
              {calendarView === "year" ? (
                <span className="text-primary">
                  {currentMonth.getFullYear()}
                </span>
              ) : (
                <>
                  {currentMonth.toLocaleString("default", { month: "long" })}{" "}
                  <span className="text-primary">
                    {currentMonth.getFullYear()}
                  </span>
                </>
              )}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[11px] font-bold">
                £
                {(calendarView === "year"
                  ? yearTotalRevenue
                  : currentMonthRevenue
                ).toLocaleString("en-GB", { maximumFractionDigits: 0 })}{" "}
                {calendarView === "year" ? "this year" : "this month"}
              </span>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {calendarView === "year"
                  ? "Click a month to view its calendar"
                  : "Click any date to Block/Unblock"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
              {["month", "year"].map((v) => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${calendarView === v ? "bg-primary text-white shadow-sm" : "text-white/40 hover:text-white/70"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={handlePrevMonth}
              className="p-3 rounded-2xl bg-white/5 text-white/40 hover:bg-[#10B981]/10 hover:text-[#10B981] transition-all border border-white/10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-3 rounded-2xl bg-white/5 text-white/40 hover:bg-[#10B981]/10 hover:text-[#10B981] transition-all border border-white/10"
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
              const totalDays = daysInMonth(
                currentMonth.getFullYear(),
                m.month,
              );
              const startDay = startDayOfMonth(
                currentMonth.getFullYear(),
                m.month,
              );
              const cells = [];
              for (let i = 0; i < startDay; i++) cells.push(null);
              for (let d = 1; d <= totalDays; d++) cells.push(d);

              return (
                <div
                  key={m.month}
                  className={`text-left p-4 rounded-[20px] border-2 transition-all ${m.count > 0 ? "bg-[#10B981]/10 border-[#10B981]/30" : "bg-white/5 border-transparent"}`}
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
                    <span className="font-bold text-white/85 text-sm">
                      {m.label}
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold text-white tabular-nums">
                        £
                        {m.revenue.toLocaleString("en-GB", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span className="block text-[10px] font-semibold text-white/40">
                        {m.count} booking{m.count !== 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((d, i) => (
                      <div
                        key={i}
                        title={
                          d && bookedDays.has(d)
                            ? `${bookedDays.size ? "" : ""}Booking on ${m.label} ${d}`
                            : undefined
                        }
                        className={`aspect-square rounded-[5px] flex items-center justify-center text-[8px] font-bold
                          ${!d ? "" : bookedDays.has(d) ? "bg-[#10B981] text-white" : "bg-white/5 text-white/30 border border-white/10"}
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
                  className="text-[10px] font-bold text-white/30 uppercase text-center py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
              {days.map((date, i) => {
                const dayBookings = getBookingsForDate(date);
                const isDayBlocked = dayBookings.some(
                  (b) =>
                    b.status === "Blackout" &&
                    b.schedule?.timeSlot === "All Day",
                );
                const hasAdminSlotBlocks = dayBookings.some(
                  (b) => b.status === "Blackout" && b.schedule?.preferredTime,
                );
                const realDayBookings = dayBookings.filter(isRealBooking);
                const hasBookings = realDayBookings.length > 0;
                const dayRevenue = realDayBookings.reduce(
                  (s, b) => s + Number(b.payment?.amount || 0),
                  0,
                );
                const hasRecurring = dayBookings.some(
                  (b) => b.meta?.recurringGroup,
                );

                // Mini slot indicator — count booked + blocked time slots
                const bookedSlotCount = realDayBookings.filter(
                  (b) =>
                    b.schedule?.preferredTime ||
                    b.schedule?.time?.includes(":"),
                ).length;
                const adminSlotCount = dayBookings.filter(
                  (b) => b.status === "Blackout" && b.schedule?.preferredTime,
                ).length;
                const totalOccupied = bookedSlotCount + adminSlotCount;

                const cellClass = isDayBlocked
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                  : hasBookings
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : hasAdminSlotBlocks
                      ? "bg-rose-500/15 border-rose-500/25 text-rose-400/70"
                      : "bg-white/4 border-transparent text-white/30 hover:border-emerald-500/30 hover:text-white/60";

                return (
                  <div key={i} className="aspect-square">
                    {date ? (
                      <button
                        onClick={() => setSelectedDateForDetails({ date })}
                        className={`w-full h-full rounded-[24px] flex flex-col items-center justify-center transition-all relative border-2 group ${cellClass}`}
                      >
                        <span className="text-sm font-bold">
                          {date.getDate()}
                        </span>
                        {isDayBlocked && (
                          <span className="text-[7px] font-bold uppercase absolute bottom-2">
                            Blocked
                          </span>
                        )}
                        {hasBookings && !isDayBlocked && (
                          <span className="text-[7px] font-bold uppercase absolute bottom-1 text-center leading-tight px-1">
                            {realDayBookings.length} booked
                            {dayRevenue > 0 && (
                              <>
                                <br />£
                                {dayRevenue.toLocaleString("en-GB", {
                                  maximumFractionDigits: 0,
                                })}
                              </>
                            )}
                          </span>
                        )}
                        {!hasBookings && hasAdminSlotBlocks && (
                          <span className="text-[7px] font-bold uppercase absolute bottom-2">
                            {adminSlotCount} blocked
                          </span>
                        )}
                        {hasRecurring && !isDayBlocked && (
                          <span
                            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-400"
                            title="Recurring"
                          />
                        )}
                        {totalOccupied > 0 && !isDayBlocked && (
                          <span className="absolute top-1.5 left-1.5 flex gap-0.5">
                            {Array.from({
                              length: Math.min(totalOccupied, 4),
                            }).map((_, k) => (
                              <span
                                key={k}
                                className={`w-1 h-1 rounded-full ${k < bookedSlotCount ? "bg-amber-400" : "bg-rose-400"}`}
                              />
                            ))}
                          </span>
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
          <div className="flex gap-6 mt-8 pt-6 border-t border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-[11px] font-bold text-white/40">
                Has Bookings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="text-[11px] font-bold text-white/40">
                Blocked
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-400" />
              <span className="text-[11px] font-bold text-white/40">
                Recurring
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/15" />
              <span className="text-[11px] font-bold text-white/40">
                Available
              </span>
            </div>
          </div>
        )}
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-4">
          {calendarView === "year"
            ? "💡 Click any month to jump straight to its calendar"
            : "💡 Click any date to view bookings and manage availability"}
        </p>
      </div>

      {/* Date Details Modal */}
      {selectedDateForDetails &&
        (() => {
          const { date } = selectedDateForDetails;
          // Re-derive live from the current bookings prop so slot toggles reflect immediately.
          const bookingsOnDate = getBookingsForDate(date);
          const isBlocked = bookingsOnDate.some(
            (b) =>
              b.status === "Blackout" && b.schedule?.timeSlot === "All Day",
          );
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
            "Completed - Unpaid": "#9333EA",
            Cancelled: "#EF4444",
            Accepted: "#0EA5E9",
          };

          // Time slot grid data
          const TIME_SLOTS = [];
          for (let h = 8; h <= 19; h++) {
            TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
            TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
          }
          TIME_SLOTS.push("20:00");

          // Map each slot to its state
          const adminBlockedBySlot = {};
          bookingsOnDate
            .filter(
              (b) =>
                b.customer?.firstName === "ADMIN_BLOCK" &&
                b.status === "Blackout" &&
                b.schedule?.preferredTime,
            )
            .forEach((b) => {
              adminBlockedBySlot[b.schedule.preferredTime] = b;
            });

          const realBookingsBySlot = {};
          realBookings.forEach((b) => {
            const t =
              b.schedule?.preferredTime ||
              (b.schedule?.time?.includes(":") ? b.schedule.time : null) ||
              (b.schedule?.timeSlot?.includes(":")
                ? b.schedule.timeSlot
                : null);
            if (t)
              realBookingsBySlot[t] = (realBookingsBySlot[t] || []).concat(b);
          });

          const fmtSlot = (t) => {
            const [h, m] = t.split(":").map(Number);
            const period = h >= 12 ? "PM" : "AM";
            return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
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
                  background: "#0B2D22",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "32px",
                  width: "100%",
                  maxWidth: "560px",
                  maxHeight: "80vh",
                  overflow: "auto",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
                }}
              >
                {/* Modal Header */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #061A13, #0B2D22)",
                    padding: "28px 32px",
                    borderRadius: "32px 32px 0 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
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
                          color: "rgba(255,255,255,0.4)",
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
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        No bookings on this date
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.25)",
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
                          color: "rgba(255,255,255,0.4)",
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
                              background: "#071D16",
                              borderRadius: "16px",
                              padding: "14px 16px",
                              border: "1px solid rgba(255,255,255,0.1)",
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
                                    color: "white",
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
                                  color: "rgba(255,255,255,0.5)",
                                  fontWeight: 600,
                                }}
                              >
                                {b.service}
                              </p>
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontSize: "11px",
                                  color: "rgba(255,255,255,0.3)",
                                }}
                              >
                                {fmtTimeRange(b) || b.schedule?.timeSlot || ""}{" "}
                                Â· {b.bookingId}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Slot Grid */}
                  {onToggleTimeSlot && (
                    <div
                      style={{
                        marginTop: "20px",
                        paddingTop: "20px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 12px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Time Slot Availability
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginBottom: "10px",
                        }}
                      >
                        {[
                          { dot: "#10b981", label: "Available" },
                          { dot: "#f59e0b", label: "Booked" },
                          { dot: "#ef4444", label: "Blocked" },
                        ].map(({ dot, label }) => (
                          <span
                            key={label}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: dot,
                                display: "inline-block",
                              }}
                            />
                            {label}
                          </span>
                        ))}
                        <span
                          style={{
                            fontSize: "10px",
                            color: "rgba(255,255,255,0.25)",
                            marginLeft: "auto",
                          }}
                        >
                          Click to block / unblock
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(5, 1fr)",
                          gap: "5px",
                        }}
                      >
                        {TIME_SLOTS.map((slot) => {
                          const isAdminBlocked = !!adminBlockedBySlot[slot];
                          const hasRealBooking = !!realBookingsBySlot[slot];
                          const bg = isAdminBlocked
                            ? "rgba(239,68,68,0.15)"
                            : hasRealBooking
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(16,185,129,0.10)";
                          const color = isAdminBlocked
                            ? "#f87171"
                            : hasRealBooking
                              ? "#fbbf24"
                              : "#34d399";
                          const border = isAdminBlocked
                            ? "1px solid rgba(239,68,68,0.3)"
                            : hasRealBooking
                              ? "1px solid rgba(245,158,11,0.3)"
                              : "1px solid rgba(16,185,129,0.3)";
                          return (
                            <button
                              key={slot}
                              disabled={hasRealBooking}
                              onClick={() =>
                                onToggleTimeSlot(
                                  date,
                                  slot,
                                  adminBlockedBySlot[slot] || null,
                                )
                              }
                              title={
                                hasRealBooking
                                  ? `${realBookingsBySlot[slot].length} booking(s)`
                                  : isAdminBlocked
                                    ? "Click to unblock"
                                    : "Click to block"
                              }
                              style={{
                                padding: "5px 2px",
                                borderRadius: "8px",
                                border,
                                background: bg,
                                color,
                                fontSize: "9px",
                                fontWeight: 800,
                                cursor: hasRealBooking ? "default" : "pointer",
                                textAlign: "center",
                                opacity: hasRealBooking ? 0.8 : 1,
                              }}
                            >
                              {fmtSlot(slot)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Block / Unblock Action */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      paddingTop: "20px",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
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
                        border: isBlocked
                          ? "1px solid rgba(16,185,129,0.25)"
                          : "1px solid rgba(239,68,68,0.25)",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: "13px",
                        transition: "all 0.2s",
                        background: isBlocked
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: isBlocked ? "#34d399" : "#f87171",
                      }}
                    >
                      {isBlocked ? "🔓 Unlock This Date" : "⛔ Block This Date"}
                    </button>
                    <button
                      onClick={() => setSelectedDateForDetails(null)}
                      style={{
                        padding: "14px 20px",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.5)",
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
    <div className="bg-[#0B2D22] rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-white/10 shadow-xl shadow-black/50">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h3 className="font-bold text-white/85 tracking-tighter text-base md:text-lg">
          {currentMonth.toLocaleString("default", { month: "long" })}{" "}
          <span className="text-primary">{currentMonth.getFullYear()}</span>
        </h3>
        <div className="flex gap-1 md:gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 md:p-2 rounded-lg bg-white/5 text-white/40 hover:bg-[#10B981]/10 hover:text-[#10B981] transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 md:p-2 rounded-lg bg-white/5 text-white/40 hover:bg-[#10B981]/10 hover:text-[#10B981] transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-[8px] md:text-[10px] font-bold text-white/30 uppercase text-center py-2"
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
                  className={`w-full h-full rounded-xl text-center flex items-center justify-center relative font-bold text-sm transition-all ${isSelected(date) ? "bg-primary text-white shadow-lg" : booked ? "bg-rose-500/20 text-rose-400 cursor-not-allowed" : past ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/20" : "bg-white/5 text-white/70 hover:bg-[#10B981]/10 hover:text-[#10B981]"}`}
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
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [crmBooking, setCrmBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
    payment: {
      amount: 0,
      currency: "GBP",
      status: "Pending",
      billingType: "hourly",
    },
    status: "Pending",
    leadSource: "Organic",
    suppliesProvidedBy: "Cleaniq",
  });
  // When billingType is "flat", createFlatAmount is used directly as the
  // total instead of the auto-calculated hourly-rate × duration price —
  // for one-off jobs the customer just wants to pay a single fixed price for.
  const [createFlatAmount, setCreateFlatAmount] = useState("");
  const [createStep, setCreateStep] = useState(1);
  // When true, the booking is created already paid (cash/bank transfer taken
  // outside the system) — no Stripe link or bank details are emailed.
  const [noPaymentRequired, setNoPaymentRequired] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  // Only relevant for non-pay bookings — silently creates the booking with
  // no confirmation email. Invoice/payment link/review request can still be
  // sent manually afterwards via the CRM actions (Sparkles) button.
  const [skipConfirmationEmail, setSkipConfirmationEmail] = useState(false);
  const [servicesList, setServicesList] = useState([]);
  const [dynamicRates, setDynamicRates] = useState({});
  const [createTotal, setCreateTotal] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [bookedSlotsByDate, setBookedSlotsByDate] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [editData, setEditData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [markingCompleteId, setMarkingCompleteId] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bookingsPage, setBookingsPage] = useState(1);
  const BOOKINGS_PAGE_SIZE = 25;
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
    if (createData.payment?.billingType === "flat") {
      setCreateTotal(
        Math.round((parseFloat(createFlatAmount) || 0) * 100) / 100,
      );
      return;
    }
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
  }, [createData, dynamicRates, createFlatAmount]);

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
      if (!value || Number(value) < 1)
        return "Duration must be at least 1 hour";
      if (Number(value) > 50) return "Duration must not exceed 50 hours";
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
      // Step 1: Location, Billing & Service — flat-rate jobs don't need an hourly duration
      const isFlatRate = createData.payment?.billingType === "flat";
      const addressErr = validateField(
        "details.address",
        createData.details?.address,
      );
      const frequencyErr = validateField(
        "details.frequency",
        createData.details?.frequency,
      );
      const serviceErr = validateField("service", createData.service);
      const durationErr = isFlatRate
        ? ""
        : validateField("details.duration", createData.details?.duration);
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
      if (durationErr) {
        errors["details.duration"] = durationErr;
        isValid = false;
      }
    } else if (step === 2) {
      // Step 2: Home details (duration is set in Step 1)
      const bedroomsErr = validateField(
        "details.Bedroom",
        createData.details?.Bedroom,
      );
      const bathroomsErr = validateField(
        "details.Bathroom",
        createData.details?.Bathroom,
      );
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
    } catch {
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
    if (selectedBookings.size === displayBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(displayBookings.map((b) => b._id)));
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
    } catch {
      setStatusMessage({
        type: "error",
        text: "Failed to mark booking as completed",
      });
    } finally {
      setMarkingCompleteId(null);
    }
  };

  const handleQuickStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: `Status updated to ${newStatus}`,
        });
        fetchBookings();
      }
    } catch {
      setStatusMessage({ type: "error", text: "Failed to update status" });
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
      } catch {
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

  const generateBookingInvoice = (b) => {
    const extras = (b.details?.extras || [])
      .map((e) => (typeof e === "string" ? e : e.name || ""))
      .filter(Boolean);
    const extrasRows = extras
      .map(
        (ex) =>
          `<tr><td style="padding:8px 24px;font-size:13px;color:#334155;">${ex}</td><td style="padding:8px 24px;text-align:right;font-size:13px;color:#334155;">—</td></tr>`,
      )
      .join("");
    const total = Number(b.payment?.amount || 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${b.bookingId}</title>
<style>@media print{body{margin:0}}.page{max-width:680px;margin:40px auto;font-family:Arial,sans-serif;color:#1e293b}</style></head>
<body><div class="page">
<div style="background:#0f172a;padding:28px 32px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center;">
<div><p style="margin:0;color:#6ee7b7;font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">Cleaniq Services</p><p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">info@cleaniqservices.com Â· +44 7752 476368</p></div>
<div style="text-align:right"><p style="margin:0;color:#fff;font-size:18px;font-weight:900;">INVOICE</p><p style="margin:4px 0 0;color:#64748b;font-size:12px;">${b.bookingId}</p></div>
</div>
<div style="border:1px solid #e2e8f0;border-top:none;padding:24px 32px;background:#fff;">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
<div><p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Bill To</p>
<p style="margin:0;font-weight:700;font-size:14px;">${b.customer?.firstName || ""} ${b.customer?.lastName || ""}</p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${b.customer?.email || ""}</p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${b.customer?.phone || ""}</p></div>
<div style="text-align:right"><p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Job Date</p>
<p style="margin:0;font-weight:700;font-size:14px;">${b.schedule?.date ? new Date(b.schedule.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${b.schedule?.timeSlot || ""}</p>
<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${b.details?.address || ""}</p></div>
</div>
<table style="width:100%;border-collapse:collapse;">
<thead><tr style="background:#f8fafc;"><th style="padding:10px 24px;text-align:left;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Description</th><th style="padding:10px 24px;text-align:right;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Amount</th></tr></thead>
<tbody>
<tr><td style="padding:12px 24px;font-size:13px;font-weight:600;">${b.service || "Cleaning Service"} — ${b.details?.duration || 1}h${b.details?.frequency && b.details.frequency !== "Once" ? ` (${b.details.frequency})` : ""}</td><td style="padding:12px 24px;text-align:right;font-size:13px;font-weight:600;">£${total.toFixed(2)}</td></tr>
${extrasRows}
</tbody>
<tfoot><tr style="border-top:2px solid #0f172a;"><td style="padding:14px 24px;font-size:15px;font-weight:900;">Total</td><td style="padding:14px 24px;text-align:right;font-size:15px;font-weight:900;">£${total.toFixed(2)}</td></tr></tfoot>
</table>
<div style="margin-top:24px;padding:16px 24px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
<p style="margin:0;font-size:12px;color:#15803d;font-weight:700;">Payment Status: ${b.payment?.status || "Pending"}</p>
<p style="margin:4px 0 0;font-size:11px;color:#64748b;">Thank you for choosing Cleaniq Services. All prices include VAT.</p>
</div>
</div></div>
<script>window.onload=function(){window.print();}</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
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
        (showCancelled || b.status !== "Cancelled") &&
        (b.customer?.firstName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          b.customer?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [bookings, searchTerm, showCancelled]);

  // Collapse recurring groups: show one representative row per recurringGroup
  const displayBookings = useMemo(() => {
    const today = new Date();
    const groups = {};
    for (const b of filteredBookings) {
      const grp = b.meta?.recurringGroup;
      if (!grp) continue;
      if (!groups[grp]) {
        groups[grp] = { best: b, count: 1 };
        continue;
      }
      groups[grp].count++;
      const bDate = new Date(b.schedule?.date);
      const bestDate = new Date(groups[grp].best.schedule?.date);
      if (bDate >= today && (bestDate < today || bDate < bestDate))
        groups[grp].best = b;
    }
    const seen = new Set();
    return filteredBookings.reduce((acc, b) => {
      const grp = b.meta?.recurringGroup;
      if (!grp) {
        acc.push(b);
        return acc;
      }
      if (!seen.has(grp)) {
        seen.add(grp);
        const { best, count } = groups[grp];
        acc.push(count > 1 ? { ...best, _recurringCount: count } : best);
      }
      return acc;
    }, []);
  }, [filteredBookings]);

  const bookingsTotalPages = Math.max(
    1,
    Math.ceil(displayBookings.length / BOOKINGS_PAGE_SIZE),
  );
  const bookingsSafePage = Math.min(bookingsPage, bookingsTotalPages);
  const pageBookings = displayBookings.slice(
    (bookingsSafePage - 1) * BOOKINGS_PAGE_SIZE,
    bookingsSafePage * BOOKINGS_PAGE_SIZE,
  );

  const getStatusColor = (status) => {
    const colors = {
      Confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      Pending: "bg-amber-500/15  text-amber-400  border-amber-500/25",
      Completed: "bg-blue-500/15   text-blue-400   border-blue-500/25",
      "Completed - Unpaid":
        "bg-purple-500/15 text-purple-400 border-purple-500/25",
      Cancelled: "bg-rose-500/15   text-rose-400   border-rose-500/25",
      "In Progress": "bg-violet-500/15 text-violet-400 border-violet-500/25",
      Accepted: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
      Assigned: "bg-cyan-500/15   text-cyan-400   border-cyan-500/25",
      Arrived: "bg-teal-500/15   text-teal-400   border-teal-500/25",
    };
    return colors[status] || "bg-white/[0.06] text-white/50 border-white/10";
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

    // Check details object directly for room properties (admin-created format)
    roomNames.forEach((room) => {
      if (b.details?.[room] && b.details[room] > 0) {
        data[room] = b.details[room];
      }
    });

    // Also check booking.property (customer app format)
    if (b.property) {
      if (!data["Bedroom"] && b.property.bedrooms > 0)
        data["Bedroom"] = b.property.bedrooms;
      if (!data["Bathroom"] && b.property.bathrooms > 0)
        data["Bathroom"] = b.property.bathrooms;
      if (!data["Kitchen"] && b.property.kitchens > 0)
        data["Kitchen"] = b.property.kitchens;
      if (!data["Reception Room"] && b.property.receptionRooms > 0)
        data["Reception Room"] = b.property.receptionRooms;
    }

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
    // Customer app format: details.hasPet = "Yes" | "No"
    if (b.details?.hasPet) return b.details.hasPet;
    // Admin format: stored as string in extras array
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
      b.details?.specialInstructions ||
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

  return (
    <div className="space-y-6 pb-20 relative">
      {/* â"€â"€ CRM MODAL â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      {crmBooking && (
        <AdminCRM booking={crmBooking} onClose={() => setCrmBooking(null)} />
      )}

      {statusMessage.text && (
        <div className="fixed top-6 right-6 z-100 px-6 py-4 rounded-2xl shadow-2xl bg-[#0B2D22] text-white font-semibold text-sm animate-in slide-in-from-right">
          {statusMessage.text}
        </div>
      )}

      {/* ── Stats Summary ───────────────────────────────────────────────────── */}
      {(() => {
        const allReal = bookings.filter(
          (b) =>
            b.status !== "Blackout" && b.customer?.firstName !== "ADMIN_BLOCK",
        );
        const todayStr = new Date().toISOString().split("T")[0];
        const todayCount = allReal.filter(
          (b) =>
            b.schedule?.date &&
            new Date(b.schedule.date).toISOString().split("T")[0] === todayStr,
        ).length;
        const pendingCount = allReal.filter(
          (b) => b.status === "Pending",
        ).length;
        const activeCount = allReal.filter((b) =>
          ["Confirmed", "In Progress", "Accepted"].includes(b.status),
        ).length;
        const completedCount = allReal.filter(
          (b) => b.status === "Completed",
        ).length;
        const totalRevenue = allReal
          .filter((b) => b.status === "Completed")
          .reduce((s, b) => s + Number(b.payment?.amount || 0), 0);
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: "Today",
                val: todayCount,
                sub: "scheduled",
                color: "text-cyan-400",
                dot: "bg-cyan-400",
              },
              {
                label: "Pending",
                val: pendingCount,
                sub: "need action",
                color: "text-amber-400",
                dot: "bg-amber-400",
              },
              {
                label: "Active",
                val: activeCount,
                sub: "in progress",
                color: "text-emerald-400",
                dot: "bg-[#10B981]",
              },
              {
                label: "Completed",
                val: completedCount,
                sub: "all time",
                color: "text-blue-400",
                dot: "bg-blue-400",
              },
              {
                label: "Revenue",
                val: `£${(totalRevenue / 1000).toFixed(1)}k`,
                sub: "earned",
                color: "text-emerald-300",
                dot: "bg-emerald-300",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm shadow-black/20"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                <div>
                  <p
                    className={`text-xl font-black tabular-nums leading-none ${s.color}`}
                  >
                    {s.val}
                  </p>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mt-0.5">
                    {s.label}
                  </p>
                  <p className="text-[9px] font-medium text-white/20">
                    {s.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Bookings
          </h1>
          <p className="text-sm text-white/35 font-medium mt-0.5">
            {bookings.filter((b) => b.status !== "Blackout").length} total
            bookings · manage and track all jobs
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm font-bold text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
          >
            <Download size={15} /> CSV
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm font-bold text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
            title="Export bookings & leads to Excel"
          >
            <Download size={15} /> Excel
          </button>
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] text-white border border-[#10B981] hover:bg-[#059669] transition-all font-black text-sm shadow-md shadow-[#10B981]/20"
            >
              + New Booking
              <ChevronDown
                size={15}
                className={`transition-transform ${showCreateMenu ? "rotate-180" : ""}`}
              />
            </button>
            {showCreateMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCreateMenu(false)}
                />
                <div
                  className="absolute right-0 z-50 mt-2 w-72 bg-[#0B2D22] border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden"
                  style={{ minWidth: "17rem" }}
                >
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      navigate("/admin/bookings/new");
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-white/[0.05] transition-all"
                  >
                    <p className="text-sm font-black text-white/85">
                      Create Booking
                    </p>
                    <p className="text-[11px] text-white/35 mt-0.5 font-medium">
                      Standard flow — payment link / bank details emailed
                    </p>
                  </button>
                  <div className="h-px bg-white/[0.06]" />
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      navigate("/admin/bookings/new", {
                        state: { noPaymentRequired: true },
                      });
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-emerald-500/10 transition-all"
                  >
                    <p className="text-sm font-black text-emerald-400">
                      Create Booking (non pay)
                    </p>
                    <p className="text-[11px] text-white/35 mt-0.5 font-medium">
                      Already paid — no Stripe link or email sent
                    </p>
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={fetchBookings}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70 transition-all"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl shadow-sm shadow-black/20 overflow-hidden animate-in fade-in">
        <div className="p-5 border-b border-white/[0.07] flex items-center gap-3 justify-between flex-wrap">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.05] rounded-xl border border-white/10 flex-1 min-w-60 focus-within:border-emerald-500/40 transition-all">
            <Search size={16} className="text-white/25" />
            <input
              type="text"
              placeholder="Search by name or booking ID…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setBookingsPage(1);
              }}
              className="bg-transparent outline-none text-sm font-medium w-full text-white/70 placeholder:text-white/20"
            />
          </div>
          <button
            onClick={() => setShowCancelled((v) => !v)}
            className={`px-4 py-2 rounded-xl border text-sm font-black transition-all flex items-center gap-2 ${showCancelled ? "bg-rose-500/15 border-rose-500/25 text-rose-400" : "bg-white/[0.05] border-white/10 text-white/40 hover:border-white/20"}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${showCancelled ? "bg-rose-500" : "bg-white/20"}`}
            />
            {showCancelled ? "Hide Cancelled" : "Show Cancelled"}
          </button>
          {selectedBookings.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 text-rose-400 font-black transition-all flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} />
              Delete ({selectedBookings.size})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-white/25 uppercase tracking-[0.15em] bg-white/[0.03] border-b border-white/[0.06]">
                <th className="px-4 py-3.5 w-12">
                  <input
                    type="checkbox"
                    checked={
                      pageBookings.length > 0 &&
                      pageBookings.every((b) => selectedBookings.has(b._id))
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-2 border-white/20 cursor-pointer accent-emerald-500"
                  />
                </th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Service</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Worker</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw
                        size={20}
                        className="text-white/20 animate-spin"
                      />
                      <span className="text-sm font-bold text-white/25">
                        Loading bookings…
                      </span>
                    </div>
                  </td>
                </tr>
              ) : displayBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <p className="text-sm font-bold text-white/20">
                      No bookings match your search
                    </p>
                    <p className="text-[11px] text-white/15 mt-1">
                      Try a different name or booking ID
                    </p>
                  </td>
                </tr>
              ) : (
                pageBookings.map((b) => (
                  <tr
                    key={b._id}
                    onClick={() => {
                      setSelectedBooking(b);
                      setEditData(b);
                      setIsEditing(false);
                    }}
                    className={`group hover:bg-white/[0.04] transition-colors cursor-pointer ${
                      selectedBookings.has(b._id) ? "bg-emerald-500/[0.08]" : ""
                    }`}
                  >
                    <td className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedBookings.has(b._id)}
                        onChange={() => toggleBookingSelection(b._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-2 border-white/20 cursor-pointer accent-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-black text-emerald-400">
                            {(
                              (b.customer?.firstName?.[0] || "") +
                              (b.customer?.lastName?.[0] || "")
                            ).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-white/85 text-sm">
                            {b.customer?.firstName} {b.customer?.lastName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-white/30 font-bold tabular-nums">
                              {b.bookingId}
                            </p>
                            {b._recurringCount > 1 && (
                              <span className="text-[9px] font-black bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide border border-violet-500/25">
                                Recurring Â· {b._recurringCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-white/70">
                        {b.service}
                      </p>
                      <p className="text-[10px] text-emerald-400/70 font-bold mt-0.5">
                        {getPropertyData(b)["Bedroom"] || 0} Bed ·{" "}
                        {b.details?.duration || 0}h
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-black uppercase text-white/30 bg-white/[0.05] border border-white/10 px-1.5 py-0.5 rounded-full">
                        {b.leadSource || "Organic"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-white/70 tabular-nums">
                        {new Date(b.schedule?.date).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                      <p className="text-[10px] text-white/35 font-bold mt-0.5">
                        {b.schedule?.timeSlot === "Flexible"
                          ? fmtTimeRange(b) || b.schedule?.timeSlot
                          : b.schedule?.timeSlot}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {b.assignedWorkerName ? (
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          {b.assignedWorkerName}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-white/20 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={b.status}
                        onChange={(e) =>
                          handleQuickStatusChange(b._id, e.target.value)
                        }
                        className={`px-2.5 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wide cursor-pointer appearance-none bg-transparent ${getStatusColor(b.status)}`}
                      >
                        {[
                          "Pending",
                          "Confirmed",
                          "Assigned",
                          "Arrived",
                          "In Progress",
                          "Completed",
                          "Completed - Unpaid",
                          "Cancelled",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setOpenActionMenu(
                                openActionMenu === b._id ? null : b._id,
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] text-white/45 hover:bg-white/10 hover:text-white/80 transition-all text-[11px] font-black border border-white/10"
                          >
                            Actions <ChevronDown size={13} />
                          </button>
                          {openActionMenu === b._id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenActionMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 z-50 bg-[#0B2D22] rounded-2xl shadow-2xl shadow-black/40 border border-white/[0.08] py-1.5 min-w-[185px] overflow-hidden">
                                <button
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setEditData(b);
                                    setIsEditing(false);
                                    setOpenActionMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-black text-white/65 hover:bg-white/[0.05] hover:text-white transition-colors text-left"
                                >
                                  <Eye size={14} className="text-white/30" />{" "}
                                  View Details
                                </button>
                                <Link
                                  to={`/admin/jobs/${b._id}`}
                                  onClick={() => setOpenActionMenu(null)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-black text-white/65 hover:bg-white/[0.05] hover:text-white transition-colors text-left"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-emerald-400"
                                  >
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Job Sheet
                                </Link>
                                <button
                                  onClick={() => {
                                    setCrmBooking(b);
                                    setOpenActionMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-black text-white/65 hover:bg-white/[0.05] hover:text-white transition-colors text-left"
                                >
                                  <Sparkles
                                    size={14}
                                    className="text-emerald-400"
                                  />{" "}
                                  CRM Actions
                                </button>
                                {b.status !== "Completed" &&
                                  b.status !== "Cancelled" && (
                                    <button
                                      disabled={markingCompleteId === b._id}
                                      onClick={() => {
                                        handleMarkCompleted(b);
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-black text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left disabled:opacity-40"
                                    >
                                      <CheckCircle2
                                        size={14}
                                        className="text-emerald-400"
                                      />{" "}
                                      Mark Complete
                                    </button>
                                  )}
                                <div className="border-t border-white/[0.06] my-1" />
                                <button
                                  onClick={() => {
                                    handleDelete(b._id, b.bookingId);
                                    setOpenActionMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-black text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && displayBookings.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/[0.07] flex items-center justify-between gap-3 bg-white/[0.02]">
            <p className="text-xs text-white/40 font-medium">
              {displayBookings.length} booking
              {displayBookings.length !== 1 ? "s" : ""}
              {selectedBookings.size > 0
                ? ` Â· ${selectedBookings.size} selected`
                : ""}{" "}
              Â· Page {bookingsSafePage} of {bookingsTotalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                disabled={bookingsSafePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {(() => {
                const range = [];
                for (
                  let i = Math.max(1, bookingsSafePage - 2);
                  i <= Math.min(bookingsTotalPages, bookingsSafePage + 2);
                  i++
                )
                  range.push(i);
                return range.map((p) => (
                  <button
                    key={p}
                    onClick={() => setBookingsPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      p === bookingsSafePage
                        ? "bg-emerald-500 text-white"
                        : "border border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                ));
              })()}
              <button
                onClick={() =>
                  setBookingsPage((p) => Math.min(bookingsTotalPages, p + 1))
                }
                disabled={bookingsSafePage === bookingsTotalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="relative w-full max-w-4xl bg-[#071E16] rounded-[28px] shadow-2xl shadow-black/60 overflow-hidden border border-white/[0.08] flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-white/[0.07] flex flex-wrap justify-between items-center gap-3 bg-[#0B2D22] shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 bg-emerald-500/20 border border-emerald-500/25 rounded-2xl flex items-center justify-center shrink-0">
                  <Hash size={18} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white tracking-tight truncate">
                    {isEditing ? "Edit Booking" : "Booking Details"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest tabular-nums">
                      {selectedBooking.bookingId}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wide ${getStatusColor(selectedBooking.status)}`}
                    >
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {!isEditing &&
                  selectedBooking.status !== "Completed" &&
                  selectedBooking.status !== "Cancelled" && (
                    <button
                      disabled={markingCompleteId === selectedBooking._id}
                      onClick={() => handleMarkCompleted(selectedBooking)}
                      title="Mark the job as done — captures any authorized payment and emails the customer their receipt"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black transition-all disabled:opacity-60 shadow-sm shadow-emerald-500/25"
                    >
                      <CheckCircle2 size={15} />
                      {markingCompleteId === selectedBooking._id
                        ? "Completing…"
                        : "Mark Completed"}
                    </button>
                  )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/40 hover:bg-rose-500/15 hover:text-rose-400 transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-[#071E16]">
              {isEditing ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
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
                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
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
                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
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
                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
                        Status
                      </label>
                      <select
                        value={editData.status}
                        onChange={(e) =>
                          setEditData({ ...editData, status: e.target.value })
                        }
                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Completed - Unpaid">
                          Completed - Unpaid
                        </option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-4">
                    <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">
                      Pricing & Logistics
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
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
                            className="w-full p-4 pl-10 rounded-2xl bg-white/5 border border-white/10 font-bold text-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
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
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
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
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg"
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
                          <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-4 md:col-span-2">
                            <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">
                              Schedule
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <label className="text-[9px] font-bold text-white/40 ml-1 uppercase block mb-2">
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
                                <label className="text-[9px] font-bold text-white/40 ml-1 uppercase block">
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
                                              ? "border-rose-500/30 bg-rose-500/15 text-rose-400 cursor-not-allowed opacity-50"
                                              : "border-white/10 bg-white/5 text-white/70 hover:border-primary/50"
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
                                  <label className="text-[9px] font-bold text-white/40 ml-1 uppercase block mb-2">
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
                                      let bookedRanges = [];
                                      if (editDateStr) {
                                        const bookingsOnDate = bookings.filter(
                                          (b) => {
                                            if (b._id === selectedBooking?._id)
                                              return false;
                                            if (!b.schedule?.date) return false;
                                            const d = new Date(b.schedule.date);
                                            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                            return dStr === editDateStr;
                                          },
                                        );
                                        bookedRanges =
                                          buildBookedRanges(bookingsOnDate);
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
                                        const isBooked = overlapsExistingRange(
                                          time,
                                          editData.details?.duration ||
                                            editData.workerDuration ||
                                            1,
                                          bookedRanges,
                                        );
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
                                                  ? "border-rose-500/30 bg-rose-500/15 text-rose-400 cursor-not-allowed opacity-50"
                                                  : "border-white/10 bg-white/5 text-white/70 hover:border-primary/50"
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
                                    className="w-full p-3 rounded-xl bg-white/5 border-2 border-white/10 text-white font-bold text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-4">
                    <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">
                      Address & Contact
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
                          Address
                        </label>
                        <input
                          type="text"
                          value={editData.details?.address || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                address: e.target.value,
                              },
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
                          Postcode
                        </label>
                        <input
                          type="text"
                          value={editData.details?.postcode || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                postcode: e.target.value,
                              },
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editData.customer?.email || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              customer: {
                                ...editData.customer,
                                email: e.target.value,
                              },
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-4">
                    <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">
                      Job Details
                    </h4>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
                          Frequency
                        </label>
                        <select
                          value={editData.details?.frequency || "Once"}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                frequency: e.target.value,
                              },
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                        >
                          <option value="Once">Once</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Bi-weekly">Bi-weekly</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
                          Duration (hours)
                        </label>
                        <input
                          type="number"
                          value={editData.details?.duration || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              details: {
                                ...editData.details,
                                duration: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
                          Supplies Provided By
                        </label>
                        <select
                          value={editData.suppliesProvidedBy || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              suppliesProvidedBy: e.target.value,
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                        >
                          <option value="">Not specified</option>
                          <option value="Cleaniq">Cleaniq</option>
                          <option value="Customer">Customer</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1 pt-2">
                      <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
                        Extra Services & Add-ons
                      </label>
                      {/* Quick-add chips from catalogue */}
                      {extraServicesList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-1 pb-2">
                          {extraServicesList.slice(0, 12).map((svc) => {
                            const currentExtras =
                              editData.details?.extras || [];
                            const alreadyAdded = currentExtras.some((e) =>
                              (typeof e === "string" ? e : e.name || "")
                                .toLowerCase()
                                .includes(svc.name.toLowerCase()),
                            );
                            return (
                              <button
                                key={svc._id || svc.name}
                                type="button"
                                onClick={() => {
                                  const extras = [
                                    ...(editData.details?.extras || []),
                                  ];
                                  if (alreadyAdded) {
                                    const idx = extras.findIndex((e) =>
                                      (typeof e === "string" ? e : e.name || "")
                                        .toLowerCase()
                                        .includes(svc.name.toLowerCase()),
                                    );
                                    extras.splice(idx, 1);
                                  } else {
                                    extras.push(
                                      svc.name +
                                        (svc.rate
                                          ? ` — £${Number(svc.rate).toFixed(2)}`
                                          : ""),
                                    );
                                  }
                                  setEditData({
                                    ...editData,
                                    details: { ...editData.details, extras },
                                  });
                                }}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                                  alreadyAdded
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white/5 text-white/70 border-white/20 hover:border-primary hover:text-primary"
                                }`}
                              >
                                {alreadyAdded ? "✓" : "+"} {svc.name}
                                {svc.rate && (
                                  <span className="opacity-70 ml-1">
                                    £{Number(svc.rate).toFixed(0)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <textarea
                        value={(editData.details?.extras || [])
                          .map((e) =>
                            typeof e === "string" ? e : e.name || "",
                          )
                          .join("\n")}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            details: {
                              ...editData.details,
                              extras: e.target.value
                                .split("\n")
                                .map((line) => line.trim())
                                .filter(Boolean),
                            },
                          })
                        }
                        placeholder="e.g. Oven Clean (x1)&#10;Parking: Available on-site&#10;Entry: I will be home"
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs h-24 resize-none"
                      />
                      <p className="text-[10px] text-white/40 ml-4">
                        Click an add-on above or type below — one item per line.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-4">
                    <label className="text-[9px] font-bold text-white/40 ml-4 uppercase">
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
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs h-24 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* â"€â"€ Recurring series overview â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
                  {selectedBooking.meta?.recurringGroup &&
                    (() => {
                      const siblings = bookings
                        .filter(
                          (b) =>
                            b.meta?.recurringGroup ===
                            selectedBooking.meta.recurringGroup,
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.schedule?.date) -
                            new Date(b.schedule?.date),
                        );
                      if (siblings.length <= 1) return null;

                      const deleteFromSeries = async (sib, e) => {
                        e.stopPropagation();
                        if (
                          !window.confirm(
                            `Delete this booking (${new Date(sib.schedule?.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})?`,
                          )
                        )
                          return;
                        try {
                          const res = await fetch(
                            `${import.meta.env.VITE_API_URL}/bookings/${sib._id}`,
                            { method: "DELETE" },
                          );
                          if (!res.ok) throw new Error("Delete failed");
                          // If we just deleted the one being viewed, switch to the next sibling
                          if (sib._id === selectedBooking._id) {
                            const remaining = siblings.filter(
                              (s) => s._id !== sib._id,
                            );
                            if (remaining.length > 0) {
                              setSelectedBooking(remaining[0]);
                              setEditData(remaining[0]);
                            } else setSelectedBooking(null);
                          }
                          fetchBookings();
                        } catch {
                          setStatusMessage({
                            type: "error",
                            text: "Failed to delete booking",
                          });
                        }
                      };

                      return (
                        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 overflow-hidden">
                          <div className="px-5 py-3 bg-violet-500/15 flex items-center gap-2">
                            <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">
                              Recurring Series
                            </span>
                            <span className="text-[9px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-bold border border-violet-500/25">
                              {siblings.length} bookings
                            </span>
                          </div>
                          <div className="divide-y divide-violet-500/15 max-h-60 overflow-y-auto">
                            {siblings.map((sib) => (
                              <div
                                key={sib._id}
                                className={`flex items-center gap-3 px-5 py-3 ${sib._id === selectedBooking._id ? "bg-violet-500/15" : "hover:bg-white/[0.04] cursor-pointer"}`}
                                onClick={() => {
                                  if (sib._id !== selectedBooking._id) {
                                    setSelectedBooking(sib);
                                    setEditData(sib);
                                    setIsEditing(false);
                                  }
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white/70">
                                    {new Date(
                                      sib.schedule?.date,
                                    ).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                  <p className="text-[10px] text-white/40 font-medium">
                                    {sib.schedule?.timeSlot}
                                  </p>
                                </div>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${getStatusColor(sib.status)}`}
                                >
                                  {sib.status}
                                </span>
                                {sib.assignedWorkerName && (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold hidden sm:inline">
                                    {sib.assignedWorkerName}
                                  </span>
                                )}
                                {sib._id === selectedBooking._id ? (
                                  <span className="text-[9px] font-black text-violet-400 uppercase tracking-wide shrink-0">
                                    Viewing
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-violet-400 uppercase tracking-wide shrink-0">
                                    Open
                                  </span>
                                )}
                                <button
                                  onClick={(e) => deleteFromSeries(sib, e)}
                                  className="p-1 rounded-lg text-white/30 hover:bg-rose-500/15 hover:text-rose-400 transition-colors shrink-0 ml-1"
                                  title="Delete this booking from series"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-white/4 border border-white/[0.07] text-center">
                      <Mail
                        size={20}
                        className="text-emerald-400 mx-auto mb-2"
                      />
                      <p className="text-[9px] font-bold text-white/40 uppercase mb-1">
                        Email
                      </p>
                      <p className="text-xs font-bold text-white/85 truncate">
                        {selectedBooking.customer?.email}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/4 border border-white/[0.07] text-center">
                      <Phone
                        size={20}
                        className="text-emerald-400 mx-auto mb-2"
                      />
                      <p className="text-[9px] font-bold text-white/40 uppercase mb-1">
                        Contact
                      </p>
                      <p className="text-xs font-bold text-white/85">
                        {selectedBooking.customer?.phone}
                      </p>
                    </div>
                    <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 text-center relative group">
                      <DollarSign
                        size={20}
                        className="text-emerald-400 mx-auto mb-2"
                      />
                      <p className="text-[9px] font-bold text-white/40 uppercase mb-1">
                        Payment
                      </p>
                      <p className="text-xs font-bold text-white/85">
                        {selectedBooking.payment?.currency === "GBP"
                          ? "£"
                          : "â‚¦"}
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
                                alert("âœ… Payment confirmed!");
                                fetchBookings();
                              }
                            } catch (err) {
                              console.error("Failed to confirm payment:", err);
                              alert("âŒ Failed to confirm payment");
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
                    <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-emerald-500/15">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <User size={24} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-widest">
                              Assigned Worker
                            </p>
                            <p className="text-sm font-bold text-white/85">
                              {selectedBooking.assignedWorker?.firstName
                                ? `${selectedBooking.assignedWorker.firstName} ${selectedBooking.assignedWorker.lastName}`
                                : selectedBooking.assignedWorkerName}
                            </p>
                          </div>
                        </div>

                        {selectedBooking.assignedWorker && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wide">
                                Phone
                              </p>
                              <p className="text-xs font-bold text-white/75">
                                {selectedBooking.assignedWorker.phone}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wide">
                                Email
                              </p>
                              <p
                                className="text-xs font-bold text-white/75 truncate"
                                title={selectedBooking.assignedWorker.email}
                              >
                                {selectedBooking.assignedWorker.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wide">
                                Worker ID
                              </p>
                              <p className="text-xs font-bold text-white/75">
                                {selectedBooking.assignedWorker.workerId}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wide">
                                Region
                              </p>
                              <p className="text-xs font-bold text-white/75">
                                {selectedBooking.assignedWorker.region}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wide">
                                Assigned Rate
                              </p>
                              <p className="text-xs font-bold text-white/75">
                                £{selectedBooking.workerRate || 0}/hr
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wide">
                                Expected Hours
                              </p>
                              <p className="text-xs font-bold text-white/75">
                                {selectedBooking.workerDuration || 0} hrs
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Cleaner Progress Timeline */}
                      <div className="w-full md:w-80 bg-white/[0.05] backdrop-blur-sm p-5 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                        <h5 className="text-[10px] font-bold text-white/75 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Live Cleaner Progress
                        </h5>

                        <div className="space-y-4 relative pl-3 border-l-2 border-white/10">
                          {/* Step 1: Arrived */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                selectedBooking.jobArrivedTime
                                  ? "bg-emerald-500 border-[#10B981]/30"
                                  : "bg-white/5 border-white/20"
                              }`}
                            />
                            <p className="text-xs font-bold text-white/85">
                              Arrived at Customer
                            </p>
                            <p className="text-[10px] text-white/40 font-medium">
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
                                  ? "bg-emerald-500 border-[#10B981]/30"
                                  : "bg-white/5 border-white/20"
                              }`}
                            />
                            <p className="text-xs font-bold text-white/85">
                              Cleaning Commenced
                            </p>
                            <p className="text-[10px] text-white/40 font-medium">
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
                                  ? "bg-emerald-500 border-[#10B981]/30"
                                  : "bg-white/5 border-white/20"
                              }`}
                            />
                            <p className="text-xs font-bold text-white/85">
                              Cleaning Finished
                            </p>
                            <p className="text-[10px] text-white/40 font-bold">
                              {selectedBooking.jobEndTime
                                ? `Done: ${selectedBooking.jobDurationActual || 0} mins actual clean`
                                : "Awaiting completion..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* â"€â"€ Worker Submission: Photos & Report â"€â"€ */}
                  {(selectedBooking.photos?.length > 0 ||
                    selectedBooking.workerReport) && (
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                      <h5 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Camera size={14} /> Worker Job Submission
                      </h5>

                      {/* Photos grouped by type */}
                      {selectedBooking.photos?.length > 0 &&
                        (() => {
                          const groups = {
                            before: [],
                            after: [],
                            damage: [],
                            other: [],
                          };
                          selectedBooking.photos.forEach((p) => {
                            (groups[p.photoType] || groups.other).push(p);
                          });
                          const labels = {
                            before: "Before",
                            after: "After",
                            damage: "Damage",
                            other: "Other",
                          };
                          const colors = {
                            before:
                              "bg-amber-500/15 text-amber-400 border-amber-500/25",
                            after:
                              "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
                            damage:
                              "bg-rose-500/15 text-rose-400 border-rose-500/25",
                            other: "bg-white/5 text-white/70 border-white/10",
                          };
                          return (
                            <div className="space-y-4 mb-4">
                              {Object.entries(groups)
                                .filter(([, arr]) => arr.length > 0)
                                .map(([type, photos]) => (
                                  <div key={type}>
                                    <p
                                      className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full border mb-2 ${colors[type]}`}
                                    >
                                      {labels[type]} — {photos.length} photo
                                      {photos.length > 1 ? "s" : ""}
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                      {photos.map((p, i) => (
                                        <a
                                          key={i}
                                          href={`https://api.cleaniqservices.com/${p.url}`}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <img
                                            src={`https://api.cleaniqservices.com/${p.url}`}
                                            alt={`${type}-${i}`}
                                            className="w-24 h-24 rounded-2xl object-cover border border-white/10 hover:opacity-90 transition-opacity"
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          );
                        })()}

                      {/* Written report */}
                      {selectedBooking.workerReport && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                          <p className="text-[10px] font-bold text-white/40 uppercase mb-2 flex items-center gap-1">
                            <FileText size={12} /> Worker Report
                          </p>
                          <p className="text-sm text-white/70 leading-relaxed">
                            {selectedBooking.workerReport}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mt-1 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                            Full Address
                          </h4>
                          <p className="font-bold text-white/85 leading-tight">
                            {selectedBooking.details?.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                            Booking Date
                          </h4>
                          <p className="font-bold text-white/85">
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
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                            Duration & Arrival Timing
                          </h4>
                          <p className="font-bold text-white/85">
                            {selectedBooking.details?.duration || 0}h Clean (
                            {selectedBooking.service})
                          </p>
                          <p className="text-[11px] font-bold text-white/60 uppercase mt-1">
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
                            Arrival â†’ Finish:{" "}
                            {fmtTimeRange(selectedBooking) ||
                              getPreferredTime(selectedBooking) ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                          <Info size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                            Customer Notes / Instructions
                          </h4>
                          <p className="text-xs font-bold text-white/60 leading-relaxed italic">
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
                        <div className="p-6 bg-indigo-500/10 rounded-[24px] border-2 border-indigo-500/25 space-y-4">
                          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <HomeIcon size={16} className="text-indigo-400" />
                            Property Rooms
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {Object.entries(
                              getPropertyData(selectedBooking),
                            ).map(([key, qty]) =>
                              qty > 0 ? (
                                <div
                                  key={key}
                                  className="bg-white/5 rounded-lg border-2 border-indigo-500/25 p-3 text-center hover:shadow-md transition-shadow"
                                >
                                  <p className="text-[10px] font-bold text-indigo-400">
                                    {qty}x
                                  </p>
                                  <p className="text-[9px] font-bold text-white/70 mt-1 line-clamp-2">
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
                        <div className="p-6 bg-rose-500/10 rounded-[24px] border-2 border-rose-500/25 space-y-4">
                          <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={16} className="text-rose-400" /> Extra
                            Services
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(getExtrasData(selectedBooking)).map(
                              ([name, qty]) => (
                                <div
                                  key={name}
                                  className="bg-white/5 rounded-lg border-2 border-rose-500/25 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-white">
                                      {name}
                                    </p>
                                    <p className="text-xs text-white/70 font-semibold">
                                      Qty: {qty}
                                    </p>
                                  </div>
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-rose-500 text-white rounded-full text-xs font-bold">
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
                              ? "bg-amber-500/15 border-amber-500/30"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <span className="text-2xl">
                            {getPetInfo(selectedBooking) === "Yes"
                              ? "🐶"
                              : "🚫"}
                          </span>
                          <div>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                              Pet on Premises
                            </p>
                            <p
                              className={`font-bold text-sm ${getPetInfo(selectedBooking) === "Yes" ? "text-amber-400" : "text-white/60"}`}
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

                  {/* Worker Before & After Photos */}
                  {(selectedBooking.photos?.before ||
                    selectedBooking.photos?.after) && (
                    <div>
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Camera size={14} /> Worker Photos
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedBooking.photos?.before && (
                          <div>
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                              Before
                            </p>
                            <img
                              src={selectedBooking.photos.before}
                              alt="Before clean"
                              className="w-full rounded-2xl object-cover border border-white/10"
                              style={{ aspectRatio: "4/3" }}
                            />
                          </div>
                        )}
                        {selectedBooking.photos?.after && (
                          <div>
                            <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-2">
                              After
                            </p>
                            <img
                              src={selectedBooking.photos.after}
                              alt="After clean"
                              className="w-full rounded-2xl object-cover border border-white/10"
                              style={{ aspectRatio: "4/3" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] bg-[#0B2D22] flex gap-3 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="py-3 px-5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-black text-white/50 uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => generateBookingInvoice(editData)}
                    title="Generate invoice PDF"
                    className="py-3 px-5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-black text-white/60 uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"
                  >
                    <FileText size={14} /> Invoice
                  </button>
                  <button
                    onClick={() => handleUpdate()}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-widest shadow-sm shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <Save size={15} /> Save Changes
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
                    className="flex-1 py-3 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs font-black uppercase tracking-widest hover:bg-rose-500/25 transition-all"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-widest shadow-sm shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit3 size={15} /> Edit Booking
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
          <div className="relative w-full max-w-md bg-[#0B2D22] rounded-[28px] overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-[#0D3527] border-b border-white/[0.07] px-6 py-5 flex items-center justify-between">
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
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-3">
                  Current Booking Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-white/40 font-bold">Original Hours:</p>
                    <p className="text-cyan-400 font-black text-lg tabular-nums">
                      {selectedBooking.details?.duration || 0}h
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 font-bold">Current Total:</p>
                    <p className="text-cyan-400 font-black text-lg tabular-nums">
                      {(selectedBooking.details?.additionalHoursPurchased ||
                        0) + (selectedBooking.details?.duration || 0)}
                      h
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Hours Input */}
              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 block">
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
                  className="w-full p-3 rounded-xl bg-white/5 border-2 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-white/40"
                />
              </div>

              {/* Hourly Rate Input */}
              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 block">
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
                  className="w-full p-3 rounded-xl bg-white/5 border-2 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-white/40"
                />
              </div>

              {/* Calculate Total */}
              {additionalHoursForm.hours && additionalHoursForm.hourlyRate && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-2">
                    💰 Payment Amount
                  </p>
                  <p className="text-3xl font-bold text-emerald-400">
                    £
                    {(
                      parseFloat(additionalHoursForm.hours || 0) *
                      parseFloat(additionalHoursForm.hourlyRate || 0)
                    ).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-emerald-400/70 font-bold mt-1">
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
                        `âœ… Payment link sent to ${selectedBooking.customer.email}!\n\nAmount: £${data.additionalAmount.toFixed(2)}`,
                      );
                      setShowAdditionalHoursModal(false);
                    } else {
                      alert(
                        "âœ… Payment link created, but email failed to send",
                      );
                    }
                  } catch (error) {
                    console.error("Error:", error);
                    alert(`âŒ ${error.message}`);
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
                className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-400 disabled:opacity-30 text-white text-xs font-black uppercase tracking-widest shadow-sm shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
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
              setCreateFlatAmount("");
              setSkipConfirmationEmail(false);
            }}
          />
          <div className="relative w-full max-w-7xl bg-[#0B2D22] rounded-[32px] overflow-hidden shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] overflow-y-auto max-h-[92vh] border border-white/10 animate-in fade-in zoom-in-95">
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-r from-primary via-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex items-center justify-between overflow-hidden">
              <div className="absolute -top-16 -right-10 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 left-1/3 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-2xl shadow-inner">
                    <Plus size={24} className="text-white" />
                  </div>
                  New Booking
                  {noPaymentRequired && (
                    <span className="bg-[#10B981] text-[#10B981]-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                      Non Pay
                    </span>
                  )}
                </h3>
                <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mt-2">
                  Step {createStep} of 4 •{" "}
                  {noPaymentRequired
                    ? skipConfirmationEmail
                      ? "Already paid — no email will be sent"
                      : "Already paid — confirmation email only, no payment link"
                    : "Create and assign a cleaning service"}
                </p>
                {noPaymentRequired && (
                  <label className="relative z-10 flex items-center gap-2 mt-3 text-white/90 text-[11px] font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={skipConfirmationEmail}
                      onChange={(e) =>
                        setSkipConfirmationEmail(e.target.checked)
                      }
                      className="w-4 h-4 rounded accent-emerald-400"
                    />
                    Don't send a confirmation email for this booking
                  </label>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNoPaymentRequired(false);
                  setCreateFlatAmount("");
                  setSkipConfirmationEmail(false);
                }}
                className="relative z-10 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-4 sm:px-6 lg:px-10 pt-6 bg-white/5/60">
              <div className="flex items-center gap-3">
                {[
                  { step: 1, icon: <MapPin size={18} /> },
                  { step: 2, icon: <HomeIcon size={18} /> },
                  { step: 3, icon: <Zap size={18} /> },
                  { step: 4, icon: <DollarSign size={18} /> },
                ].map(({ step, icon }) => (
                  <div key={step} className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-11 h-11 rounded-2xl font-bold text-sm flex items-center justify-center transition-all duration-300 ${
                        step < createStep
                          ? "bg-primary text-white shadow-lg"
                          : step === createStep
                            ? "bg-primary text-white shadow-lg scale-110 ring-4 ring-primary/20"
                            : "bg-white/5 text-white/30 border-2 border-white/10"
                      }`}
                    >
                      {step < createStep ? <CheckCircle2 size={20} /> : icon}
                    </div>
                    {step < 4 && (
                      <div
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          step < createStep ? "bg-primary" : "bg-white/15"
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
                            ? "text-white/60"
                            : "text-white/30"
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
                <div className="bg-[#071D16] p-6 sm:p-8 rounded-[28px] border border-white/10">
                  {/* Step content */}
                  {createStep === 1 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-white/10">
                        <h4 className="text-2xl font-bold text-white/85 flex items-center gap-3">
                          <MapPin size={24} className="text-primary" />
                          Cleaning Location
                        </h4>
                        <p className="text-[11px] text-white/60 uppercase tracking-widest mt-2 font-bold">
                          Where and what type of cleaning?
                        </p>
                      </div>

                      {/* Billing Type */}
                      <div className="p-5 bg-[#071D16] rounded-2xl border-2 border-white/10 space-y-4">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                          💷 Billing Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleFieldChange("payment.billingType", "hourly")
                            }
                            className={`flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                              (createData.payment?.billingType || "hourly") ===
                              "hourly"
                                ? "border-primary bg-primary text-white shadow-lg scale-[1.02]"
                                : "border-white/10 bg-white/5 text-white/70 hover:border-primary/50"
                            }`}
                          >
                            <Clock size={18} />
                            <span className="text-xs font-bold uppercase">
                              Hourly Rate
                            </span>
                            <span
                              className={`text-[10px] ${(createData.payment?.billingType || "hourly") === "hourly" ? "text-white/70" : "text-white/40"}`}
                            >
                              Priced by duration
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleFieldChange("payment.billingType", "flat")
                            }
                            className={`flex flex-col items-center gap-1 py-4 px-3 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                              createData.payment?.billingType === "flat"
                                ? "border-primary bg-primary text-white shadow-lg scale-[1.02]"
                                : "border-white/10 bg-white/5 text-white/70 hover:border-primary/50"
                            }`}
                          >
                            <DollarSign size={18} />
                            <span className="text-xs font-bold uppercase">
                              Flat Rate
                            </span>
                            <span
                              className={`text-[10px] ${createData.payment?.billingType === "flat" ? "text-white/70" : "text-white/40"}`}
                            >
                              One fixed price
                            </span>
                          </button>
                        </div>

                        {createData.payment?.billingType === "flat" ? (
                          <>
                            <div>
                              <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">
                                Fixed Price for This Job
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">
                                  £
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={createFlatAmount}
                                  onChange={(e) =>
                                    setCreateFlatAmount(e.target.value)
                                  }
                                  className="w-full pl-7 p-3 rounded-xl bg-white/5 border-2 border-white/10 text-white placeholder:text-white/20 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                />
                              </div>
                              <p className="text-[10px] text-white/40 mt-1.5">
                                Overrides the hourly calculation — customer pays
                                this once. No hourly duration is needed for
                                flat-rate jobs.
                              </p>
                            </div>
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                              <span className="text-amber-500">🔇</span>
                              <p className="text-[11px] font-bold text-amber-400">
                                No confirmation email is sent automatically for
                                flat-rate bookings. Send the invoice yourself
                                from the booking's CRM actions (âœ¨) whenever
                                you're ready.
                              </p>
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">
                              â±ï¸ Hours{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-1 mb-2 bg-white/5 rounded-xl border border-white/10">
                              {Array.from({ length: 50 }, (_, i) => i + 1).map(
                                (hours) => (
                                  <button
                                    key={hours}
                                    type="button"
                                    onClick={() =>
                                      handleFieldChange(
                                        "details.duration",
                                        hours,
                                      )
                                    }
                                    className={`py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                                      createData.details.duration === hours
                                        ? "border-primary bg-primary text-white shadow-sm"
                                        : "border-white/10 bg-white/5 text-white/70 hover:border-primary/50"
                                    }`}
                                  >
                                    {hours}
                                  </button>
                                ),
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="50"
                                step="1"
                                placeholder="Or type a custom number"
                                value={createData.details.duration || ""}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  handleFieldChange(
                                    "details.duration",
                                    Number.isNaN(val)
                                      ? 0
                                      : Math.min(50, Math.max(1, val)),
                                  );
                                }}
                                className={`w-full p-3 rounded-xl bg-white/5 border-2 transition-all text-sm text-white font-bold focus:outline-none focus:ring-2 ${
                                  formErrors["details.duration"]
                                    ? "border-rose-400 focus:ring-rose-500/30 focus:border-rose-500"
                                    : "border-white/10 focus:ring-primary/30 focus:border-primary"
                                }`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                hours
                              </span>
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5">
                              Any custom duration from 1 to 50 hours — drives
                              the price automatically.
                            </p>
                            {formErrors["details.duration"] && (
                              <p className="text-rose-500 text-[10px] font-bold mt-1.5">
                                {formErrors["details.duration"]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Address and Postcode */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                            📍 Full Address{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            placeholder="Enter complete address"
                            className={`w-full p-4 rounded-2xl bg-white/5 border-2 transition-all text-sm text-white font-medium placeholder:text-white/40 focus:outline-none focus:ring-2 ${
                              formErrors["details.address"]
                                ? "border-rose-400 focus:ring-rose-500/30 focus:border-rose-500"
                                : "border-white/10 focus:ring-primary/30 focus:border-primary"
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
                            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 block">
                              📬 Postcode
                            </label>
                            <input
                              placeholder="e.g., M1 1AA"
                              className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium placeholder:text-white/40"
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
                            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1">
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
                              className={`w-full p-4 rounded-2xl bg-white/5 border-2 transition-all text-sm text-white font-medium focus:outline-none focus:ring-2 ${
                                formErrors["details.frequency"]
                                  ? "border-rose-400 focus:ring-rose-500/30 focus:border-rose-500"
                                  : "border-white/10 focus:ring-primary/30 focus:border-primary"
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
                          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 block">
                            📣 Where did this booking come from?
                          </label>
                          <select
                            value={createData.leadSource || "Organic"}
                            onChange={(e) =>
                              handleFieldChange("leadSource", e.target.value)
                            }
                            className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium"
                          >
                            {LEAD_SOURCES.map((src) => (
                              <option key={src} value={src}>
                                {src}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 block">
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
                            className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium"
                          >
                            <option value="Cleaniq">Cleaniq provides</option>
                            <option value="Customer">Customer provides</option>
                          </select>
                        </div>
                      </div>

                      {/* Service Selection */}
                      <div className="pt-2">
                        <h5 className="font-bold text-lg text-white/85 mb-4 flex items-center gap-2">
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
                                  ? "border-primary bg-primary/10 shadow-lg scale-105"
                                  : formErrors.service
                                    ? "border-rose-500/25 bg-white/5 hover:shadow-md"
                                    : "border-white/10 bg-white/5 hover:shadow-md hover:border-primary/30"
                              }`}
                            >
                              <div className="font-extrabold text-base text-white/85">
                                {s.title}
                              </div>
                              <div className="text-[11px] text-white/60 mt-2 font-bold">
                                {s.tag}
                              </div>
                              {createData.service === s.id && (
                                <div className="text-primary text-sm font-bold mt-2">
                                  âœ" Selected
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
                      <div className="pb-4 border-b border-white/10">
                        <h4 className="text-2xl font-bold text-white/85 flex items-center gap-3">
                          <HomeIcon size={24} className="text-primary" />
                          Home Details
                        </h4>
                        <p className="text-[11px] text-white/60 uppercase tracking-widest mt-2 font-bold">
                          Specify property rooms
                        </p>
                      </div>

                      {/* Duration summary and Pet */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border-2 border-white/10">
                        {createData.payment?.billingType === "flat" ? (
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <DollarSign
                              size={20}
                              className="text-emerald-400/70 shrink-0"
                            />
                            <p className="text-xs font-bold text-emerald-400">
                              Flat-rate job — no hourly duration needed. The
                              fixed price you set in Step 1 covers the whole
                              job.
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <Clock
                              size={20}
                              className="text-primary shrink-0"
                            />
                            <p className="text-xs font-bold text-white/70">
                              Duration: {createData.details.duration || "—"}{" "}
                              hour{createData.details.duration === 1 ? "" : "s"}{" "}
                              <span className="text-white/40 font-medium">
                                (set in Step 1)
                              </span>
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-3 block">
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
                            className="w-full p-3 rounded-xl bg-white/5 border-2 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-bold"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>

                      {/* Property Rooms */}
                      <div
                        className={`p-4 bg-white/5 rounded-2xl border-2 ${
                          formErrors["details.Bedroom"] ||
                          formErrors["details.Bathroom"]
                            ? "border-rose-500/50 bg-rose-500/10"
                            : "border-white/10"
                        }`}
                      >
                        <h5 className="font-bold text-base text-white/85 mb-4 flex items-center gap-2">
                          🛏ï¸ Property Rooms
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
                              className="p-3 bg-[#071D16] rounded-xl border-2 border-white/10 flex flex-col items-center gap-2 hover:shadow-md transition-all"
                            >
                              <div className="font-bold text-sm text-white/85 text-center line-clamp-2">
                                {r}
                              </div>
                              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                                <button
                                  onClick={() => {
                                    const cur = createData.details[r] || 0;
                                    handleFieldChange(
                                      `details.${r}`,
                                      Math.max(0, cur - 1),
                                    );
                                  }}
                                  className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-primary transition-colors"
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
                                  className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-primary transition-colors"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {(formErrors["details.Bedroom"] ||
                          formErrors["details.Bathroom"]) && (
                          <div className="mt-4 p-3 bg-rose-500/10 border-l-4 border-rose-500/50 rounded">
                            {formErrors["details.Bedroom"] && (
                              <p className="text-rose-400 text-[10px] font-bold mb-1">
                                ⚠️ {formErrors["details.Bedroom"]}
                              </p>
                            )}
                            {formErrors["details.Bathroom"] && (
                              <p className="text-rose-400 text-[10px] font-bold">
                                ⚠️ {formErrors["details.Bathroom"]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {createStep === 3 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-white/10">
                        <h4 className="text-2xl font-bold text-white/85 flex items-center gap-3">
                          <Zap size={24} className="text-primary" />
                          Extra Services
                        </h4>
                        <p className="text-[11px] text-white/60 uppercase tracking-widest mt-2 font-bold">
                          Add optional services to boost the booking value
                        </p>
                      </div>
                      {extraServicesList.length === 0 ? (
                        <div className="text-center py-12 px-6 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                          <Zap
                            size={40}
                            className="mx-auto text-white/30 mb-3"
                          />
                          <p className="text-sm font-bold text-white/60">
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
                                    ? "bg-emerald-500/15 border-emerald-500/25 shadow-md"
                                    : "bg-white/5 border-white/10 hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="p-3 bg-white/5 rounded-xl border-2 border-white/10">
                                      <Zap
                                        size={20}
                                        className="text-amber-500"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-white/85">
                                        {extra.name}
                                      </p>
                                      <p className="text-xs font-bold text-white/60 mt-1">
                                        £{extra.rate} per unit
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2 border-2 border-white/10">
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
                                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 flex items-center justify-center transition-colors font-bold"
                                    >
                                      âˆ’
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
                                      className="w-8 h-8 rounded-lg bg-[#10B981]/20 hover:bg-emerald-500/25 text-emerald-400/70 flex items-center justify-center transition-colors font-bold"
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
                      <div className="pb-4 border-b border-white/10">
                        <h4 className="text-2xl font-bold text-white/85 flex items-center gap-3">
                          <DollarSign size={24} className="text-primary" />
                          Payment & Schedule
                        </h4>
                        <p className="text-[11px] text-white/60 uppercase tracking-widest mt-2 font-bold">
                          Set date, time, and customer details
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Calendar and Time */}
                        <div className="p-4 bg-white/5 rounded-2xl border-2 border-white/10">
                          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-1">
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
                              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
                                🕐 Time Slot Selection
                              </label>

                              <div className="p-3 bg-white/5 rounded-xl border-2 border-white/10">
                                <p className="text-[9px] font-bold text-white/60 mb-2">
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
                                                ? "border-rose-500/30 bg-rose-500/15 text-rose-400 cursor-not-allowed opacity-50 font-bold text-xs"
                                                : "border-white/10 bg-white/5 text-white/70 hover:border-primary/50"
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

                              <div className="p-6 bg-white/5 rounded-xl border-2 border-white/10 space-y-4">
                                <div>
                                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Clock size={16} className="text-primary" />
                                    Choose Your Flexible Time
                                  </p>
                                  <p className="text-[9px] text-white/40 mb-4">
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

                                    // Get booked ranges for the selected date
                                    const selectedDateStr =
                                      createData.schedule.date;
                                    let bookedRanges = [];
                                    if (selectedDateStr && bookedDates) {
                                      const bookingsOnDate = bookings.filter(
                                        (b) => {
                                          if (!b.schedule?.date) return false;
                                          const d = new Date(b.schedule.date);
                                          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                          return dStr === selectedDateStr;
                                        },
                                      );
                                      bookedRanges =
                                        buildBookedRanges(bookingsOnDate);
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
                                      const isBooked = overlapsExistingRange(
                                        time,
                                        createData.details?.duration || 1,
                                        bookedRanges,
                                      );
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
                                                ? "border-rose-500/30 bg-rose-500/15 text-rose-400 cursor-not-allowed opacity-50"
                                                : "border-white/10 bg-white/5 text-white/70 hover:border-primary/50"
                                          }`}
                                        >
                                          {time}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>

                                {/* Custom Time Input */}
                                <div className="border-t-2 border-white/10 pt-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                      â° Custom Time
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
                                      className="text-[8px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider px-2 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 transition"
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
                                      className="flex-1 p-4 rounded-xl bg-white/5 border-2 border-white/10 focus:border-primary focus:bg-white/10 shadow-sm outline-none font-bold text-sm text-white placeholder:text-white/20"
                                      min="08:00"
                                      max="20:00"
                                    />
                                    <span className="text-[9px] font-bold text-white/60 text-center whitespace-nowrap">
                                      {createData.schedule.preferredTime &&
                                      createData.schedule.timeSlot ===
                                        "Flexible"
                                        ? "✓ Selected"
                                        : "Click to set"}
                                    </span>
                                  </div>
                                  <p className="text-[8px] text-white/40">
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
                                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 block">
                                    â° Preferred Arrival Time (Optional)
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
                                    className="w-full p-3 rounded-xl bg-white/5 border-2 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium placeholder:text-white/40"
                                  />
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-4 bg-white/5 rounded-2xl border-2 border-white/10 space-y-3">
                          <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
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
                                className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm text-white focus:outline-none focus:ring-2 ${
                                  formErrors["customer.firstName"]
                                    ? "bg-white/5 border-rose-400/50 focus:ring-rose-500/30 focus:border-rose-400 placeholder:text-rose-300/60"
                                    : "bg-white/5 border-white/10 focus:ring-primary/30 focus:border-primary placeholder:text-white/40"
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
                                className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm text-white focus:outline-none focus:ring-2 ${
                                  formErrors["customer.lastName"]
                                    ? "bg-white/5 border-rose-400/50 focus:ring-rose-500/30 focus:border-rose-400 placeholder:text-rose-300/60"
                                    : "bg-white/5 border-white/10 focus:ring-primary/30 focus:border-primary placeholder:text-white/40"
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
                              className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm text-white focus:outline-none focus:ring-2 ${
                                formErrors["customer.email"]
                                  ? "bg-white/5 border-rose-400/50 focus:ring-rose-500/30 focus:border-rose-400 placeholder:text-rose-300/60"
                                  : "bg-white/5 border-white/10 focus:ring-primary/30 focus:border-primary placeholder:text-white/40"
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
                              className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm text-white focus:outline-none focus:ring-2 ${
                                formErrors["customer.phone"]
                                  ? "bg-white/5 border-rose-400/50 focus:ring-rose-500/30 focus:border-rose-400 placeholder:text-rose-300/60"
                                  : "bg-white/5 border-white/10 focus:ring-primary/30 focus:border-primary placeholder:text-white/40"
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
                      <div className="p-5 bg-emerald-500/15 rounded-2xl border-2 border-emerald-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-wider">
                              💰 Estimated Total
                            </p>
                            <p className="text-3xl font-bold text-emerald-400 mt-1">
                              £{createTotal}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-wider">
                              📊 Status
                            </p>
                            <p className="font-bold text-emerald-400 text-lg mt-1">
                              {noPaymentRequired
                                ? "Completed"
                                : createData.status}
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

                  {/* Billing Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors flex items-center justify-between">
                    {createData.payment?.billingType === "flat" ? (
                      <div>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                          💷 Billing
                        </p>
                        <div className="text-sm font-bold mt-2">Flat Rate</div>
                      </div>
                    ) : (
                      createData.details.duration && (
                        <div>
                          <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                            â±ï¸ Duration
                          </p>
                          <div className="text-sm font-bold mt-2">
                            {createData.details.duration} hours
                          </div>
                        </div>
                      )
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                      {createData.payment?.billingType === "flat"
                        ? "Flat Rate"
                        : "Hourly"}
                    </span>
                  </div>

                  {/* Price Divider */}
                  <div className="h-px bg-white/20"></div>

                  {/* Total Price Card */}
                  <div className="bg-white/5 rounded-xl p-5 text-primary shadow-lg">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                      💰 Estimated Total
                    </p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      £{createTotal}
                    </p>
                    <p className="text-xs text-white/70 mt-2 font-bold">
                      Ready to create this booking?
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-4 sm:px-6 lg:px-10 py-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-3 flex-1 sm:flex-initial">
                {createStep > 1 && (
                  <button
                    onClick={() => setCreateStep((s) => Math.max(1, s - 1))}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 font-bold transition-colors border-2 border-white/10"
                  >
                    â† Back
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
                        ? "bg-white/15 text-white/40 border-white/20 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg text-white hover:scale-105 border-primary"
                    }`}
                  >
                    Next â†’
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
                            // Non-pay bookings haven't actually been paid yet —
                            // they stay Pending until an invoice is sent
                            // (â†’ Confirmed) and the job is done (â†’ Completed,
                            // which is also when money is actually captured).
                            status: "Pending",
                            billingType:
                              createData.payment?.billingType || "hourly",
                          },
                          status: noPaymentRequired
                            ? "Confirmed"
                            : createData.status,
                          noPaymentRequired,
                          skipConfirmationEmail:
                            noPaymentRequired && skipConfirmationEmail,
                          createdByAdmin:
                            localStorage.getItem("adminUser") || null,
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
                        setCreateFlatAmount("");
                        setSkipConfirmationEmail(false);
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
          <div className="bg-[#0B2D22] rounded-[32px] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-400/70" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Booking Created Successfully!
              </h2>
              <p className="text-sm text-white/60">
                Payment link has been sent to customer email
              </p>
            </div>

            {/* Booking Details - 2 Column Layout */}
            <div className="space-y-6 mb-8">
              {/* Row 1: Reference & Customer */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Booking Reference */}
                <div className="bg-[#071D16] rounded-2xl p-6 border border-white/10">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                    📋 Booking Reference
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {successBooking.bookingId}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="bg-blue-500/15 rounded-2xl p-6 border border-blue-500/25">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                    👤 Customer
                  </p>
                  <p className="text-lg font-bold text-white mb-1">
                    {successBooking.customer.firstName}{" "}
                    {successBooking.customer.lastName}
                  </p>
                  <p className="text-xs text-white/70">
                    {successBooking.customer.email}
                  </p>
                  <p className="text-xs text-white/70 mt-2">
                    📱 {successBooking.customer.phone}
                  </p>
                </div>
              </div>

              {/* Row 2: Service & Schedule */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Service Type */}
                <div className="bg-purple-500/15 rounded-2xl p-6 border border-purple-500/25">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                    🧹 Service Type
                  </p>
                  <p className="text-lg font-bold text-white mb-1">
                    {successBooking.service}
                  </p>
                  <p className="text-xs text-white/70">
                    Duration: {successBooking.details.duration} hours
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    Frequency: {successBooking.details.frequency || "Once"}
                  </p>
                </div>

                {/* Schedule */}
                <div className="bg-amber-500/15 rounded-2xl p-6 border border-amber-500/25">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                    📅 Schedule
                  </p>
                  <p className="text-lg font-bold text-white mb-2">
                    {new Date(successBooking.schedule.date).toDateString()}
                  </p>
                  <p className="text-sm font-bold text-white/70">
                    🕐 {successBooking.schedule.timeSlot}
                  </p>
                </div>
              </div>

              {/* Row 3: Location */}
              <div className="bg-emerald-500/15 rounded-2xl p-6 border border-emerald-500/25">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                  📍 Location
                </p>
                <p className="text-lg font-bold text-white mb-2">
                  {successBooking.details.address}
                </p>
                <p className="text-sm text-white/70">
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
                  <div className="bg-indigo-500/15 rounded-2xl p-6 border border-indigo-500/25">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
                      🏠 Property Rooms
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {rooms.map((room) => (
                        <div
                          key={room}
                          className="bg-white/[0.05] rounded-xl p-3 border border-indigo-500/25 flex flex-col items-center justify-center"
                        >
                          <p className="text-xs font-bold text-indigo-400">
                            {successBooking.details[room]}x
                          </p>
                          <p className="text-xs font-bold text-white/70 text-center mt-1">
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
                  <div className="bg-rose-500/15 rounded-2xl p-6 border border-rose-500/25">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
                      ⭐ Extra Services
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
                            className="bg-white/[0.05] rounded-xl p-4 border border-rose-500/25 flex items-start justify-between"
                          >
                            <div>
                              <p className="text-sm font-bold text-white">
                                {displayText}
                              </p>
                              {extraPrice && (
                                <p className="text-xs text-white/70 mt-1">
                                  £{extraPrice} each
                                </p>
                              )}
                            </div>
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                              âœ"
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Row 6: Payment */}
              <div className="bg-emerald-500/15 rounded-2xl p-6 border border-emerald-500/25">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                      💰 Total Amount
                    </p>
                    <p className="text-xs text-white/70 mb-1">
                      Status:{" "}
                      <span className="font-bold text-amber-400">
                        Pending Payment
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-emerald-400">
                      {successBooking.payment.currency === "GBP" ? "£" : "â‚¦"}
                      {successBooking.payment.amount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border-2 border-blue-500/25 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-blue-300 mb-2">
                ✓ Payment Link Sent
              </p>
              <p className="text-xs text-blue-400/80">
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
                className="w-full py-3 px-6 rounded-2xl bg-white/10 text-white/70 font-bold hover:bg-white/15 transition-all"
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
          <div className="relative w-full max-w-md bg-[#0B2D22] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden border border-white/[0.08] p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/25 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 size={28} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Delete {selectedBookings.size} Bookings?
                </h3>
                <p className="text-sm text-white/40 mt-2">
                  This action cannot be undone. All selected bookings will be
                  permanently deleted.
                </p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
                  Warning: {selectedBookings.size} bookings will be deleted
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 py-3 px-6 rounded-xl bg-white/[0.06] text-white/60 font-black hover:bg-white/10 transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 py-3 px-6 rounded-xl bg-rose-500 text-white font-black hover:bg-rose-400 transition-all shadow-sm shadow-rose-500/25"
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
