import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  AlertCircle,
} from "lucide-react";

export const ProfessionalCalendar = ({
  bookings = [],
  onDateSelect,
  selectedDate,
  minDate = new Date(),
  showTimeSlots = true,
  allowPastDates = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
    );
    const startDay = startDayOfMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
    );

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
      );
    }

    return days;
  }, [currentMonth]);

  const getDateStatus = (date) => {
    if (!date) return null;

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const bookingsForDate = bookings.filter((b) => {
      if (!b.schedule?.date) return false;
      const bDate = new Date(b.schedule.date);
      const bStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}`;
      return bStr === dateStr;
    });

    const timeSlots = new Set(
      bookingsForDate.map((b) => b.schedule?.timeSlot).filter((s) => s),
    );

    if (timeSlots.size >= 3) {
      return { status: "fully-booked", count: bookingsForDate.length };
    } else if (bookingsForDate.length > 0) {
      return { status: "partially-booked", count: bookingsForDate.length };
    }

    return { status: "available", count: 0 };
  };

  const isPastDate = (date) => {
    if (allowPastDates) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (date) => {
    if (!date || isPastDate(date)) return;
    const status = getDateStatus(date);
    if (status?.status === "fully-booked") return;
    onDateSelect(date);
  };

  const timeSlots = [
    { id: "Morning", label: "Morning (8am-12pm)", icon: "🌅" },
    { id: "Afternoon", label: "Afternoon (12pm-4pm)", icon: "☀️" },
    { id: "Evening", label: "Evening (4pm-8pm)", icon: "🌙" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tighter">
              {currentMonth.toLocaleString("default", { month: "long" })}{" "}
              <span className="text-emerald-400">{currentMonth.getFullYear()}</span>
            </h3>
            <p className="text-[11px] text-white/40 uppercase tracking-widest mt-2 font-bold">
              Select a date for the booking
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:bg-emerald-500/15 hover:text-emerald-400 transition-all"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:bg-emerald-500/15 hover:text-emerald-400 transition-all"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-[#071D16] rounded-lg border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-white/60">
              Available
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-[10px] font-bold text-white/60">
              Some Booked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-bold text-white/60">
              Fully Booked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-[10px] text-white/25 font-black uppercase">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 bg-[#071D16] p-3 rounded-lg">
          {calendarDays.map((date, index) => {
            const status = date ? getDateStatus(date) : null;
            const isPast = date ? isPastDate(date) : false;
            const isClickable =
              date && !isPast && status?.status !== "fully-booked";
            const selected = isSelected(date);

            return (
              <div
                key={index}
                className="aspect-square flex items-center justify-center"
              >
                {date ? (
                  <button
                    onClick={() => handleDateClick(date)}
                    disabled={!isClickable}
                    className={`
                      w-full h-full rounded-lg font-bold text-sm
                      transition-all duration-200
                      flex items-center justify-center flex-col
                      relative overflow-hidden group
                      ${
                        selected
                          ? "bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/50"
                          : isPast
                            ? "bg-[#071D16] text-white/20 cursor-not-allowed opacity-50"
                            : status?.status === "fully-booked"
                              ? "bg-rose-500/10 text-rose-400 cursor-not-allowed border border-rose-500/20"
                              : status?.status === "partially-booked"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:shadow-md"
                                : "bg-[#071D16] text-white/60 border border-white/[0.06] hover:border-emerald-500/30 hover:bg-[#0A2A1F] hover:text-white"
                      }
                    `}
                  >
                    <span className="text-lg">{date.getDate()}</span>
                    {status?.count > 0 && !selected && (
                      <span className="text-[9px] font-black opacity-60">
                        {status.count} booked
                      </span>
                    )}
                    {selected && (
                      <Check size={14} className="absolute top-1 right-1" />
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

      {selectedDate && showTimeSlots && (
        <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-4">
            <h4 className="text-lg font-black text-white tracking-tighter">
              Select Time Slot
            </h4>
            <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1 font-bold">
              {selectedDate.toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {timeSlots.map((slot) => {
              const slotBookings = bookings.filter((b) => {
                if (!b.schedule?.date || !b.schedule?.timeSlot) return false;
                const bDate = new Date(b.schedule.date);
                const sDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
                const bDateStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}`;
                return bDateStr === sDateStr && b.schedule.timeSlot === slot.id;
              });

              const isBooked = slotBookings.length > 0;

              return (
                <button
                  key={slot.id}
                  disabled={isBooked}
                  className={`
                    p-4 rounded-2xl font-bold text-center
                    transition-all duration-200
                    border-2
                    ${
                      isBooked
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400 cursor-not-allowed opacity-50"
                        : "bg-blue-500/15 border-blue-500/25 text-blue-400 hover:shadow-lg hover:scale-105"
                    }
                  `}
                >
                  <span className="text-2xl mb-1 block">{slot.icon}</span>
                  <span className="text-xs font-black uppercase tracking-tight">
                    {slot.label}
                  </span>
                  {isBooked && (
                    <span className="text-[9px] block mt-1">Fully Booked</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleDateClick(new Date())}
          className="px-4 py-2 rounded-xl bg-[#071D16] border border-white/10 text-white/60 text-xs font-black hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all"
        >
          Today
        </button>
        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            handleDateClick(tomorrow);
          }}
          className="px-4 py-2 rounded-xl bg-[#071D16] border border-white/10 text-white/60 text-xs font-black hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all"
        >
          Tomorrow
        </button>
        <button
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setCurrentMonth(nextWeek);
          }}
          className="px-4 py-2 rounded-xl bg-[#071D16] border border-white/10 text-white/60 text-xs font-black hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all"
        >
          Next Week
        </button>
      </div>

      <div className="bg-blue-500/15 border border-blue-500/25 rounded-2xl p-4 flex gap-3">
        <AlertCircle size={20} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-300">
            Professional Booking Calendar
          </p>
          <p className="text-xs text-blue-400/70 mt-1">
            Select an available date and time slot. Red dates are fully booked
            and cannot be selected. Grayed out dates are in the past.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCalendar;
