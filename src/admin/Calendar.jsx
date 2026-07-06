import React, { useState, useEffect, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import { AdminCalendar } from "./Bookings";

const Calendar = () => {
  const [bookings, setBookings] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (!statusMessage.text) return;
    const timer = setTimeout(
      () => setStatusMessage({ type: "", text: "" }),
      3000,
    );
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const toggleTimeSlot = async (date, time, existingBlock) => {
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (existingBlock) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/bookings/${existingBlock._id}`, { method: "DELETE" });
        setStatusMessage({ type: "success", text: `✅ Unblocked ${time} on ${dStr}` });
        fetchBookings();
      } catch (e) {
        console.error(e);
      }
    } else {
      const payload = {
        bookingId: `TBLOCK-${Date.now()}`,
        customer: { firstName: "ADMIN_BLOCK", lastName: "SYSTEM", email: "admin@cleaniq.com", phone: "000" },
        service: "Time Block",
        status: "Blackout",
        schedule: { date: dStr, timeSlot: "Flexible", preferredTime: time },
        details: { duration: 0.5 },
        payment: { amount: 0, status: "N/A" },
      };
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setStatusMessage({ type: "success", text: `⛔ Blocked ${time} on ${dStr}` });
        fetchBookings();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleAvailability = async (date, isCurrentlyBlocked) => {
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (isCurrentlyBlocked) {
      const block = bookings.find((b) => {
        if (b.customer?.firstName !== "ADMIN_BLOCK") return false;
        if (b.schedule?.timeSlot !== "All Day") return false;
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

  return (
    <div className="space-y-6 pb-20 relative">
      {statusMessage.text && (
        <div className="fixed top-6 right-6 z-100 px-6 py-4 rounded-2xl shadow-2xl bg-slate-900 text-white font-semibold text-sm animate-in slide-in-from-right">
          {statusMessage.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarDays size={22} className="text-primary" /> Calendar
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          View bookings by date, manage availability, and schedule recurring
          jobs
        </p>
      </div>

      <AdminCalendar
        bookings={bookings}
        onToggleDate={toggleAvailability}
        onToggleTimeSlot={toggleTimeSlot}
        onBookingsCreated={fetchBookings}
      />
    </div>
  );
};

export default Calendar;
