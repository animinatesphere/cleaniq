import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  AlertCircle,
} from "lucide-react";

/**
 * Professional Calendar Component for Admin Booking System
 * Features:
 * - Month/year navigation
 * - Visual status indicators (available, booked, fully booked)
 * - Responsive design
 * - Keyboard navigation
 * - Touch-friendly
 */

export const ProfessionalCalendar = ({
  bookings = [],
  onDateSelect,
  selectedDate,
  minDate = new Date(),
  showTimeSlots = true,
  allowPastDates = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days in month
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // Get first day of month (0-6, Sunday-Saturday)
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

  // Build calendar days array
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

    // Add empty slots for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= totalDays; i++) {
      days.push(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
      );
    }

    return days;
  }, [currentMonth]);

  // Calculate booking status for a date
  const getDateStatus = (date) => {
    if (!date) return null;

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const bookingsForDate = bookings.filter((b) => {
      if (!b.schedule?.date) return false;
      const bDate = new Date(b.schedule.date);
      const bStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}`;
      return bStr === dateStr;
    });

    // Count bookings by time slot
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

  // Check if date is in past
  const isPastDate = (date) => {
    if (allowPastDates) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Handle date click
  const handleDateClick = (date) => {
    if (!date || isPastDate(date)) return;
    const status = getDateStatus(date);
    if (status?.status === "fully-booked") return;
    onDateSelect(date);
  };

  // Time slots for selection
  const timeSlots = [
    { id: "Morning", label: "Morning (8am-12pm)", icon: "🌅" },
    { id: "Afternoon", label: "Afternoon (12pm-4pm)", icon: "☀️" },
    { id: "Evening", label: "Evening (4pm-8pm)", icon: "🌙" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Calendar Header */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-black text-primary-dark tracking-tighter">
              {currentMonth.toLocaleString("default", { month: "long" })}{" "}
              <span className="text-primary">{currentMonth.getFullYear()}</span>
            </h3>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
              Select a date for the booking
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-slate-600">
              Available
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-[10px] font-bold text-slate-600">
              Some Booked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-bold text-slate-600">
              Fully Booked
            </span>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-[10px] text-slate-300 font-black uppercase">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 bg-slate-50 p-3 rounded-lg">
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
                          ? "bg-primary text-white shadow-lg ring-2 ring-primary/50"
                          : isPast
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed opacity-50"
                            : status?.status === "fully-booked"
                              ? "bg-rose-50 text-rose-300 cursor-not-allowed border border-rose-200"
                              : status?.status === "partially-booked"
                                ? "bg-amber-50 text-amber-600 border border-amber-200 hover:shadow-md"
                                : "bg-white text-slate-600 border border-slate-200 hover:border-primary hover:shadow-md hover:text-primary"
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

      {/* Time Slot Selection (if date selected and time slots enabled) */}
      {selectedDate && showTimeSlots && (
        <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-4">
            <h4 className="text-lg font-black text-primary-dark tracking-tighter">
              Select Time Slot
            </h4>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
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
              // Check if this time slot is available on selected date
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
                        ? "bg-rose-50 border-rose-200 text-rose-300 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-600 hover:shadow-lg hover:scale-105"
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

      {/* Quick Date Selection Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleDateClick(new Date())}
          className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-black hover:bg-primary hover:text-white transition-all border border-slate-200"
        >
          Today
        </button>
        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            handleDateClick(tomorrow);
          }}
          className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-black hover:bg-primary hover:text-white transition-all border border-slate-200"
        >
          Tomorrow
        </button>
        <button
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setCurrentMonth(nextWeek);
          }}
          className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-black hover:bg-primary hover:text-white transition-all border border-slate-200"
        >
          Next Week
        </button>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900">
            📅 Professional Booking Calendar
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Select an available date and time slot. Red dates are fully booked
            and cannot be selected. Grayed out dates are in the past.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCalendar;
