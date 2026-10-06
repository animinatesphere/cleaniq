import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgePercent, Copy, UserPlus, Pencil, Wallet, MousePointerClick, Users, CheckCircle2, X, RefreshCw, Save, Search,
} from "lucide-react";

// Creator / influencer programme (server/utils/creators.js): programme rules, creators and the
// commissions they've earned. Commission = % of the booking before tax, earned once the clean is
// done and paid.
const API = import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api";
const headers = () => {
  const token = localStorage.getItem("adminToken") || "";
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};
const money = (n) => `£${Number(n || 0).toFixed(2)}`;
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const RULES = { first: "First booking only", months: "Bookings within N months", forever: "Every booking (forever)" };
const STATUS = {
  pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-300" },
  earned: { label: "Owed", cls: "bg-emerald-500/15 text-emerald-300" },
  paid: { label: "Paid", cls: "bg-sky-500/15 text-sky-300" },
  cancelled: { label: "Cancelled", cls: "bg-white/5 text-white/40" },
};
const input = "w-full rounded-xl border border-white/10 bg-[#071D16] px-3.5 py-2.5 text-sm font-semibold text-white placeholder:text-white/25 focus:border-emerald-500/50 focus:outline-none";
const label = "mb-1.5 block text-[10px] font-black uppercase tracking-wider text-white/40";

function Field({ title, hint, children }) {
  return (
    <label className="block">
      <span className={label}>{title}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-white/35">{hint}</span>}
    </label>
  );
}

const ruleText = (r) => (r.countRule === "months" ? `Bookings within ${r.countMonths} months` : RULES[r.countRule]);

export default function Commission() {
  const [tab, setTab] = useState("creators");
  const [settings, setSettings] = useState(null);
  const [creators, setCreators] = useState([]);
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("earned");
  const [creatorFilter, setCreatorFilter] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState([]);
  const [payRef, setPayRef] = useState("");
  const [editing, setEditing] = useState(null); // creator object or {} for new
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const show = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        fetch(`${API}/creators/admin/settings`, { headers: headers() }).then((r) => r.json()),
        fetch(`${API}/creators/admin`, { headers: headers() }).then((r) => r.json()),
      ]);
      setSettings(s);
      setCreators(Array.isArray(c) ? c : []);
    } catch {
      show("Couldn't load the creator programme", "err");
    }
  }, []);

  const loadRows = useCallback(async () => {
    const qs = new URLSearchParams({ ...(statusFilter ? { status: statusFilter } : {}), ...(creatorFilter ? { creatorId: creatorFilter } : {}) });
    const r = await fetch(`${API}/creators/admin/commissions?${qs}`, { headers: headers() }).then((x) => x.json()).catch(() => []);
    setRows(Array.isArray(r) ? r : []);
    setPicked([]);
  }, [statusFilter, creatorFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "commissions") loadRows(); }, [tab, loadRows]);

  const saveSettings = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/creators/admin/settings`, { method: "PUT", headers: headers(), body: JSON.stringify(settings) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Couldn't save");
      setSettings(data);
      show("Programme settings saved");
      load();
    } catch (e) {
      show(e.message, "err");
    } finally {
      setBusy(false);
    }
  };

  const saveCreator = async () => {
    const isNew = !editing._id;
    setBusy(true);
    try {
      const body = { ...editing };
      for (const k of ["commissionPercent", "discountPercent", "countMonths"]) if (body[k] === "") body[k] = null;
      if (body.countRule === "") body.countRule = null;
      const r = await fetch(isNew ? `${API}/creators/admin` : `${API}/creators/admin/${editing._id}`, {
        method: isNew ? "POST" : "PUT", headers: headers(), body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Couldn't save");
      show(isNew ? `Creator added — login details emailed to ${data.email}` : "Creator updated");
      setEditing(null);
      load();
    } catch (e) {
      show(e.message, "err");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (c) => {
    await fetch(`${API}/creators/admin/${c._id}`, { method: "PUT", headers: headers(), body: JSON.stringify({ active: !c.active }) });
    show(c.active ? `${c.firstName}'s code is paused` : `${c.firstName}'s code is active again`);
    load();
  };

  const markPaid = async () => {
    if (!picked.length) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}/creators/admin/payouts`, { method: "POST", headers: headers(), body: JSON.stringify({ bookingIds: picked, reference: payRef }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Couldn't record the payout");
      show(`${data.paid} commission${data.paid === 1 ? "" : "s"} marked as paid`);
      setPayRef("");
      loadRows();
      load();
    } catch (e) {
      show(e.message, "err");
    } finally {
      setBusy(false);
    }
  };

  const copy = (text, what) => {
    navigator.clipboard?.writeText(text).then(() => show(`${what} copied`)).catch(() => {});
  };

  const totals = useMemo(() => creators.reduce((t, c) => ({
    owed: t.owed + (c.stats?.earned || 0), paid: t.paid + (c.stats?.paid || 0),
    bookings: t.bookings + (c.stats?.bookings || 0), clicks: t.clicks + (c.clicks || 0),
  }), { owed: 0, paid: 0, bookings: 0, clicks: 0 }), [creators]);

  const shown = rows.filter((b) => {
    if (!search.trim()) return true;
    const hay = `${b.bookingId} ${b.service} ${b.customer?.firstName} ${b.customer?.lastName} ${b.customer?.email} ${b.creator?.name} ${b.creator?.code}`.toLowerCase();
    return hay.includes(search.trim().toLowerCase());
  });
  const pickedTotal = shown.filter((b) => picked.includes(b._id)).reduce((s, b) => s + (b.creatorCommission?.amount || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15">
            <BadgePercent size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Commission</h1>
            <p className="text-sm text-white/40">Creators &amp; influencers · commission is earned once a clean is done and paid</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { load(); if (tab === "commissions") loadRows(); }} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setEditing({ firstName: "", lastName: "", email: "", phone: "", code: "", commissionPercent: "", discountPercent: "", countRule: "", countMonths: "" })}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400">
            <UserPlus size={15} /> Add creator
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [Wallet, "Owed to creators", money(totals.owed)],
          [CheckCircle2, "Paid out", money(totals.paid)],
          [Users, "Bookings from creators", totals.bookings],
          [MousePointerClick, "Link clicks", totals.clicks],
        ].map(([Icon, t, v]) => (
          <div key={t} className="rounded-2xl border border-white/10 bg-[#0B2D22] p-4">
            <div className="flex items-center gap-2 text-white/40"><Icon size={14} /><span className="text-[11px] font-bold uppercase tracking-wider">{t}</span></div>
            <p className="mt-2 text-2xl font-black text-white">{v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[["creators", "Creators"], ["commissions", "Commissions & payouts"], ["settings", "Programme settings"]].map(([id, t]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${tab === id ? "border-transparent bg-emerald-500 text-white" : "border-white/10 bg-white/5 text-white/50 hover:text-white/80"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Creators */}
      {tab === "creators" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B2D22]">
          {creators.length === 0 ? (
            <p className="p-8 text-center text-sm text-white/40">No creators yet. Click “Add creator” to give an influencer their code and login.</p>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/35">
                  <th className="px-4 py-3">Creator</th><th className="px-4 py-3">Code &amp; link</th><th className="px-4 py-3">Rules</th>
                  <th className="px-4 py-3 text-right">Clicks</th><th className="px-4 py-3 text-right">Bookings</th>
                  <th className="px-4 py-3 text-right">Owed</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {creators.map((c) => (
                  <tr key={c._id} className="border-b border-white/5 align-top">
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-white/40">{c.email}</p>
                      {!c.active && <span className="mt-1 inline-block rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">Paused</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => copy(c.code, "Code")} className="flex items-center gap-1.5 font-mono font-bold text-emerald-300 hover:text-emerald-200">{c.code} <Copy size={12} /></button>
                      <button onClick={() => copy(c.link, "Link")} className="mt-1 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70">Copy link <Copy size={11} /></button>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/60">
                      <p><b className="text-white">{c.rules.commissionPercent}%</b> commission{c.commissionPercent === null ? "" : " (own)"}</p>
                      <p>{c.rules.discountPercent}% customer discount{c.discountPercent === null ? "" : " (own)"}</p>
                      <p>{ruleText(c.rules)}{c.countRule === null ? "" : " (own)"}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/70">{c.clicks}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/70">{c.stats.bookings}<span className="block text-[11px] text-white/35">{c.stats.customers} customers</span></td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-300">{money(c.stats.earned)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/60">{money(c.stats.paid)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setCreatorFilter(c._id); setStatusFilter(""); setTab("commissions"); }} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/60 hover:bg-white/10">Bookings</button>
                        <button onClick={() => setEditing({ ...c, commissionPercent: c.commissionPercent ?? "", discountPercent: c.discountPercent ?? "", countRule: c.countRule ?? "", countMonths: c.countMonths ?? "" })}
                          className="rounded-lg bg-white/5 p-1.5 text-white/60 hover:bg-white/10" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => toggleActive(c)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${c.active ? "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"}`}>
                          {c.active ? "Pause" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Commissions */}
      {tab === "commissions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[["earned", "Owed"], ["pending", "Pending"], ["paid", "Paid"], ["cancelled", "Cancelled"], ["", "All"]].map(([id, t]) => (
              <button key={t} onClick={() => setStatusFilter(id)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold ${statusFilter === id ? "border-transparent bg-emerald-500 text-white" : "border-white/10 bg-white/5 text-white/50"}`}>{t}</button>
            ))}
            <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} className={`${input} w-auto py-2 text-xs`}>
              <option value="">All creators</option>
              {creators.map((c) => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.code})</option>)}
            </select>
            <div className="relative ml-auto w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bookings…" className={`${input} pl-9`} />
            </div>
          </div>

          {statusFilter === "earned" && shown.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm text-white/70"><b className="text-white">{picked.length}</b> selected · <b className="text-emerald-300">{money(pickedTotal)}</b></p>
              <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Payout reference (e.g. bank transfer 6 Oct)" className={`${input} max-w-xs py-2`} />
              <button onClick={markPaid} disabled={!picked.length || busy} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Mark as paid</button>
              <p className="w-full text-[11px] text-white/35">Pay the creator by bank transfer first, then mark those commissions as paid here.</p>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B2D22]">
            {shown.length === 0 ? (
              <p className="p-8 text-center text-sm text-white/40">Nothing here.</p>
            ) : (
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/35">
                    <th className="px-4 py-3">
                      {statusFilter === "earned" && (
                        <input type="checkbox" checked={picked.length === shown.length} onChange={(e) => setPicked(e.target.checked ? shown.map((b) => b._id) : [])} className="accent-emerald-500" />
                      )}
                    </th>
                    <th className="px-4 py-3">Booking</th><th className="px-4 py-3">Creator</th><th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Booking</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((b) => {
                    const st = STATUS[b.creatorCommission?.status] || STATUS.pending;
                    return (
                      <tr key={b._id} className="border-b border-white/5">
                        <td className="px-4 py-3">
                          {b.creatorCommission?.status === "earned" && statusFilter === "earned" && (
                            <input type="checkbox" checked={picked.includes(b._id)} className="accent-emerald-500"
                              onChange={(e) => setPicked((p) => (e.target.checked ? [...p, b._id] : p.filter((x) => x !== b._id)))} />
                          )}
                        </td>
                        <td className="px-4 py-3"><p className="font-bold text-white">{b.bookingId}</p><p className="text-xs text-white/40">{b.service} · {day(b.schedule?.date)}</p></td>
                        <td className="px-4 py-3 text-white/70">{b.creator?.name}<span className="block font-mono text-xs text-emerald-300/70">{b.creator?.code}</span></td>
                        <td className="px-4 py-3 text-white/70">{b.customer?.firstName} {b.customer?.lastName}<span className="block text-xs text-white/35">{b.status}</span></td>
                        <td className="px-4 py-3 text-right tabular-nums text-white/70">{money(b.payment?.amount)}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-white">
                          {b.creatorCommission?.status === "pending" ? <span className="text-white/40">{b.creatorCommission?.percent}%</span> : money(b.creatorCommission?.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                          {b.creatorCommission?.status === "paid" && <span className="mt-1 block text-[11px] text-white/35">{day(b.creatorCommission.paidAt)}{b.creatorCommission.payoutRef ? ` · ${b.creatorCommission.payoutRef}` : ""}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Programme settings */}
      {tab === "settings" && settings && (
        <div className="max-w-3xl space-y-5 rounded-2xl border border-white/10 bg-[#0B2D22] p-6">
          <label className="flex items-center justify-between gap-4 rounded-xl bg-white/5 p-4">
            <span>
              <span className="block font-bold text-white">Creator programme on</span>
              <span className="text-xs text-white/40">When off, creator codes stop working and no new bookings are tagged.</span>
            </span>
            <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} className="h-5 w-5 accent-emerald-500" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field title="Default commission %" hint="% of each counted booking, before tax. Can be changed per creator.">
              <input type="number" min="0" max="100" step="0.5" value={settings.commissionPercent} onChange={(e) => setSettings({ ...settings, commissionPercent: e.target.value })} className={input} />
            </Field>
            <Field title="Customer discount %" hint="Discount customers get with a creator's code. 0 = no discount.">
              <input type="number" min="0" max="100" step="1" value={settings.discountPercent} onChange={(e) => setSettings({ ...settings, discountPercent: e.target.value })} className={input} />
            </Field>
            <Field title="Discount applies to">
              <select value={settings.discountAppliesTo} onChange={(e) => setSettings({ ...settings, discountAppliesTo: e.target.value })} className={input}>
                <option value="first">The customer's first booking only</option>
                <option value="all">Every booking with the code</option>
              </select>
            </Field>
            <Field title="Which bookings count for the creator">
              <select value={settings.countRule} onChange={(e) => setSettings({ ...settings, countRule: e.target.value })} className={input}>
                {Object.entries(RULES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            {settings.countRule === "months" && (
              <Field title="Number of months" hint="From the customer's first booking with the code.">
                <input type="number" min="1" max="120" value={settings.countMonths} onChange={(e) => setSettings({ ...settings, countMonths: e.target.value })} className={input} />
              </Field>
            )}
            <Field title="Remember the link for (days)" hint="A visitor who opened a creator's link and books within this time is counted.">
              <input type="number" min="1" max="365" value={settings.linkDays} onChange={(e) => setSettings({ ...settings, linkDays: e.target.value })} className={input} />
            </Field>
          </div>
          <button onClick={saveSettings} disabled={busy} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            <Save size={15} /> Save settings
          </button>
        </div>
      )}

      {/* Add / edit creator */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0B2D22] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h3 className="text-base font-bold text-white">{editing._id ? `Edit ${editing.firstName}` : "Add creator"}</h3>
              <button onClick={() => setEditing(null)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/50 hover:bg-white/20"><X size={16} /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <Field title="First name *"><input value={editing.firstName} onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} className={input} /></Field>
                <Field title="Last name *"><input value={editing.lastName} onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} className={input} /></Field>
              </div>
              {!editing._id && (
                <Field title="Email (their login) *" hint="They'll get an email with their code, link and how to set their password.">
                  <input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className={input} />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field title="Phone"><input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className={input} /></Field>
                <Field title="Code *" hint="Letters/numbers, e.g. AMAKA10">
                  <input value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} className={`${input} font-mono`} />
                </Field>
              </div>
              <p className="pt-2 text-[11px] font-bold uppercase tracking-wider text-white/40">Own rules (leave empty to use the programme settings)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field title="Commission %"><input type="number" min="0" max="100" step="0.5" placeholder={`${settings?.commissionPercent ?? ""} (default)`} value={editing.commissionPercent} onChange={(e) => setEditing({ ...editing, commissionPercent: e.target.value })} className={input} /></Field>
                <Field title="Customer discount %"><input type="number" min="0" max="100" placeholder={`${settings?.discountPercent ?? ""} (default)`} value={editing.discountPercent} onChange={(e) => setEditing({ ...editing, discountPercent: e.target.value })} className={input} /></Field>
              </div>
              <Field title="Which bookings count">
                <select value={editing.countRule} onChange={(e) => setEditing({ ...editing, countRule: e.target.value })} className={input}>
                  <option value="">Programme default ({settings ? ruleText(settings) : ""})</option>
                  {Object.entries(RULES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              {editing.countRule === "months" && (
                <Field title="Number of months"><input type="number" min="1" max="120" value={editing.countMonths} onChange={(e) => setEditing({ ...editing, countMonths: e.target.value })} className={input} /></Field>
              )}
              {editing._id && editing.bank?.accountNumber && (
                <div className="rounded-xl bg-white/5 p-3 text-xs text-white/60">
                  <p className="mb-1 font-bold text-white/80">Payout bank details</p>
                  {editing.bank.accountName} · {editing.bank.sortCode} · {editing.bank.accountNumber}
                </div>
              )}
              <button onClick={saveCreator} disabled={busy} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-60">
                {busy ? "Saving…" : editing._id ? "Save changes" : "Create & email login details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-2xl ${toast.type === "err" ? "bg-rose-600" : "bg-emerald-600"}`}>{toast.msg}</div>
      )}
    </div>
  );
}
