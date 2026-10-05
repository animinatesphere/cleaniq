import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat, PauseCircle, PlayCircle, XCircle, RefreshCw, AlertCircle, Calendar } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const STATUS = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  paused: { label: "Paused", cls: "bg-amber-50 text-amber-600 border-amber-100" },
  cancelled: { label: "Cancelled", cls: "bg-slate-50 text-slate-500 border-slate-100" },
};

const money = (n) => `£${Number(n || 0).toFixed(2)}`;
const every = (f) => ({ Weekly: "Every week", Fortnightly: "Every two weeks", Monthly: "Every month", Quarterly: "Every 3 months" }[f] || f);
const when = (d) =>
  new Date(d).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

// Customer's regular cleans: see the next visit, pause, resume or cancel.
// Pausing/cancelling with under 24 hours' notice shows the late-notice fee before confirming.
export default function RegularCleans({ authFetch, onChanged }) {
  const [subs, setSubs] = useState(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null); // { sub, action, fee, rule }
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await authFetch(`${API}/subscriptions/my`);
      const data = await res.json();
      setSubs(Array.isArray(data) ? data : []);
    } catch {
      setSubs([]);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ask = async (sub, action) => {
    setError("");
    if (action === "resume") return run(sub, action);
    try {
      const res = await authFetch(`${API}/subscriptions/my/${sub._id}/cancellation-fee`);
      const q = await res.json();
      setConfirm({ sub, action, fee: q.fee || 0, rule: q.rule || "", paid: Boolean(q.nextVisitPaid), refund: q.refund || 0 });
    } catch {
      setConfirm({ sub, action, fee: 0, rule: "" });
    }
  };

  const run = async (sub, action) => {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`${API}/subscriptions/my/${sub._id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      setConfirm(null);
      await load();
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (subs === null) {
    return (
      <div className="text-center py-20">
        <RefreshCw size={32} className="text-primary mx-auto animate-spin mb-4" />
        <p className="font-bold text-slate-400">Loading your regular cleans…</p>
      </div>
    );
  }

  if (!subs.length) {
    return (
      <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
        <Repeat size={40} className="text-slate-200 mx-auto mb-4" />
        <p className="font-extrabold text-primary-dark mb-1">No regular cleans yet</p>
        <p className="text-sm text-slate-400 font-medium">Choose Weekly or Fortnightly when you book to set one up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4">
          <AlertCircle size={16} className="shrink-0" /> <p className="font-bold text-sm">{error}</p>
        </div>
      )}
      {subs.map((s) => {
        const st = STATUS[s.status] || STATUS.cancelled;
        return (
          <div key={s._id} className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-extrabold text-primary-dark text-lg">{s.service}</p>
                <p className="text-sm text-slate-500 font-semibold">
                  {every(s.frequency)} · {money(s.pricePerVisit)} per clean
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${st.cls}`}>{st.label}</span>
            </div>
            {s.status === "active" && s.nextVisit && (
              <p className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-4">
                <Calendar size={15} className="text-primary" /> Next clean: {when(s.nextVisit.schedule.date)}
              </p>
            )}
            <p className="text-xs text-slate-400 font-semibold mb-4">
              Charged to your saved card 48 hours before each clean. Ref {s.subscriptionRef}
            </p>
            <div className="flex flex-wrap gap-2">
              {s.status === "active" && (
                <button onClick={() => ask(s, "pause")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-200 text-amber-700 text-xs font-black hover:bg-amber-50">
                  <PauseCircle size={14} /> Pause
                </button>
              )}
              {s.status === "paused" && (
                <button disabled={busy} onClick={() => ask(s, "resume")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black disabled:opacity-60">
                  <PlayCircle size={14} /> Resume
                </button>
              )}
              {s.status !== "cancelled" && (
                <button onClick={() => ask(s, "cancel")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-black hover:bg-rose-50">
                  <XCircle size={14} /> Cancel regular clean
                </button>
              )}
            </div>
          </div>
        );
      })}

      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={() => !busy && setConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} className="bg-white rounded-[28px] p-7 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-extrabold text-primary-dark mb-2">
                {confirm.action === "pause" ? "Pause your regular clean?" : "Cancel your regular clean?"}
              </h2>
              <p className="text-sm text-slate-500 font-medium mb-4">
                {confirm.action === "pause"
                  ? "Your upcoming cleans will be cancelled until you resume."
                  : "All your upcoming cleans will be cancelled."}
              </p>
              {confirm.fee > 0 ? (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-5 text-sm text-amber-800 font-bold">
                  Your next clean is less than {confirm.rule.includes("2 hours") ? "2" : "24"} hours away, so a late-notice charge of{" "}
                  {money(confirm.fee)} applies
                  {confirm.paid
                    ? `. It's already paid, so ${money(confirm.refund)} will be refunded to your card.`
                    : " and will be taken from your saved card."}
                </div>
              ) : (
                <p className="text-sm text-emerald-700 font-bold mb-5">
                  No charge: you&apos;re giving at least 24 hours&apos; notice.
                  {confirm.paid && confirm.refund > 0 ? ` Your next clean is already paid, so ${money(confirm.refund)} will be refunded in full.` : ""}
                </p>
              )}
              <div className="flex gap-3">
                <button disabled={busy} onClick={() => setConfirm(null)} className="flex-1 py-3 rounded-xl border border-slate-200 font-black text-sm text-slate-600">
                  Keep it
                </button>
                <button disabled={busy} onClick={() => run(confirm.sub, confirm.action)}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-black text-sm disabled:opacity-60">
                  {busy ? "Please wait…" : confirm.action === "pause" ? "Pause" : "Cancel it"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
