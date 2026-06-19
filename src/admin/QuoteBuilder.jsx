import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time Quote" },
  { value: "weekly", label: "Weekly (Every Week)" },
  { value: "biweekly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const DEFAULT_SERVICES = [
  "Airbnb & Holiday Let Cleaning",
  "Office Cleaning",
  "End of Tenancy Cleaning",
  "Deep Cleaning",
  "Regular Domestic Cleaning",
  "Commercial Kitchen Cleaning",
  "Post-Construction Cleaning",
  "Carpet & Upholstery Cleaning",
];

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
const LineItem = ({ item, index, onChange, onRemove, services }) => (
  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-semibold text-slate-400">
        Line Item #{index + 1}
      </span>
      <button
        onClick={() => onRemove(index)}
        className="w-7 h-7 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all"
      >
        <Trash2 size={13} />
      </button>
    </div>
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
          Service
        </label>
        <select
          value={item.service}
          onChange={(e) => onChange(index, "service", e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        >
          <option value="">Select a service…</option>
          {services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value="__custom__">— Enter custom service —</option>
        </select>
        {item.service === "__custom__" && (
          <input
            type="text"
            placeholder="Custom service name"
            value={item.customService}
            onChange={(e) => onChange(index, "customService", e.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        )}
      </div>
      <div className="sm:col-span-2">
        <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
          Cleaning Details — what will be cleaned (optional)
        </label>
        <textarea
          rows={2}
          placeholder="e.g. 3-bed property: all bedrooms, 2 bathrooms, kitchen deep clean, hoovering & dusting throughout..."
          value={item.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <p className="text-[10px] text-slate-400 font-semibold mt-1">
          This shows up in the quote preview and the email sent to the
          customer, so they know exactly how the clean will be done.
        </p>
      </div>
      <div className="sm:col-span-2 flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 w-fit">
        <button
          type="button"
          onClick={() => onChange(index, "billingType", "flat")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${item.billingType !== "hourly" ? "bg-primary text-white shadow" : "text-slate-500 hover:bg-slate-50"}`}
        >
          Flat Rate
        </button>
        <button
          type="button"
          onClick={() => onChange(index, "billingType", "hourly")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${item.billingType === "hourly" ? "bg-primary text-white shadow" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Clock size={12} /> Hourly Rate
        </button>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
          {item.billingType === "hourly" ? "Estimated Hours" : "Quantity / Visits"}
        </label>
        <input
          type="number"
          min="1"
          step={item.billingType === "hourly" ? "0.5" : "1"}
          value={item.qty}
          onChange={(e) => onChange(index, "qty", Number(e.target.value))}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
          {item.billingType === "hourly" ? "Hourly Rate (£/hr)" : "Unit Price (£)"}
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={item.unitPrice}
          onChange={(e) => onChange(index, "unitPrice", e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>
    </div>
    <div className="flex justify-end">
      <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400">
          Subtotal:
        </span>
        <span className="font-bold text-slate-800 text-sm">
          £
          {(Number(item.unitPrice || 0) * Number(item.qty || 1)).toLocaleString(
            "en-GB",
            { minimumFractionDigits: 2 },
          )}
        </span>
      </div>
    </div>
  </div>
);

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
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center rounded-t-[32px] z-10">
        <h2 className="text-lg font-bold text-slate-800">Quote Preview</h2>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all"
        >
          <X size={18} className="text-slate-600" />
        </button>
      </div>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              SERVICE QUOTE
            </h1>
            <p className="text-sm text-slate-400 font-semibold mt-1">
              Cleaniq Services Ltd
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Quote Ref
            </p>
            <p className="text-sm font-bold text-slate-800">
              CLQ-{Date.now().toString().slice(-6)}
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-3xl p-6 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">
            Prepared For
          </p>
          <p className="font-bold text-slate-800 text-lg">
            {data.companyName || "—"}
          </p>
          {data.contactName && (
            <p className="text-sm text-slate-600 font-semibold">
              Attn: {data.contactName}
            </p>
          )}
          {data.email && <p className="text-sm text-slate-500">{data.email}</p>}
          {data.phone && <p className="text-sm text-slate-500">{data.phone}</p>}
          {data.address && (
            <p className="text-sm text-slate-500">{data.address}</p>
          )}
        </div>
        {data.frequency !== "once" && (
          <div className="flex items-center gap-3 px-5 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
            <Repeat2 size={18} className="text-primary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Recurring Contract
              </p>
              <p className="text-sm font-bold text-slate-700">
                {
                  FREQUENCY_OPTIONS.find((f) => f.value === data.frequency)
                    ?.label
                }
              </p>
            </div>
          </div>
        )}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 mb-3">
            Services Included
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-[11px] font-semibold text-slate-400">
                  <th className="px-5 py-3 text-left">Service & Cleaning Details</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items
                  .filter((i) => i.service || i.customService)
                  .map((item, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {item.service === "__custom__"
                            ? item.customService
                            : item.service}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.description}
                          </p>
                        )}
                        {item.billingType === "hourly" && (
                          <p className="text-[10px] text-primary/50 font-bold mt-1 flex items-center gap-1">
                            <Clock size={10} /> Billed hourly
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-slate-700">
                        {item.qty}
                        {item.billingType === "hourly" ? " hrs" : ""}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-700">
                        £{Number(item.unitPrice || 0).toFixed(2)}
                        {item.billingType === "hourly" ? "/hr" : ""}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-800">
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
        <div className="space-y-2 bg-slate-50 rounded-3xl p-6">
          <div className="flex justify-between text-sm font-semibold text-slate-600">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-emerald-600">
              <span>Discount ({data.discount}%)</span>
              <span>-£{discountAmount.toFixed(2)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-slate-600">
              <span>Subtotal after discount</span>
              <span>£{subtotalAfterDiscount.toFixed(2)}</span>
            </div>
          )}
          {data.includeVat && vat > 0 && (
            <div className="flex justify-between text-sm font-semibold text-slate-600">
              <span>VAT ({data.vatRate}%)</span>
              <span>£{vat.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-800 pt-3 border-t border-slate-200">
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
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm font-semibold text-primary">
                <span>Deposit Required ({data.depositPercent}%)</span>
                <span>£{depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>Balance Due</span>
                <span>£{balanceDue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        {data.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
              Notes & Terms
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center rounded-t-[32px] z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {quote.quoteRef}
              {quote.status === "accepted" && (
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                  Accepted
                </span>
              )}
              {quote.status === "declined" && (
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-700 bg-rose-100 px-2 py-1 rounded-full">
                  Declined
                </span>
              )}
              {(!quote.status || quote.status === "sent") && (
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  Sent
                </span>
              )}
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Sent {new Date(quote.createdAt).toLocaleString("en-GB")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          {quote.status === "accepted" && (
            <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">
                  This company accepted the quote
                </p>
                {quote.acceptedAt && (
                  <p className="text-[11px] font-semibold text-emerald-600">
                    Accepted {new Date(quote.acceptedAt).toLocaleString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          )}
          {quote.status === "declined" && (
            <div className="flex items-center gap-3 px-5 py-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <X size={20} className="text-rose-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-800">
                  This company declined the quote
                </p>
                {quote.declinedAt && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    Declined {new Date(quote.declinedAt).toLocaleString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-3xl p-6 space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 mb-2">
              Company Details
            </p>
            <p className="font-bold text-slate-800 text-lg">
              {quote.companyName}
            </p>
            {quote.contactName && (
              <p className="text-sm text-slate-600 font-semibold">
                Attn: {quote.contactName}
              </p>
            )}
            <p className="text-sm text-slate-500">{quote.email}</p>
            {quote.phone && (
              <p className="text-sm text-slate-500">{quote.phone}</p>
            )}
            {quote.address && (
              <p className="text-sm text-slate-500">{quote.address}</p>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
            <Repeat2 size={18} className="text-primary" />
            <p className="text-sm font-bold text-slate-700">
              {frequencyLabel}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 mb-3">
              Cleaning Services & Scope of Work
            </p>
            <div className="space-y-3">
              {(quote.items || []).map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200"
                >
                  <div className="flex justify-between items-start gap-3">
                    <p className="font-bold text-slate-800 text-sm">
                      {item.service || item.customService}
                    </p>
                    <p className="font-bold text-slate-800 text-sm whitespace-nowrap">
                      £
                      {(
                        Number(item.unitPrice || 0) * Number(item.qty || 1)
                      ).toFixed(2)}
                    </p>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      <span className="font-bold text-slate-600">
                        What will be cleaned:
                      </span>{" "}
                      {item.description}
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-primary/50 mt-1.5 flex items-center gap-1">
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

          <div className="space-y-2 bg-slate-50 rounded-3xl p-6">
            <div className="flex justify-between text-sm font-semibold text-slate-600">
              <span>Subtotal</span>
              <span>£{Number(quote.subtotal || 0).toFixed(2)}</span>
            </div>
            {quote.discountAmount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-emerald-600">
                <span>Discount ({quote.discount}%)</span>
                <span>-£{Number(quote.discountAmount).toFixed(2)}</span>
              </div>
            )}
            {quote.includeVat && quote.vat > 0 && (
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>VAT ({quote.vatRate}%)</span>
                <span>£{Number(quote.vat).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-800 pt-3 border-t border-slate-200">
              <span>GRAND TOTAL</span>
              <span>
                £{Number(quote.grandTotal || 0).toFixed(2)}
                {quote.frequency !== "once"
                  ? ` / ${frequencyLabel.split(" ")[0].toLowerCase()}`
                  : ""}
              </span>
            </div>
            {quote.depositRequired && quote.depositAmount > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-sm font-semibold text-primary">
                  <span>Deposit Required ({quote.depositPercent}%)</span>
                  <span>£{Number(quote.depositAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-slate-600">
                  <span>Balance Due</span>
                  <span>£{Number(quote.balanceDue).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {quote.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
                Notes & Terms
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
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
      className={`w-10 h-6 rounded-full transition-all relative ${value ? "bg-primary" : "bg-slate-200"}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-5" : "left-1"}`}
      />
    </div>
    <span className="text-sm font-bold text-slate-700">{label}</span>
  </label>
);

// ── Main ───────────────────────────────────────────────────────────────────────
const QuoteBuilder = () => {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [items, setItems] = useState([emptyItem()]);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(false);
  const [sentQuotes, setSentQuotes] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

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
          const apiNames = data.map((s) => s.name);
          setServices([
            ...apiNames,
            ...DEFAULT_SERVICES.filter((d) => !apiNames.includes(d)),
          ]);
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <FileText size={20} className="text-white" />
            </div>
            Quote Builder
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1 ml-14">
            Create & send professional service quotes to anyone — companies
            or individual customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Eye size={15} /> Preview
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
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
          <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Building2 size={18} className="text-primary/50" />
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Recipient Details
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">
                  Who is this quote for? Works for companies and individual
                  customers alike.
                </p>
              </div>
            </div>
            <div className="p-8 grid sm:grid-cols-2 gap-5">
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
                  <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => updateForm(f.key, e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Repeat2 size={18} className="text-primary/50" />
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Frequency & Terms
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">
                  How often will services be provided?
                </p>
              </div>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                    Service Frequency
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) => updateForm("frequency", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {FREQUENCY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                    VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.vatRate}
                    onChange={(e) => updateForm("vatRate", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                    Valid for (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.validDays}
                    onChange={(e) => updateForm("validDays", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  First Service Date & Time
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mb-4">
                  {form.frequency === "once"
                    ? "If the customer accepts, we'll automatically add this to the calendar."
                    : "If accepted, we'll automatically schedule this recurring slot on the calendar going forward."}
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.serviceDate}
                      onChange={(e) => updateForm("serviceDate", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                      Time Slot
                    </label>
                    <select
                      value={form.serviceTimeSlot}
                      onChange={(e) =>
                        updateForm("serviceTimeSlot", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
              <div className="border-t border-slate-200 pt-5 space-y-5">
                <h4 className="text-sm font-bold text-slate-800">
                  Payment Terms
                </h4>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                      Payment Terms
                    </label>
                    <select
                      value={form.paymentTerms}
                      onChange={(e) =>
                        updateForm("paymentTerms", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                    <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={form.discount}
                      onChange={(e) => updateForm("discount", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Deposit/Retainer Option */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                  <input
                    type="checkbox"
                    id="depositCheck"
                    checked={form.depositRequired}
                    onChange={(e) =>
                      updateForm("depositRequired", e.target.checked)
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="depositCheck"
                    className="text-sm font-semibold text-primary-dark cursor-pointer flex-1"
                  >
                    Require deposit/retainer payment
                  </label>
                </div>

                {form.depositRequired && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
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
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Hash size={18} className="text-primary/50" />
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Services & Pricing
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Add individual line items
                  </p>
                </div>
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-2xl text-xs font-bold border border-primary/20 transition-all"
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
                  services={services}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Pencil size={18} className="text-primary/50" />
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Notes & Terms
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">
                  Shown at the bottom of the quote
                </p>
              </div>
            </div>
            <div className="p-8">
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Right col ───────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden sticky top-24">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-800">
                Quote Summary
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Live calculation
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Recipient
                </p>
                <p className="font-bold text-slate-800 text-sm">
                  {form.companyName || (
                    <span className="text-slate-300 font-normal">
                      Company name…
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 font-semibold">
                  {form.email || (
                    <span className="text-slate-300 font-normal">
                      email@company.com
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <Repeat2 size={14} className="text-primary/50" />
                <span className="text-xs font-bold text-slate-700">
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
                        <span className="text-slate-600 font-semibold truncate flex-1 mr-2">
                          {item.service === "__custom__"
                            ? item.customService
                            : item.service}
                        </span>
                        <span className="font-bold text-slate-800">
                          £{(Number(item.unitPrice || 0) * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {form.includeVat && (
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>VAT ({form.vatRate}%)</span>
                    <span>£{vat.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-primary">
                    £{grandTotal.toFixed(2)}
                  </span>
                </div>
                {form.frequency !== "once" && (
                  <p className="text-[10px] font-bold text-slate-400 text-right">
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
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
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
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold transition-all border border-slate-200 flex items-center justify-center gap-2"
              >
                <Eye size={15} /> Preview Quote
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-primary/50" />
                  Quote History
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {showAllHistory ? "All quotes sent" : "Last 10 quotes"}
                </p>
              </div>
              <button
                onClick={toggleHistoryView}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-primary-dark transition-colors flex-shrink-0"
              >
                {showAllHistory ? "Show Recent" : "View All"}
              </button>
            </div>
            <div className="p-4 space-y-1 max-h-[420px] overflow-y-auto">
              {historyLoading && (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <RefreshCw size={16} className="animate-spin" />
                </div>
              )}
              {!historyLoading && sentQuotes.length === 0 && (
                <p className="text-xs text-slate-400 font-semibold text-center py-8">
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
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all text-left"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isAccepted ? "bg-emerald-100" : isDeclined ? "bg-rose-100" : "bg-slate-100"}`}
                      >
                        {isDeclined ? (
                          <X size={16} className="text-rose-600" />
                        ) : (
                          <CheckCircle2
                            size={16}
                            className={
                              isAccepted ? "text-emerald-600" : "text-slate-400"
                            }
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                          {q.companyName}
                          {isAccepted && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Accepted
                            </span>
                          )}
                          {isDeclined && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Declined
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {q.quoteRef} · £{Number(q.grandTotal || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex-shrink-0">
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
