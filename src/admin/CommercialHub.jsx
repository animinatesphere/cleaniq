import React, { useState, useRef } from "react";
import {
  Building2, FileText, FileCheck, Camera, Plus, Trash2,
  Download, Send, X, ClipboardList, Printer,
  RefreshCw, Package, AlertTriangle,
} from "lucide-react";
import QuoteBuilderComponent from "./QuoteBuilder";
import InvoiceBuilderComponent from "./InvoiceBuilder";

const API = import.meta.env.VITE_API_URL;

// ── Shared helpers ─────────────────────────────────────────────────────────────

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={15} /></button>
  </div>
);

const readFile = (file) =>
  new Promise((res) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target.result);
    r.readAsDataURL(file);
  });

const Field = ({ label, children }) => (
  <div>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all ${props.className || ""}`} />
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50">
      {Icon && <Icon size={16} className="text-primary" />}
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ── Config ─────────────────────────────────────────────────────────────────────

const CONDITIONS = [
  { id: "slightly", label: "Slightly Dirty", ring: "ring-yellow-400", bg: "bg-yellow-50", text: "text-yellow-800", dot: "bg-yellow-400" },
  { id: "moderately", label: "Moderately Dirty", ring: "ring-orange-400", bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500" },
  { id: "very", label: "Very Dirty", ring: "ring-red-500", bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500" },
];

const SUPPLIES = [
  "Multi-surface cleaner", "Bathroom cleaner", "Kitchen degreaser",
  "Toilet cleaner", "Glass cleaner", "Floor mop & bucket",
  "Microfibre cloths", "Sponges / scrubbers", "Rubber gloves",
  "Bin bags", "Vacuum bags / filters", "Air freshener",
];

const CONSUMABLES = [
  "Toilet rolls", "Hand soap", "Shower gel", "Shampoo", "Conditioner",
  "Washing up liquid", "Dishwasher tablets", "Kitchen roll",
  "Tea / coffee sachets", "Sugar / sweetener", "Milk pods / UHT", "Salt & pepper",
];

const BASE_INVENTORY = [
  "Single duvet sets", "Double duvet sets", "King duvet sets",
  "Bath towels", "Hand towels", "Face cloths", "Pillows", "Pillow cases",
  "Mugs / cups", "Glasses", "Plates / bowls", "Cutlery sets", "Remote controls", "Keys / fobs",
].map((item) => ({ item, expected: "", actual: "", notes: "" }));

// ══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Property Report
// ══════════════════════════════════════════════════════════════════════════════

const PhotoGrid = ({ photos, onAdd, onRemove, label }) => {
  const ref = useRef(null);
  const handle = async (e) => {
    const urls = await Promise.all(Array.from(e.target.files).slice(0, 10 - photos.length).map(readFile));
    onAdd(urls);
    e.target.value = "";
  };
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button onClick={() => onRemove(i)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={11} className="text-white" />
            </button>
          </div>
        ))}
        {photos.length < 10 && (
          <button onClick={() => ref.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors">
            <Camera size={18} />
            <span className="text-[10px] font-bold mt-1">Add</span>
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={handle} />
    </div>
  );
};

const PropertyReport = () => {
  const vendingRef = useRef(null);
  const [info, setInfo] = useState({ propertyName: "", address: "", bookingRef: "", date: new Date().toISOString().slice(0, 10), cleaner: "", recipientEmail: "" });
  const [condition, setCondition] = useState("");
  const [before, setBefore] = useState([]);
  const [after, setAfter] = useState([]);
  const [vendingPhoto, setVendingPhoto] = useState(null);
  const [damages, setDamages] = useState([]);
  const [supplies, setSupplies] = useState({});
  const [consumables, setConsumables] = useState({});
  const [inventory, setInventory] = useState(BASE_INVENTORY.map((r) => ({ ...r })));
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (k) => (e) => setInfo((p) => ({ ...p, [k]: e.target.value }));
  const toggleItem = (state, setState, key) => setState((p) => ({ ...p, [key]: !p[key] }));
  const setQty = (state, setState, key, v) => setState((p) => ({ ...p, [`qty_${key}`]: v }));

  const addDamage = () => setDamages((p) => [...p, { id: Date.now(), item: "", location: "", severity: "Minor", description: "" }]);
  const updDamage = (id, k, v) => setDamages((p) => p.map((d) => d.id === id ? { ...d, [k]: v } : d));
  const delDamage = (id) => setDamages((p) => p.filter((d) => d.id !== id));
  const updInv = (i, k, v) => setInventory((p) => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const handleVending = async (e) => {
    if (e.target.files[0]) setVendingPhoto(await readFile(e.target.files[0]));
    e.target.value = "";
  };

  const condObj = CONDITIONS.find((c) => c.id === condition);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;padding:32px}
.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #0A5C43;padding-bottom:16px;margin-bottom:24px}
.brand{font-size:20px;font-weight:900;color:#0A5C43}.brand small{display:block;font-size:10px;font-weight:400;color:#64748b}
.meta{text-align:right;font-size:11px;color:#475569;line-height:1.7}
h2{font-size:13px;font-weight:700;color:#0A5C43;margin:20px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
.badge{display:inline-block;padding:3px 12px;border-radius:999px;font-weight:700;font-size:11px;margin-top:8px}
.slightly{background:#fef9c3;color:#854d0e}.moderately{background:#ffedd5;color:#9a3412}.very{background:#fee2e2;color:#991b1b}
table{width:100%;border-collapse:collapse;font-size:11px}th{background:#f1f5f9;text-align:left;padding:6px 8px;font-size:10px;text-transform:uppercase;color:#64748b}td{padding:6px 8px;border-bottom:1px solid #f1f5f9}
.cl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px}.cli{display:flex;gap:5px;align-items:center;font-size:11px;padding:4px 6px;background:#f8fafc;border-radius:4px}
.chk{color:#16a34a;font-weight:700}.unchk{color:#cbd5e1}
.pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.pgrid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0}
.foot{margin-top:32px;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;font-size:10px;color:#94a3b8}`;

  // withPhotos=true for print/download, false for email (keeps size manageable)
  const buildHtml = (withPhotos = true) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Property Report — ${info.propertyName || "Cleaniq"}</title>
<style>${CSS}</style></head><body>
<div class="hdr">
  <div><div class="brand">Cleaniq Services<small>Property Condition Report</small></div>
  ${condObj ? `<div class="badge ${condition}">${condObj.label}</div>` : ""}</div>
  <div class="meta">
    <p><strong>${info.propertyName || "—"}</strong></p>
    <p>${info.address || ""}</p>
    <p>Date: ${fmtDate(info.date)}</p>
    <p>Booking Ref: ${info.bookingRef || "—"}</p>
    <p>Cleaner: ${info.cleaner || "—"}</p>
  </div>
</div>
${withPhotos && before.length ? `<h2>Before Photos</h2><div class="pgrid">${before.map((s) => `<img src="${s}">`).join("")}</div>` : before.length ? `<p style="font-size:11px;color:#64748b;margin:8px 0">📷 ${before.length} before photo(s) — see downloaded report for full images.</p>` : ""}
${withPhotos && after.length ? `<h2>After Photos</h2><div class="pgrid">${after.map((s) => `<img src="${s}">`).join("")}</div>` : after.length ? `<p style="font-size:11px;color:#64748b;margin:8px 0">📷 ${after.length} after photo(s) — see downloaded report for full images.</p>` : ""}
${damages.length ? `<h2>Damage Report</h2><table><tr><th>Item</th><th>Location</th><th>Severity</th><th>Description</th></tr>${damages.map((d) => `<tr><td>${d.item}</td><td>${d.location}</td><td>${d.severity}</td><td>${d.description}</td></tr>`).join("")}</table>` : ""}
<h2>Cleaning Supplies Restock</h2><div class="cl">${SUPPLIES.map((s) => `<div class="cli"><span class="${supplies[s] ? "chk" : "unchk"}">${supplies[s] ? "✓" : "○"}</span>${s}${supplies[`qty_${s}`] ? ` ×${supplies[`qty_${s}`]}` : ""}</div>`).join("")}</div>
<h2>Consumables Replenish</h2><div class="cl">${CONSUMABLES.map((s) => `<div class="cli"><span class="${consumables[s] ? "chk" : "unchk"}">${consumables[s] ? "✓" : "○"}</span>${s}${consumables[`qty_${s}`] ? ` ×${consumables[`qty_${s}`]}` : ""}</div>`).join("")}</div>
${withPhotos && vendingPhoto ? `<h2>Vending Machine</h2><img src="${vendingPhoto}" style="max-width:220px;border-radius:8px;border:1px solid #e2e8f0">` : ""}
<h2>Inventory Report</h2><table><tr><th>Item</th><th>Expected</th><th>Actual</th><th>Discrepancy</th><th>Notes</th></tr>${inventory.map((r) => { const disc = r.expected !== "" && r.actual !== "" && String(r.expected) !== String(r.actual); return `<tr><td>${r.item}</td><td>${r.expected || "—"}</td><td style="${disc ? "color:#dc2626;font-weight:700" : ""}">${r.actual || "—"}</td><td>${disc ? "⚠ Mismatch" : ""}</td><td>${r.notes || ""}</td></tr>`; }).join("")}</table>
${notes ? `<h2>Additional Notes</h2><p style="padding:12px;background:#f8fafc;border-radius:8px;line-height:1.6">${notes}</p>` : ""}
<div class="foot">Generated by Cleaniq Services · cleaniqservices.com · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
</body></html>`;

  const printReport = () => {
    const w = window.open("", "_blank");
    w.document.write(buildHtml(true));
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const handleDownload = () => {
    const html = buildHtml(true);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-report-${info.bookingRef || info.propertyName || "cleaniq"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!info.recipientEmail) { setToast({ msg: "Enter a recipient email address first", type: "error" }); return; }
    setSending(true);
    try {
      const res = await fetch(`${API}/custom-invoice/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: `RPT-${info.bookingRef || Date.now()}`,
          customerName: info.propertyName || "Property Owner",
          customerEmail: info.recipientEmail,
          invoiceDate: fmtDate(info.date),
          htmlOverride: buildHtml(false),
          subject: `Property Report — ${info.propertyName || info.bookingRef || "Cleaniq"} · ${fmtDate(info.date)}`,
          items: [],
          notes: "",
          paymentInstructions: "",
          showPaidBadge: false,
          currencySymbol: "£",
          isReport: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setToast({ msg: `Report sent to ${info.recipientEmail}`, type: "success" });
    } catch (err) {
      setToast({ msg: err.message || "Failed to send report", type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {/* Property Info */}
      <Section title="Property Details" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Property Name"><Input value={info.propertyName} onChange={set("propertyName")} placeholder="e.g. The Grand Flat" /></Field>
          <Field label="Address"><Input value={info.address} onChange={set("address")} placeholder="Full address" /></Field>
          <Field label="Booking Reference"><Input value={info.bookingRef} onChange={set("bookingRef")} placeholder="e.g. CLQ-0042" /></Field>
          <Field label="Date"><Input type="date" value={info.date} onChange={set("date")} /></Field>
          <Field label="Cleaner Name"><Input value={info.cleaner} onChange={set("cleaner")} placeholder="Name of cleaner" /></Field>
          <Field label="Send Report To (Email)"><Input type="email" value={info.recipientEmail} onChange={set("recipientEmail")} placeholder="client@example.com" /></Field>
        </div>
      </Section>

      {/* Condition */}
      <Section title="Current Condition of Property" icon={AlertTriangle}>
        <div className="flex flex-wrap gap-3">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCondition(c.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${condition === c.id ? `${c.ring} ${c.bg} ${c.text} ring-2` : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              {c.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Photos */}
      <Section title="Before & After Photos" icon={Camera}>
        <div className="space-y-5">
          <PhotoGrid photos={before} label="Before Cleaning" onAdd={(urls) => setBefore((p) => [...p, ...urls])} onRemove={(i) => setBefore((p) => p.filter((_, idx) => idx !== i))} />
          <PhotoGrid photos={after} label="After Cleaning" onAdd={(urls) => setAfter((p) => [...p, ...urls])} onRemove={(i) => setAfter((p) => p.filter((_, idx) => idx !== i))} />
        </div>
      </Section>

      {/* Damage Report */}
      <Section title="Damage Report" icon={AlertTriangle}>
        <div className="space-y-3">
          {damages.map((d) => (
            <div key={d.id} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <Field label="Item"><Input value={d.item} onChange={(e) => updDamage(d.id, "item", e.target.value)} placeholder="e.g. Mirror" /></Field>
              <Field label="Location"><Input value={d.location} onChange={(e) => updDamage(d.id, "location", e.target.value)} placeholder="e.g. Bathroom" /></Field>
              <Field label="Severity">
                <select value={d.severity} onChange={(e) => updDamage(d.id, "severity", e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                  {["Minor", "Moderate", "Major"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <div className="flex gap-2">
                <Field label="Description">
                  <Input value={d.description} onChange={(e) => updDamage(d.id, "description", e.target.value)} placeholder="Brief description" />
                </Field>
                <button onClick={() => delDamage(d.id)} className="mt-6 flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          <button onClick={addDamage} className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
            <Plus size={16} /> Add Damage Item
          </button>
        </div>
      </Section>

      {/* Supplies Restock */}
      <Section title="Cleaning Supplies Restock" icon={Package}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {SUPPLIES.map((s) => (
            <div key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${supplies[s] ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`} onClick={() => toggleItem(supplies, setSupplies, s)}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${supplies[s] ? "bg-primary border-primary" : "border-slate-300"}`}>
                {supplies[s] && <X size={11} className="text-white" />}
              </div>
              <span className="text-sm font-medium text-slate-700 flex-1">{s}</span>
              {supplies[s] && (
                <input
                  type="number" min="1" placeholder="Qty"
                  value={supplies[`qty_${s}`] || ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setQty(supplies, setSupplies, s, e.target.value)}
                  className="w-14 px-2 py-1 rounded-lg border border-primary/30 bg-white text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Consumables */}
      <Section title="Consumables Replenish" icon={Package}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {CONSUMABLES.map((s) => (
            <div key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${consumables[s] ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`} onClick={() => toggleItem(consumables, setConsumables, s)}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${consumables[s] ? "bg-primary border-primary" : "border-slate-300"}`}>
                {consumables[s] && <X size={11} className="text-white" />}
              </div>
              <span className="text-sm font-medium text-slate-700 flex-1">{s}</span>
              {consumables[s] && (
                <input
                  type="number" min="1" placeholder="Qty"
                  value={consumables[`qty_${s}`] || ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setQty(consumables, setConsumables, s, e.target.value)}
                  className="w-14 px-2 py-1 rounded-lg border border-primary/30 bg-white text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Vending Machine */}
      <Section title="Vending Machine Photo" icon={Camera}>
        <div className="flex items-center gap-4">
          {vendingPhoto
            ? <div className="relative group">
                <img src={vendingPhoto} alt="Vending machine" className="w-40 h-40 object-cover rounded-2xl border border-slate-200" />
                <button onClick={() => setVendingPhoto(null)} className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={13} className="text-white" /></button>
              </div>
            : <button onClick={() => vendingRef.current?.click()} className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors">
                <Camera size={28} />
                <span className="text-xs font-bold mt-2">Upload Photo</span>
              </button>
          }
          <div className="text-sm text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Vending Machine Status</p>
            <p className="text-xs leading-relaxed">Take a photo of the vending machine to document stock levels and any issues.</p>
          </div>
        </div>
        <input ref={vendingRef} type="file" accept="image/*" className="hidden" onChange={handleVending} />
      </Section>

      {/* Inventory */}
      <Section title="Inventory Report" icon={ClipboardList}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2.5 pr-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-40">Item</th>
                <th className="text-center py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-24">Expected</th>
                <th className="text-center py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-24">Actual</th>
                <th className="text-left py-2.5 pl-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row, i) => {
                const mismatch = row.expected !== "" && row.actual !== "" && String(row.expected) !== String(row.actual);
                return (
                  <tr key={i} className={`border-b border-slate-100 ${mismatch ? "bg-red-50" : ""}`}>
                    <td className="py-2 pr-4 font-medium text-slate-700 text-xs">{row.item}</td>
                    <td className="py-2 px-3">
                      <input type="number" min="0" value={row.expected} onChange={(e) => updInv(i, "expected", e.target.value)} placeholder="0" className="w-full text-center px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min="0" value={row.actual} onChange={(e) => updInv(i, "actual", e.target.value)} placeholder="0" className={`w-full text-center px-2 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${mismatch ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50"}`} />
                    </td>
                    <td className="py-2 pl-3">
                      <input value={row.notes} onChange={(e) => updInv(i, "notes", e.target.value)} placeholder={mismatch ? "⚠ Mismatch — add note" : "Optional note"} className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${mismatch ? "border-red-200 bg-red-50 placeholder:text-red-400" : "border-slate-200 bg-slate-50"}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Additional Notes */}
      <Section title="Additional Notes" icon={FileText}>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Any additional observations, issues, or comments…" className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all" />
      </Section>

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-3">
        <button onClick={handleSendEmail} disabled={sending} className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 disabled:opacity-60 transition-colors">
          {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? "Sending…" : "Send to Email"}
        </button>
        <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-primary/40 hover:text-primary transition-colors">
          <Download size={15} /> Download
        </button>
        <button onClick={printReport} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm">
          <Printer size={15} /> Print Report
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Tab 3 — Commercial Invoice  (full InvoiceBuilder)
// ══════════════════════════════════════════════════════════════════════════════

const CommercialQuote = () => <QuoteBuilderComponent />;
const CommercialInvoice = () => <InvoiceBuilderComponent />;

// ══════════════════════════════════════════════════════════════════════════════
// Main CommercialHub page
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "report", label: "Property Report", icon: ClipboardList, desc: "Condition, photos, damage & inventory" },
  { id: "quote", label: "Commercial Quote", icon: FileText, desc: "Airbnb & commercial cleaning quote" },
  { id: "invoice", label: "Commercial Invoice", icon: FileCheck, desc: "Generate by booking code" },
];

const CommercialHub = () => {
  const [tab, setTab] = useState("report");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Building2 size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Commercial Hub</h1>
          <p className="text-sm text-slate-500">Airbnb & commercial client tools — reports, quotes, and invoices</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border font-bold text-sm transition-all ${tab === t.id ? "bg-primary text-white border-primary shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"}`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Active tab description */}
      <p className="text-xs text-slate-400 font-medium">
        {TABS.find((t) => t.id === tab)?.desc}
      </p>

      {/* Tab content */}
      {tab === "report" && <PropertyReport />}
      {tab === "quote" && <CommercialQuote />}
      {tab === "invoice" && <CommercialInvoice />}
    </div>
  );
};

export default CommercialHub;
