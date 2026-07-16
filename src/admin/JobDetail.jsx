import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, User, Clock, Camera, FileText, MapPin,
  CheckCircle2, AlertTriangle, Briefcase, Phone, Mail,
  Calendar, Timer, Star, Image, ChevronRight, Radio, Navigation
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const SERVER = API?.replace("/api", "");

const fmt = (date) =>
  date ? new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

const fmtTime = (date) =>
  date ? new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null;

const diffMins = (a, b) => a && b ? Math.round((new Date(b) - new Date(a)) / 60000) : null;

const StatusBadge = ({ status }) => {
  const colors = {
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Completed: "bg-blue-50 text-blue-700 border-blue-200",
    "Completed - Unpaid": "bg-purple-50 text-purple-700 border-purple-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    "In Progress": "bg-sky-50 text-sky-700 border-sky-200",
    Assigned: "bg-violet-50 text-violet-700 border-violet-200",
    Arrived: "bg-teal-50 text-teal-700 border-teal-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${colors[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
};

const TimelineStep = ({ icon: Icon, label, time, color, done, active }) => (
  <div className={`flex items-start gap-4 ${!done && !active ? "opacity-40" : ""}`}>
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${done ? `bg-${color}-100 text-${color}-600` : active ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
      <Icon size={18} />
    </div>
    <div className="flex-1 pt-1">
      <p className={`text-xs font-black uppercase tracking-widest ${done || active ? "text-slate-700" : "text-slate-400"}`}>{label}</p>
      {time && <p className="text-sm font-bold text-primary mt-0.5">{time}</p>}
      {!time && active && <p className="text-xs text-slate-400 font-medium mt-0.5">In progress...</p>}
      {!time && !active && !done && <p className="text-xs text-slate-400 font-medium mt-0.5">Not yet</p>}
    </div>
  </div>
);

const PhotoCard = ({ photo, label }) => {
  const url = photo?.url?.startsWith("http") ? photo.url : `${SERVER}/${photo?.url}`;
  return (
    <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
      <img src={url} alt={label} className="w-full h-48 object-cover" onError={(e) => { e.target.style.display = "none"; }} />
      <div className="p-3 flex items-center gap-2">
        <Image size={12} className="text-slate-400" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        {photo?.uploadedAt && <p className="text-[10px] text-slate-400 ml-auto">{fmtTime(photo.uploadedAt)}</p>}
      </div>
    </div>
  );
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState(null); // { lat, lng, lastUpdated, sharing }
  const locationPollRef = useRef(null);

  const pollLocation = async (bookingMongoId) => {
    try {
      const res = await fetch(`${API}/workers/jobs/${bookingMongoId}/worker-location`);
      if (res.ok) {
        const data = await res.json();
        setLiveLocation(data.sharing ? data : null);
      } else {
        setLiveLocation(null);
      }
    } catch {
      setLiveLocation(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/bookings/${id}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setBooking(data);

        if (data.assignedWorker) {
          const wr = await fetch(`${API}/workers/${data.assignedWorker}`);
          if (wr.ok) setWorker(await wr.json());
        }

        // Start polling live location if job is active
        if (["Assigned", "Arrived", "In Progress"].includes(data.status) && data._id) {
          pollLocation(data._id);
          locationPollRef.current = setInterval(() => pollLocation(data._id), 15000);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { if (locationPollRef.current) clearInterval(locationPollRef.current); };
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 border-4 border-primary border-r-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertTriangle size={40} className="text-rose-400" />
      <p className="text-xl font-black text-slate-700">Booking not found</p>
      <button onClick={() => navigate(-1)} className="btn-primary py-3 px-6">Go Back</button>
    </div>
  );

  const photos = booking.photos || [];
  const beforePhotos = photos.filter(p => p.photoType === "before");
  const afterPhotos  = photos.filter(p => p.photoType === "after");
  const damagePhotos = photos.filter(p => p.photoType === "damage");

  const totalActualMins = booking.jobDurationActual ||
    diffMins(booking.jobStartTime, booking.jobEndTime) || 0;
  const actualHrs = (totalActualMins / 60).toFixed(1);

  const arrivedToStartMins = diffMins(booking.jobArrivedTime, booking.jobStartTime);

  const extras = Array.isArray(booking.details?.extras)
    ? booking.details.extras.filter(e => e?.qty > 0)
    : Object.entries(booking.extras || {}).filter(([, v]) => v > 0).map(([name, qty]) => ({ name, qty }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-primary-dark tracking-tight">{booking.bookingId}</h1>
            <StatusBadge status={booking.status} />
            {booking.assignedWorkerName && (
              <span className="text-xs font-bold text-slate-500">
                Assigned to <span className="text-primary">{booking.assignedWorkerName}</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">{booking.service} · Created {fmt(booking.createdAt)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* Timeline */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Job Timeline</h2>
            <div className="space-y-5">
              <TimelineStep
                icon={Calendar}
                label="Booking Created"
                time={fmt(booking.createdAt)}
                color="slate"
                done={!!booking.createdAt}
              />
              <TimelineStep
                icon={CheckCircle2}
                label="Job Accepted by Worker"
                time={fmt(booking.jobAcceptedTime)}
                color="emerald"
                done={!!booking.jobAcceptedTime}
                active={!booking.jobAcceptedTime && !!booking.assignedWorker}
              />
              <TimelineStep
                icon={MapPin}
                label="Worker Arrived"
                time={fmt(booking.jobArrivedTime)}
                color="sky"
                done={!!booking.jobArrivedTime}
                active={!!booking.jobAcceptedTime && !booking.jobArrivedTime}
              />
              <TimelineStep
                icon={Timer}
                label="Job Started"
                time={fmt(booking.jobStartTime)}
                color="amber"
                done={!!booking.jobStartTime}
                active={!!booking.jobArrivedTime && !booking.jobStartTime}
              />
              <TimelineStep
                icon={Star}
                label="Job Completed"
                time={fmt(booking.jobEndTime)}
                color="primary"
                done={!!booking.jobEndTime}
                active={!!booking.jobStartTime && !booking.jobEndTime}
              />
            </div>

            {/* Duration summary */}
            {(booking.jobStartTime || totalActualMins > 0) && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-black text-primary">{actualHrs}h</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Actual Duration</p>
                </div>
                {booking.workerDuration && (
                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-black text-slate-700">{booking.workerDuration}h</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Expected Duration</p>
                  </div>
                )}
                {arrivedToStartMins != null && (
                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-black text-slate-700">{arrivedToStartMins}m</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Arrival → Start</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Worker Location */}
          {["Assigned", "Arrived", "In Progress"].includes(booking.status) && (
            <div className={`rounded-3xl border p-6 shadow-sm ${liveLocation ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                  <Radio size={14} className={liveLocation ? "text-emerald-500" : "text-slate-300"} />
                  Live Worker Location
                </h2>
                {liveLocation && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              {liveLocation ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitude</p>
                      <p className="text-sm font-black text-slate-800">{liveLocation.lat?.toFixed(6)}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitude</p>
                      <p className="text-sm font-black text-slate-800">{liveLocation.lng?.toFixed(6)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Last updated: {liveLocation.lastUpdated ? new Date(liveLocation.lastUpdated).toLocaleTimeString("en-GB") : "—"}
                    <span className="text-[9px] text-slate-400 ml-1">(auto-refreshes every 15s)</span>
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors w-fit"
                  >
                    <Navigation size={13} /> Open in Google Maps
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <MapPin size={28} className="text-slate-200" />
                  <p className="text-sm font-bold text-slate-400">No live location yet</p>
                  <p className="text-xs text-slate-300 font-medium text-center">Location sharing starts automatically when the worker presses "I've Arrived"</p>
                </div>
              )}
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Job Photos</h2>

              {beforePhotos.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Camera size={12} /> Before ({beforePhotos.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {beforePhotos.map((p, i) => <PhotoCard key={i} photo={p} label={`Before ${i + 1}`} />)}
                  </div>
                </div>
              )}

              {afterPhotos.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500" /> After ({afterPhotos.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {afterPhotos.map((p, i) => <PhotoCard key={i} photo={p} label={`After ${i + 1}`} />)}
                  </div>
                </div>
              )}

              {damagePhotos.length > 0 && (
                <div>
                  <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle size={12} /> Damage Photos ({damagePhotos.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {damagePhotos.map((p, i) => <PhotoCard key={i} photo={p} label={`Damage ${i + 1}`} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Job Photos</h2>
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-300">
                <Camera size={40} />
                <p className="text-sm font-bold text-slate-400">No photos uploaded yet</p>
              </div>
            </div>
          )}

          {/* Worker Report */}
          {booking.workerReport && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={12} /> Worker Report
              </h2>
              <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{booking.workerReport}</p>
            </div>
          )}

          {/* Job Details */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Job Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Service", value: booking.service },
                { label: "Date", value: booking.schedule?.date ? new Date(booking.schedule.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : null },
                { label: "Time Slot", value: booking.schedule?.timeSlot },
                { label: "Address", value: booking.details?.address },
                { label: "Postcode", value: booking.details?.postcode },
                { label: "Duration (booked)", value: booking.details?.duration ? `${booking.details.duration} hrs` : null },
                { label: "Bedrooms", value: booking.details?.bedrooms || booking.property?.bedrooms },
                { label: "Bathrooms", value: booking.details?.bathrooms || booking.property?.bathrooms },
                { label: "Kitchens", value: booking.details?.kitchens || booking.property?.kitchens },
                { label: "Reception Rooms", value: booking.details?.receptionRooms || booking.property?.receptionRooms },
                { label: "Pet", value: booking.details?.hasPet || (booking.details?.extras && typeof booking.details.extras === "object" ? null : null) },
                { label: "Notes", value: booking.details?.notes || booking.details?.specialInstructions },
                { label: "Supplies By", value: booking.suppliesProvidedBy },
                { label: "Lead Source", value: booking.leadSource },
              ].filter(f => f.value != null && f.value !== "").map(({ label, value }) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-bold text-slate-700">{String(value)}</p>
                </div>
              ))}
            </div>

            {extras.length > 0 && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Extras</p>
                <div className="flex flex-wrap gap-2">
                  {extras.map((e, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700">
                      {e.name} × {e.qty}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* Customer */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Customer</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                {booking.customer?.firstName?.charAt(0)}
              </div>
              <div>
                <p className="font-black text-primary-dark">{booking.customer?.firstName} {booking.customer?.lastName}</p>
                <p className="text-xs text-slate-500 font-bold">{booking.customer?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              {booking.customer?.phone && (
                <a href={`tel:${booking.customer.phone}`} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                  <Phone size={14} className="text-slate-400" /> {booking.customer.phone}
                </a>
              )}
              {booking.customer?.email && (
                <a href={`mailto:${booking.customer.email}`} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                  <Mail size={14} className="text-slate-400" /> {booking.customer.email}
                </a>
              )}
            </div>
          </div>

          {/* Worker */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Assigned Worker</h2>
            {booking.assignedWorkerName ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                    {booking.assignedWorkerName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-primary-dark">{booking.assignedWorkerName}</p>
                    {worker && <p className="text-xs text-slate-500 font-bold">{worker.email}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  {worker?.phone && (
                    <a href={`tel:${worker.phone}`} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                      <Phone size={14} className="text-slate-400" /> {worker.phone}
                    </a>
                  )}
                  {booking.workerRate && (
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Briefcase size={14} className="text-slate-400" /> £{booking.workerRate}/hr
                    </div>
                  )}
                  {booking.jobAcceptedTime && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Clock size={12} /> Accepted {fmt(booking.jobAcceptedTime)}
                    </div>
                  )}
                </div>
                {worker && (
                  <Link
                    to={`/admin/workers`}
                    className="mt-4 flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
                  >
                    View worker profile <ChevronRight size={12} />
                  </Link>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-300">
                <User size={32} />
                <p className="text-sm font-bold text-slate-400">Not yet assigned</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Amount</span>
                <span className="text-lg font-black text-primary-dark">
                  {booking.payment?.currency === "GBP" ? "£" : "₦"}{booking.payment?.amount || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Status</span>
                <span className={`text-xs font-black uppercase px-2 py-1 rounded-full border ${
                  booking.payment?.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  booking.payment?.status === "Authorized" ? "bg-sky-50 text-sky-700 border-sky-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {booking.payment?.status || "Pending"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Method</span>
                <span className="text-sm font-bold text-slate-700">{booking.payment?.method || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Billing</span>
                <span className="text-sm font-bold text-slate-700 capitalize">{booking.payment?.billingType || "hourly"}</span>
              </div>
              {booking.noPaymentRequired && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-500">
                  No payment required (paid outside system)
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to={`/admin/bookings`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-primary/5 transition-colors group"
              >
                <span className="text-sm font-bold text-slate-700 group-hover:text-primary">All Bookings</span>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-primary" />
              </Link>
              <Link
                to={`/admin/chat`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-primary/5 transition-colors group"
              >
                <span className="text-sm font-bold text-slate-700 group-hover:text-primary">Open Chat</span>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-primary" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
