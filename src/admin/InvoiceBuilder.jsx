import React, { useState, useMemo } from "react";
import html2pdf from "html2pdf.js";
import {
  FileText, Plus, Trash2, Send, Download, X, Search,
  CreditCard, Copy, GripVertical, Eye, EyeOff, ChevronDown,
  Building2, AlignLeft, Users, RefreshCw, Layers,
} from "lucide-react";
import logoAsset from "../assets/lOGO.png";

const API = import.meta.env.VITE_API_URL;
const uid = () => `${Date.now()}-${Math.random()}`;
const emptyItem = () => ({ id: uid(), description: "", qty: 1, rate: 0 });

const SECTION_DEFS = [
  { id: "client", label: "Client Details",         icon: Users      },
  { id: "items",  label: "Line Items",             icon: AlignLeft  },
  { id: "bank",   label: "Bank Transfer Details",  icon: Building2  },
  { id: "stripe", label: "Stripe Pay Now Button",  icon: CreditCard },
  { id: "notes",  label: "Notes",                  icon: FileText   },
];

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={15} /></button>
  </div>
);

const Field = ({ label, span = 1, children }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
    {children}
  </div>
);

const inp = "w-full p-2.5 rounded-lg border-2 border-slate-200 text-xs font-medium focus:outline-none focus:border-primary transition-colors bg-white";

const PDF_OPTS = {
  margin: [8, 8, 8, 8],
  image: { type: "jpeg", quality: 0.95 },
  html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true, imageTimeout: 15000 },
  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  pagebreak: { mode: ["avoid-all", "css"] },
};

const mountForPdf = (html) =>
  new Promise((resolve) => {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const root = parsed.getElementById("inv-root");
    if (!root) { resolve(null); return; }
    const host = document.createElement("div");
    Object.assign(host.style, { position: "absolute", top: "-99999px", left: "0", width: "794px", background: "#fff" });
    host.appendChild(root);
    document.body.appendChild(host);
    setTimeout(() => { host.style.height = host.scrollHeight + "px"; resolve(host); }, 800);
  });

const InvoiceBuilder = () => {
  const [sections, setSections]       = useState(SECTION_DEFS.map((s) => ({ ...s, enabled: s.id !== "stripe" })));
  const [openSections, setOpenSections] = useState(() => new Set(SECTION_DEFS.map((s) => s.id)));
  const [dragIdx, setDragIdx]         = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [showPaidBadge, setShowPaidBadge] = useState(false);
  const [flatRate, setFlatRate]           = useState(false);

  const [client, setClient] = useState({ name: "", email: "", phone: "", address: "" });
  const setC = (k, v) => setClient((p) => ({ ...p, [k]: v }));

  const [serviceDate, setServiceDate] = useState("");
  const [items, setItems]             = useState([emptyItem()]);
  const updateItem = (id, k, v) => setItems((p) => p.map((it) => (it.id === id ? { ...it, [k]: v } : it)));
  const addItem    = ()         => setItems((p) => [...p, emptyItem()]);
  const removeItem = (id)       => setItems((p) => p.filter((it) => it.id !== id));

  const [bank, setBank] = useState({ accountName: "Cleaniq Services Limited", sortCode: "40-11-56", accountNumber: "81106546", bankName: "", reference: "" });
  const setB = (k, v) => setBank((p) => ({ ...p, [k]: v }));

  const [paymentLink, setPaymentLink]     = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [notes, setNotes]                 = useState("Thank you for your business!");

  // Load mode
  const [loadMode, setLoadMode] = useState("single"); // "single" | "multi"

  // Single booking
  const [bookingRef, setBookingRef]       = useState("");
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadedBookingId, setLoadedBookingId] = useState(null);

  // Multi-booking (combine)
  const [customerSearch, setCustomerSearch]       = useState("");
  const [foundBookings, setFoundBookings]         = useState([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState(new Set());
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [sending, setSending]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const invoiceDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0),
    [items]
  );

  const isEnabled   = (id) => sections.find((s) => s.id === id)?.enabled ?? false;
  const toggleSection = (id) => setSections((p) => p.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  const toggleOpen  = (id) => setOpenSections((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const onDragStart = (idx) => setDragIdx(idx);
  const onDragOver  = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const onDrop      = (toIdx) => {
    if (dragIdx !== null && dragIdx !== toIdx) {
      setSections((p) => { const n = [...p]; const [m] = n.splice(dragIdx, 1); n.splice(toIdx, 0, m); return n; });
    }
    setDragIdx(null); setDragOverIdx(null);
  };

  const bankText = [
    bank.accountName   && `Account Name: ${bank.accountName}`,
    bank.sortCode      && `Sort Code: ${bank.sortCode}`,
    bank.accountNumber && `Account Number: ${bank.accountNumber}`,
    bank.bankName      && `Bank: ${bank.bankName}`,
    bank.reference     && `Reference: ${bank.reference}`,
  ].filter(Boolean).join("\n");

  // ── Single booking load ───────────────────────────────────────────────────
  const handleLoadBooking = async () => {
    if (!bookingRef.trim()) return;
    setLoadingBooking(true);
    try {
      const res  = await fetch(`${API}/bookings/by-ref/${encodeURIComponent(bookingRef.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking not found");

      setInvoiceNumber(`INV-${data.bookingId}`);
      setClient({
        name:    `${data.customer?.firstName || ""} ${data.customer?.lastName || ""}`.trim(),
        email:   data.customer?.email   || "",
        phone:   data.customer?.phone   || "",
        address: data.details?.address  || "",
      });
      const rawDate = data.details?.date || data.scheduledDate || data.date || "";
      if (rawDate) {
        try { setServiceDate(new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })); }
        catch { setServiceDate(rawDate); }
      }

      const extras = Array.isArray(data.details?.extras) ? data.details.extras : [];
      const descParts = [data.service || "Cleaning Service"];
      if (data.details?.bedrooms) descParts.push(`${data.details.bedrooms} bed`);
      if (!flatRate && data.payment?.billingType !== "flat" && data.details?.duration)
        descParts.push(`${data.details.duration} hrs`);

      setItems([
        { id: uid(), description: descParts.join(" · "), qty: 1, rate: Number(data.payment?.amount || 0) },
        ...extras.map((ex) => ({ id: uid(), description: typeof ex === "string" ? ex : ex.name || ex.label || String(ex), qty: 1, rate: Number(ex.price || ex.amount || 0) })),
      ]);
      setLoadedBookingId(data._id);
      showToast(`Loaded booking ${data.bookingId}`);
    } catch (err) {
      showToast(err.message || "Could not find that booking", "error");
    } finally { setLoadingBooking(false); }
  };

  // ── Multi-booking search ──────────────────────────────────────────────────
  const handleSearchCustomer = async () => {
    if (!customerSearch.trim()) return;
    setSearchingCustomer(true);
    setFoundBookings([]);
    setSelectedBookingIds(new Set());
    try {
      const res = await fetch(`${API}/bookings`);
      const all = await res.json();
      const q   = customerSearch.toLowerCase().trim();
      const matched = (Array.isArray(all) ? all : [])
        .filter(b =>
          b.status !== "Blackout" &&
          (
            b.customer?.email?.toLowerCase().includes(q) ||
            b.customer?.firstName?.toLowerCase().includes(q) ||
            b.customer?.lastName?.toLowerCase().includes(q) ||
            `${b.customer?.firstName} ${b.customer?.lastName}`.toLowerCase().includes(q)
          )
        )
        .sort((a, b) => new Date(b.schedule?.date || b.createdAt) - new Date(a.schedule?.date || a.createdAt));
      setFoundBookings(matched);
      if (!matched.length) showToast("No bookings found for that customer", "error");
    } catch {
      showToast("Search failed", "error");
    } finally { setSearchingCustomer(false); }
  };

  const toggleBookingSelection = (id) => {
    setSelectedBookingIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectedTotal = foundBookings
    .filter((b) => selectedBookingIds.has(b._id))
    .reduce((s, b) => s + Number(b.payment?.amount || 0), 0);

  const handleAddSelectedToInvoice = () => {
    const selected = foundBookings.filter((b) => selectedBookingIds.has(b._id));
    if (!selected.length) return;

    const first = selected[0];
    setClient({
      name:    `${first.customer?.firstName || ""} ${first.customer?.lastName || ""}`.trim(),
      email:   first.customer?.email  || "",
      phone:   first.customer?.phone  || "",
      address: first.details?.address || "",
    });

    const newItems = selected.map((b) => {
      const dateStr = b.schedule?.date
        ? new Date(b.schedule.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;
      const parts = [b.service || "Cleaning Service"];
      if (dateStr) parts.push(dateStr);
      if (!flatRate && b.details?.duration) parts.push(`${b.details.duration}h`);
      return { id: uid(), description: parts.join(" · "), qty: 1, rate: Number(b.payment?.amount || 0) };
    });

    setItems(newItems);
    setInvoiceNumber(`INV-${(first.customer?.firstName || "COMB").toUpperCase().replace(/\s/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`);
    if (selected.length === 1 && selected[0].schedule?.date) {
      setServiceDate(new Date(selected[0].schedule.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }));
    }
    setLoadedBookingId(null);
    showToast(`${selected.length} booking${selected.length > 1 ? "s" : ""} added to invoice`);
    setSelectedBookingIds(new Set());
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    invoiceNumber, customerName: client.name, customerEmail: client.email,
    customerPhone: client.phone, customerAddress: client.address,
    serviceDate, invoiceDate, items,
    notes: isEnabled("notes") ? notes : "",
    paymentInstructions: isEnabled("bank") ? bankText : "",
    showPaidBadge, currencySymbol: "£",
    paymentLink: isEnabled("stripe") ? paymentLink : "",
    bookingId: loadedBookingId,
    flatRate,
  });

  const handleGeneratePaymentLink = async () => {
    if (subtotal <= 0) { showToast("Add items with an amount first", "error"); return; }
    setGeneratingLink(true);
    try {
      const res  = await fetch(`${API}/custom-invoice/payment-link`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPaymentLink(data.url);
      showToast("Stripe payment link generated");
    } catch (err) { showToast(err.message || "Failed to generate link", "error"); }
    finally { setGeneratingLink(false); }
  };

  const handleSend = async () => {
    if (!client.email || !items[0]?.description) { showToast("Add a customer email and at least one item", "error"); return; }
    setSending(true);
    try {
      const res  = await fetch(`${API}/custom-invoice/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (loadedBookingId) {
        try { await fetch(`${API}/bookings/${loadedBookingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Confirmed" }) }); } catch {}
      }
      showToast(loadedBookingId ? `Invoice sent to ${client.email} — booking marked Confirmed` : `Invoice sent to ${client.email}`);
    } catch (err) { showToast(err.message || "Failed to send invoice", "error"); }
    finally { setSending(false); }
  };

  // ── PDF Download ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    const logoUrl    = `${window.location.origin}${logoAsset}`;
    const enabledIds = sections.filter((s) => s.enabled).map((s) => s.id);
    const filename   = `Invoice-${invoiceNumber}-${(client.name || "Cleaniq").replace(/[^a-z0-9]/gi, "-")}.pdf`;

    const itemsTableHtml = flatRate
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:16px;border:1px solid #e2e8f0">
  <thead><tr style="background:#0f172a">
    <th style="padding:11px 16px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:left">Description</th>
    <th style="padding:11px 16px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:right;width:120px">Amount</th>
  </tr></thead>
  <tbody>${items.map((item, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f9fafb"}">
      <td style="padding:12px 16px;font-size:12px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9">${item.description || "—"}</td>
      <td style="padding:12px 16px;font-size:12px;color:#0f172a;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9">£${((Number(item.qty)||0)*(Number(item.rate)||0)).toFixed(2)}</td>
    </tr>`).join("")}</tbody>
</table>`
      : `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:16px;border:1px solid #e2e8f0">
  <thead><tr style="background:#0f172a">
    <th style="padding:11px 16px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:left">Description</th>
    <th style="padding:11px 16px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:center;width:48px">Qty</th>
    <th style="padding:11px 16px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:right;width:80px">Rate</th>
    <th style="padding:11px 16px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:right;width:90px">Amount</th>
  </tr></thead>
  <tbody>${items.map((item, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f9fafb"}">
      <td style="padding:12px 16px;font-size:12px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9">${item.description || "—"}</td>
      <td style="padding:12px 16px;font-size:12px;color:#64748b;text-align:center;border-bottom:1px solid #f1f5f9">${item.qty}</td>
      <td style="padding:12px 16px;font-size:12px;color:#64748b;text-align:right;border-bottom:1px solid #f1f5f9">£${Number(item.rate||0).toFixed(2)}</td>
      <td style="padding:12px 16px;font-size:12px;color:#0f172a;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9">£${((Number(item.qty)||0)*(Number(item.rate)||0)).toFixed(2)}</td>
    </tr>`).join("")}</tbody>
</table>`;

    const totalBox = `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
  <tr><td></td><td style="width:220px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A5C43;border-radius:12px;overflow:hidden">
      <tr>
        <td style="padding:14px 18px;font-size:10px;font-weight:800;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1px">${showPaidBadge ? "Total Paid" : "Total Due"}</td>
        <td style="padding:14px 18px;font-size:22px;font-weight:900;color:#ffffff;text-align:right">£${subtotal.toFixed(2)}</td>
      </tr>
    </table>
  </td></tr>
</table>`;

    const sectionHtml = (id) => {
      switch (id) {
        case "client": return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
  <tr>
    <td style="vertical-align:top;width:50%;padding-right:16px">
      <p style="font-size:8px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;padding-bottom:5px;border-bottom:2px solid #d1fae5">Billed To</p>
      <p style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:3px">${client.name || "—"}</p>
      ${client.email   ? `<p style="font-size:11px;color:#64748b;margin-top:2px">${client.email}</p>` : ""}
      ${client.phone   ? `<p style="font-size:11px;color:#64748b;margin-top:2px">${client.phone}</p>` : ""}
      ${client.address ? `<p style="font-size:11px;color:#64748b;margin-top:4px;line-height:1.5">${client.address}</p>` : ""}
    </td>
    <td style="vertical-align:top;width:50%;text-align:right;padding-left:16px">
      <p style="font-size:8px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;padding-bottom:5px;border-bottom:2px solid #d1fae5">From</p>
      <p style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:3px">Cleaniq Services Ltd</p>
      <p style="font-size:11px;color:#64748b;margin-top:2px">info@cleaniqservices.com</p>
      <p style="font-size:11px;color:#64748b;margin-top:2px">+44 7752 476368</p>
      <p style="font-size:11px;color:#64748b;margin-top:2px">cleaniqservices.com</p>
    </td>
  </tr>
</table>`;
        case "items":  return itemsTableHtml + totalBox;
        case "bank":   return bankText ? `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:16px">
  <tr><td style="background:#0f172a;padding:10px 16px"><p style="font-size:8px;font-weight:800;color:#6ee7b7;text-transform:uppercase;letter-spacing:1.2px;margin:0">Bank Transfer Details</p></td></tr>
  <tr><td style="background:#f8fafc;padding:16px"><p style="font-size:12px;color:#334155;white-space:pre-line;line-height:2;font-weight:500;margin:0">${bankText}</p></td></tr>
</table>` : "";
        case "stripe": return paymentLink ? `
<div style="text-align:center;margin:20px 0 16px">
  <a href="${paymentLink}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:800;padding:14px 36px;border-radius:12px;font-size:14px;text-decoration:none">💳 Pay Now Securely</a>
  <p style="font-size:10px;color:#94a3b8;margin-top:8px">Encrypted · Powered by Stripe</p>
</div>` : "";
        case "notes":  return notes ? `
<div style="background:#f0fdf4;border-radius:10px;padding:14px 18px;border-left:4px solid #0A5C43;margin-bottom:16px">
  <p style="font-size:8px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1px;margin:0 0 5px">Note</p>
  <p style="font-size:12px;color:#065f46;white-space:pre-line;line-height:1.7;margin:0">${notes}</p>
</div>` : "";
        default: return "";
      }
    };

    const CSS = `#inv-root *{margin:0;padding:0;box-sizing:border-box}#inv-root{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1e293b;background:#fff;width:794px;-webkit-print-color-adjust:exact;print-color-adjust:exact}`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#fff">
<div id="inv-root"><style>${CSS}</style>
<div style="background:#0A5C43;padding:36px 44px 30px">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle">
      <img src="${logoUrl}" alt="Cleaniq Services" style="height:52px;width:auto;display:block" />
      <p style="margin:10px 0 0;font-size:9px;font-weight:800;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:2px">Professional Cleaning Services</p>
    </td>
    <td style="text-align:right;vertical-align:middle">
      <p style="font-size:34px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1">INVOICE</p>
      <p style="font-size:13px;font-weight:700;color:#6ee7b7;margin-top:6px">${invoiceNumber}</p>
      ${showPaidBadge ? `<span style="display:inline-block;margin-top:10px;background:#6ee7b7;color:#064e3b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;padding:5px 16px;border-radius:999px">✓ PAID IN FULL</span>` : ""}
    </td>
  </tr></table>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-top:3px solid #0A5C43">
  <tr>
    <td style="padding:12px 20px;border-right:1px solid #bbf7d0;width:25%"><p style="font-size:7.5px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;opacity:.75;margin-bottom:3px">Invoice #</p><p style="font-size:11px;font-weight:700;color:#0f172a">${invoiceNumber}</p></td>
    <td style="padding:12px 20px;border-right:1px solid #bbf7d0;width:25%"><p style="font-size:7.5px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;opacity:.75;margin-bottom:3px">Invoice Date</p><p style="font-size:11px;font-weight:700;color:#0f172a">${invoiceDate}</p></td>
    <td style="padding:12px 20px;border-right:1px solid #bbf7d0;width:25%"><p style="font-size:7.5px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;opacity:.75;margin-bottom:3px">Service Date</p><p style="font-size:11px;font-weight:700;color:#0f172a">${serviceDate || "—"}</p></td>
    <td style="padding:12px 20px;width:25%"><p style="font-size:7.5px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;opacity:.75;margin-bottom:3px">Status</p><p style="font-size:11px;font-weight:800;color:${showPaidBadge ? "#16a34a" : "#d97706"}">${showPaidBadge ? "✓ Paid" : "Payment Due"}</p></td>
  </tr>
</table>
<div style="padding:32px 44px 40px;background:#ffffff">${enabledIds.map(sectionHtml).join("")}</div>
<div style="background:#0A5C43;padding:22px 44px;text-align:center">
  <p style="font-size:14px;font-weight:800;color:#ffffff;margin-bottom:4px">Thank you for choosing Cleaniq Services</p>
  <p style="font-size:11px;color:rgba(255,255,255,.6)">We're committed to delivering a spotless clean every time.</p>
</div>
<div style="background:#0f172a;padding:18px 44px;text-align:center">
  <p style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px">Cleaniq Services Limited</p>
  <p style="font-size:10px;color:#475569">info@cleaniqservices.com &nbsp;·&nbsp; cleaniqservices.com &nbsp;·&nbsp; +44 7752 476368</p>
  <p style="font-size:9px;color:#334155;margin-top:6px">&copy; ${new Date().getFullYear()} Cleaniq Services. All rights reserved.</p>
</div>
</div></body></html>`;

    const host = await mountForPdf(html);
    try {
      await html2pdf().set({ ...PDF_OPTS, filename }).from(host.firstElementChild).save();
    } finally {
      if (host && host.parentNode) document.body.removeChild(host);
      setDownloading(false);
    }
  };

  // ── Section forms ─────────────────────────────────────────────────────────
  const renderSectionForm = (id) => {
    switch (id) {
      case "client":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input className={inp} value={client.name} onChange={(e) => setC("name", e.target.value)} placeholder="John Doe" /></Field>
            <Field label="Email"><input className={inp} type="email" value={client.email} onChange={(e) => setC("email", e.target.value)} placeholder="customer@email.com" /></Field>
            <Field label="Phone"><input className={inp} type="tel" value={client.phone} onChange={(e) => setC("phone", e.target.value)} placeholder="+44 7700 000000" /></Field>
            <Field label="Service Date"><input className={inp} value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} placeholder="e.g. 15 July 2026" /></Field>
            <Field label="Address" span={2}><input className={inp} value={client.address} onChange={(e) => setC("address", e.target.value)} placeholder="Full property / service address" /></Field>
          </div>
        );

      case "items":
        return (
          <div className="space-y-2">
            <div className={`grid gap-1.5 pb-1 ${flatRate ? "grid-cols-[1fr_80px_30px]" : "grid-cols-[1fr_50px_66px_30px]"}`}>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Description</p>
              {!flatRate && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">Qty</p>}
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">{flatRate ? "Amount £" : "Rate £"}</p>
              <p />
            </div>
            {items.map((item) => (
              <div key={item.id} className={`grid gap-1.5 ${flatRate ? "grid-cols-[1fr_80px_30px]" : "grid-cols-[1fr_50px_66px_30px]"}`}>
                <input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Service description" className={inp} />
                {!flatRate && <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(item.id, "qty", e.target.value)} className={`${inp} text-center`} />}
                <input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateItem(item.id, "rate", e.target.value)} className={`${inp} text-center`} />
                <button onClick={() => removeItem(item.id)} disabled={items.length === 1} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all disabled:opacity-30"><Trash2 size={13} /></button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <button onClick={addItem} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80">
                <Plus size={13} /> Add Line Item
              </button>
              <span className="text-xs font-black text-slate-700">Total: £{subtotal.toFixed(2)}</span>
            </div>
          </div>
        );

      case "bank":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Account Name" span={2}><input className={inp} value={bank.accountName} onChange={(e) => setB("accountName", e.target.value)} /></Field>
            <Field label="Sort Code"><input className={inp} value={bank.sortCode} onChange={(e) => setB("sortCode", e.target.value)} placeholder="00-00-00" /></Field>
            <Field label="Account Number"><input className={inp} value={bank.accountNumber} onChange={(e) => setB("accountNumber", e.target.value)} /></Field>
            <Field label="Bank Name"><input className={inp} value={bank.bankName} onChange={(e) => setB("bankName", e.target.value)} placeholder="Optional" /></Field>
            <Field label="Payment Reference"><input className={inp} value={bank.reference} onChange={(e) => setB("reference", e.target.value)} placeholder="Optional" /></Field>
          </div>
        );

      case "stripe":
        return paymentLink ? (
          <div className="flex gap-2 items-center">
            <input readOnly value={paymentLink} className="flex-1 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-medium text-indigo-700 truncate" />
            <button onClick={() => { navigator.clipboard.writeText(paymentLink); showToast("Link copied"); }} className="p-2.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-all"><Copy size={14} /></button>
            <button onClick={() => setPaymentLink("")} className="p-2.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all"><X size={14} /></button>
          </div>
        ) : (
          <div>
            <button onClick={handleGeneratePaymentLink} disabled={generatingLink} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all disabled:opacity-60">
              <CreditCard size={14} />{generatingLink ? "Generating..." : "Generate Stripe Payment Link"}
            </button>
            <p className="text-[10px] text-slate-400 mt-1.5">Adds a secure "Pay Now" button to the invoice for the full total.</p>
          </div>
        );

      case "notes":
        return <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for your business!" className={`${inp} h-20 resize-none`} />;

      default: return null;
    }
  };

  // ── Preview ───────────────────────────────────────────────────────────────
  const renderPreviewSection = (id) => {
    switch (id) {
      case "client":
        return (
          <div key={id} className="flex justify-between gap-4 text-[10px]">
            <div>
              <p className="text-[7px] font-black text-[#0A5C43] uppercase tracking-wide mb-1.5 pb-1 border-b-2 border-emerald-100">Billed To</p>
              <p className="font-bold text-slate-800 text-[11px]">{client.name || "Customer Name"}</p>
              {client.email   && <p className="text-slate-500 mt-0.5">{client.email}</p>}
              {client.phone   && <p className="text-slate-500 mt-0.5">{client.phone}</p>}
              {client.address && <p className="text-slate-500 mt-0.5">{client.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-[7px] font-black text-[#0A5C43] uppercase tracking-wide mb-1.5 pb-1 border-b-2 border-emerald-100">From</p>
              <p className="font-bold text-slate-800 text-[11px]">Cleaniq Services Ltd</p>
              <p className="text-slate-500 mt-0.5">info@cleaniqservices.com</p>
              <p className="text-slate-500 mt-0.5">+44 7752 476368</p>
            </div>
          </div>
        );

      case "items":
        return (
          <div key={id}>
            <table className="w-full text-[9px] rounded-lg overflow-hidden border border-slate-200" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="bg-slate-900">
                  <th className="p-2 font-bold uppercase text-[7px] text-emerald-300 tracking-wide text-left">Description</th>
                  {!flatRate && <th className="p-2 font-bold uppercase text-[7px] text-emerald-300 tracking-wide text-right">Qty</th>}
                  {!flatRate && <th className="p-2 font-bold uppercase text-[7px] text-emerald-300 tracking-wide text-right">Rate</th>}
                  <th className="p-2 font-bold uppercase text-[7px] text-emerald-300 tracking-wide text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="p-2 border-b border-slate-100 text-slate-700 font-medium">{item.description || "—"}</td>
                    {!flatRate && <td className="p-2 text-right border-b border-slate-100 text-slate-500">{item.qty}</td>}
                    {!flatRate && <td className="p-2 text-right border-b border-slate-100 text-slate-500">£{Number(item.rate || 0).toFixed(2)}</td>}
                    <td className="p-2 text-right font-bold border-b border-slate-100 text-slate-800">£{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-2">
              <div className="bg-[#0A5C43] rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="text-[9px] text-emerald-200">{showPaidBadge ? "Paid" : "Due"}</span>
                <span className="font-black text-sm text-white">£{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      case "bank":
        return bankText ? (
          <div key={id} className="rounded-xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-3 py-1.5"><p className="text-[7px] font-black text-emerald-300 uppercase tracking-wide">Bank Transfer Details</p></div>
            <div className="p-3 bg-white"><p className="whitespace-pre-line text-[9px] text-slate-700 font-medium leading-loose">{bankText}</p></div>
          </div>
        ) : null;

      case "stripe":
        return paymentLink ? (
          <div key={id} className="text-center py-1">
            <span className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-[10px]">💳 Pay Now Securely</span>
          </div>
        ) : null;

      case "notes":
        return notes ? (
          <div key={id} className="p-3 bg-emerald-50 rounded-xl border-l-4 border-[#0A5C43]">
            <p className="text-[7px] font-black text-[#0A5C43] uppercase tracking-wide mb-1">Note</p>
            <p className="whitespace-pre-line text-[9px] text-emerald-800 leading-relaxed">{notes}</p>
          </div>
        ) : null;

      default: return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText size={22} className="text-primary" /> Invoice Builder
        </h1>
        <p className="text-sm text-slate-400 mt-1">Drag sections to reorder · eye icon to show/hide · send or download PDF</p>
      </div>

      {/* ── Top controls ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">

        {/* Invoice number + global toggles */}
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-36">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Invoice Number</label>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:border-primary" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-xl border-2 border-slate-200 whitespace-nowrap hover:border-slate-300 transition-colors select-none">
            <input type="checkbox" checked={showPaidBadge} onChange={(e) => setShowPaidBadge(e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-xs font-bold text-slate-600">Mark as PAID</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-xl border-2 border-slate-200 whitespace-nowrap hover:border-slate-300 transition-colors select-none">
            <input type="checkbox" checked={flatRate} onChange={(e) => setFlatRate(e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-xs font-bold text-slate-600">Flat rate</span>
            <span className="text-[10px] text-slate-400 font-medium">(hide hours &amp; qty)</span>
          </label>
        </div>

        {/* Load mode tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {[{ key: "single", label: "Single Booking" }, { key: "multi", label: "Combine Bookings" }].map((t) => (
            <button
              key={t.key}
              onClick={() => { setLoadMode(t.key); setFoundBookings([]); setSelectedBookingIds(new Set()); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${loadMode === t.key ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loadMode === "single" ? (
          /* ── Single booking ── */
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Load From Booking (optional)</label>
            <div className="flex gap-2">
              <input value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLoadBooking()} placeholder="e.g. BK-7437" className="flex-1 p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:border-primary" />
              <button onClick={handleLoadBooking} disabled={loadingBooking} className="flex items-center gap-2 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-60 shrink-0">
                <Search size={15} />{loadingBooking ? "Loading..." : "Load"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Combine bookings ── */
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Search Customer to Combine Transactions</label>
            <div className="flex gap-2">
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchCustomer()}
                placeholder="Customer name or email address..."
                className="flex-1 p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:border-primary"
              />
              <button onClick={handleSearchCustomer} disabled={searchingCustomer} className="flex items-center gap-2 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-60 shrink-0">
                <Search size={15} />{searchingCustomer ? "Searching..." : "Search"}
              </button>
            </div>

            {foundBookings.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {/* List header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-700">{foundBookings.length} booking{foundBookings.length !== 1 ? "s" : ""} found</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedBookingIds(new Set(foundBookings.map((b) => b._id)))} className="text-[11px] font-bold text-primary hover:underline">Select all</button>
                    <button onClick={() => setSelectedBookingIds(new Set())} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:underline">Clear</button>
                  </div>
                </div>

                {/* Booking rows */}
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {foundBookings.map((b) => {
                    const isSelected = selectedBookingIds.has(b._id);
                    const dateStr    = b.schedule?.date ? new Date(b.schedule.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
                    return (
                      <label key={b._id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleBookingSelection(b._id)} className="w-4 h-4 accent-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{b.service}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {b.bookingId && <span className="mr-1.5">{b.bookingId}</span>}
                            {dateStr && <span>{dateStr}</span>}
                            {!flatRate && b.details?.duration && <span className="ml-1">· {b.details.duration}h</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-black text-slate-800 tabular-nums">{b.payment?.amount ? `£${Number(b.payment.amount).toFixed(2)}` : "—"}</p>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-px rounded-full ${
                            b.status === "Completed"            ? "bg-emerald-100 text-emerald-700" :
                            b.status === "Completed - Unpaid"   ? "bg-purple-100 text-purple-700"  :
                            b.status === "Cancelled"            ? "bg-rose-100 text-rose-700"       :
                            "bg-slate-100 text-slate-500"
                          }`}>{b.status}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Selection footer */}
                {selectedBookingIds.size > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-t border-primary/20">
                    <div>
                      <p className="text-xs font-black text-primary">{selectedBookingIds.size} selected</p>
                      <p className="text-[11px] text-primary/70 font-bold tabular-nums">Total: £{selectedTotal.toFixed(2)}</p>
                    </div>
                    <button onClick={handleAddSelectedToInvoice} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-colors shadow-sm">
                      <Layers size={13} /> Build Invoice
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Builder + Preview ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">

        {/* Section builder */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-0.5">Invoice Sections</p>
          {sections.map((sec, idx) => {
            const SecIcon      = sec.icon;
            const isOpen       = openSections.has(sec.id);
            const isDragTarget = dragOverIdx === idx && dragIdx !== idx;
            return (
              <div
                key={sec.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={() => onDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all border ${isDragTarget ? "border-primary ring-2 ring-primary/20 scale-[1.01]" : "border-slate-200/80"} ${!sec.enabled ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-2.5 px-3.5 py-3 cursor-pointer select-none" onClick={() => sec.enabled && toggleOpen(sec.id)}>
                  <GripVertical size={16} className="text-slate-300 hover:text-slate-500 cursor-grab flex-shrink-0 transition-colors" />
                  <SecIcon size={13} className={`flex-shrink-0 transition-colors ${sec.enabled ? "text-primary" : "text-slate-300"}`} />
                  <span className={`flex-1 text-xs font-bold transition-colors ${sec.enabled ? "text-slate-700" : "text-slate-400"}`}>{sec.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleSection(sec.id); }} className={`p-1.5 rounded-lg transition-all ${sec.enabled ? "text-primary hover:bg-primary/10" : "text-slate-300 hover:bg-slate-100"}`}>
                    {sec.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  {sec.enabled && <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />}
                </div>
                {sec.enabled && isOpen && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3">{renderSectionForm(sec.id)}</div>
                )}
              </div>
            );
          })}

          <div className="flex gap-3 pt-3">
            <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all disabled:opacity-60">
              {downloading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
              {downloading ? "Generating…" : "Download PDF"}
            </button>
            <button onClick={handleSend} disabled={sending} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 font-semibold text-sm shadow-sm transition-all disabled:opacity-60">
              {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? "Sending…" : "Send Invoice"}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-slate-100 border border-slate-200/80 rounded-2xl shadow-sm p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Live Preview</p>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
            <div style={{ background: "#0A5C43" }} className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <img src={logoAsset} alt="Cleaniq Services" className="h-8 w-auto" />
                  <p className="text-[8px] text-white/40 uppercase tracking-widest mt-2 font-bold">Professional Cleaning Services</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-white leading-none">INVOICE</p>
                  <p className="text-[10px] text-emerald-300 font-bold mt-1">{invoiceNumber}</p>
                  {showPaidBadge && <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-300 text-emerald-950 text-[8px] font-black uppercase">✓ Paid</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 text-[8px]" style={{ background: "#f0fdf4", borderTop: "3px solid #0A5C43" }}>
              {[["Invoice #", invoiceNumber], ["Date", invoiceDate], ["Service", serviceDate || "—"], ["Status", showPaidBadge ? "✓ Paid" : "Due"]].map(([label, val], i) => (
                <div key={label} className={`px-3 py-2 ${i < 3 ? "border-r border-emerald-100" : ""}`}>
                  <p className="font-black text-[#0A5C43] uppercase tracking-wide opacity-70 mb-0.5" style={{ fontSize: "6px" }}>{label}</p>
                  <p className="font-bold text-slate-800 truncate">{val}</p>
                </div>
              ))}
            </div>
            <div className="p-4 space-y-3">
              {sections.filter((s) => s.enabled).map((s) => renderPreviewSection(s.id))}
            </div>
            <div style={{ background: "#0A5C43" }} className="px-5 py-3 text-center">
              <p className="text-[10px] font-bold text-white">Thank you for choosing Cleaniq Services</p>
              <p className="text-[8px] text-white/50 mt-0.5">We're committed to delivering a spotless clean every time.</p>
            </div>
            <div className="bg-slate-900 px-5 py-2.5 text-center">
              <p className="text-[8px] text-slate-500 font-semibold">Cleaniq Services Limited</p>
              <p className="text-[7px] text-slate-600 mt-0.5">info@cleaniqservices.com · cleaniqservices.com · +44 7752 476368</p>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InvoiceBuilder;
