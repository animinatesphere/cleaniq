import { useState, useEffect, useRef } from "react";
import { Home, Search, ChevronRight, User } from "lucide-react";
import DomesticPropertyReport from "./DomesticPropertyReport";

const API = import.meta.env.VITE_API_URL;

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const DomesticHub = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/bookings`)
      .then((r) => r.json())
      .then((data) => setAllBookings(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowResults(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const isDomestic = (b) => {
    const s = (b.service || "").toLowerCase().replace(/[^a-z]/g, "");
    return (
      s.includes("domestic") ||
      s.includes("residential") ||
      s.includes("home") ||
      s.includes("deep") ||
      s.includes("endoftenancy") ||
      s.includes("moveout") ||
      s.includes("movein") ||
      s.includes("regular") ||
      // fallback: if no commercial or airbnb keyword
      (!s.includes("commercial") &&
        !s.includes("office") &&
        !s.includes("airbnb") &&
        !s.includes("shortlet"))
    );
  };

  const q = search.trim().toLowerCase();
  const results =
    q.length < 2
      ? []
      : allBookings
          .filter((b) => isDomestic(b))
          .filter((b) => {
            const name =
              `${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`.toLowerCase();
            const email = (b.customer?.email || "").toLowerCase();
            const ref = (b.bookingId || "").toLowerCase();
            const addr = (b.details?.address || "").toLowerCase();
            return (
              name.includes(q) ||
              email.includes(q) ||
              ref.includes(q) ||
              addr.includes(q)
            );
          })
          .slice(0, 8);

  const pick = (b) => {
    setSelected(b);
    setSearch(
      `${b.customer?.firstName || ""} ${b.customer?.lastName || ""} — ${b.bookingId}`,
    );
    setShowResults(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Home size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary-dark tracking-tight">
            Property Condition{" "}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Search a domestic booking to generate a property condition report
          </p>
        </div>
      </div>

      {/* Booking search */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          Select Booking
        </p>
        <div className="relative" ref={searchRef}>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowResults(true);
                if (!e.target.value) setSelected(null);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search by customer name, email, booking ref or address…"
              className="flex-1 bg-transparent text-sm font-medium text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>

          {showResults && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden">
              {results.map((b) => (
                <button
                  key={b._id}
                  onClick={() => pick(b)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                    {b.customer?.firstName?.charAt(0) || <User size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {b.customer?.firstName} {b.customer?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {b.bookingId} · {b.service} · {fmt(b.schedule?.date)}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          )}

          {showResults && q.length >= 2 && results.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 px-5 py-4">
              <p className="text-sm text-slate-400 font-medium">
                No domestic bookings match "{search}"
              </p>
            </div>
          )}
        </div>

        {selected && (
          <div className="mt-4 flex flex-wrap gap-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
            <span className="font-black text-emerald-800">
              {selected.customer?.firstName} {selected.customer?.lastName}
            </span>
            <span className="text-emerald-700 font-medium">
              {selected.bookingId}
            </span>
            <span className="text-emerald-700 font-medium">
              {selected.service}
            </span>
            <span className="text-emerald-700 font-medium">
              {fmt(selected.schedule?.date)}
            </span>
            {selected.details?.address && (
              <span className="text-emerald-600 font-medium">
                {selected.details.address}
              </span>
            )}
            <button
              onClick={() => {
                setSelected(null);
                setSearch("");
              }}
              className="ml-auto text-emerald-600 font-bold hover:text-emerald-800 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Property report — shown once a booking is selected */}
      {selected ? (
        <DomesticPropertyReport booking={selected} defaultOpen />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-300">
          <Home size={48} />
          <p className="text-sm font-bold text-slate-400">
            Search and select a booking above to begin
          </p>
        </div>
      )}
    </div>
  );
};

export default DomesticHub;
