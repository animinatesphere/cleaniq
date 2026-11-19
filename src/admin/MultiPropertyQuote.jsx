// Commercial Hub → Commercial Quote → "Multi-property quote".
// One quote for several properties (e.g. end of tenancy for a letting agent's houses): price per
// property size, each property's price, a multi-property discount, what's included and optional
// extras. Sent through the normal quote system (same email, history and follow-ups); when the
// customer accepts, they pick a date per property and each property becomes its own booking.
import { useMemo, useState } from "react";
import { Plus, Trash2, Download, Send, X, Building2, Home, Tag, ListChecks, PackagePlus, User } from "lucide-react";
import logo from "../assets/logo DP.jpg";

const API = import.meta.env.VITE_API_URL;

const newRef = () => `CLQ-${Date.now().toString().slice(-6)}`;
const money = (n) => `£${(Number(n) || 0).toFixed(2)}`;
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rooms = (x) => [x.bedrooms ? `${x.bedrooms} bed` : "", x.bathrooms ? `${x.bathrooms} bath` : ""].filter(Boolean).join(" · ");
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

const emptyProperty = () => ({ name: "", bedrooms: "", bathrooms: "" });

export default function MultiPropertyQuote() {
  const [ref, setRef] = useState(newRef);
  const [client, setClient] = useState({ companyName: "", contactName: "", email: "", phone: "", address: "" });
  const [title, setTitle] = useState("End of Tenancy Clean");
  const [subtitle, setSubtitle] = useState("");
  const [properties, setProperties] = useState([emptyProperty()]);
  const [sizePrices, setSizePrices] = useState({}); // "5-2" -> price
  const [discount, setDiscount] = useState("");
  const [discountCondition, setDiscountCondition] = useState("");
  const [includeVat, setIncludeVat] = useState(false);
  const [vatRate, setVatRate] = useState(20);
  const [included, setIncluded] = useState(EOT_INCLUDED);
  const [extras, setExtras] = useState([
    { name: "Carpet steam cleaning", unit: "per room", price: "40" },
    { name: "Mattress cleaning", unit: "per mattress", price: "35" },
    { name: "Rubbish/item removal", unit: "", price: "" },
  ]);
  const [paymentTerms, setPaymentTerms] = useState("Due on completion");
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState("");
  const [sendCopy, setSendCopy] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const setC = (k) => (e) => setClient((c) => ({ ...c, [k]: e.target.value }));
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

  const filled = properties
    .filter((p) => p.name.trim() || Number(p.bedrooms) > 0)
    .map((p) => ({ name: p.name.trim(), bedrooms: Number(p.bedrooms) || 0, bathrooms: Number(p.bathrooms) || 0, price: Number(sizePrices[sizeKey(p)]) || 0 }));
  const subtotal = filled.reduce((s, p) => s + p.price, 0);
  const pct = Math.min(Math.max(Number(discount) || 0, 0), 100);
  const discountAmount = Math.round(subtotal * pct) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vat = includeVat ? Math.round(afterDiscount * (Number(vatRate) || 0)) / 100 : 0;
  const grandTotal = afterDiscount + vat;
  const includedLines = included.split("\n").map((t) => t.trim()).filter(Boolean);
  const extraRows = extras.filter((x) => x.name.trim());
  const condition = discountCondition.trim() || (filled.length > 1 ? `If all ${filled.length} properties are booked` : "");
  const dateLabel = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const problems = () => {
    if (!client.companyName.trim()) return "Please enter the customer or company name.";
    if (!client.email.trim()) return "Please enter an email address.";
    if (!filled.length) return "Please add at least one property.";
    if (filled.some((p) => !p.name)) return "Please give every property a name or address.";
    if (sizes.some((s) => !(s.price > 0))) return "Please enter a price for every property size.";
    return null;
  };

  // Same layout and styles as the Quote Builder's PDF.
  const downloadPDF = () => {
    const logoUrl = `${window.location.origin}${logo}`;
    const sizeRows = sizes.map((s) => `<tr><td>${esc(rooms(s))}</td><td style="text-align:right;font-weight:700;">${money(s.price)}</td></tr>`).join("");
    const propRows = filled
      .map((p) => `<tr><td><strong>${esc(p.name)}</strong></td><td style="text-align:center;">${esc(rooms(p))}</td><td style="text-align:right;font-weight:700;">${money(p.price)}</td></tr>`)
      .join("");
    const extraHtml = extraRows
      .map((x) => `<tr><td>${esc(x.name)}</td><td style="text-align:center;">${esc(x.unit) || "—"}</td><td style="text-align:right;font-weight:700;">${x.price === "" ? "Quoted on request" : money(x.price)}</td></tr>`)
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Quote — ${esc(client.companyName || "Client")} — ${ref}</title>
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
.label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:8px;}
.val{font-size:16px;font-weight:800;color:#0f172a;}
.sub{font-size:13px;color:#64748b;margin-top:3px;}
.info-block{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;display:flex;justify-content:space-between;margin-bottom:28px;}
.title{font-size:20px;font-weight:900;color:#0f172a;}
.subtitle{font-size:13px;color:#475569;margin-top:4px;margin-bottom:24px;}
h3{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin:0 0 8px;}
table{width:100%;border-collapse:collapse;margin-bottom:24px;}
thead tr{background:#0f172a;}
thead th{padding:12px 16px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:left;}
td{padding:11px 16px;border-bottom:1px solid #e2e8f0;}
tbody tr:nth-child(even){background:#f8fafc;}
.totals{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin-bottom:24px;}
.trow{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:#475569;}
.trow.discount{color:#16a34a;}
.trow .cond{display:block;font-size:11px;color:#64748b;}
.grand{font-size:17px;font-weight:900;color:#0f172a;border-top:2px solid #e2e8f0;padding-top:12px;margin-top:8px;}
ul{list-style:none;margin-bottom:24px;}
li{font-size:13px;color:#334155;line-height:1.5;padding:4px 0 4px 20px;position:relative;}
li:before{content:"✓";position:absolute;left:0;color:#16a34a;font-weight:900;}
.terms{font-size:12px;color:#475569;margin-bottom:6px;}
.notes{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-top:20px;}
.notes-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#d97706;margin-bottom:6px;}
.notes-body{font-size:13px;color:#92400e;line-height:1.6;white-space:pre-line;}
.footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;}
.avoid{page-break-inside:avoid;}
</style></head><body>
<div class="hdr">
  <img src="${logoUrl}" alt="Cleaniq Services" class="hdr-logo" />
  <div class="hdr-right">
    <div class="lbl">Service Quote</div>
    <div class="ref">${ref}</div>
    <div class="date">${dateLabel}</div>
    ${validDays ? `<div class="date">Valid for ${Number(validDays)} days</div>` : ""}
  </div>
</div>
<div class="body">
  <div class="info-block">
    <div>
      <div class="label">Prepared For</div>
      <div class="val">${esc(client.companyName) || "—"}</div>
      ${client.contactName ? `<div class="sub">Attn: ${esc(client.contactName)}</div>` : ""}
      ${client.email ? `<div class="sub">${esc(client.email)}</div>` : ""}
      ${client.phone ? `<div class="sub">${esc(client.phone)}</div>` : ""}
      ${client.address ? `<div class="sub">${esc(client.address)}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div class="label">Payment Terms</div>
      <div class="val" style="font-size:14px;">${esc(paymentTerms) || "—"}</div>
    </div>
  </div>
  <div class="title">${esc(title)}</div>
  ${subtitle ? `<div class="subtitle">${esc(subtitle)}</div>` : `<div class="subtitle"></div>`}
  <div class="avoid"><h3>Price per property size</h3>
  <table><thead><tr><th>Property size</th><th style="text-align:right;">Price per property</th></tr></thead><tbody>${sizeRows}</tbody></table></div>
  <div class="avoid"><h3>Your properties</h3>
  <table><thead><tr><th>Property</th><th style="text-align:center;">Size</th><th style="text-align:right;">Price</th></tr></thead><tbody>${propRows}</tbody></table></div>
  <div class="totals avoid">
    <div class="trow"><span>Total for ${filled.length} propert${filled.length === 1 ? "y" : "ies"}</span><span>${money(subtotal)}</span></div>
    ${discountAmount > 0 ? `<div class="trow discount"><span>Multi-property discount (${pct}%)${condition ? `<span class="cond">${esc(condition)}</span>` : ""}</span><span>−${money(discountAmount)}</span></div>` : ""}
    ${vat > 0 ? `<div class="trow"><span>VAT (${Number(vatRate)}%)</span><span>${money(vat)}</span></div>` : ""}
    <div class="trow grand"><span>TOTAL${discountAmount > 0 ? " AFTER DISCOUNT" : ""}</span><span>${money(grandTotal)}</span></div>
  </div>
  ${includedLines.length ? `<div class="avoid"><h3>What's included</h3><ul>${includedLines.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
  ${extraRows.length ? `<div class="avoid"><h3>Optional extras</h3>
  <table><thead><tr><th>Extra</th><th style="text-align:center;">Unit</th><th style="text-align:right;">Price</th></tr></thead><tbody>${extraHtml}</tbody></table></div>` : ""}
  ${notes ? `<div class="notes avoid"><div class="notes-label">Notes &amp; Terms</div><div class="notes-body">${esc(notes)}</div></div>` : ""}
  <div class="footer"><span>© ${new Date().getFullYear()} Cleaniq Services Limited · 20 Swan St, Manchester M4 5JW</span><span>info@cleaniqservices.com · cleaniqservices.com · +44 7846 726428</span></div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

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
            sizes: sizes.map(({ bedrooms, bathrooms, price }) => ({ bedrooms, bathrooms, price })),
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

      <Section title="Service" icon={Building2}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Service"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="End of Tenancy Clean" /></Field>
          <Field label="Line under the title (optional)"><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Salford properties · all have 2 bathrooms" /></Field>
        </div>
      </Section>

      <Section
        title="Properties"
        icon={Home}
        right={
          <button onClick={() => setProperties((ps) => [...ps, emptyProperty()])} className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300">
            <Plus size={14} /> Add property
          </button>
        }
      >
        <div className="space-y-3">
          {properties.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_90px_32px] gap-2 items-end">
              <Field label={i === 0 ? "Property name / address" : ""}><Input value={p.name} onChange={(e) => setProp(i, "name", e.target.value)} placeholder="e.g. Carlton Road" /></Field>
              <Field label={i === 0 ? "Bedrooms" : ""}><Input type="number" min="0" value={p.bedrooms} onChange={(e) => setProp(i, "bedrooms", e.target.value)} /></Field>
              <Field label={i === 0 ? "Bathrooms" : ""}><Input type="number" min="0" value={p.bathrooms} onChange={(e) => setProp(i, "bathrooms", e.target.value)} /></Field>
              <div className="pb-2.5 text-right text-sm font-bold text-white/80">{Number(sizePrices[sizeKey(p)]) > 0 ? money(sizePrices[sizeKey(p)]) : "—"}</div>
              <button
                onClick={() => setProperties((ps) => (ps.length > 1 ? ps.filter((_, j) => j !== i) : [emptyProperty()]))}
                className="mb-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10"
                aria-label="Remove property"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Price per property size" icon={Tag}>
        {sizes.length === 0 ? (
          <p className="text-sm text-white/40">Add properties with their bedrooms and bathrooms, and each size will appear here for you to price.</p>
        ) : (
          <div className="space-y-2">
            {sizes.map((s) => (
              <div key={s.key} className="grid grid-cols-[1fr_140px] gap-3 items-center">
                <span className="text-sm font-semibold text-white/80">
                  {rooms(s)} <span className="text-white/40 font-normal">· {filled.filter((p) => sizeKey(p) === s.key).length} propert{filled.filter((p) => sizeKey(p) === s.key).length === 1 ? "y" : "ies"}</span>
                </span>
                <Input type="number" min="0" step="0.01" value={sizePrices[s.key] ?? ""} onChange={(e) => setSizePrices((m) => ({ ...m, [s.key]: e.target.value }))} placeholder="Price £" />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Discount, VAT & terms" icon={Tag}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Multi-property discount %"><Input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="e.g. 10" /></Field>
          <Field label="Discount condition"><Input value={discountCondition} onChange={(e) => setDiscountCondition(e.target.value)} placeholder={filled.length > 1 ? `If all ${filled.length} properties are booked` : "e.g. If all properties are booked"} /></Field>
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
        <div className="flex justify-between text-sm font-semibold text-white/60"><span>Total for {filled.length} propert{filled.length === 1 ? "y" : "ies"}</span><span>{money(subtotal)}</span></div>
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
          When the customer accepts, they choose a cleaning date for each property and every property is added to Bookings straight away. No card payment link is sent, so send them an invoice.
        </p>
      </div>
    </div>
  );
}
