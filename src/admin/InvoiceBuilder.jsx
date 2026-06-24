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
} from "lucide-react";
import logo from "../assets/logo DP2.jpg";

const API = import.meta.env.VITE_API_URL;

const emptyItem = () => ({ description: "", qty: 1, rate: 0 });

const Toast = ({ msg, type, onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
  >
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
      <X size={15} />
    </button>
  </div>
);

const InvoiceBuilder = () => {
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => `INV-${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [notes, setNotes] = useState("Thank you for your business!");
  const [paymentInstructions, setPaymentInstructions] = useState(
    "Account Name: Cleaniq Services Limited\nSort Code: 40-11-56\nAccount Number: 81106546",
  );
  const [showPaidBadge, setShowPaidBadge] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);
  const [bookingRef, setBookingRef] = useState("");
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadedBookingId, setLoadedBookingId] = useState(null);
  const [paymentLink, setPaymentLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0),
        0,
      ),
    [items],
  );

  const invoiceDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleLoadBooking = async () => {
    if (!bookingRef.trim()) return;
    setLoadingBooking(true);
    try {
      const res = await fetch(
        `${API}/bookings/by-ref/${encodeURIComponent(bookingRef.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking not found");

      setInvoiceNumber(`INV-${data.bookingId}`);
      setCustomerName(
        `${data.customer?.firstName || ""} ${data.customer?.lastName || ""}`.trim(),
      );
      setCustomerEmail(data.customer?.email || "");
      const isFlatRate = data.payment?.billingType === "flat";
      setItems([
        {
          description: `${data.service || "Cleaning Service"}${!isFlatRate && data.details?.duration ? ` (${data.details.duration} hrs)` : ""}`,
          qty: 1,
          rate: Number(data.payment?.amount || 0),
        },
      ]);
      setLoadedBookingId(data._id);
      setToast({
        msg: `Loaded booking ${data.bookingId}`,
        type: "success",
      });
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
    customerName,
    customerEmail,
    invoiceDate,
    items,
    notes,
    paymentInstructions,
    showPaidBadge,
    currencySymbol: "£",
    paymentLink,
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
    if (!customerEmail || items.length === 0 || !items[0].description) {
      setToast({
        msg: "Add a customer email and at least one item first",
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

      // If this invoice was loaded from a real booking, sending it confirms
      // that booking — so its status flips to Confirmed in the Bookings page.
      if (loadedBookingId) {
        try {
          await fetch(`${API}/bookings/${loadedBookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Confirmed" }),
          });
        } catch {
          // Invoice still sent successfully even if the status update fails
        }
      }

      setToast({
        msg: loadedBookingId
          ? `Invoice sent to ${customerEmail} — booking marked Confirmed`
          : `Invoice sent to ${customerEmail}`,
        type: "success",
      });
    } catch (err) {
      setToast({ msg: err.message || "Failed to send invoice", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/custom-invoice/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cleaniq-Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ msg: err.message || "Download failed", type: "error" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText size={22} className="text-primary" /> Invoice Builder
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Design a one-off invoice, then send it straight to the customer's
          email or download it as a PDF
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
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
                className="flex-1 p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
            <p className="text-[10px] text-slate-400 mt-1.5">
              Type a booking reference to auto-fill the customer and item
              details below.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Invoice Number
              </label>
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border-2 border-slate-200 w-full">
                <input
                  type="checkbox"
                  checked={showPaidBadge}
                  onChange={(e) => setShowPaidBadge(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-xs font-bold text-slate-600">
                  Show "PAID" badge
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Customer Name
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Items
              </label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(idx, "description", e.target.value)
                    }
                    placeholder="Description"
                    className="flex-1 p-2.5 rounded-lg border-2 border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    placeholder="Qty"
                    className="w-16 p-2.5 rounded-lg border-2 border-slate-200 text-xs font-medium text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(idx, "rate", e.target.value)}
                    placeholder="Rate"
                    className="w-20 p-2.5 rounded-lg border-2 border-slate-200 text-xs font-medium text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="p-2.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Payment Instructions
            </label>
            <textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="Bank details, PayPal, or any payment destination you want the customer to use..."
              className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-xs h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50">
            <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <CreditCard size={13} /> Stripe Pay Now Button (optional)
            </label>
            {paymentLink ? (
              <div className="flex gap-2 items-center">
                <input
                  readOnly
                  value={paymentLink}
                  className="flex-1 p-2.5 rounded-lg border border-indigo-200 bg-white text-xs font-medium text-indigo-700 truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentLink);
                    setToast({ msg: "Link copied", type: "success" });
                  }}
                  className="p-2.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-all"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setPaymentLink("")}
                  className="p-2.5 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGeneratePaymentLink}
                disabled={generatingLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all disabled:opacity-60"
              >
                <CreditCard size={14} />
                {generatingLink
                  ? "Generating..."
                  : "Generate Stripe Payment Link"}
              </button>
            )}
            <p className="text-[10px] text-indigo-500/80 mt-1.5">
              Adds a secure "Pay Now" button to the invoice for the full
              total — generate it only when you actually want the customer to
              pay by card.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-xs h-16 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all disabled:opacity-60"
            >
              <Download size={15} />
              {downloading ? "Generating..." : "Download PDF"}
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

        {/* Live Preview */}
        <div className="bg-slate-100 border border-slate-200/80 rounded-2xl shadow-sm p-4 sm:p-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Live Preview
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden text-[13px] font-sans">
            <div className="flex justify-between items-start p-6 bg-gradient-to-br from-slate-900 to-slate-800">
              <div>
                <img src={logo} alt="Cleaniq Services" className="h-10 rounded-lg mb-2" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Professional Cleaning Services
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-xl text-white">INVOICE</p>
                <p className="text-xs text-emerald-300 font-bold">{invoiceNumber}</p>
                {showPaidBadge && (
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-300 text-emerald-950 text-[10px] font-black uppercase">
                    ✓ Paid
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-5 text-xs px-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  Billed To
                </p>
                <p className="font-bold mt-1">
                  {customerName || "Customer Name"}
                </p>
                <p className="text-slate-500">
                  {customerEmail || "customer@email.com"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  Date
                </p>
                <p className="font-bold mt-1">{invoiceDate}</p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <table className="w-full mt-5 text-xs rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-900 text-emerald-300">
                    <th className="text-left p-2.5 font-bold uppercase text-[9px]">
                      Description
                    </th>
                    <th className="text-center p-2.5 font-bold uppercase text-[9px]">
                      Qty
                    </th>
                    <th className="text-right p-2.5 font-bold uppercase text-[9px]">
                      Rate
                    </th>
                    <th className="text-right p-2.5 font-bold uppercase text-[9px]">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="p-2.5 border-b border-slate-100">
                        {item.description || "—"}
                      </td>
                      <td className="p-2.5 text-center border-b border-slate-100">
                        {item.qty || 0}
                      </td>
                      <td className="p-2.5 text-right border-b border-slate-100">
                        £{Number(item.rate || 0).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-bold border-b border-slate-100">
                        £
                        {(
                          (Number(item.qty) || 0) * (Number(item.rate) || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mt-3 bg-gradient-to-r from-emerald-50 to-emerald-100 p-3.5 rounded-xl">
                <p className="font-black text-sm text-emerald-800">
                  TOTAL DUE: £{subtotal.toFixed(2)}
                </p>
              </div>

              {paymentLink && (
                <div className="flex justify-center mt-4">
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-200"
                  >
                    💳 Pay Now Securely
                  </a>
                </div>
              )}

              {paymentInstructions && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                    How to Pay
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {paymentInstructions}
                  </p>
                </div>
              )}

              {notes && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="whitespace-pre-line text-emerald-800">
                    {notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default InvoiceBuilder;
