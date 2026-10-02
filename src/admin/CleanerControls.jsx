import React, { useEffect, useState } from "react";
import { Banknote, Check, Pencil, RefreshCw, UserMinus, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const admTok = () => localStorage.getItem("adminToken") || "";

// Booking → cleaner: set what the cleaner is paid per hour for this booking, and remove the
// assigned cleaner. onChange(patch) gets the fields that changed so the page can update.
export default function CleanerControls({ booking, onChange }) {
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => { setRate(booking?.workerRate != null ? String(booking.workerRate) : ""); }, [booking?.workerRate]);
  if (!booking) return null;

  const id = booking._id || booking.bookingId;
  const finished = ["Completed", "Completed - Unpaid"].includes(booking.status);
  const assigned = !!(booking.assignedWorker || booking.assignedWorkerName);
  const cleanerName = booking.assignedWorker?.firstName
    ? `${booking.assignedWorker.firstName} ${booking.assignedWorker.lastName || ""}`.trim()
    : booking.assignedWorkerName || "the cleaner";

  const call = async (path, body) => {
    const res = await fetch(`${API}/workers/jobs/${id}/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${admTok()}` },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  };

  const savePay = async () => {
    setBusy("pay");
    setMsg({ type: "", text: "" });
    try {
      const data = await call("pay", { workerRate: parseFloat(rate) });
      onChange?.({ workerRate: data.booking.workerRate, workerRateBonus: data.booking.workerRateBonus });
      setEditing(false);
      setMsg({ type: "ok", text: data.message });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setBusy("");
    }
  };

  const unassign = async () => {
    if (!window.confirm(`Remove ${cleanerName} from this booking?\n\nThey'll be told, and the booking goes back on the job feed so another cleaner can take it.`)) return;
    setBusy("unassign");
    setMsg({ type: "", text: "" });
    try {
      const data = await call("unassign");
      const b = data.booking;
      onChange?.({
        assignedWorker: null, assignedWorkerName: null, status: b.status,
        jobAcceptedTime: null, jobArrivedTime: null, jobStartTime: null, jobEndTime: null,
        workerRate: b.workerRate, workerRateBonus: b.workerRateBonus,
      });
      setMsg({ type: "ok", text: data.message });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#071D16] border border-white/7">
        <Banknote size={14} className="text-white/30 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Cleaner pay</p>
          {editing ? (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-white/40 text-sm font-bold">£</span>
              <input
                type="number" min="0" step="0.25" autoFocus value={rate}
                onChange={(e) => setRate(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") savePay(); if (e.key === "Escape") setEditing(false); }}
                className="w-24 px-2 py-1 rounded-lg bg-white/5 border border-emerald-500/40 text-white font-black text-center focus:outline-none"
              />
              <span className="text-white/40 text-sm font-bold">/hr</span>
              <button onClick={savePay} disabled={busy === "pay" || !(parseFloat(rate) > 0)} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50" title="Save">
                {busy === "pay" ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
              </button>
              <button onClick={() => { setEditing(false); setRate(String(booking.workerRate ?? "")); }} className="p-1.5 rounded-lg bg-white/10 text-white/50 hover:bg-white/20" title="Cancel">
                <X size={13} />
              </button>
            </div>
          ) : (
            <p className="text-sm font-bold text-white/80">
              {booking.workerRate ? `£${Number(booking.workerRate).toFixed(2)}/hr` : "Not set"}
              {booking.workerRateBonus > 0 && (
                <span className="block text-[10px] font-black text-amber-300">incl. £{Number(booking.workerRateBonus).toFixed(2)} top-rated bonus</span>
              )}
            </p>
          )}
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10" title="Change the cleaner's pay for this booking">
            <Pencil size={12} /> Change
          </button>
        )}
      </div>

      {assigned && !finished && (
        <button
          onClick={unassign}
          disabled={busy === "unassign"}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm font-bold hover:bg-rose-500/20 disabled:opacity-60"
        >
          {busy === "unassign" ? <RefreshCw size={14} className="animate-spin" /> : <UserMinus size={14} />}
          Remove cleaner
        </button>
      )}

      {msg.text && (
        <p className={`text-xs font-bold ${msg.type === "ok" ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
