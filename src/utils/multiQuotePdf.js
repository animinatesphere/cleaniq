// PDF for multi-property quotes (Commercial Hub), in the same layout and styles as the Quote
// Builder's PDF. Used by the multi-property quote builder and by quote history.
import logo from "../assets/logo DP.jpg";

// Quote History → "Edit" on a multi-property quote opens it in Commercial Hub via this key.
export const MULTI_QUOTE_EDIT_KEY = "cleaniq_multi_quote_edit_draft";

export const money = (n) => `£${(Number(n) || 0).toFixed(2)}`;
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const rooms = (x) => [x.bedrooms ? `${x.bedrooms} bed` : "", x.bathrooms ? `${x.bathrooms} bath` : ""].filter(Boolean).join(" · ");

// The quote PDF (same layout and styles as the Quote Builder's), opened in a new tab to print or
// save as PDF. `d` is a plain description of the quote, so saved quotes from history print too.
export function printMultiQuote(d) {
  const { ref, dateLabel, validDays, client, paymentTerms, title, subtitle, sizes, filled, subtotal, pct,
  discountAmount, condition, vat, vatRate, grandTotal, includedLines, extraRows, notes } = d;
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
}

/** Print a multi-property quote saved in quote history. */
export function printSavedMultiQuote(q) {
  const m = q.multi || {};
  printMultiQuote({
  ref: q.quoteRef,
  dateLabel: q.date || new Date(q.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  validDays: q.validDays,
  client: { companyName: q.companyName, contactName: q.contactName, email: q.email, phone: q.phone, address: q.address },
  paymentTerms: q.paymentTerms,
  title: m.title,
  subtitle: m.subtitle,
  sizes: m.sizes || [],
  filled: m.properties || [],
  subtotal: Number(q.subtotal) || 0,
  pct: Number(q.discount) || 0,
  discountAmount: Number(q.discountAmount) || 0,
  condition: m.discountCondition || "",
  vat: q.includeVat ? Number(q.vat) || 0 : 0,
  vatRate: q.vatRate,
  grandTotal: Number(q.grandTotal) || 0,
  includedLines: m.included || [],
  extraRows: (m.optionalExtras || []).map((x) => ({ name: x.name, unit: x.unit || "", price: x.price == null ? "" : x.price })),
  notes: q.notes || "",
  });
}

