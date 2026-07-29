import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Send,
  Plus,
  Trash2,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Repeat2,
  Eye,
  X,
  Hash,
  Pencil,
  Clock,
  History,
  Download,
  Search,
  UserCheck,
} from "lucide-react";
import logo from "../assets/logo DP.jpg";

const API = import.meta.env.VITE_API_URL;

export const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time Quote" },
  { value: "weekly", label: "Weekly (Every Week)" },
  { value: "biweekly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

// Full service catalogue organised by category — used in the quote builder dropdown
export const SERVICE_CATALOGUE = {
  "Residential & Domestic": [
    "Regular Domestic Cleaning",
    "One-Off House Clean",
    "Spring / Seasonal Deep Clean",
    "Deep Cleaning",
    "Declutter & Organising Clean",
  ],
  "Airbnb & Holiday Let": [
    "Airbnb & Holiday Let Cleaning",
    "Guest Changeover Clean",
    "Short-Let Property Clean",
    "Linen & Laundry Service",
  ],
  "Commercial & Office": [
    "Office Cleaning",
    "Retail & Shop Cleaning",
    "Restaurant & Hospitality Cleaning",
    "Medical / Healthcare Facility Clean",
    "School & Education Cleaning",
    "Gym & Fitness Facility Clean",
    "Warehouse & Industrial Cleaning",
    "Co-working Space Cleaning",
  ],
  "Specialist Cleans": [
    "End of Tenancy Cleaning",
    "Move-In Cleaning",
    "Carpet & Upholstery Cleaning",
    "Sofa & Mattress Deep Clean",
    "Oven & Appliance Deep Clean",
    "Window Cleaning (Interior)",
    "Window Cleaning (Exterior & Interior)",
    "Conservatory Cleaning",
    "Pressure Washing (Driveways & Patios)",
  ],
  "Post-Event & Restoration": [
    "After Builders / Post-Construction Clean",
    "Post-Party & Event Clean",
    "Commercial Kitchen Deep Clean",
    "Hoarder / Extreme Clean",
    "Flood Damage & Restoration Clean",
    "Disinfection & Sanitisation",
    "Bio-Hazard Specialist Clean",
    "Fire & Smoke Damage Clean",
  ],
};

const DEFAULT_SERVICES = Object.values(SERVICE_CATALOGUE).flat();

const emptyItem = () => ({
  service: "",
  customService: "",
  description: "",
  billingType: "flat",
  qty: 1,
  unitPrice: "",
});

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
  >
    {type === "success" ? (
      <CheckCircle2 size={18} />
    ) : (
      <AlertCircle size={18} />
    )}
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
      <X size={15} />
    </button>
  </div>
);

// ── Line Item ──────────────────────────────────────────────────────────────────
const LineItem = ({ item, index, onChange, onRemove, catalogue }) => {
  const lineTotal = Number(item.unitPrice || 0) * Number(item.qty || 1);
  return (
    <div className="border border-white/7 rounded-2xl bg-[#0B2D22] overflow-hidden hover:border-emerald-500/30 transition-all">
      {/* Row header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/7">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wide">Line Item</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-white tabular-nums">
            £{lineTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
          </span>
          <button
            onClick={() => onRemove(index)}
            className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 hover:text-rose-300 flex items-center justify-center transition-all"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Service select — grouped by category */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Service *</label>
          <select
            value={item.service}
            onChange={(e) => onChange(index, "service", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
          >
            <option value="">— Select a service —</option>
            {Object.entries(catalogue).map(([cat, svcs]) => (
              <optgroup key={cat} label={cat}>
                {svcs.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            ))}
            <option value="__custom__">✏ Custom / Other service</option>
          </select>
          {item.service === "__custom__" && (
            <input
              type="text"
              placeholder="Type the service name…"
              value={item.customService}
              onChange={(e) => onChange(index, "customService", e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          )}
        </div>

        {/* Cleaning scope */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">
            Scope of Work <span className="text-white/25 font-medium normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="e.g. 3-bed house: all bedrooms, 2 bathrooms, kitchen deep clean, hoovering throughout…"
            value={item.description}
            onChange={(e) => onChange(index, "description", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <p className="text-[10px] text-white/40 mt-1">Appears on the quote and customer email — helps them see exactly what's included.</p>
        </div>

        {/* Pricing row */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Billing toggle */}
          <div className="shrink-0">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Billing Type</label>
            <div className="flex items-center gap-0.5 p-1 bg-white/5 rounded-xl">
              <button
                type="button"
                onClick={() => onChange(index, "billingType", "flat")}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${item.billingType !== "hourly" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "text-white/40 hover:text-white/60"}`}
              >
                Flat Rate
              </button>
              <button
                type="button"
                onClick={() => onChange(index, "billingType", "hourly")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${item.billingType === "hourly" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "text-white/40 hover:text-white/60"}`}
              >
                <Clock size={11} /> Hourly
              </button>
            </div>
          </div>

          {/* Qty */}
          <div className="flex-1 min-w-24">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">
              {item.billingType === "hourly" ? "Hours" : "Qty"}
            </label>
            <input
              type="number" min="1" step={item.billingType === "hourly" ? "0.5" : "1"}
              value={item.qty}
              onChange={(e) => onChange(index, "qty", Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-center text-white focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Unit price */}
          <div className="flex-1 min-w-28">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">
              {item.billingType === "hourly" ? "£ / hr" : "Unit Price £"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">£</span>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={item.unitPrice}
                onChange={(e) => onChange(index, "unitPrice", e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          {/* Line total */}
          <div className="flex-1 min-w-24">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Total</label>
            <div className="px-3 py-2.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/15 text-sm font-black text-emerald-400 text-center tabular-nums">
              £{lineTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Preview Modal ──────────────────────────────────────────────────────────────
const PreviewModal = ({
  data,
  items,
  subtotal,
  discountAmount,
  subtotalAfterDiscount,
  vat,
  grandTotal,
  depositAmount,
  balanceDue,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-[#0B2D22] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-[#0B2D22] border-b border-white/7 px-8 py-5 flex justify-between items-center rounded-t-2xl z-10">
        <h2 className="text-lg font-bold text-white">Quote Preview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const logoUrl = `${window.location.origin}${logo}`;
              const quoteRef = `CLQ-${Date.now().toString().slice(-6)}`;
              const rows = items.filter(i => i.service || i.customService).map(item => `
                <tr>
                  <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">
                    <strong>${item.service === "__custom__" ? item.customService : item.service}</strong>
                    ${item.description ? `<br/><span style="font-size:11px;color:#64748b;">${item.description}</span>` : ""}
                  </td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.qty}${item.billingType === "hourly" ? " hrs" : ""}</td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;text-align:right;">£${Number(item.unitPrice||0).toFixed(2)}${item.billingType==="hourly"?"/hr":""}</td>
                  <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">£${(Number(item.unitPrice||0)*Number(item.qty||1)).toFixed(2)}</td>
                </tr>`).join("");
              const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Quote — ${data.companyName||"Client"}</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;color:#1e293b;background:#fff;}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}
.hdr{background:#0f172a;padding:28px 40px;display:flex;justify-content:space-between;align-items:center;}
.hdr-logo{height:56px;border-radius:8px;}
.ref{color:#6ee7b7;font-size:14px;font-weight:800;text-align:right;}
.co{color:#94a3b8;font-size:11px;margin-top:3px;text-align:right;}
.body{padding:32px 40px;}.section{margin-bottom:24px;}
.label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px;}
.val{font-size:15px;font-weight:700;color:#0f172a;}.sub{font-size:13px;color:#64748b;margin-top:2px;}
table{width:100%;border-collapse:collapse;margin-bottom:16px;}
thead tr{background:#0f172a;}thead th{padding:10px 16px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:left;}
thead th:last-child,thead th:nth-child(2),thead th:nth-child(3){text-align:right;}
.totals{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;}
.trow{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#475569;}
.grand{font-size:16px;font-weight:900;color:#0f172a;border-top:1px solid #e2e8f0;padding-top:10px;margin-top:6px;}
.notes{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;font-size:13px;color:#92400e;margin-top:16px;}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b;}
</style></head><body>
<div class="hdr">
  <img src="${logoUrl}" alt="Cleaniq Services" class="hdr-logo" />
  <div><div class="ref">${quoteRef}</div><div class="co">${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}</div></div>
</div>
<div class="body">
  <div style="display:flex;gap:32px;margin-bottom:24px;">
    <div><div class="label">Prepared For</div><div class="val">${data.companyName||"—"}</div>${data.contactName?`<div class="sub">Attn: ${data.contactName}</div>`:""}${data.email?`<div class="sub">${data.email}</div>`:""}${data.phone?`<div class="sub">${data.phone}</div>`:""}</div>
    <div style="text-align:right"><div class="label">Frequency</div><div class="val">${FREQUENCY_OPTIONS.find(f=>f.value===data.frequency)?.label||"One-time"}</div></div>
  </div>
  <table>
    <thead><tr><th>Service &amp; Details</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="trow"><span>Subtotal</span><span>£${subtotal.toFixed(2)}</span></div>
    ${discountAmount>0?`<div class="trow" style="color:#16a34a;"><span>Discount (${data.discount}%)</span><span>-£${discountAmount.toFixed(2)}</span></div>`:""}
    ${data.includeVat&&vat>0?`<div class="trow"><span>VAT (${data.vatRate}%)</span><span>£${vat.toFixed(2)}</span></div>`:""}
    <div class="trow grand"><span>GRAND TOTAL</span><span>£${grandTotal.toFixed(2)}</span></div>
    ${data.depositRequired&&depositAmount>0?`<div class="trow" style="color:#0369a1;margin-top:8px;"><span>Deposit Required (${data.depositPercent}%)</span><span>£${depositAmount.toFixed(2)}</span></div>`:""}
  </div>
  ${data.notes?`<div class="notes"><strong>Notes:</strong> ${data.notes}</div>`:""}
  <div class="footer">Cleaniq Services Limited · info@cleaniqservices.com · cleaniqservices.com · +44 7752 476368</div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
              const w = window.open("","_blank"); w.document.write(html); w.document.close();
            }}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-sm font-semibold transition-all flex items-center gap-2"
          >
            🖨 Print / PDF
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <img src={logo} alt="Cleaniq Services" className="h-10 rounded-lg" />
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">
              Quote Ref
            </p>
            <p className="text-sm font-bold text-white">
              CLQ-{Date.now().toString().slice(-6)}
            </p>
            <p className="text-xs text-white/40 font-semibold mt-1">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-6 space-y-1">
          <p className="text-[11px] font-semibold text-white/40 mb-2">
            Prepared For
          </p>
          <p className="font-bold text-white text-lg">
            {data.companyName || "—"}
          </p>
          {data.contactName && (
            <p className="text-sm text-white/80 font-semibold">
              Attn: {data.contactName}
            </p>
          )}
          {data.email && <p className="text-sm text-white/40">{data.email}</p>}
          {data.phone && <p className="text-sm text-white/40">{data.phone}</p>}
          {data.address && (
            <p className="text-sm text-white/40">{data.address}</p>
          )}
        </div>
        {data.frequency !== "once" && (
          <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <Repeat2 size={18} className="text-emerald-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Recurring Contract
              </p>
              <p className="text-sm font-bold text-white/80">
                {
                  FREQUENCY_OPTIONS.find((f) => f.value === data.frequency)
                    ?.label
                }
              </p>
            </div>
          </div>
        )}
        <div>
          <p className="text-[11px] font-semibold text-white/40 mb-3">
            Services Included
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/7">
            <table className="w-full text-sm">
              <thead className="bg-[#071D16]">
                <tr className="text-[11px] font-semibold text-white/40">
                  <th className="px-5 py-3 text-left">Service & Cleaning Details</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items
                  .filter((i) => i.service || i.customService)
                  .map((item, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4">
                        <p className="font-bold text-white">
                          {item.service === "__custom__"
                            ? item.customService
                            : item.service}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-white/40 mt-0.5">
                            {item.description}
                          </p>
                        )}
                        {item.billingType === "hourly" && (
                          <p className="text-[10px] text-emerald-500/50 font-bold mt-1 flex items-center gap-1">
                            <Clock size={10} /> Billed hourly
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-white/80">
                        {item.qty}
                        {item.billingType === "hourly" ? " hrs" : ""}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-white/80">
                        £{Number(item.unitPrice || 0).toFixed(2)}
                        {item.billingType === "hourly" ? "/hr" : ""}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-white">
                        £
                        {(
                          Number(item.unitPrice || 0) * item.qty
                        ).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-2 bg-white/[0.03] rounded-2xl p-6">
          <div className="flex justify-between text-sm font-semibold text-white/60">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-emerald-400">
              <span>Discount ({data.discount}%)</span>
              <span>-£{discountAmount.toFixed(2)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-white/60">
              <span>Subtotal after discount</span>
              <span>£{subtotalAfterDiscount.toFixed(2)}</span>
            </div>
          )}
          {data.includeVat && vat > 0 && (
            <div className="flex justify-between text-sm font-semibold text-white/60">
              <span>VAT ({data.vatRate}%)</span>
              <span>£{vat.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-white/10">
            <span>GRAND TOTAL</span>
            <span>
              £{grandTotal.toFixed(2)}
              {data.frequency !== "once"
                ? ` / ${FREQUENCY_OPTIONS.find(
                    (f) => f.value === data.frequency,
                  )
                    ?.label.split(" ")[0]
                    .toLowerCase()}`
                : ""}
            </span>
          </div>
          {data.depositRequired && depositAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-sm font-semibold text-emerald-400">
                <span>Deposit Required ({data.depositPercent}%)</span>
                <span>£{depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-white/60">
                <span>Balance Due</span>
                <span>£{balanceDue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        {data.notes && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">
              Notes & Terms
            </p>
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
              {data.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ── Quote Detail / History Modal ────────────────────────────────────────────────
export const QuoteDetailModal = ({ quote, onClose }) => {
  const frequencyLabel =
    FREQUENCY_OPTIONS.find((f) => f.value === quote.frequency)?.label ||
    "One-time Quote";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B2D22] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0B2D22] border-b border-white/7 px-8 py-5 flex justify-between items-center rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {quote.quoteRef}
              {quote.status === "accepted" && (
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-1 rounded-full">
                  Accepted
                </span>
              )}
              {quote.status === "declined" && (
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/15 border border-rose-500/25 px-2 py-1 rounded-full">
                  Declined
                </span>
              )}
              {(!quote.status || quote.status === "sent") && (
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60 bg-white/10 px-2 py-1 rounded-full">
                  Sent
                </span>
              )}
            </h2>
            <p className="text-[11px] font-semibold text-white/40 mt-0.5">
              Sent {new Date(quote.createdAt).toLocaleString("en-GB")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          {quote.status === "accepted" && (
            <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
              <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-400">
                  This company accepted the quote
                </p>
                {quote.acceptedAt && (
                  <p className="text-[11px] font-semibold text-emerald-400/70">
                    Accepted {new Date(quote.acceptedAt).toLocaleString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          )}
          {quote.status === "declined" && (
            <div className="flex items-center gap-3 px-5 py-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
              <X size={20} className="text-rose-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-400">
                  This company declined the quote
                </p>
                {quote.declinedAt && (
                  <p className="text-[11px] font-semibold text-rose-400/70">
                    Declined {new Date(quote.declinedAt).toLocaleString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white/[0.03] rounded-2xl p-6 space-y-1">
            <p className="text-[11px] font-semibold text-white/40 mb-2">
              Company Details
            </p>
            <p className="font-bold text-white text-lg">
              {quote.companyName}
            </p>
            {quote.contactName && (
              <p className="text-sm text-white/80 font-semibold">
                Attn: {quote.contactName}
              </p>
            )}
            <p className="text-sm text-white/40">{quote.email}</p>
            {quote.phone && (
              <p className="text-sm text-white/40">{quote.phone}</p>
            )}
            {quote.address && (
              <p className="text-sm text-white/40">{quote.address}</p>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <Repeat2 size={18} className="text-emerald-400" />
            <p className="text-sm font-bold text-white/80">
              {frequencyLabel}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-white/40 mb-3">
              Cleaning Services & Scope of Work
            </p>
            <div className="space-y-3">
              {(quote.items || []).map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10"
                >
                  <div className="flex justify-between items-start gap-3">
                    <p className="font-bold text-white text-sm">
                      {item.service || item.customService}
                    </p>
                    <p className="font-bold text-white text-sm whitespace-nowrap">
                      £
                      {(
                        Number(item.unitPrice || 0) * Number(item.qty || 1)
                      ).toFixed(2)}
                    </p>
                  </div>
                  {item.description && (
                    <p className="text-xs text-white/40 mt-1.5">
                      <span className="font-bold text-white/60">
                        What will be cleaned:
                      </span>{" "}
                      {item.description}
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-emerald-400/50 mt-1.5 flex items-center gap-1">
                    {item.billingType === "hourly" ? (
                      <>
                        <Clock size={11} /> {item.qty} hrs @ £
                        {Number(item.unitPrice || 0).toFixed(2)}/hr
                      </>
                    ) : (
                      <>Qty {item.qty} × £{Number(item.unitPrice || 0).toFixed(2)}</>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 bg-white/[0.03] rounded-2xl p-6">
            <div className="flex justify-between text-sm font-semibold text-white/60">
              <span>Subtotal</span>
              <span>£{Number(quote.subtotal || 0).toFixed(2)}</span>
            </div>
            {quote.discountAmount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-emerald-400">
                <span>Discount ({quote.discount}%)</span>
                <span>-£{Number(quote.discountAmount).toFixed(2)}</span>
              </div>
            )}
            {quote.includeVat && quote.vat > 0 && (
              <div className="flex justify-between text-sm font-semibold text-white/60">
                <span>VAT ({quote.vatRate}%)</span>
                <span>£{Number(quote.vat).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-white/10">
              <span>GRAND TOTAL</span>
              <span>
                £{Number(quote.grandTotal || 0).toFixed(2)}
                {quote.frequency !== "once"
                  ? ` / ${frequencyLabel.split(" ")[0].toLowerCase()}`
                  : ""}
              </span>
            </div>
            {quote.depositRequired && quote.depositAmount > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-sm font-semibold text-emerald-400">
                  <span>Deposit Required ({quote.depositPercent}%)</span>
                  <span>£{Number(quote.depositAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-white/60">
                  <span>Balance Due</span>
                  <span>£{Number(quote.balanceDue).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {quote.notes && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">
                Notes & Terms
              </p>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                {quote.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Toggle ─────────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, label }) => (
  <label
    className="flex items-center gap-2.5 cursor-pointer"
    onClick={() => onChange(!value)}
  >
    <div
      className={`w-10 h-6 rounded-full transition-all relative ${value ? "bg-emerald-500" : "bg-white/10"}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-5" : "left-1"}`}
      />
    </div>
    <span className="text-sm font-bold text-white/80">{label}</span>
  </label>
);

// ── Main ───────────────────────────────────────────────────────────────────────
const QuoteBuilder = () => {
  const [catalogue, setCatalogue] = useState(SERVICE_CATALOGUE);
  const [items, setItems] = useState([emptyItem()]);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(false);
  const [sentQuotes, setSentQuotes] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Customer search
  const [allCustomers, setAllCustomers] = useState([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef(null);

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    frequency: "once",
    serviceDate: "",
    serviceTimeSlot: "Morning (8am-12pm)",
    vatRate: 20,
    validDays: 30,
    includeVat: true,
    sendCopy: true,
    paymentTerms: "Net 30",
    depositRequired: false,
    depositPercent: 0,
    discount: 0,
    notes:
      "This quote is valid for 30 days from the date of issue. All services are subject to our terms and conditions available at cleaniqservices.com/terms.",
  });

  const loadHistory = useCallback((limit = 10) => {
    setHistoryLoading(true);
    fetch(`${API}/quotes?limit=${limit}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSentQuotes(res.data);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API}/services`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge API services into catalogue under "Custom Services" if not already present
          const allExisting = Object.values(SERVICE_CATALOGUE).flat().map(s => s.toLowerCase());
          const newApiServices = data.map(s => s.name).filter(n => !allExisting.includes(n.toLowerCase()));
          if (newApiServices.length > 0) {
            setCatalogue(prev => ({ ...prev, "Custom Services": [...(prev["Custom Services"] || []), ...newApiServices] }));
          }
        }
      })
      .catch(() => {});
    loadHistory(10);
  }, [loadHistory]);

  // If a quote was sent here for editing from Quote History, prefill the form.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cleaniq_quote_edit_draft");
      if (!raw) return;
      sessionStorage.removeItem("cleaniq_quote_edit_draft");
      const draft = JSON.parse(raw);
      setForm((f) => ({
        ...f,
        companyName: draft.companyName || "",
        contactName: draft.contactName || "",
        email: draft.email || "",
        phone: draft.phone || "",
        address: draft.address || "",
        frequency: draft.frequency || "once",
        vatRate: draft.vatRate ?? 20,
        validDays: draft.validDays ?? 30,
        includeVat: draft.includeVat ?? true,
        paymentTerms: draft.paymentTerms || "Net 30",
        depositRequired: draft.depositRequired || false,
        depositPercent: draft.depositPercent || 0,
        discount: draft.discount || 0,
        notes: draft.notes || f.notes,
      }));
      setItems(
        (draft.items || []).map((i) => ({
          service: i.service || "",
          customService: i.customService || "",
          description: i.description || "",
          billingType: i.billingType || "flat",
          qty: i.qty || 1,
          unitPrice: i.unitPrice ?? "",
        })),
      );
      setToast({
        msg: `Loaded ${draft.quoteRef} for editing — sending will create a new quote.`,
        type: "success",
      });
    } catch {
      // ignore malformed drafts
    }
  }, []);

  const toggleHistoryView = () => {
    const next = !showAllHistory;
    setShowAllHistory(next);
    loadHistory(next ? 100 : 10);
  };

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadAllCustomers = useCallback(async () => {
    if (customersLoaded) return;
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`${API}/customers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllCustomers(data);
        setCustomersLoaded(true);
      }
    } catch {}
  }, [customersLoaded]);

  const handleCustomerSearch = (val) => {
    setCustomerSearch(val);
    if (!val.trim()) {
      setCustomerResults([]);
      setCustomerDropdownOpen(false);
      return;
    }
    if (!customersLoaded) loadAllCustomers();
    const q = val.toLowerCase();
    const results = allCustomers
      .filter(
        (c) =>
          `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.phone || "").includes(q),
      )
      .slice(0, 8);
    setCustomerResults(results);
    setCustomerDropdownOpen(results.length > 0);
  };

  // Re-filter when customers finish loading
  useEffect(() => {
    if (!customersLoaded || !customerSearch.trim()) return;
    const q = customerSearch.toLowerCase();
    const results = allCustomers
      .filter(
        (c) =>
          `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.phone || "").includes(q),
      )
      .slice(0, 8);
    setCustomerResults(results);
    setCustomerDropdownOpen(results.length > 0);
  }, [customersLoaded, allCustomers, customerSearch]);

  const selectCustomer = (c) => {
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim();
    setForm((f) => ({
      ...f,
      companyName: fullName,
      contactName: "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
    }));
    setCustomerSearch(fullName);
    setCustomerResults([]);
    setCustomerDropdownOpen(false);
  };

  const updateForm = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateItem = (i, key, val) =>
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [key]: val } : item)),
    );
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (i) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal = items.reduce(
    (s, i) => s + Number(i.unitPrice || 0) * Number(i.qty || 1),
    0,
  );
  const discountAmount = subtotal * (Number(form.discount || 0) / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const vat = form.includeVat
    ? subtotalAfterDiscount * (Number(form.vatRate) / 100)
    : 0;
  const grandTotal = subtotalAfterDiscount + vat;
  const depositAmount = form.depositRequired
    ? grandTotal * (Number(form.depositPercent) / 100)
    : 0;
  const balanceDue = grandTotal - depositAmount;

  const downloadPDF = () => {
    const ref = `CLQ-${Date.now().toString().slice(-6)}`;
    const logoUrl = `${window.location.origin}${logo}`;
    const rows = items
      .filter(i => i.service || i.customService)
      .map(item => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
            <strong>${item.service === "__custom__" ? item.customService : item.service}</strong>
            ${item.description ? `<br/><span style="font-size:11px;color:#64748b;">${item.description}</span>` : ""}
            ${item.billingType === "hourly" ? `<br/><span style="font-size:10px;color:#7c3aed;font-weight:700;">Billed hourly</span>` : ""}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.qty}${item.billingType === "hourly" ? " hrs" : ""}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;">£${Number(item.unitPrice || 0).toFixed(2)}${item.billingType === "hourly" ? "/hr" : ""}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">£${(Number(item.unitPrice || 0) * Number(item.qty || 1)).toFixed(2)}</td>
        </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Quote — ${form.companyName || "Client"} — ${ref}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,sans-serif;color:#1e293b;background:#fff;font-size:14px;}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}@page{margin:20mm;}}
.hdr{background:#0f172a;padding:28px 48px;display:flex;justify-content:space-between;align-items:center;}
.hdr-logo{height:60px;border-radius:8px;}
.hdr-right{text-align:right;}
.hdr-right .ref{color:#6ee7b7;font-size:15px;font-weight:900;}
.hdr-right .lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.4);margin-bottom:4px;}
.hdr-right .date{color:rgba(255,255,255,.55);font-size:11px;margin-top:4px;}
.body{padding:40px 48px;}
.section{margin-bottom:28px;}
.label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:8px;}
.val{font-size:16px;font-weight:800;color:#0f172a;}
.sub{font-size:13px;color:#64748b;margin-top:3px;}
.info-block{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;display:flex;justify-content:space-between;margin-bottom:28px;}
.freq-block{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 20px;margin-bottom:28px;display:flex;align-items:center;gap:10px;}
.freq-block .freq-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;}
.freq-block .freq-val{font-size:14px;font-weight:700;color:#1e293b;}
table{width:100%;border-collapse:collapse;margin-bottom:24px;}
thead tr{background:#0f172a;}
thead th{padding:12px 16px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:left;}
thead th:nth-child(2){text-align:center;}
thead th:nth-child(3),thead th:nth-child(4){text-align:right;}
tbody tr:nth-child(even){background:#f8fafc;}
.totals{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;}
.trow{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:#475569;}
.trow.discount{color:#16a34a;}
.grand{font-size:17px;font-weight:900;color:#0f172a;border-top:2px solid #e2e8f0;padding-top:12px;margin-top:8px;}
.deposit{font-size:13px;font-weight:700;color:#0369a1;border-top:1px solid #e2e8f0;padding-top:10px;margin-top:6px;}
.notes{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-top:20px;}
.notes-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#d97706;margin-bottom:6px;}
.notes-body{font-size:13px;color:#92400e;line-height:1.6;}
.footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;}
</style></head><body>
<div class="hdr">
  <img src="${logoUrl}" alt="Cleaniq Services" class="hdr-logo" />
  <div class="hdr-right">
    <div class="lbl">Service Quote</div>
    <div class="ref">${ref}</div>
    <div class="date">${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
    ${form.validDays ? `<div class="date">Valid for ${form.validDays} days</div>` : ""}
  </div>
</div>
<div class="body">
  <div class="info-block">
    <div>
      <div class="label">Prepared For</div>
      <div class="val">${form.companyName || "—"}</div>
      ${form.contactName ? `<div class="sub">Attn: ${form.contactName}</div>` : ""}
      ${form.email ? `<div class="sub">${form.email}</div>` : ""}
      ${form.phone ? `<div class="sub">${form.phone}</div>` : ""}
      ${form.address ? `<div class="sub">${form.address}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div class="label">Payment Terms</div>
      <div class="val" style="font-size:14px;">${form.paymentTerms || "Net 30"}</div>
      ${form.serviceDate ? `<div class="sub" style="margin-top:8px;">Service Date: ${new Date(form.serviceDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>` : ""}
    </div>
  </div>
  ${form.frequency !== "once" ? `
  <div class="freq-block">
    <div>
      <div class="freq-label">Recurring Contract</div>
      <div class="freq-val">${FREQUENCY_OPTIONS.find(f => f.value === form.frequency)?.label || "—"}</div>
    </div>
  </div>` : ""}
  <table>
    <thead>
      <tr>
        <th>Service &amp; Details</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="trow"><span>Subtotal</span><span>£${subtotal.toFixed(2)}</span></div>
    ${discountAmount > 0 ? `<div class="trow discount"><span>Discount (${form.discount}%)</span><span>−£${discountAmount.toFixed(2)}</span></div>` : ""}
    ${form.includeVat && vat > 0 ? `<div class="trow"><span>VAT (${form.vatRate}%)</span><span>£${vat.toFixed(2)}</span></div>` : ""}
    <div class="trow grand"><span>GRAND TOTAL</span><span>£${grandTotal.toFixed(2)}${form.frequency !== "once" ? ` / ${FREQUENCY_OPTIONS.find(f => f.value === form.frequency)?.label.split(" ")[0].toLowerCase()}` : ""}</span></div>
    ${form.depositRequired && depositAmount > 0 ? `<div class="trow deposit"><span>Deposit Required (${form.depositPercent}%)</span><span>£${depositAmount.toFixed(2)}</span></div><div class="trow" style="color:#475569;"><span>Balance Due</span><span>£${balanceDue.toFixed(2)}</span></div>` : ""}
  </div>
  ${form.notes ? `<div class="notes"><div class="notes-label">Notes &amp; Terms</div><div class="notes-body">${form.notes}</div></div>` : ""}
  <div class="footer"><span>© ${new Date().getFullYear()} Cleaniq Services Limited</span><span>info@cleaniqservices.com · cleaniqservices.com · +44 7752 476368</span></div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const handleSend = async () => {
    if (!form.email)
      return setToast({
        msg: "Please enter an email address.",
        type: "error",
      });
    if (!form.companyName)
      return setToast({
        msg: "Please enter the customer or company name.",
        type: "error",
      });
    if (items.every((i) => !i.service && !i.customService))
      return setToast({
        msg: "Please add at least one service line item.",
        type: "error",
      });
    setSending(true);
    try {
      const quoteRef = `CLQ-${Date.now().toString().slice(-6)}`;
      const payload = {
        ...form,
        quoteRef,
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        items: items.map((i) => ({
          ...i,
          service: i.service === "__custom__" ? i.customService : i.service,
          subtotal: Number(i.unitPrice || 0) * Number(i.qty || 1),
        })),
        subtotal,
        discountAmount,
        subtotalAfterDiscount,
        vat,
        grandTotal,
        depositAmount,
        balanceDue,
      };
      const res = await fetch(`${API}/quotes/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server error");
      loadHistory(showAllHistory ? 100 : 10);
      setToast({ msg: `Quote sent to ${form.email}!`, type: "success" });
      setItems([emptyItem()]);
      setForm((f) => ({
        ...f,
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
      }));
    } catch {
      setToast({
        msg: "Failed to send quote. Check server connection.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {preview && (
        <PreviewModal
          data={form}
          items={items}
          subtotal={subtotal}
          discountAmount={discountAmount}
          subtotalAfterDiscount={subtotalAfterDiscount}
          vat={vat}
          grandTotal={grandTotal}
          depositAmount={depositAmount}
          balanceDue={balanceDue}
          onClose={() => setPreview(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <FileText size={20} className="text-white" />
            </div>
            Quote Builder
          </h2>
          <p className="text-sm text-white/40 font-medium mt-1 ml-14">
            Create & send professional service quotes to anyone — companies
            or individual customers
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPreview(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white/80 hover:bg-white/10 transition-all"
          >
            <Eye size={15} /> Preview
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white/80 hover:bg-white/10 transition-all"
          >
            <Download size={15} /> Download PDF
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
          >
            {sending ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {sending ? "Sending…" : "Send Quote"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-7">
        {/* ── Left col ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/7 bg-white/[0.03] flex items-center gap-3">
              <Building2 size={18} className="text-emerald-500/50" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Recipient Details
                </h3>
                <p className="text-[11px] font-semibold text-white/40">
                  Who is this quote for? Works for companies and individual
                  customers alike.
                </p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              {/* Customer search */}
              <div className="relative" ref={customerDropdownRef}>
                <label className="text-[11px] font-semibold text-white/40 mb-1.5 block uppercase tracking-wider">
                  Search Existing Customer
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Type name, email, or phone to auto-fill…"
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    onFocus={() => { loadAllCustomers(); if (customerResults.length > 0) setCustomerDropdownOpen(true); }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => { setCustomerSearch(""); setCustomerResults([]); setCustomerDropdownOpen(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {customerDropdownOpen && customerResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-[#0B2D22] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden max-h-56 overflow-y-auto">
                    {customerResults.map((c, i) => (
                      <button
                        key={c.email || i}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full px-4 py-3 text-left hover:bg-white/[0.06] flex items-center gap-3 border-b border-white/[0.05] last:border-0 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <UserCheck size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-[11px] text-white/40 truncate">
                            {c.email}{c.phone ? ` · ${c.phone}` : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!customersLoaded && customerSearch.trim() && (
                  <p className="text-[11px] text-white/30 mt-1 flex items-center gap-1.5">
                    <RefreshCw size={10} className="animate-spin" /> Loading customers…
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  key: "companyName",
                  label: "Customer / Company Name *",
                  type: "text",
                  placeholder: "e.g. Jane Smith or Airbnb Host Ltd",
                  span: 1,
                },
                {
                  key: "contactName",
                  label: "Contact Person (if different)",
                  type: "text",
                  placeholder: "e.g. Jane Smith",
                  span: 1,
                },
                {
                  key: "email",
                  label: "Email Address *",
                  type: "email",
                  placeholder: "name@example.com",
                  span: 1,
                },
                {
                  key: "phone",
                  label: "Phone Number",
                  type: "tel",
                  placeholder: "+44 7000 000000",
                  span: 1,
                },
                {
                  key: "address",
                  label: "Address",
                  type: "text",
                  placeholder: "14 Business Park, London, EC1A 1BB",
                  span: 2,
                },
              ].map((f) => (
                <div
                  key={f.key}
                  className={f.span === 2 ? "sm:col-span-2" : ""}
                >
                  <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => updateForm(f.key, e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/7 bg-white/[0.03] flex items-center gap-3">
              <Repeat2 size={18} className="text-emerald-500/50" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Frequency & Terms
                </h3>
                <p className="text-[11px] font-semibold text-white/40">
                  How often will services be provided?
                </p>
              </div>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                    Service Frequency
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) => updateForm("frequency", e.target.value)}
                    className={inputCls}
                  >
                    {FREQUENCY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                    VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.vatRate}
                    onChange={(e) => updateForm("vatRate", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                    Valid for (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.validDays}
                    onChange={(e) => updateForm("validDays", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-5 space-y-1">
                <h4 className="text-sm font-bold text-white mb-4">
                  Date and Time
                </h4>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.serviceDate}
                      onChange={(e) => updateForm("serviceDate", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                      Time Slot
                    </label>
                    <select
                      value={form.serviceTimeSlot}
                      onChange={(e) =>
                        updateForm("serviceTimeSlot", e.target.value)
                      }
                      className={inputCls}
                    >
                      <option value="Morning (8am-12pm)">
                        Morning (8am-12pm)
                      </option>
                      <option value="Afternoon (12pm-4pm)">
                        Afternoon (12pm-4pm)
                      </option>
                      <option value="Evening (4pm-8pm)">
                        Evening (4pm-8pm)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <Toggle
                  value={form.includeVat}
                  onChange={(v) => updateForm("includeVat", v)}
                  label="Include VAT on quote"
                />
                <Toggle
                  value={form.sendCopy}
                  onChange={(v) => updateForm("sendCopy", v)}
                  label="Send copy to admin"
                />
              </div>

              {/* Professional Payment Terms */}
              <div className="border-t border-white/10 pt-5 space-y-5">
                <h4 className="text-sm font-bold text-white">
                  Payment Terms
                </h4>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                      Payment Terms
                    </label>
                    <select
                      value={form.paymentTerms}
                      onChange={(e) =>
                        updateForm("paymentTerms", e.target.value)
                      }
                      className={inputCls}
                    >
                      <option value="Immediate">Immediate Payment</option>
                      <option value="Net 7">Net 7</option>
                      <option value="Net 14">Net 14</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Custom">Custom Terms</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={form.discount}
                      onChange={(e) => updateForm("discount", e.target.value)}
                      className={inputCls}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Deposit/Retainer Option */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <input
                    type="checkbox"
                    id="depositCheck"
                    checked={form.depositRequired}
                    onChange={(e) =>
                      updateForm("depositRequired", e.target.checked)
                    }
                    className="w-4 h-4 cursor-pointer accent-emerald-500"
                  />
                  <label
                    htmlFor="depositCheck"
                    className="text-sm font-semibold text-emerald-400 cursor-pointer flex-1"
                  >
                    Require deposit/retainer payment
                  </label>
                </div>

                {form.depositRequired && (
                  <div>
                    <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                      Deposit (% of total)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={form.depositPercent}
                      onChange={(e) =>
                        updateForm("depositPercent", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/7 bg-white/[0.03] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Hash size={18} className="text-emerald-500/50" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Services & Pricing
                  </h3>
                  <p className="text-[11px] font-semibold text-white/40">
                    Add individual line items
                  </p>
                </div>
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/25 transition-all"
              >
                <Plus size={14} /> Add Service
              </button>
            </div>
            <div className="p-8 space-y-4">
              {items.map((item, i) => (
                <LineItem
                  key={i}
                  item={item}
                  index={i}
                  onChange={updateItem}
                  onRemove={removeItem}
                  catalogue={catalogue}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/7 bg-white/[0.03] flex items-center gap-3">
              <Pencil size={18} className="text-emerald-500/50" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Notes & Terms
                </h3>
                <p className="text-[11px] font-semibold text-white/40">
                  Shown at the bottom of the quote
                </p>
              </div>
            </div>
            <div className="p-8">
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Right col ───────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden sticky top-24">
            <div className="px-6 py-5 border-b border-white/7 bg-white/[0.03]">
              <h3 className="text-base font-bold text-white">
                Quote Summary
              </h3>
              <p className="text-[11px] font-semibold text-white/40 mt-0.5">
                Live calculation
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Recipient
                </p>
                <p className="font-bold text-white text-sm">
                  {form.companyName || (
                    <span className="text-white/25 font-normal">
                      Company name…
                    </span>
                  )}
                </p>
                <p className="text-xs text-white/40 font-semibold">
                  {form.email || (
                    <span className="text-white/25 font-normal">
                      email@company.com
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                <Repeat2 size={14} className="text-emerald-400/50" />
                <span className="text-xs font-bold text-white/80">
                  {
                    FREQUENCY_OPTIONS.find((f) => f.value === form.frequency)
                      ?.label
                  }
                </span>
              </div>

              {items.filter((i) => i.service || i.customService).length > 0 && (
                <div className="space-y-1.5">
                  {items
                    .filter((i) => i.service || i.customService)
                    .map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-white/60 font-semibold truncate flex-1 mr-2">
                          {item.service === "__custom__"
                            ? item.customService
                            : item.service}
                        </span>
                        <span className="font-bold text-white">
                          £{(Number(item.unitPrice || 0) * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-white/40">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {form.includeVat && (
                  <div className="flex justify-between text-xs font-semibold text-white/40">
                    <span>VAT ({form.vatRate}%)</span>
                    <span>£{vat.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-emerald-400">
                    £{grandTotal.toFixed(2)}
                  </span>
                </div>
                {form.frequency !== "once" && (
                  <p className="text-[10px] font-bold text-white/40 text-right">
                    per{" "}
                    {FREQUENCY_OPTIONS.find((f) => f.value === form.frequency)
                      ?.label.split(" ")[0]
                      .toLowerCase()}
                  </p>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {sending ? "Sending…" : "Send Quote via Email"}
              </button>
              <button
                onClick={() => setPreview(true)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-2xl text-sm font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Eye size={15} /> Preview Quote
              </button>
              <button
                onClick={downloadPDF}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-2xl text-sm font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/7 bg-white/[0.03] flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History size={16} className="text-emerald-400/50" />
                  Quote History
                </h3>
                <p className="text-[11px] font-semibold text-white/40 mt-0.5">
                  {showAllHistory ? "All quotes sent" : "Last 10 quotes"}
                </p>
              </div>
              <button
                onClick={toggleHistoryView}
                className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors flex-shrink-0"
              >
                {showAllHistory ? "Show Recent" : "View All"}
              </button>
            </div>
            <div className="p-4 space-y-1 max-h-[420px] overflow-y-auto">
              {historyLoading && (
                <div className="flex items-center justify-center py-8 text-white/40">
                  <RefreshCw size={16} className="animate-spin" />
                </div>
              )}
              {!historyLoading && sentQuotes.length === 0 && (
                <p className="text-xs text-white/40 font-semibold text-center py-8">
                  No quotes sent yet.
                </p>
              )}
              {!historyLoading &&
                sentQuotes.map((q) => {
                  const isAccepted = q.status === "accepted";
                  const isDeclined = q.status === "declined";
                  return (
                    <button
                      key={q.quoteRef}
                      onClick={() => setSelectedQuote(q)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-left"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isAccepted ? "bg-emerald-500/15" : isDeclined ? "bg-rose-500/15" : "bg-white/10"}`}
                      >
                        {isDeclined ? (
                          <X size={16} className="text-rose-400" />
                        ) : (
                          <CheckCircle2
                            size={16}
                            className={
                              isAccepted ? "text-emerald-400" : "text-white/40"
                            }
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {q.companyName}
                          {isAccepted && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Accepted
                            </span>
                          )}
                          {isDeclined && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Declined
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-semibold text-white/40">
                          {q.quoteRef} · £{Number(q.grandTotal || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest flex-shrink-0">
                        {new Date(q.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}
    </div>
  );
};

export default QuoteBuilder;
