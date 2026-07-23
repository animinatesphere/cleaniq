import { useState, useEffect } from "react";
import {
  Search, CheckCircle2, XCircle, Clock, Briefcase,
  MapPin, Calendar, ChevronRight, User, X, Building2,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const STATUS_META = {
  pending_review: { label: "Pending Review", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25"   },
  approved:       { label: "Approved",        cls: "bg-sky-500/15 text-sky-400 border-sky-500/25"         },
  assigned:       { label: "Worker Assigned", cls: "bg-violet-500/15 text-violet-400 border-violet-500/25"},
  in_progress:    { label: "In Progress",     cls: "bg-blue-500/15 text-blue-400 border-blue-500/25"      },
  completed:      { label: "Completed",       cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"},
  cancelled:      { label: "Cancelled",       cls: "bg-white/5 text-white/40 border-white/10"             },
  rejected:       { label: "Rejected",        cls: "bg-rose-500/15 text-rose-400 border-rose-500/25"      },
};

const TABS = [
  { key: "all",           label: "All"      },
  { key: "pending_review",label: "Pending"  },
  { key: "approved",      label: "Approved" },
  { key: "assigned",      label: "Assigned" },
  { key: "in_progress",   label: "Active"   },
  { key: "completed",     label: "Done"     },
  { key: "rejected",      label: "Rejected" },
];

export default function CompanyJobs() {
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("all");
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acting,    setActing]    = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/jobs`);
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const filtered = jobs.filter(j => {
    if (tab !== "all" && j.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        j.jobId?.toLowerCase().includes(q) ||
        j.service?.toLowerCase().includes(q) ||
        j.company?.name?.toLowerCase().includes(q) ||
        j.property?.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const approve = async (id) => {
    setActing(true);
    try {
      const res = await fetch(`${API}/jobs/${id}/approve`, { method: "PUT" });
      if (res.ok) { await fetchJobs(); setSelected(null); }
    } catch {}
    finally { setActing(false); }
  };

  const reject = async (id) => {
    if (!rejectReason.trim()) return;
    setActing(true);
    try {
      const res = await fetch(`${API}/jobs/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) { await fetchJobs(); setSelected(null); setRejecting(false); setRejectReason(""); }
    } catch {}
    finally { setActing(false); }
  };

  const counts = {
    pending_review: jobs.filter(j => j.status === "pending_review").length,
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 size={24} className="text-emerald-400" />
            Company Jobs
          </h1>
          <p className="text-white/40 text-sm mt-1">Jobs posted by company accounts — review and approve before assigning workers</p>
        </div>
        {counts.pending_review > 0 && (
          <div className="bg-amber-500/15 border border-amber-500/25 text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold">
            {counts.pending_review} pending review
          </div>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key ? "bg-emerald-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t.label}
              {t.key === "pending_review" && counts.pending_review > 0 && (
                <span className="ml-1.5 bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{counts.pending_review}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 w-56"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-white/40 py-20">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
          <p>No jobs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(job => {
            const m = STATUS_META[job.status] || STATUS_META.pending_review;
            return (
              <div
                key={job._id}
                onClick={() => setSelected(job)}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/8 hover:border-white/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-400 text-xs font-bold">{job.jobId}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>
                  </div>
                  <p className="font-semibold text-sm">{job.service}</p>
                  <div className="flex items-center gap-3 mt-1 text-white/40 text-xs">
                    {job.company?.name && (
                      <span className="flex items-center gap-1"><User size={11} />{job.company.name}</span>
                    )}
                    {job.property?.address && (
                      <span className="flex items-center gap-1 truncate"><MapPin size={11} />{job.property.address}</span>
                    )}
                    {job.schedule?.date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(job.schedule.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/30 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setRejecting(false); setRejectReason(""); }}>
          <div className="bg-[#0F1628] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <p className="text-emerald-400 text-sm font-bold">{selected.jobId}</p>
                <h2 className="text-lg font-bold mt-0.5">{selected.service}</h2>
              </div>
              <button onClick={() => { setSelected(null); setRejecting(false); setRejectReason(""); }} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status */}
              <div>
                {(() => { const m = STATUS_META[selected.status] || STATUS_META.pending_review; return (
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${m.cls}`}>{m.label}</span>
                ); })()}
              </div>

              {/* Company */}
              <Section title="Company">
                <InfoRow label="Name"  value={selected.company?.name}  />
                <InfoRow label="Email" value={selected.company?.email} />
                <InfoRow label="Phone" value={selected.company?.phone} />
              </Section>

              {/* Property */}
              <Section title="Property">
                <InfoRow label="Address"   value={selected.property?.address} />
                <InfoRow label="Postcode"  value={selected.property?.postcode} />
                <InfoRow label="Region"    value={selected.region} />
                <InfoRow label="Bedrooms"  value={selected.details?.bedrooms} />
                <InfoRow label="Bathrooms" value={selected.details?.bathrooms} />
              </Section>

              {/* Schedule */}
              <Section title="Schedule">
                <InfoRow label="Date" value={selected.schedule?.date ? new Date(selected.schedule.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null} />
                <InfoRow label="Time" value={selected.schedule?.preferredTime} />
                <InfoRow label="Duration" value={selected.details?.duration ? `${selected.details.duration} hours` : null} />
              </Section>

              {/* Worker */}
              {selected.assignedWorkerName && (
                <Section title="Assigned Worker">
                  <InfoRow label="Worker" value={selected.assignedWorkerName} />
                </Section>
              )}

              {/* Notes */}
              {selected.notes && (
                <Section title="Notes">
                  <p className="text-sm text-white/70 leading-relaxed">{selected.notes}</p>
                </Section>
              )}

              {/* Reject reason */}
              {selected.rejectedReason && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-rose-400 text-sm font-semibold">Rejection reason</p>
                  <p className="text-white/60 text-sm mt-1">{selected.rejectedReason}</p>
                </div>
              )}

              {/* Actions */}
              {selected.status === "pending_review" && (
                <div className="space-y-3 pt-2">
                  {!rejecting ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => approve(selected._id)}
                        disabled={acting}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        {acting ? "Approving..." : "Approve & Create Booking"}
                      </button>
                      <button
                        onClick={() => setRejecting(true)}
                        className="flex items-center justify-center gap-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 text-rose-400 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection (required)..."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 outline-none focus:border-rose-500/50 resize-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => reject(selected._id)}
                          disabled={acting || !rejectReason.trim()}
                          className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                        >
                          {acting ? "Rejecting..." : "Confirm Rejection"}
                        </button>
                        <button onClick={() => { setRejecting(false); setRejectReason(""); }} className="bg-white/5 text-white/50 px-4 py-3 rounded-xl text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Section = ({ title, children }) => (
  <div>
    <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">{title}</p>
    <div className="bg-white/4 rounded-xl p-3 space-y-2">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  value ? (
    <div className="flex justify-between items-start gap-4">
      <span className="text-white/40 text-sm shrink-0">{label}</span>
      <span className="text-white text-sm font-medium text-right">{value}</span>
    </div>
  ) : null
);
