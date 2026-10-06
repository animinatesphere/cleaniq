import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Copy, Share2, MousePointerClick, Users, CalendarCheck, Wallet, CheckCircle2, LogOut, Landmark, Loader2 } from "lucide-react";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

// A creator's own page: their code and link, earnings and the bookings that came through them
// (server routes/creators.js → GET /api/creators/me).
const API = import.meta.env.VITE_API_URL;
const money = (n) => `£${Number(n || 0).toFixed(2)}`;
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const STATUS = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  earned: { label: "Earned", cls: "bg-emerald-50 text-emerald-700" },
  paid: { label: "Paid", cls: "bg-sky-50 text-sky-700" },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-500" },
};
const RULES = { first: "their first booking", months: "bookings within", forever: "every booking they make" };

export default function CreatorDashboard() {
  const { customer, loading, logout, authFetch } = useCustomerAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [bank, setBank] = useState({ accountName: "", sortCode: "", accountNumber: "" });
  const [bankMsg, setBankMsg] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!customer) return navigate("/account/login?returnTo=/account/creator", { replace: true });
    if (customer.role !== "creator") return navigate("/account/dashboard", { replace: true });
    authFetch(`${API}/creators/me`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || "Couldn't load your dashboard");
        setMe(d);
        setBank({ accountName: d.bank?.accountName || "", sortCode: d.bank?.sortCode || "", accountNumber: d.bank?.accountNumber || "" });
      })
      .catch((e) => setError(e.message));
  }, [customer, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = (text, what) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(""), 2000); }).catch(() => {});
  };
  const share = () => {
    const text = `Book a professional clean with Cleaniq Services${me.rules.discountPercent > 0 ? ` and get ${me.rules.discountPercent}% off with my code ${me.code}` : ` — use my code ${me.code}`}: ${me.link}`;
    if (navigator.share) navigator.share({ title: "Cleaniq Services", text, url: me.link }).catch(() => {});
    else copy(text, "message");
  };
  const saveBank = async (e) => {
    e.preventDefault();
    setBankMsg("");
    const r = await authFetch(`${API}/creators/me/bank`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bank) });
    const d = await r.json().catch(() => ({}));
    setBankMsg(r.ok ? "Saved — payouts go to this account." : d.message || "Couldn't save");
  };

  if (error) return <div className="min-h-screen bg-slate-50 px-4 pt-32 text-center font-bold text-rose-600">{error}</div>;
  if (!me) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" /></div>;

  const s = me.stats;
  const countText = me.rules.countRule === "months" ? `bookings within ${me.rules.countMonths} months` : RULES[me.rules.countRule];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-28 md:pt-32">
      <Helmet><title>Creator dashboard | Cleaniq Services</title><meta name="robots" content="noindex" /></Helmet>
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">Creator dashboard</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Hi {me.name.split(" ")[0]} 👋</h1>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">
            <LogOut size={15} /> Log out
          </button>
        </div>

        {!me.active && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">Your code is paused at the moment. Contact Cleaniq if you think this is a mistake.</div>
        )}

        {/* Code and link */}
        <div className="rounded-[28px] bg-gradient-to-br from-[#0B2D22] to-[#036847] p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-200">Your code</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="font-mono text-4xl font-black tracking-wider">{me.code}</span>
            <button onClick={() => copy(me.code, "code")} className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25"><Copy size={13} /> {copied === "code" ? "Copied!" : "Copy"}</button>
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-widest text-emerald-200">Your link</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="break-all rounded-xl bg-black/20 px-3 py-2 text-sm font-semibold">{me.link}</span>
            <button onClick={() => copy(me.link, "link")} className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25"><Copy size={13} /> {copied === "link" ? "Copied!" : "Copy"}</button>
            <button onClick={share} className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-primary"><Share2 size={13} /> {copied === "message" ? "Message copied!" : "Share"}</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Book a professional clean with Cleaniq Services — use my code ${me.code}: ${me.link}`)}`}
              target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-emerald-950">WhatsApp</a>
          </div>
          <p className="mt-5 text-sm text-white/75">
            You earn <b className="text-white">{me.rules.commissionPercent}%</b> of each booking (before tax) — on {countText} from the customers you bring.
            {me.rules.discountPercent > 0 && <> Your followers get <b className="text-white">{me.rules.discountPercent}% off</b>{me.rules.discountAppliesTo === "first" ? " their first booking" : ""}.</>}
            {" "}Commission is earned once the clean is done and paid.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            [MousePointerClick, "Link clicks", me.clicks],
            [Users, "Customers", s.customers],
            [CalendarCheck, "Bookings", s.bookings],
            [Wallet, "Earned (to be paid)", money(s.earned)],
            [CheckCircle2, "Paid to you", money(s.paid)],
          ].map(([Icon, t, v]) => (
            <div key={t} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-400"><Icon size={14} /><span className="text-[11px] font-bold uppercase tracking-wider">{t}</span></div>
              <p className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">{v}</p>
            </div>
          ))}
        </div>

        {/* Bookings */}
        <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">Bookings from your customers</h2></div>
          {me.bookings.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No bookings yet — share your link to get started.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {me.bookings.map((b) => {
                const st = STATUS[b.commission?.status] || STATUS.pending;
                return (
                  <div key={b.bookingId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{b.service}</p>
                      <p className="text-xs text-slate-500">{b.customer} · {day(b.date)} · {b.bookingId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black tabular-nums text-slate-900">{b.commission?.status === "pending" ? `${b.commission?.percent}%` : money(b.commission?.amount)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bank details */}
        <form onSubmit={saveBank} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 font-black text-slate-900"><Landmark size={17} className="text-primary" /> Where should we pay you?</h2>
          <p className="mt-1 text-sm text-slate-500">Your earned commission is paid by bank transfer.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[["accountName", "Account name", "A Smith"], ["sortCode", "Sort code", "12-34-56"], ["accountNumber", "Account number", "12345678"]].map(([k, t, ph]) => (
              <label key={k} className="block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-400">{t}</span>
                <input value={bank[k]} onChange={(e) => setBank({ ...bank, [k]: e.target.value })} placeholder={ph}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base font-semibold text-slate-800 focus:border-primary focus:outline-none sm:text-sm" />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">Save bank details</button>
            {bankMsg && <span className="text-sm font-semibold text-slate-600">{bankMsg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
