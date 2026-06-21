import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Repeat,
  RefreshCw,
  Calendar,
  User,
  Ban,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const isRealBooking = (b) =>
  b.status !== "Blackout" && b.customer?.firstName !== "ADMIN_BLOCK";

const Recurring = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    fetch(`${API}/bookings`)
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const series = useMemo(() => {
    const groups = {};
    bookings
      .filter(isRealBooking)
      .filter((b) => b.meta?.recurringGroup)
      .forEach((b) => {
        const key = b.meta.recurringGroup;
        if (!groups[key]) groups[key] = [];
        groups[key].push(b);
      });

    let list = Object.entries(groups).map(([groupId, items]) => {
      const sorted = items.sort(
        (a, b) => new Date(a.schedule?.date) - new Date(b.schedule?.date),
      );
      const now = new Date();
      const upcoming = sorted.filter(
        (b) => new Date(b.schedule?.date) >= now && b.status !== "Cancelled",
      );
      const totalRevenue = sorted.reduce(
        (s, b) => s + Number(b.payment?.amount || 0),
        0,
      );
      return {
        groupId,
        first: sorted[0],
        frequency: sorted[0]?.details?.frequency || "Recurring",
        count: sorted.length,
        upcomingCount: upcoming.length,
        nextDate: upcoming[0]?.schedule?.date || null,
        totalRevenue,
        bookings: sorted,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.first?.customer?.firstName?.toLowerCase().includes(s) ||
          g.first?.customer?.lastName?.toLowerCase().includes(s) ||
          g.first?.service?.toLowerCase().includes(s) ||
          g.groupId?.toLowerCase().includes(s),
      );
    }

    return list.sort(
      (a, b) => new Date(a.nextDate || 0) - new Date(b.nextDate || 0),
    );
  }, [bookings, search]);

  const cancelRemaining = async (group) => {
    const now = new Date();
    const future = group.bookings.filter(
      (b) => new Date(b.schedule?.date) >= now && b.status !== "Cancelled",
    );
    if (future.length === 0) return;
    if (
      !window.confirm(
        `Cancel the remaining ${future.length} upcoming booking(s) in this recurring series?`,
      )
    )
      return;
    setCancelling(group.groupId);
    try {
      await Promise.all(
        future.map((b) =>
          fetch(`${API}/bookings/${b._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Cancelled" }),
          }),
        ),
      );
      fetchBookings();
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Repeat size={22} className="text-primary" /> Recurring Bookings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Weekly, fortnightly, monthly, quarterly & yearly booking series
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all font-semibold text-sm shadow-sm self-start"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or service..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-400">
            Loading recurring series...
          </p>
        ) : series.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">
            No recurring booking series found
          </p>
        ) : (
          series.map((group) => {
            const isOpen = openGroup === group.groupId;
            return (
              <div key={group.groupId}>
                <button
                  onClick={() =>
                    setOpenGroup(isOpen ? null : group.groupId)
                  }
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      {group.first?.customer?.firstName}{" "}
                      {group.first?.customer?.lastName}
                      <span className="text-slate-400 font-medium">
                        — {group.first?.service}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                      <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                        {group.frequency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />{" "}
                        {group.nextDate
                          ? `Next: ${new Date(group.nextDate).toLocaleDateString("en-GB")}`
                          : "No upcoming dates"}
                      </span>
                      <span>{group.count} total in series</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-sm font-bold text-slate-700 tabular-nums">
                      £
                      {group.totalRevenue.toLocaleString("en-GB", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 -mt-1 space-y-3">
                    <div className="flex justify-end">
                      <button
                        disabled={
                          cancelling === group.groupId ||
                          group.upcomingCount === 0
                        }
                        onClick={() => cancelRemaining(group)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Ban size={13} />
                        {group.upcomingCount === 0
                          ? "No upcoming bookings"
                          : `Cancel remaining ${group.upcomingCount} booking(s)`}
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
                      {group.bookings.map((b) => (
                        <div
                          key={b._id}
                          className="flex items-center justify-between gap-3 p-3 text-xs"
                        >
                          <span className="font-bold text-slate-600">
                            {b.bookingId}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar size={11} />
                            {b.schedule?.date
                              ? new Date(b.schedule.date).toLocaleDateString(
                                  "en-GB",
                                )
                              : "—"}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <User size={11} /> £{b.payment?.amount || 0}
                          </span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full ${
                              b.status === "Cancelled"
                                ? "bg-rose-100 text-rose-600"
                                : b.status === "Completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Recurring;
