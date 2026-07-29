import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Mail,
  FileText,
  Star,
  CreditCard,
  Send,
  Download,
  Plus,
  Minus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  ChevronDown,
  Trash2,
  Package,
  MessageSquare,
  Zap,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com";

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 24px",
        borderRadius: "16px",
        background:
          type === "success"
            ? "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)"
            : "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
        color: "white",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
        fontSize: "14px",
        fontWeight: 600,
        maxWidth: "400px",
        animation: "slideUp 0.3s ease",
      }}
    >
      {type === "success" ? (
        <CheckCircle2 size={20} style={{ color: "#6EE7B7", flexShrink: 0 }} />
      ) : (
        <AlertCircle size={20} style={{ color: "#fca5a5", flexShrink: 0 }} />
      )}
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          cursor: "pointer",
          padding: "0 0 0 8px",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

// ─── TAB BUTTON ───────────────────────────────────────────────────────────────
const TabBtn = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 18px",
      borderRadius: "14px",
      border: "none",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 700,
      transition: "all 0.2s ease",
      position: "relative",
      background: active
        ? "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)"
        : "transparent",
      color: active ? "#6EE7B7" : "rgba(255,255,255,0.4)",
      boxShadow: active ? "0 4px 15px rgba(15,23,42,0.25)" : "none",
    }}
  >
    <Icon size={16} />
    <span className="tab-label">{label}</span>
    {badge && (
      <span
        style={{
          background: "#6EE7B7",
          color: "#0F172A",
          fontSize: "10px",
          fontWeight: 900,
          padding: "2px 7px",
          borderRadius: "20px",
          lineHeight: 1,
        }}
      >
        {badge}
      </span>
    )}
  </button>
);

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────
const ActionBtn = ({
  onClick,
  loading,
  disabled,
  children,
  variant = "primary",
  icon: Icon,
}) => {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)",
      color: "#6EE7B7",
      boxShadow: "0 8px 20px rgba(15,23,42,0.3)",
    },
    success: {
      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      color: "white",
      boxShadow: "0 8px 20px rgba(5,150,105,0.3)",
    },
    outline: {
      background: "rgba(255,255,255,0.05)",
      color: "rgba(255,255,255,0.8)",
      boxShadow: "none",
      border: "1px solid rgba(255,255,255,0.1)",
    },
    accent: {
      background: "linear-gradient(135deg, #6EE7B7 0%, #10b981 100%)",
      color: "#0F172A",
      boxShadow: "0 8px 20px rgba(16,185,129,0.35)",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "14px 24px",
        borderRadius: "14px",
        border: styles[variant].border || "none",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        fontSize: "14px",
        fontWeight: 800,
        transition: "all 0.2s ease",
        opacity: disabled || loading ? 0.6 : 1,
        ...styles[variant],
      }}
    >
      {loading ? (
        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        Icon && <Icon size={16} />
      )}
      {children}
    </button>
  );
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const SentBadge = ({ date, label }) => {
  if (!date) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(16,185,129,0.15)",
        color: "#34d399",
        border: "1px solid rgba(16,185,129,0.25)",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      <CheckCircle2 size={12} />
      {label}{" "}
      {new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </div>
  );
};

// ─── MAIN CRM MODAL ───────────────────────────────────────────────────────────
const AdminCRM = ({ booking, onClose }) => {
  const [activeTab, setActiveTab] = useState("confirmation");
  const [toast, setToast] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  // Payment link tab state
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customItem, setCustomItem] = useState({
    name: "",
    amount: "",
    qty: 1,
  });
  const [paymentNote, setPaymentNote] = useState("");
  const [generatedLink, setGeneratedLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Booking meta (track what's been sent)
  const [meta, setMeta] = useState(booking.meta || {});

  // Additional Hours state
  const [additionalHoursForm, setAdditionalHoursForm] = useState({
    hours: "",
    hourlyRate: "",
    isGenerating: false,
  });

  const showToast = (message, type = "success") => setToast({ message, type });

  // Fetch services for payment link tab
  useEffect(() => {
    if (activeTab === "payment") {
      setLoadingServices(true);
      const region = booking.region || "UK";
      fetch(`${API}/services?region=${region}`)
        .then((r) => r.json())
        .then((data) => {
          setServices(Array.isArray(data) ? data : []);
        })
        .catch(() => setServices([]))
        .finally(() => setLoadingServices(false));
    }
  }, [activeTab, booking.region]);

  // ─── API CALLS ────────────────────────────────────────────────────────────
  const doAction = useCallback(
    async (endpoint, body = {}) => {
      setLoadingAction(endpoint);
      try {
        const res = await fetch(`${API}/bookings/${booking._id}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Something went wrong");
        return data;
      } finally {
        setLoadingAction(null);
      }
    },
    [booking._id],
  );

  const handleSendConfirmation = async () => {
    try {
      await doAction("send-confirmation");
      const now = new Date().toISOString();
      setMeta((m) => ({ ...m, confirmationSentAt: now }));
      showToast("✓ Booking confirmation sent to " + booking.customer.email);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleSendInvoice = async () => {
    try {
      await doAction("send-invoice");
      const now = new Date().toISOString();
      setMeta((m) => ({ ...m, invoiceSentAt: now }));
      showToast("🧾 Invoice sent to " + booking.customer.email);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleSendReview = async () => {
    try {
      await doAction("send-review-request");
      const now = new Date().toISOString();
      setMeta((m) => ({ ...m, reviewRequestSentAt: now }));
      showToast("⭐ Review request sent to " + booking.customer.email);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0) * (item.qty || 1),
    0,
  );

  const handleAddServiceItem = (svc) => {
    const existing = selectedItems.find((i) => i.serviceId === svc._id);
    if (existing) {
      setSelectedItems((prev) =>
        prev.map((i) =>
          i.serviceId === svc._id ? { ...i, qty: i.qty + 1 } : i,
        ),
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        { serviceId: svc._id, name: svc.name, amount: svc.rate, qty: 1 },
      ]);
    }
  };

  const handleAddCustomItem = () => {
    if (!customItem.name.trim() || !customItem.amount) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        name: customItem.name.trim(),
        amount: parseFloat(customItem.amount),
        qty: parseInt(customItem.qty) || 1,
      },
    ]);
    setCustomItem({ name: "", amount: "", qty: 1 });
  };

  const handleRemoveItem = (idx) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== idx));
    if (generatedLink) setGeneratedLink(null);
  };

  // ─── HANDLER: Send Additional Hours Payment Link ──────────────────────────
  const handleSendAdditionalHours = async () => {
    if (!additionalHoursForm.hours || !additionalHoursForm.hourlyRate) {
      showToast("Please enter both hours and hourly rate", "error");
      return;
    }

    const hours = parseFloat(additionalHoursForm.hours);
    const rate = parseFloat(additionalHoursForm.hourlyRate);
    const amount = hours * rate;

    if (hours <= 0 || rate <= 0 || amount <= 0) {
      showToast("Hours and rate must be greater than 0", "error");
      return;
    }

    setAdditionalHoursForm((prev) => ({ ...prev, isGenerating: true }));

    try {
      const checkoutRes = await fetch(
        `${API}/payments/additional-hours-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking._id,
            additionalHours: hours,
            hourlyRate: rate,
          }),
        },
      );
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok)
        throw new Error(checkoutData.message || "Failed to create checkout");

      const emailRes = await fetch(
        `${API}/payments/send-additional-hours-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking._id,
            customerEmail: booking.customer.email,
            customerName: booking.customer.firstName,
            checkoutUrl: checkoutData.checkoutUrl,
            additionalHours: hours,
            additionalAmount: amount,
            bookingRef: booking.bookingId,
          }),
        },
      );
      const emailData = await emailRes.json();
      if (!emailRes.ok)
        throw new Error(emailData.message || "Failed to send email");

      showToast(
        `✓ Payment link sent to ${booking.customer.email} for ${hours}h (£${amount.toFixed(2)})`,
      );
      setAdditionalHoursForm({
        hours: "",
        hourlyRate: "",
        isGenerating: false,
      });
      setMeta((m) => ({
        ...m,
        additionalHoursSentAt: new Date().toISOString(),
      }));
    } catch (e) {
      showToast(e.message, "error");
      setAdditionalHoursForm((prev) => ({ ...prev, isGenerating: false }));
    }
  };

  const handleQtyChange = (idx, delta) => {
    setSelectedItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) }
          : item,
      ),
    );
    if (generatedLink) setGeneratedLink(null);
  };

  const handleGenerateLink = async () => {
    try {
      // If no explicit items selected, fall back to the booking's total
      // so admins can generate a link without adding extras.
      let itemsToSend = selectedItems;
      if (!itemsToSend || itemsToSend.length === 0) {
        const fallbackAmount = parseFloat(booking.payment?.amount) || 0;
        itemsToSend = [
          {
            name: booking.service || "Booking",
            amount: fallbackAmount,
            qty: 1,
          },
        ];
      }

      const data = await doAction("create-payment-link", {
        items: itemsToSend,
      });
      setGeneratedLink(data.url);
      showToast("✓ Payment link generated successfully!");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleSendPaymentLink = async () => {
    if (!generatedLink) {
      showToast("Generate the link first before sending", "error");
      return;
    }
    try {
      const itemsToSend =
        selectedItems && selectedItems.length > 0
          ? selectedItems
          : [
              {
                name: booking.service || "Booking",
                amount: parseFloat(booking.payment?.amount) || 0,
                qty: 1,
              },
            ];
      const computedTotal = itemsToSend.reduce(
        (s, it) => s + (parseFloat(it.amount) || 0) * (it.qty || 1),
        0,
      );

      await doAction("send-payment-link", {
        url: generatedLink,
        items: itemsToSend,
        totalAmount: computedTotal,
        note: paymentNote,
      });
      const now = new Date().toISOString();
      setMeta((m) => ({ ...m, paymentLinkSentAt: now }));
      showToast("💳 Payment link emailed to " + booking.customer.email);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    }
  };

  // ─── TAB: CONFIRMATION ────────────────────────────────────────────────────
  const ConfirmationTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)",
          borderRadius: "20px",
          padding: "28px",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "11px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Booking Reference
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 900,
                letterSpacing: "1px",
              }}
            >
              {booking.bookingId}
            </p>
          </div>
          <div
            style={{
              background: "#6EE7B7",
              color: "#0F172A",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            {booking.status}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Customer
            </p>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
              {booking.customer?.firstName} {booking.customer?.lastName}
            </p>
            <p
              style={{ margin: "4px 0 0", fontSize: "12px", color: "#6EE7B7" }}
            >
              {booking.customer?.email}
            </p>
          </div>
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Service
            </p>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
              {booking.service}
            </p>
            <p
              style={{ margin: "4px 0 0", fontSize: "12px", color: "#6EE7B7" }}
            >
              £{booking.payment?.amount}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h4
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            fontWeight: 800,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          What this email contains
        </h4>
        <ul
          style={{
            margin: 0,
            padding: "0 0 0 16px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            lineHeight: 2,
          }}
        >
          <li>Booking reference number ({booking.bookingId})</li>
          <li>Date, time slot & service address</li>
          <li>Service details, duration & frequency</li>
          <li>Total amount & payment status</li>
          <li>What happens next — team assignment steps</li>
        </ul>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <SentBadge date={meta.confirmationSentAt} label="Sent" />
        <ActionBtn
          onClick={handleSendConfirmation}
          loading={loadingAction === "send-confirmation"}
          icon={Send}
          variant="primary"
        >
          Send Confirmation Email
        </ActionBtn>
      </div>
    </div>
  );

  // ─── TAB: INVOICE ─────────────────────────────────────────────────────────
  const InvoiceTab = () => {
    const invoiceDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const dueDate = booking.jobEndTime
      ? new Date(
          new Date(booking.jobEndTime).getTime() + 7 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : invoiceDate;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            overflow: "hidden",
            background: "rgba(7,29,22,0.9)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)",
              padding: "28px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#6EE7B7",
                  letterSpacing: "-0.5px",
                }}
              >
                INVOICE
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 600,
                }}
              >
                INV-{booking.bookingId}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Date Issued
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                {invoiceDate}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: "24px 32px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Bill To
              </p>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "white",
                }}
              >
                {booking.customer?.firstName} {booking.customer?.lastName}
              </p>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {booking.customer?.email}
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                {booking.customer?.phone}
              </p>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                From
              </p>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "white",
                }}
              >
                Cleaniq Services
              </p>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                info@cleaniqservices.com
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                cleaniqservices.com
              </p>
            </div>
          </div>

          <div
            style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(110,231,183,0.3)" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 0",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 0",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td
                    style={{
                      padding: "14px 0",
                      fontSize: "14px",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    {booking.service}
                    <br />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.4)",
                        fontWeight: 500,
                      }}
                    >
                      {booking.schedule?.date
                        ? new Date(booking.schedule.date).toLocaleDateString(
                            "en-GB",
                          )
                        : ""}{" "}
                      — {booking.schedule?.timeSlot}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "14px 10px",
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    1
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "14px 0",
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "white",
                    }}
                  >
                    £{booking.payment?.amount || "0.00"}
                  </td>
                </tr>
                {(booking.details?.extras || []).map((e, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td
                      style={{
                        padding: "12px 0",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {typeof e === "object" ? e.name : e}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px 10px",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {typeof e === "object" ? e.qty || 1 : 1}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "12px 0",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      Included
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div
            style={{
              padding: "20px 32px",
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "flex",
                  gap: "48px",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 700,
                  }}
                >
                  Subtotal
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "white",
                  }}
                >
                  £{booking.payment?.amount || "0.00"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "48px",
                  alignItems: "center",
                  paddingTop: "12px",
                  borderTop: "2px solid rgba(110,231,183,0.3)",
                }}
              >
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  TOTAL
                </span>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  £{booking.payment?.amount || "0.00"}
                </span>
              </div>
              <div style={{ marginTop: "10px" }}>
                <span
                  style={{
                    background:
                      booking.payment?.status === "Completed" ||
                      booking.payment?.status === "Paid"
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(245,158,11,0.15)",
                    color:
                      booking.payment?.status === "Completed" ||
                      booking.payment?.status === "Paid"
                        ? "#34d399"
                        : "#fbbf24",
                    border: `1px solid ${booking.payment?.status === "Completed" || booking.payment?.status === "Paid" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                    padding: "4px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {booking.payment?.status === "Completed" ||
                  booking.payment?.status === "Paid"
                    ? "PAID"
                    : booking.payment?.status || "PENDING"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <SentBadge date={meta.invoiceSentAt} label="Sent" />
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <ActionBtn
              onClick={handleSendInvoice}
              loading={loadingAction === "send-invoice"}
              icon={Send}
              variant="primary"
            >
              Email Invoice to Customer
            </ActionBtn>
          </div>
        </div>
      </div>
    );
  };

  // ─── TAB: REVIEW REQUEST ──────────────────────────────────────────────────
  const ReviewTab = () => {
    const reviewUrl = `https://cleaniqservices.com/review?booking=${booking.bookingId}&customer=${encodeURIComponent((booking.customer?.firstName || "") + " " + (booking.customer?.lastName || ""))}`;
    const isCompleted = booking.status === "Completed";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {!isCompleted && (
          <div
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "16px",
              padding: "16px 20px",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <AlertCircle
              size={18}
              style={{ color: "#fbbf24", flexShrink: 0, marginTop: "1px" }}
            />
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#fbbf24",
                }}
              >
                Job Not Yet Completed
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "rgba(251,191,36,0.7)" }}>
                You can still send a review request, but it's best practice to
                send this after the job is marked as Completed.
              </p>
            </div>
          </div>
        )}

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)",
              padding: "28px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⭐</div>
            <h3
              style={{
                margin: "0 0 8px",
                color: "white",
                fontSize: "22px",
                fontWeight: 800,
              }}
            >
              How did we do?
            </h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
              Your feedback helps us be better
            </p>
          </div>
          <div style={{ padding: "24px 28px", background: "rgba(7,29,22,0.9)" }}>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "15px",
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.7,
              }}
            >
              Hi <strong style={{ color: "white" }}>{booking.customer?.firstName}</strong>, we hope you
              loved your recent cleaning session! Your honest feedback helps us
              keep delivering 5-star results.
            </p>
            <div
              style={{
                background: "linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%)",
                borderRadius: "16px",
                padding: "16px 20px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "white",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontWeight: 800,
                  }}
                >
                  Booking
                </p>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 900 }}>
                  {booking.bookingId}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontWeight: 800,
                  }}
                >
                  Service
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#6EE7B7",
                  }}
                >
                  {booking.service}
                </p>
              </div>
            </div>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "32px", letterSpacing: "8px" }}>
                ⭐⭐⭐⭐⭐
              </div>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Tap a star in the email to rate
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  background:
                    "linear-gradient(135deg, #6EE7B7 0%, #10b981 100%)",
                  color: "#0F172A",
                  padding: "14px 36px",
                  borderRadius: "50px",
                  fontWeight: 900,
                  fontSize: "15px",
                  boxShadow: "0 8px 20px rgba(16,185,129,0.3)",
                }}
              >
                Leave a Review →
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "12px",
              fontWeight: 800,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Review URL (embedded in email)
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "rgba(255,255,255,0.6)",
              wordBreak: "break-all",
              fontFamily: "monospace",
              background: "rgba(255,255,255,0.05)",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {reviewUrl}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <SentBadge date={meta.reviewRequestSentAt} label="Request Sent" />
          <ActionBtn
            onClick={handleSendReview}
            loading={loadingAction === "send-review-request"}
            icon={Star}
            variant="accent"
          >
            Send Review Request
          </ActionBtn>
        </div>
      </div>
    );
  };

  // ─── TAB: PAYMENT LINK ────────────────────────────────────────────────────
  const PaymentLinkTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h4
          style={{
            margin: "0 0 14px",
            fontSize: "13px",
            fontWeight: 800,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              background: "#0F172A",
              color: "#6EE7B7",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              fontSize: "11px",
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            1
          </span>
          Select Services / Extras
        </h4>
        {loadingServices ? (
          <div
            style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.4)" }}
          >
            <Loader2
              size={24}
              style={{
                animation: "spin 1s linear infinite",
                marginBottom: "8px",
              }}
            />
            <p style={{ margin: 0, fontSize: "13px" }}>Loading services...</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "10px",
              maxHeight: "220px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {services
              .filter((s) => s.type === "flat" || s.rate > 0)
              .map((svc) => {
                const isSelected = selectedItems.some(
                  (i) => i.serviceId === svc._id,
                );
                return (
                  <button
                    key={svc._id}
                    onClick={() => handleAddServiceItem(svc)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "14px",
                      border: `2px solid ${isSelected ? "#6EE7B7" : "rgba(255,255,255,0.1)"}`,
                      background: isSelected
                        ? "rgba(110,231,183,0.08)"
                        : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 3px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "white",
                        }}
                      >
                        {svc.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          fontWeight: 800,
                          color: isSelected ? "#34d399" : "rgba(255,255,255,0.4)",
                        }}
                      >
                        £{svc.rate}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2
                        size={16}
                        style={{ color: "#34d399", flexShrink: 0 }}
                      />
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </div>

      <div>
        <h4
          style={{
            margin: "0 0 12px",
            fontSize: "13px",
            fontWeight: 800,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              background: "#0F172A",
              color: "#6EE7B7",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              fontSize: "11px",
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            2
          </span>
          Add Custom Item
        </h4>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Item name"
            value={customItem.name}
            onChange={(e) =>
              setCustomItem((p) => ({ ...p, name: e.target.value }))
            }
            style={{
              flex: "2",
              minWidth: "140px",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <input
            type="number"
            placeholder="£ Amount"
            value={customItem.amount}
            onChange={(e) =>
              setCustomItem((p) => ({ ...p, amount: e.target.value }))
            }
            style={{
              flex: "1",
              minWidth: "90px",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <input
            type="number"
            min={1}
            placeholder="Qty"
            value={customItem.qty}
            onChange={(e) =>
              setCustomItem((p) => ({
                ...p,
                qty: parseInt(e.target.value) || 1,
              }))
            }
            style={{
              width: "64px",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            onClick={handleAddCustomItem}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "none",
              background: "#0F172A",
              color: "#6EE7B7",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div>
          <h4
            style={{
              margin: "0 0 12px",
              fontSize: "13px",
              fontWeight: 800,
              color: "white",
              textTransform: "uppercase",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                background: "#0F172A",
                color: "#6EE7B7",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                fontSize: "11px",
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              3
            </span>
            Review Items
          </h4>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {selectedItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderBottom:
                    idx < selectedItems.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {item.name}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    £{item.amount} each
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255,255,255,0.07)",
                      borderRadius: "10px",
                      padding: "4px 10px",
                    }}
                  >
                    <button
                      onClick={() => handleQtyChange(idx, -1)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.4)",
                        display: "flex",
                        padding: "2px",
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "white",
                        minWidth: "16px",
                        textAlign: "center",
                      }}
                    >
                      {item.qty}
                    </span>
                    <button
                      onClick={() => handleQtyChange(idx, 1)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.4)",
                        display: "flex",
                        padding: "2px",
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "white",
                      minWidth: "64px",
                      textAlign: "right",
                    }}
                  >
                    £{((item.amount || 0) * (item.qty || 1)).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                      padding: "4px",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div
              style={{
                padding: "16px 18px",
                background: "rgba(16,185,129,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "2px solid rgba(16,185,129,0.25)",
              }}
            >
              <span
                style={{ fontSize: "14px", fontWeight: 800, color: "#34d399" }}
              >
                TOTAL
              </span>
              <span
                style={{ fontSize: "22px", fontWeight: 900, color: "#34d399" }}
              >
                £{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "12px",
            fontWeight: 800,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Note to Customer (optional)
        </label>
        <textarea
          value={paymentNote}
          onChange={(e) => setPaymentNote(e.target.value)}
          placeholder="e.g. This covers the additional deep clean requested during the service..."
          rows={3}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontSize: "13px",
            outline: "none",
            resize: "none",
            lineHeight: 1.6,
            boxSizing: "border-box",
          }}
        />
      </div>

      {generatedLink && (
        <div
          style={{
            background: "rgba(16,185,129,0.1)",
            borderRadius: "16px",
            padding: "18px 20px",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "12px",
              fontWeight: 800,
              color: "#34d399",
              textTransform: "uppercase",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={14} /> Payment Link Generated
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#34d399",
                fontFamily: "monospace",
                wordBreak: "break-all",
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              {generatedLink.substring(0, 80)}...
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <button
                onClick={handleCopyLink}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(16,185,129,0.25)",
                  background: "rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Copy size={12} />
                {linkCopied ? "Copied!" : "Copy"}
              </button>
              <a
                href={generatedLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(16,185,129,0.25)",
                  background: "rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={12} /> Open
              </a>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <SentBadge date={meta.paymentLinkSentAt} label="Link Sent" />
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <ActionBtn
            onClick={handleGenerateLink}
            loading={loadingAction === "create-payment-link"}
            icon={CreditCard}
            variant="outline"
            disabled={
              selectedItems.length === 0 &&
              !(booking.payment?.amount || booking.service)
            }
          >
            Generate Link
          </ActionBtn>
          <ActionBtn
            onClick={handleSendPaymentLink}
            loading={loadingAction === "send-payment-link"}
            icon={Send}
            variant="primary"
            disabled={!generatedLink}
          >
            Send to Customer
          </ActionBtn>
        </div>
      </div>
    </div>
  );

  // ─── TAB: ADDITIONAL HOURS ────────────────────────────────────────────────
  const AdditionalHoursTab = () => {
    const hoursTotal =
      additionalHoursForm.hours && additionalHoursForm.hourlyRate
        ? parseFloat(additionalHoursForm.hours) *
          parseFloat(additionalHoursForm.hourlyRate)
        : 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: "20px",
            padding: "28px",
            color: "white",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "12px",
                borderRadius: "12px",
              }}
            >
              <Zap size={24} />
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.8)",
                  textTransform: "uppercase",
                }}
              >
                Current Duration
              </p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: 900 }}>
                {booking.details?.duration || 0}h
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "20px",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "13px",
              fontWeight: 800,
              color: "white",
              textTransform: "uppercase",
            }}
          >
            Create Payment Link
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                }}
              >
                Additional Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                placeholder="e.g. 2"
                value={additionalHoursForm.hours}
                onChange={(e) =>
                  setAdditionalHoursForm({
                    ...additionalHoursForm,
                    hours: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                }}
              >
                Hourly Rate (£)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 25.00"
                value={additionalHoursForm.hourlyRate}
                onChange={(e) =>
                  setAdditionalHoursForm({
                    ...additionalHoursForm,
                    hourlyRate: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {hoursTotal > 0 && (
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "16px",
                border: "1px solid rgba(59,130,246,0.4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}
              >
                {additionalHoursForm.hours}h × £
                {parseFloat(additionalHoursForm.hourlyRate).toFixed(2)}
              </span>
              <span
                style={{ fontSize: "20px", fontWeight: 900, color: "white" }}
              >
                £{hoursTotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            background: "rgba(16,185,129,0.1)",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "12px",
              fontWeight: 800,
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={14} /> How it Works
          </p>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 16px",
              fontSize: "12px",
              color: "rgba(52,211,153,0.8)",
              lineHeight: "1.8",
            }}
          >
            <li>Enter the additional hours the customer needs</li>
            <li>Set the hourly rate to charge</li>
            <li>Payment link is generated and sent to the customer</li>
            <li>When the customer pays, booking hours auto-update</li>
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <SentBadge date={meta.additionalHoursSentAt} label="Link Sent" />
          <ActionBtn
            onClick={handleSendAdditionalHours}
            loading={additionalHoursForm.isGenerating}
            icon={Zap}
            variant="primary"
            disabled={
              !additionalHoursForm.hours || !additionalHoursForm.hourlyRate
            }
          >
            Create & Send Payment Link
          </ActionBtn>
        </div>
      </div>
    );
  };

  // ─── TAB REGISTRY ─────────────────────────────────────────────────────────
  const tabs = [
    { id: "confirmation", label: "Confirmation", icon: Mail },
    { id: "invoice", label: "Invoice", icon: FileText },
    { id: "review", label: "Review", icon: Star },
    { id: "payment", label: "Payment Link", icon: CreditCard },
    // { id: "additional-hours", label: "Extra Hours", icon: Zap },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "confirmation":
        return <ConfirmationTab />;
      case "invoice":
        return <InvoiceTab />;
      case "review":
        return <ReviewTab />;
      case "payment":
        return <PaymentLinkTab />;
      case "additional-hours":
        return <AdditionalHoursTab />;
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .crm-tab-label { display: inline; }
        @media (max-width: 640px) { .crm-tab-label { display: none; } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.7)",
          backdropFilter: "blur(6px)",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "min(780px, 96vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          background: "#0B2D22",
          borderRadius: "28px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          animation: "modalIn 0.3s ease",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: "linear-gradient(135deg, #0F172A 0%, #1e293b 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                background: "rgba(110,231,183,0.15)",
                border: "1px solid rgba(110,231,183,0.3)",
                borderRadius: "12px",
                padding: "10px",
                display: "flex",
              }}
            >
              <MessageSquare size={20} style={{ color: "#6EE7B7" }} />
            </div>
            <div>
              <h2
                style={{
                  margin: "0 0 3px",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "-0.3px",
                }}
              >
                CRM Actions
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 600,
                }}
              >
                Booking #{booking.bookingId} — {booking.customer?.firstName}{" "}
                {booking.customer?.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "10px",
              padding: "8px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              transition: "all 0.2s",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            gap: "6px",
            flexShrink: 0,
            background: "#071D16",
            flexWrap: "wrap",
          }}
        >
          {tabs.map((tab) => (
            <TabBtn
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "28px", overflowY: "auto", flex: 1 }}>
          {renderTab()}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default AdminCRM;
