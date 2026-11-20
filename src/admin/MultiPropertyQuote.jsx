// Commercial Hub → Commercial Quote → "Multi-property quote".
// One quote for several properties (e.g. end of tenancy for a letting agent's houses): price per
// property size, each property's price, a multi-property discount, what's included and optional
// extras. Sent through the normal quote system (same email, history and follow-ups); when the
// customer accepts, they pick a date per property and each property becomes its own booking.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download, Send, X, Building2, Home, Tag, ListChecks, PackagePlus, User, History, Pencil, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { printMultiQuote, printSavedMultiQuote, money, rooms, MULTI_QUOTE_EDIT_KEY } from "../utils/multiQuotePdf";

const API = import.meta.env.VITE_API_URL;

const newRef = () => `CLQ-${Date.now().toString().slice(-6)}`;
const sizeKey = (x) => `${Number(x.bedrooms) || 0}-${Number(x.bathrooms) || 0}`;

// Starting text for an end of tenancy quote; everything can be edited before sending.
const EOT_INCLUDED = [
  "Kitchen: oven, hob and extractor deep cleaned; inside and outside of all cupboards, fridge/freezer and appliances; worktops, tiles and sinks degreased",
  "Bathrooms: toilets, showers, baths and sinks sanitised; limescale removed from tiles, screens and taps; mirrors polished",
  "Bedrooms and living areas: dusting of all surfaces, inside wardrobes and drawers, skirting boards, doors, frames, switches and sockets",
  "Internal windows, sills and frames",
  "Hallways and stairs",
  "All floors vacuumed and hard floors mopped",
  "All products and equipment supplied by our team",
].join("\n");

const Field = ({ label, children, className = "" }) => (
  <div className={className}>
    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">{label}</label>
    {children}
  </div>
);
const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/20";
const Input = (props) => <input {...props} className={`${inputCls} ${props.className || ""}`} />;
const Section = ({ title, icon: Icon, children, right }) => (
  <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
    <div className="flex items-center justify-between gap-2.5 px-4 py-3 sm:px-5 sm:py-4 border-b border-white/[0.04] bg-white/5">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={15} className="text-primary flex-shrink-0" />}
        <h3 className="text-sm font-bold text-white/80 leading-tight">{title}</h3>
      </div>
      {right}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

const emptyProperty = () => ({ name: "", bedrooms: "", bathrooms: "", sqm: "", price: "" });

// Types of cleaning, as on the website's commercial enquiry form, plus end of tenancy and "Other".
// Picking one fills in the service name and how the properties are measured.
const CLEANING_TYPES = [
  { label: "End of Tenancy", title: "End of Tenancy Clean", sizeMode: "rooms" },
  { label: "Event Cleaning", title: "Event Cleaning", sizeMode: "sqm" },
  { label: "Restaurant Cleaning", title: "Restaurant Cleaning", sizeMode: "sqm" },
  { label: "Contract Cleaning", title: "Contract Cleaning", sizeMode: "sqm" },
  { label: "Communal Area Cleaning", title: "Communal Area Cleaning", sizeMode: "sqm" },
  { label: "Commercial Cleaning", title: "Commercial Cleaning", sizeMode: "sqm" },
  { label: "Gym Cleaning", title: "Gym Cleaning", sizeMode: "sqm" },
  { label: "Other", title: "", sizeMode: null },
];

const DEFAULT_FORM = {
  client: { companyName: "", contactName: "", email: "", phone: "", address: "" },
  cleaningType: "End of Tenancy",
  otherType: "",
  sizeMode: "rooms", // "rooms" (bedrooms & bathrooms) or "sqm" (square metres)
  ratePerSqm: "",
  title: "End of Tenancy Clean",
  subtitle: "",
  properties: [emptyProperty()],
  sizePrices: {},
  discount: "",
  discountCondition: "",
  includeVat: false,
  vatRate: 20,
  included: EOT_INCLUDED,
  extras: [
    { name: "Carpet steam cleaning", unit: "per room", price: "40" },
    { name: "Mattress cleaning", unit: "per mattress", price: "35" },
    { name: "Rubbish/item removal", unit: "", price: "" },
  ],
  paymentTerms: "Due on completion",
  validDays: 30,
  notes: "",
};

// Form values from a saved quote ("Edit & duplicate").
const formFromQuote = (q) => {
  const m = q.multi || {};
  return {
    client: { companyName: q.companyName || "", contactName: q.contactName || "", email: q.email || "", phone: q.phone || "", address: q.address || "" },
    cleaningType: CLEANING_TYPES.some((t) => t.label === m.cleaningType) ? m.cleaningType : m.cleaningType ? "Other" : "End of Tenancy",
    otherType: m.cleaningType && !CLEANING_TYPES.some((t) => t.label === m.cleaningType) ? m.cleaningType : "",
    sizeMode: m.sizeMode === "sqm" ? "sqm" : "rooms",
    ratePerSqm: m.ratePerSqm ? String(m.ratePerSqm) : "",
    title: m.title || DEFAULT_FORM.title,
    subtitle: m.subtitle || "",
    properties: (m.properties || []).length
      ? m.properties.map((x) => ({
          name: x.name || "",
          bedrooms: String(x.bedrooms || ""),
          bathrooms: String(x.bathrooms || ""),
          sqm: String(x.sqm || ""),
          // In square-metre quotes a site's price is kept as typed (it may differ from m² × rate).
          price: m.sizeMode === "sqm" ? String(x.price ?? "") : "",
        }))
      : [emptyProperty()],
    sizePrices: Object.fromEntries((m.sizes || []).map((x) => [sizeKey(x), String(x.price ?? "")])),
    discount: q.discount ? String(q.discount) : "",
    discountCondition: m.discountCondition || "",
    includeVat: !!q.includeVat,
    vatRate: q.vatRate ?? 20,
    included: (m.included || []).join("\n"),
    extras: (m.optionalExtras || []).map((x) => ({ name: x.name || "", unit: x.unit || "", price: x.price == null ? "" : String(x.price) })),
    paymentTerms: q.paymentTerms || "",
    validDays: q.validDays || 30,
    notes: q.notes || "",
  };
};

// A quote sent here from Quote History's "Edit" button, if any (read once).
const takeDraft = () => {
  try {
    const raw = sessionStorage.getItem(MULTI_QUOTE_EDIT_KEY);
    if (!raw) return DEFAULT_FORM;
    sessionStorage.removeItem(MULTI_QUOTE_EDIT_KEY);
    return formFromQuote(JSON.parse(raw));
  } catch {
    return DEFAULT_FORM;
  }
};

export default function MultiPropertyQuote() {
  const [initial] = useState(takeDraft);
  const [ref, setRef] = useState(newRef);
  const [client, setClient] = useState(initial.client);
  const [cleaningType, setCleaningType] = useState(initial.cleaningType);
  const [otherType, setOtherType] = useState(initial.otherType);
  const [sizeMode, setSizeMode] = useState(initial.sizeMode);
  const [ratePerSqm, setRatePerSqm] = useState(initial.ratePerSqm);
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [properties, setProperties] = useState(initial.properties);
  const [sizePrices, setSizePrices] = useState(initial.sizePrices); // "5-2" -> price
  const [discount, setDiscount] = useState(initial.discount);
  const [discountCondition, setDiscountCondition] = useState(initial.discountCondition);
  const [includeVat, setIncludeVat] = useState(initial.includeVat);
  const [vatRate, setVatRate] = useState(initial.vatRate);
  const [included, setIncluded] = useState(initial.included);
  const [extras, setExtras] = useState(initial.extras);
  const [paymentTerms, setPaymentTerms] = useState(initial.paymentTerms);
  const [validDays, setValidDays] = useState(initial.validDays);
  const [notes, setNotes] = useState(initial.notes);
  const [sendCopy, setSendCopy] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  // History of multi-property quotes (they're also in the main Quote History).
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [resending, setResending] = useState(null);
  const fetchHistory = useCallback(
    () =>
      fetch(`${API}/quotes?limit=200`)
        .then((r) => r.json())
        .then((d) => setHistory((d.data || []).filter((q) => q.quoteType === "multi")))
        .catch(() => {})
        .finally(() => setHistoryLoading(false)),
    [],
  );
  const loadHistory = () => {
    setHistoryLoading(true);
    fetchHistory();
  };
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // "Edit & duplicate": fill the form from a saved quote; it's sent as a new quote with a new reference.
  const loadQuote = (q) => {
    const f = formFromQuote(q);
    setRef(newRef());
    setClient(f.client);
    setCleaningType(f.cleaningType);
    setOtherType(f.otherType);
    setSizeMode(f.sizeMode);
    setRatePerSqm(f.ratePerSqm);
    setTitle(f.title);
    setSubtitle(f.subtitle);
    setProperties(f.properties);
    setSizePrices(f.sizePrices);
    setDiscount(f.discount);
    setDiscountCondition(f.discountCondition);
    setIncludeVat(f.includeVat);
    setVatRate(f.vatRate);
    setIncluded(f.included);
    setExtras(f.extras);
    setPaymentTerms(f.paymentTerms);
    setValidDays(f.validDays);
    setNotes(f.notes);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resend = async (q) => {
    if (!window.confirm(`Resend quote ${q.quoteRef} to ${q.email}?`)) return;
    setResending(q.quoteRef);
    try {
      const r = await fetch(`${API}/quotes/resend/${q.quoteRef}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!r.ok) throw new Error();
      setToast({ msg: `Quote ${q.quoteRef} resent to ${q.email}`, type: "success" });
    } catch {
      setToast({ msg: "Failed to resend the quote.", type: "error" });
    } finally {
      setResending(null);
    }
  };

  const setC = (k) => (e) => setClient((c) => ({ ...c, [k]: e.target.value }));
  const chooseType = (t) => {
    setCleaningType(t.label);
    if (t.label === "Other") {
      setTitle(otherType.trim());
    } else {
      setTitle(t.title);
      setSizeMode(t.sizeMode);
      // The end of tenancy list doesn't fit other jobs: clear it if it hasn't been edited.
      if (t.label !== "End of Tenancy" && included === EOT_INCLUDED) setIncluded("");
      if (t.label === "End of Tenancy" && !included.trim()) setIncluded(EOT_INCLUDED);
    }
  };
  const isSqm = sizeMode === "sqm";
  const unit = isSqm ? "site" : "property";
  const units = isSqm ? "sites" : "properties";
  const rate = Number(ratePerSqm) || 0;
  // A site's price: what was typed for it, otherwise its m² × the rate.
  const sqmPrice = (p) => (p.price !== "" && p.price != null ? Number(p.price) || 0 : Math.round((Number(p.sqm) || 0) * rate * 100) / 100);
  const setProp = (i, k, v) => setProperties((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const setExtra = (i, k, v) => setExtras((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  // Distinct property sizes, smallest first: each gets one price that every property of that size uses.
  const sizes = useMemo(() => {
    const seen = new Map();
    properties
      .filter((p) => Number(p.bedrooms) > 0 || Number(p.bathrooms) > 0)
      .forEach((p) => seen.set(sizeKey(p), { bedrooms: Number(p.bedrooms) || 0, bathrooms: Number(p.bathrooms) || 0 }));
    return [...seen.entries()]
      .map(([key, x]) => ({ key, ...x, price: Number(sizePrices[key]) || 0 }))
      .sort((a, b) => a.bedrooms - b.bedrooms || a.bathrooms - b.bathrooms);
  }, [properties, sizePrices]);

  const filled = isSqm
    ? properties
        .filter((p) => p.name.trim() || Number(p.sqm) > 0)
        .map((p) => ({ name: p.name.trim(), sqm: Number(p.sqm) || 0, price: sqmPrice(p) }))
    : properties
        .filter((p) => p.name.trim() || Number(p.bedrooms) > 0)
        .map((p) => ({ name: p.name.trim(), bedrooms: Number(p.bedrooms) || 0, bathrooms: Number(p.bathrooms) || 0, price: Number(sizePrices[sizeKey(p)]) || 0 }));
  const shownSizes = isSqm ? [] : sizes;
  const subtotal = filled.reduce((s, p) => s + p.price, 0);
  const pct = Math.min(Math.max(Number(discount) || 0, 0), 100);
  const discountAmount = Math.round(subtotal * pct) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vat = includeVat ? Math.round(afterDiscount * (Number(vatRate) || 0)) / 100 : 0;
  const grandTotal = afterDiscount + vat;
  const includedLines = included.split("\n").map((t) => t.trim()).filter(Boolean);
  const extraRows = extras.filter((x) => x.name.trim());
  const condition = discountCondition.trim() || (filled.length > 1 ? `If all ${filled.length} ${units} are booked` : "");
  const dateLabel = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const problems = () => {
    if (!client.companyName.trim()) return "Please enter the customer or company name.";
    if (!client.email.trim()) return "Please enter an email address.";
    if (cleaningType === "Other" && !title.trim()) return "Please type the kind of cleaning.";
    if (!filled.length) return `Please add at least one ${unit}.`;
    if (filled.some((p) => !p.name)) return `Please give every ${unit} a name or address.`;
    if (isSqm && filled.some((p) => !(p.price > 0))) return "Please enter the square metres and a price per m², or a price, for every site.";
    if (!isSqm && sizes.some((s) => !(s.price > 0))) return "Please enter a price for every property size.";
    return null;
  };

  const downloadPDF = () =>
    printMultiQuote({ ref, dateLabel, validDays, client, paymentTerms, title, subtitle, sizes: shownSizes, filled, subtotal, pct,
      discountAmount, condition, vat, vatRate, grandTotal, includedLines, extraRows, notes, ratePerSqm: isSqm ? rate : 0 });

  const send = async () => {
    const problem = problems();
    if (problem) return setToast({ msg: problem, type: "error" });
    setSending(true);
    try {
      const res = await fetch(`${API}/quotes/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...client,
          quoteRef: ref,
          date: dateLabel,
          frequency: "once",
          quoteType: "multi",
          multi: {
            title,
            subtitle,
            cleaningType: cleaningType === "Other" ? otherType.trim() || title : cleaningType,
            sizeMode,
            ratePerSqm: isSqm ? rate : 0,
            sizes: shownSizes.map(({ bedrooms, bathrooms, price }) => ({ bedrooms, bathrooms, price })),
            properties: filled,
            discountCondition: discountAmount > 0 ? condition : "",
            included: includedLines,
            optionalExtras: extraRows.map((x) => ({ name: x.name.trim(), unit: x.unit.trim(), price: x.price === "" ? null : Number(x.price) })),
          },
          // The properties are the quote's lines, so history, totals and follow-ups work as usual.
          items: filled.map((p) => ({ service: title, description: `${p.name}${rooms(p) ? ` · ${rooms(p)}` : ""}`, billingType: "flat", qty: 1, unitPrice: p.price, subtotal: p.price })),
          subtotal,
          discount: pct,
          discountAmount,
          subtotalAfterDiscount: afterDiscount,
          includeVat,
          vatRate: Number(vatRate) || 0,
          vat,
          grandTotal,
          validDays: Number(validDays) || 30,
          paymentTerms,
          notes,
          sendCopy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Server error");
      setToast({ msg: `Quote ${ref} sent to ${client.email}!`, type: "success" });
      setRef(newRef());
      loadHistory();
    } catch (e) {
      setToast({ msg: `Failed to send quote: ${e.message}`, type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100" aria-label="Close"><X size={15} /></button>
        </div>
      )}

      <Section title="Customer" icon={User} right={<span className="text-xs font-bold text-emerald-400">{ref}</span>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Company / customer name *"><Input value={client.companyName} onChange={setC("companyName")} placeholder="e.g. Salford Lettings Ltd" /></Field>
          <Field label="Contact name"><Input value={client.contactName} onChange={setC("contactName")} placeholder="e.g. Bell" /></Field>
          <Field label="Email *"><Input type="email" value={client.email} onChange={setC("email")} placeholder="name@company.com" /></Field>
          <Field label="Phone"><Input value={client.phone} onChange={setC("phone")} /></Field>
          <Field label="Address (optional)" className="sm:col-span-2"><Input value={client.address} onChange={setC("address")} /></Field>
        </div>
      </Section>

      <Section title="Type of cleaning" icon={Building2}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4" role="radiogroup" aria-label="Type of cleaning">
          {CLEANING_TYPES.map((t) => (
            <button
              key={t.label}
              type="button"
              role="radio"
              aria-checked={cleaningType === t.label}
              onClick={() => chooseType(t)}
              className={`px-3 py-2.5 rounded-xl border text-left text-sm font-semibold transition-all ${cleaningType === t.label ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300" : "bg-white/5 border-white/10 text-white/70 hover:border-white/25"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {cleaningType === "Other" && (
          <Field label="What kind of cleaning? *" className="mb-4">
            <Input
              value={otherType}
              onChange={(e) => { setOtherType(e.target.value); setTitle(e.target.value); }}
              placeholder="e.g. School cleaning, Warehouse cleaning, Church hall cleaning"
              autoFocus
            />
          </Field>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Service name on the quote"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Restaurant Cleaning" /></Field>
          <Field label="Line under the title (optional)"><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Salford properties · all have 2 bathrooms" /></Field>
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Measure each {unit} by</p>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1" role="radiogroup" aria-label="Measure by">
            {[["rooms", "Bedrooms & bathrooms"], ["sqm", "Square metres (m²)"]].map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={sizeMode === v}
                onClick={() => setSizeMode(v)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${sizeMode === v ? "bg-emerald-600 text-white" : "text-white/50 hover:text-white/80"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title={isSqm ? "Sites" : "Properties"}
        icon={Home}
        right={
          <button onClick={() => setProperties((ps) => [...ps, emptyProperty()])} className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300">
            <Plus size={14} /> Add {unit}
          </button>
        }
      >
        <div className="space-y-3">
          {properties.map((p, i) => (
            <div key={i} className={`grid gap-2 items-end ${isSqm ? "grid-cols-[1fr_90px_110px_32px]" : "grid-cols-[1fr_80px_80px_90px_32px]"}`}>
              <Field label={i === 0 ? `${isSqm ? "Site" : "Property"} name / address` : ""}>
                <Input value={p.name} onChange={(e) => setProp(i, "name", e.target.value)} placeholder={isSqm ? "e.g. The Kitchen, Deansgate" : "e.g. Carlton Road"} />
              </Field>
              {isSqm ? (
                <>
                  <Field label={i === 0 ? "Size (m²)" : ""}><Input type="number" min="0" value={p.sqm} onChange={(e) => setProp(i, "sqm", e.target.value)} placeholder="e.g. 120" /></Field>
                  <Field label={i === 0 ? "Price £" : ""}>
                    <Input type="number" min="0" step="0.01" value={p.price} onChange={(e) => setProp(i, "price", e.target.value)} placeholder={rate && Number(p.sqm) ? sqmPrice({ ...p, price: "" }).toFixed(2) : "£"} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label={i === 0 ? "Bedrooms" : ""}><Input type="number" min="0" value={p.bedrooms} onChange={(e) => setProp(i, "bedrooms", e.target.value)} /></Field>
                  <Field label={i === 0 ? "Bathrooms" : ""}><Input type="number" min="0" value={p.bathrooms} onChange={(e) => setProp(i, "bathrooms", e.target.value)} /></Field>
                  <div className="pb-2.5 text-right text-sm font-bold text-white/80">{Number(sizePrices[sizeKey(p)]) > 0 ? money(sizePrices[sizeKey(p)]) : "—"}</div>
                </>
              )}
              <button
                onClick={() => setProperties((ps) => (ps.length > 1 ? ps.filter((_, j) => j !== i) : [emptyProperty()]))}
                className="mb-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10"
                aria-label={`Remove ${unit}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {isSqm ? (
        <Section title="Price per square metre" icon={Tag}>
          <div className="grid sm:grid-cols-[200px_1fr] gap-4 items-center">
            <Input type="number" min="0" step="0.01" value={ratePerSqm} onChange={(e) => setRatePerSqm(e.target.value)} placeholder="£ per m²" />
            <p className="text-xs text-white/40">
              Each site's price is its size × this rate (shown greyed in the Price box). Type a price for a site to use that instead, or leave the rate empty and price every site yourself.
            </p>
          </div>
        </Section>
      ) : (
        <Section title="Price per property size" icon={Tag}>
          {sizes.length === 0 ? (
            <p className="text-sm text-white/40">Add properties with their bedrooms and bathrooms, and each size will appear here for you to price.</p>
          ) : (
            <div className="space-y-2">
              {sizes.map((sz) => (
                <div key={sz.key} className="grid grid-cols-[1fr_140px] gap-3 items-center">
                  <span className="text-sm font-semibold text-white/80">
                    {rooms(sz)} <span className="text-white/40 font-normal">· {filled.filter((p) => sizeKey(p) === sz.key).length} propert{filled.filter((p) => sizeKey(p) === sz.key).length === 1 ? "y" : "ies"}</span>
                  </span>
                  <Input type="number" min="0" step="0.01" value={sizePrices[sz.key] ?? ""} onChange={(e) => setSizePrices((m) => ({ ...m, [sz.key]: e.target.value }))} placeholder="Price £" />
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section title="Discount, VAT & terms" icon={Tag}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Discount %"><Input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="e.g. 10" /></Field>
          <Field label="Discount condition"><Input value={discountCondition} onChange={(e) => setDiscountCondition(e.target.value)} placeholder={filled.length > 1 ? `If all ${filled.length} ${units} are booked` : `e.g. If all ${units} are booked`} /></Field>
          <Field label="Payment terms"><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></Field>
          <Field label="Valid for (days)"><Input type="number" min="1" value={validDays} onChange={(e) => setValidDays(e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-white/70">
            <input type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} className="accent-emerald-500" /> Add VAT
          </label>
          {includeVat && <Field label="VAT rate %"><Input type="number" min="0" value={vatRate} onChange={(e) => setVatRate(e.target.value)} /></Field>}
        </div>
      </Section>

      <Section title="What's included (one per line)" icon={ListChecks}>
        <textarea value={included} onChange={(e) => setIncluded(e.target.value)} rows={8} className={`${inputCls} leading-relaxed`} />
      </Section>

      <Section
        title="Optional extras"
        icon={PackagePlus}
        right={
          <button onClick={() => setExtras((xs) => [...xs, { name: "", unit: "", price: "" }])} className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300">
            <Plus size={14} /> Add extra
          </button>
        }
      >
        <p className="text-xs text-white/40 mb-3">Leave the price empty to show "Quoted on request". Extras are listed on the quote but not added to the total.</p>
        <div className="space-y-2">
          {extras.map((x, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_100px_32px] gap-2 items-center">
              <Input value={x.name} onChange={(e) => setExtra(i, "name", e.target.value)} placeholder="Extra" />
              <Input value={x.unit} onChange={(e) => setExtra(i, "unit", e.target.value)} placeholder="per room" />
              <Input type="number" min="0" step="0.01" value={x.price} onChange={(e) => setExtra(i, "price", e.target.value)} placeholder="£" />
              <button onClick={() => setExtras((xs) => xs.filter((_, j) => j !== i))} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10" aria-label="Remove extra">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Notes (optional)" icon={ListChecks}>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} placeholder="Anything else the customer should know" />
      </Section>

      {/* Totals + actions */}
      <div className="bg-[#0B2D22] rounded-2xl border border-white/7 p-5 space-y-2">
        <div className="flex justify-between text-sm font-semibold text-white/60"><span>Total for {filled.length} {filled.length === 1 ? unit : units}</span><span>{money(subtotal)}</span></div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm font-semibold text-emerald-400"><span>Discount ({pct}%){condition ? ` · ${condition}` : ""}</span><span>−{money(discountAmount)}</span></div>
        )}
        {vat > 0 && <div className="flex justify-between text-sm font-semibold text-white/60"><span>VAT ({vatRate}%)</span><span>{money(vat)}</span></div>}
        <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-white/10"><span>Total{discountAmount > 0 ? " after discount" : ""}</span><span>{money(grandTotal)}</span></div>
        <label className="flex items-center gap-2 text-xs font-semibold text-white/50 pt-2">
          <input type="checkbox" checked={sendCopy} onChange={(e) => setSendCopy(e.target.checked)} className="accent-emerald-500" /> Send me a copy
        </label>
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button onClick={downloadPDF} className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-sm font-semibold flex items-center justify-center gap-2">
            <Download size={15} /> Download PDF
          </button>
          <button onClick={send} disabled={sending} className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2">
            <Send size={15} /> {sending ? "Sending…" : "Send quote"}
          </button>
        </div>
        <p className="text-[11px] text-white/40 pt-1">
          When the customer accepts, they choose a cleaning date for each {unit} and every {unit} is added to Bookings straight away. No card payment link is sent, so send them an invoice.
        </p>
      </div>
      {/* History */}
      <Section
        title="Multi-property quote history"
        icon={History}
        right={
          <div className="flex items-center gap-3">
            <button onClick={loadHistory} className="text-white/40 hover:text-white/80" aria-label="Refresh history">
              <RefreshCw size={14} className={historyLoading ? "animate-spin" : ""} />
            </button>
            <Link to="/admin/quotes/history" className="text-xs font-bold text-emerald-400 hover:text-emerald-300">All quotes →</Link>
          </div>
        }
      >
        {history.length === 0 ? (
          <p className="text-sm text-white/40">{historyLoading ? "Loading…" : "No multi-property quotes sent yet."}</p>
        ) : (
          <div className="space-y-3">
            {history.map((q) => {
              const props = q.multi?.properties || [];
              const tone = q.status === "accepted" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : q.status === "declined" ? "text-rose-400 bg-rose-500/10 border-rose-500/25" : "text-sky-300 bg-sky-500/10 border-sky-500/25";
              return (
                <div key={q.quoteRef} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">{q.companyName} <span className="text-white/40 font-semibold">· {q.quoteRef}</span></p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {q.multi?.title} · {props.length} propert{props.length === 1 ? "y" : "ies"} · sent {new Date(q.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${tone}`}>{q.status || "sent"}</span>
                      <span className="text-base font-black text-white tabular-nums">{money(q.grandTotal)}</span>
                    </div>
                  </div>
                  {q.status === "accepted" && props.some((x) => x.date) && (
                    <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                      {props.map((x, i) => (
                        <li key={i} className="flex justify-between gap-3 text-xs">
                          <span className="text-white/70 truncate">{x.name}{rooms(x) ? ` · ${rooms(x)}` : ""}</span>
                          <span className="text-emerald-400 font-semibold shrink-0">{x.date ? new Date(x.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => printSavedMultiQuote(q)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-xs font-semibold">
                      <Download size={12} /> Download PDF
                    </button>
                    <button onClick={() => resend(q)} disabled={resending === q.quoteRef} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold disabled:opacity-50">
                      {resending === q.quoteRef ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />} Resend
                    </button>
                    <button onClick={() => loadQuote(q)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-xs font-semibold">
                      <Pencil size={12} /> Edit &amp; duplicate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
