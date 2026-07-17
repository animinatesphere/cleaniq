import React, { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Send,
  Download,
  X,
  Search,
  CreditCard,
  Copy,
  GripVertical,
  Eye,
  EyeOff,
  ChevronDown,
  Building2,
  AlignLeft,
  Users,
} from "lucide-react";
import logo from "../assets/logo DP.jpg";

const API = import.meta.env.VITE_API_URL;
const uid = () => `${Date.now()}-${Math.random()}`;
const emptyItem = () => ({ id: uid(), description: "", qty: 1, rate: 0 });

const SECTION_DEFS = [
  { id: "client", label: "Client Details", icon: Users },
  { id: "items", label: "Line Items", icon: AlignLeft },
  { id: "bank", label: "Bank Transfer Details", icon: Building2 },
  { id: "stripe", label: "Stripe Pay Now Button", icon: CreditCard },
  { id: "notes", label: "Notes", icon: FileText },
];

const Toast = ({ msg, type, onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold ${
      type === "success" ? "bg-emerald-600" : "bg-rose-600"
    }`}
  >
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
      <X size={15} />
    </button>
  </div>
);

const Field = ({ label, span = 1, children }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
      {label}
    </label>
    {children}
  </div>
);

const inp =
  "w-full p-2.5 rounded-lg border-2 border-slate-200 text-xs font-medium focus:outline-none focus:border-primary transition-colors";

const InvoiceBuilder = () => {
  // Section manager state
  const [sections, setSections] = useState(
    SECTION_DEFS.map((s) => ({ ...s, enabled: s.id !== "stripe" }))
  );
  const [openSections, setOpenSections] = useState(
    () => new Set(SECTION_DEFS.map((s) => s.id))
  );
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Invoice meta
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => `INV-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [showPaidBadge, setShowPaidBadge] = useState(false);

  // Client
  const [client, setClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const setC = (k, v) => setClient((p) => ({ ...p, [k]: v }));

  // Dates
  const [serviceDate, setServiceDate] = useState("");

  // Items
  const [items, setItems] = useState([emptyItem()]);
  const updateItem = (id, k, v) =>
    setItems((p) => p.map((it) => (it.id === id ? { ...it, [k]: v } : it)));
  const addItem = () => setItems((p) => [...p, emptyItem()]);
  const removeItem = (id) => setItems((p) => p.filter((it) => it.id !== id));

  // Bank
  const [bank, setBank] = useState({
    accountName: "Cleaniq Services Limited",
    sortCode: "40-11-56",
    accountNumber: "81106546",
    bankName: "",
    reference: "",
  });
  const setB = (k, v) => setBank((p) => ({ ...p, [k]: v }));

  // Stripe
  const [paymentLink, setPaymentLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  // Notes
  const [notes, setNotes] = useState("Thank you for your business!");

  // Booking loader
  const [bookingRef, setBookingRef] = useState("");
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadedBookingId, setLoadedBookingId] = useState(null);

  // UI
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const invoiceDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0),
        0
      ),
    [items]
  );

  const isEnabled = (id) =>
    sections.find((s) => s.id === id)?.enabled ?? false;

  // Section helpers
  const toggleSection = (id) =>
    setSections((p) =>
      p.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  const toggleOpen = (id) =>
    setOpenSections((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // Drag handlers
  const onDragStart = (idx) => setDragIdx(idx);
  const onDragOver = (e, idx) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const onDrop = (toIdx) => {
    if (dragIdx !== null && dragIdx !== toIdx) {
      setSections((p) => {
        const n = [...p];
        const [moved] = n.splice(dragIdx, 1);
        n.splice(toIdx, 0, moved);
        return n;
      });
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const bankText = [
    bank.accountName && `Account Name: ${bank.accountName}`,
    bank.sortCode && `Sort Code: ${bank.sortCode}`,
    bank.accountNumber && `Account Number: ${bank.accountNumber}`,
    bank.bankName && `Bank: ${bank.bankName}`,
    bank.reference && `Reference: ${bank.reference}`,
  ]
    .filter(Boolean)
    .join("\n");

  const handleLoadBooking = async () => {
    if (!bookingRef.trim()) return;
    setLoadingBooking(true);
    try {
      const res = await fetch(
        `${API}/bookings/by-ref/${encodeURIComponent(bookingRef.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking not found");

      setInvoiceNumber(`INV-${data.bookingId}`);
      setClient({
        name: `${data.customer?.firstName || ""} ${data.customer?.lastName || ""}`.trim(),
        email: data.customer?.email || "",
        phone: data.customer?.phone || "",
        address: data.details?.address || "",
      });

      const rawDate =
        data.details?.date || data.scheduledDate || data.date || "";
      if (rawDate) {
        try {
          setServiceDate(
            new Date(rawDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          );
        } catch {
          setServiceDate(rawDate);
        }
      }

      const extras = Array.isArray(data.details?.extras)
        ? data.details.extras
        : [];
      const mainDesc = [
        data.service || "Cleaning Service",
        data.details?.bedrooms ? `${data.details.bedrooms} bed` : "",
        data.payment?.billingType !== "flat" && data.details?.duration
          ? `${data.details.duration} hrs`
          : "",
      ]
        .filter(Boolean)
        .join(" · ");

      setItems([
        {
          id: uid(),
          description: mainDesc,
          qty: 1,
          rate: Number(data.payment?.amount || 0),
        },
        ...extras.map((ex) => ({
          id: uid(),
          description:
            typeof ex === "string"
              ? ex
              : ex.name || ex.label || String(ex),
          qty: 1,
          rate: Number(ex.price || ex.amount || 0),
        })),
      ]);

      setLoadedBookingId(data._id);
      setToast({ msg: `Loaded booking ${data.bookingId}`, type: "success" });
    } catch (err) {
      setToast({
        msg: err.message || "Could not find that booking",
        type: "error",
      });
    } finally {
      setLoadingBooking(false);
    }
  };

  const buildPayload = () => ({
    invoiceNumber,
    customerName: client.name,
    customerEmail: client.email,
    customerPhone: client.phone,
    customerAddress: client.address,
    serviceDate,
    invoiceDate,
    items,
    notes: isEnabled("notes") ? notes : "",
    paymentInstructions: isEnabled("bank") ? bankText : "",
    showPaidBadge,
    currencySymbol: "£",
    paymentLink: isEnabled("stripe") ? paymentLink : "",
    bookingId: loadedBookingId,
  });

  const handleGeneratePaymentLink = async () => {
    if (subtotal <= 0) {
      setToast({ msg: "Add items with an amount first", type: "error" });
      return;
    }
    setGeneratingLink(true);
    try {
      const res = await fetch(`${API}/custom-invoice/payment-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPaymentLink(data.url);
      setToast({ msg: "Stripe payment link generated", type: "success" });
    } catch (err) {
      setToast({
        msg: err.message || "Failed to generate payment link",
        type: "error",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSend = async () => {
    if (!client.email || !items[0]?.description) {
      setToast({
        msg: "Add a customer email and at least one item",
        type: "error",
      });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API}/custom-invoice/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (loadedBookingId) {
        try {
          await fetch(`${API}/bookings/${loadedBookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Confirmed" }),
          });
        } catch {}
      }

      setToast({
        msg: loadedBookingId
          ? `Invoice sent to ${client.email} — booking marked Confirmed`
          : `Invoice sent to ${client.email}`,
        type: "success",
      });
    } catch (err) {
      setToast({
        msg: err.message || "Failed to send invoice",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDownload = () => {
    const logoUrl = `${window.location.origin}${logo}`;
    const enabledIds = sections.filter((s) => s.enabled).map((s) => s.id);

    const sectionHtml = (id) => {
      switch (id) {
        case "client":
          return `
<div style="display:flex;justify-content:space-between;margin-bottom:28px">
  <div>
    <p style="font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Billed To</p>
    <p style="font-size:15px;font-weight:700;color:#0f172a">${client.name || "—"}</p>
    ${client.email ? `<p style="font-size:12px;color:#64748b;margin-top:2px">${client.email}</p>` : ""}
    ${client.phone ? `<p style="font-size:12px;color:#64748b;margin-top:2px">${client.phone}</p>` : ""}
    ${client.address ? `<p style="font-size:12px;color:#64748b;margin-top:2px">${client.address}</p>` : ""}
  </div>
  <div style="text-align:right">
    <p style="font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Invoice Date</p>
    <p style="font-size:15px;font-weight:700;color:#0f172a">${invoiceDate}</p>
    ${serviceDate ? `<p style="font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:10px;margin-bottom:6px">Service Date</p><p style="font-size:15px;font-weight:700;color:#0f172a">${serviceDate}</p>` : ""}
  </div>
</div>`;
        case "items":
          return `
<table style="width:100%;border-collapse:collapse;margin-bottom:16px">
  <thead>
    <tr style="background:#0f172a">
      <th style="padding:10px 14px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:left">Description</th>
      <th style="padding:10px 14px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:right">Qty</th>
      <th style="padding:10px 14px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:right">Rate</th>
      <th style="padding:10px 14px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;text-align:right">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${items
      .map(
        (item) =>
          `<tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0">${item.description || "—"}</td><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right">${item.qty}</td><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right">£${Number(item.rate || 0).toFixed(2)}</td><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700">£${((Number(item.qty) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td></tr>`
      )
      .join("")}
  </tbody>
</table>
<div style="display:flex;justify-content:flex-end;margin-bottom:20px">
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 20px">
    <p style="font-size:9px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:1px">Total Due</p>
    <p style="font-size:22px;font-weight:900;color:#166534;margin-top:4px">£${subtotal.toFixed(2)}</p>
  </div>
</div>`;
        case "bank":
          return bankText
            ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:12px">
  <p style="font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Bank Transfer Details</p>
  <p style="font-size:12px;color:#334155;white-space:pre-line;line-height:1.7">${bankText}</p>
</div>`
            : "";
        case "stripe":
          return paymentLink
            ? `<div style="text-align:center;margin:20px 0"><a href="${paymentLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;font-size:14px;text-decoration:none">💳 Pay Now Securely</a></div>`
            : "";
        case "notes":
          return notes
            ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-bottom:12px">
  <p style="font-size:12px;color:#166534;line-height:1.6">${notes}</p>
</div>`
            : "";
        default:
          return "";
      }
    };

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Cleaniq Invoice ${invoiceNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#1e293b}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style>
</head><body>
<div style="background:#0f172a;padding:32px 40px;display:flex;justify-content:space-between;align-items:center">
  <img src="${logoUrl}" alt="Cleaniq Services" style="height:40px;border-radius:6px" />
  <div>
    <p style="color:#fff;font-size:28px;font-weight:900;text-align:right">INVOICE</p>
    <p style="color:#6ee7b7;font-size:13px;font-weight:700;text-align:right;margin-top:4px">${invoiceNumber}</p>
    ${showPaidBadge ? `<p style="display:inline-block;margin-top:8px;padding:3px 12px;background:#6ee7b7;color:#052e16;border-radius:999px;font-size:10px;font-weight:900;text-transform:uppercase;float:right">✓ PAID</p>` : ""}
  </div>
</div>
<div style="padding:36px 40px">
  ${enabledIds.map(sectionHtml).join("")}
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="font-size:13px;font-weight:700;color:#0f172a">Cleaniq Services Limited</p>
    <p style="font-size:11px;color:#64748b;margin-top:4px">info@cleaniqservices.com · cleaniqservices.com · +44 7752 476368</p>
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  // ─── JSX ───────────────────────────────────────────────────────────────────

  const renderSectionForm = (id) => {
    switch (id) {
      case "client":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name">
              <input className={inp} value={client.name} onChange={(e) => setC("name", e.target.value)} placeholder="John Doe" />
            </Field>
            <Field label="Email">
              <input className={inp} type="email" value={client.email} onChange={(e) => setC("email", e.target.value)} placeholder="customer@email.com" />
            </Field>
            <Field label="Phone">
              <input className={inp} type="tel" value={client.phone} onChange={(e) => setC("phone", e.target.value)} placeholder="+44 7700 000000" />
            </Field>
            <Field label="Service Date">
              <input className={inp} value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} placeholder="e.g. 15 July 2026" />
            </Field>
            <Field label="Address" span={2}>
              <input className={inp} value={client.address} onChange={(e) => setC("address", e.target.value)} placeholder="Full property / service address" />
            </Field>
          </div>
        );

      case "items":
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_50px_66px_34px] gap-1.5 pb-1">
              {["Description", "Qty", "Rate £", ""].map((h, i) => (
                <p key={i} className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-0.5">{h}</p>
              ))}
            </div>
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_50px_66px_34px] gap-1.5">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Service description"
                  className={inp}
                />
                <input
                  type="number" min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                  className={`${inp} text-center`}
                />
                <input
                  type="number" min="0" step="0.01"
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, "rate", e.target.value)}
                  className={`${inp} text-center`}
                />
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all disabled:opacity-30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <button onClick={addItem} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark">
                <Plus size={13} /> Add Line Item
              </button>
              <span className="text-xs font-black text-slate-700">Total: £{subtotal.toFixed(2)}</span>
            </div>
          </div>
        );

      case "bank":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Account Name" span={2}>
              <input className={inp} value={bank.accountName} onChange={(e) => setB("accountName", e.target.value)} placeholder="Account Name" />
            </Field>
            <Field label="Sort Code">
              <input className={inp} value={bank.sortCode} onChange={(e) => setB("sortCode", e.target.value)} placeholder="00-00-00" />
            </Field>
            <Field label="Account Number">
              <input className={inp} value={bank.accountNumber} onChange={(e) => setB("accountNumber", e.target.value)} placeholder="00000000" />
            </Field>
            <Field label="Bank Name">
              <input className={inp} value={bank.bankName} onChange={(e) => setB("bankName", e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Payment Reference">
              <input className={inp} value={bank.reference} onChange={(e) => setB("reference", e.target.value)} placeholder="Optional" />
            </Field>
          </div>
        );

      case "stripe":
        return (
          <div>
            {paymentLink ? (
              <div className="flex gap-2 items-center">
                <input readOnly value={paymentLink} className="flex-1 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-medium text-indigo-700 truncate" />
                <button
                  onClick={() => { navigator.clipboard.writeText(paymentLink); setToast({ msg: "Link copied", type: "success" }); }}
                  className="p-2.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-all"
                ><Copy size={14} /></button>
                <button
                  onClick={() => setPaymentLink("")}
                  className="p-2.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all"
                ><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={handleGeneratePaymentLink}
                disabled={generatingLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all disabled:opacity-60"
              >
                <CreditCard size={14} />
                {generatingLink ? "Generating..." : "Generate Stripe Payment Link"}
              </button>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">Adds a secure "Pay Now" button to the invoice for the full total.</p>
          </div>
        );

      case "notes":
        return (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Thank you for your business!"
            className={`${inp} h-20 resize-none`}
          />
        );

      default:
        return null;
    }
  };

  const renderPreviewSection = (id) => {
    switch (id) {
      case "client":
        return (
          <div key={id} className="flex justify-between text-[11px]">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-1">Billed To</p>
              <p className="font-bold text-slate-800 text-xs">{client.name || "Customer Name"}</p>
              {client.email && <p className="text-slate-500 text-[10px]">{client.email}</p>}
              {client.phone && <p className="text-slate-500 text-[10px]">{client.phone}</p>}
              {client.address && <p className="text-slate-500 text-[10px]">{client.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-1">Invoice Date</p>
              <p className="font-bold text-slate-800">{invoiceDate}</p>
              {serviceDate && (
                <>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wide mt-2 mb-1">Service Date</p>
                  <p className="font-bold text-slate-800">{serviceDate}</p>
                </>
              )}
            </div>
          </div>
        );

      case "items":
        return (
          <div key={id}>
            <table className="w-full text-[10px] mb-2 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-900 text-emerald-300">
                  {["Description", "Qty", "Rate", "Amount"].map((h, i) => (
                    <th key={h} className={`p-2 font-bold uppercase text-[8px] ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="p-2 border-b border-slate-100">{item.description || "—"}</td>
                    <td className="p-2 text-right border-b border-slate-100">{item.qty}</td>
                    <td className="p-2 text-right border-b border-slate-100">£{Number(item.rate || 0).toFixed(2)}</td>
                    <td className="p-2 text-right font-bold border-b border-slate-100">£{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                <span className="font-black text-sm text-emerald-800">Total: £{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      case "bank":
        return bankText ? (
          <div key={id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Bank Transfer Details</p>
            <p className="whitespace-pre-line text-[10px] text-slate-700 font-medium leading-relaxed">{bankText}</p>
          </div>
        ) : null;

      case "stripe":
        return paymentLink ? (
          <div key={id} className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs shadow shadow-indigo-200">
              💳 Pay Now Securely
            </span>
          </div>
        ) : null;

      case "notes":
        return notes ? (
          <div key={id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="whitespace-pre-line text-[10px] text-emerald-800">{notes}</p>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText size={22} className="text-primary" /> Invoice Builder
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Drag sections to reorder · eye icon to show/hide · send or download as PDF
        </p>
      </div>

      {/* Load from booking + invoice # */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Load From Booking (optional)
          </label>
          <div className="flex gap-2">
            <input
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadBooking()}
              placeholder="e.g. BK-7437"
              className="flex-1 p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleLoadBooking}
              disabled={loadingBooking}
              className="flex items-center gap-2 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-60"
            >
              <Search size={15} />
              {loadingBooking ? "Loading..." : "Load"}
            </button>
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Invoice Number
            </label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-xl border-2 border-slate-200 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showPaidBadge}
              onChange={(e) => setShowPaidBadge(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs font-bold text-slate-600">Mark as PAID</span>
          </label>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.15fr] gap-6">
        {/* LEFT — Section builder */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-0.5">
            Invoice Sections
          </p>

          {sections.map((sec, idx) => {
            const SecIcon = sec.icon;
            const isOpen = openSections.has(sec.id);
            const isDragTarget = dragOverIdx === idx && dragIdx !== idx;

            return (
              <div
                key={sec.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={() => onDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all border ${
                  isDragTarget
                    ? "border-primary ring-2 ring-primary/20 scale-[1.01]"
                    : "border-slate-200/80"
                } ${!sec.enabled ? "opacity-50" : ""}`}
              >
                {/* Section header row */}
                <div
                  className="flex items-center gap-2.5 px-3.5 py-3 cursor-pointer select-none"
                  onClick={() => sec.enabled && toggleOpen(sec.id)}
                >
                  <GripVertical
                    size={16}
                    className="text-slate-300 hover:text-slate-500 cursor-grab flex-shrink-0 transition-colors"
                  />
                  <SecIcon
                    size={13}
                    className={`flex-shrink-0 transition-colors ${sec.enabled ? "text-primary" : "text-slate-300"}`}
                  />
                  <span className={`flex-1 text-xs font-bold transition-colors ${sec.enabled ? "text-slate-700" : "text-slate-400"}`}>
                    {sec.label}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSection(sec.id); }}
                    title={sec.enabled ? "Hide this section" : "Show this section"}
                    className={`p-1.5 rounded-lg transition-all ${
                      sec.enabled
                        ? "text-primary hover:bg-primary/10"
                        : "text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {sec.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  {sec.enabled && (
                    <ChevronDown
                      size={13}
                      className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </div>

                {/* Section form */}
                {sec.enabled && isOpen && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                    {renderSectionForm(sec.id)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
            >
              <Download size={15} /> Download PDF
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary-dark font-semibold text-sm shadow-sm transition-all disabled:opacity-60"
            >
              <Send size={15} />
              {sending ? "Sending..." : "Send Invoice"}
            </button>
          </div>
        </div>

        {/* RIGHT — Live preview */}
        <div className="bg-slate-100 border border-slate-200/80 rounded-2xl shadow-sm p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Live Preview
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Preview invoice header */}
            <div className="flex justify-between items-start p-5 bg-gradient-to-br from-slate-900 to-slate-800">
              <div>
                <img src={logo} alt="Cleaniq Services" className="h-9 rounded-lg mb-2" />
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">
                  Professional Cleaning Services
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-xl text-white">INVOICE</p>
                <p className="text-xs text-emerald-300 font-bold">{invoiceNumber}</p>
                {showPaidBadge && (
                  <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-emerald-300 text-emerald-950 text-[9px] font-black uppercase">
                    ✓ Paid
                  </span>
                )}
              </div>
            </div>

            {/* Preview body — sections in drag order */}
            <div className="p-5 space-y-4">
              {sections
                .filter((s) => s.enabled)
                .map((s) => renderPreviewSection(s.id))}

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-[9px] font-bold text-slate-700">
                  Cleaniq Services Limited
                </p>
                <p className="text-[8px] text-slate-400 mt-0.5">
                  info@cleaniqservices.com · cleaniqservices.com · +44 7752 476368
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default InvoiceBuilder;
