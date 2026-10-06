// What a booking's status means for the customer (stored values stay the same). Regular-clean
// visits are Pending until they're charged, 24 hours before — that's normal, so say so.
import { C } from "../theme/flat";

const LABEL = {
  Assigned: "Cleaner Assigned",
  Arrived: "Cleaner Arrived",
  Cleaning: "In Progress",
  Authorized: "Payment Authorised",
  "Completed - Unpaid": "Completed – Payment Due",
};
const COLORS = {
  Completed:     { color: C.success,  bg: C.successBg },
  Cancelled:     { color: C.error,    bg: C.errorBg },
  Cleaning:      { color: C.warning,  bg: C.warningBg },
  "In Progress": { color: C.warning,  bg: C.warningBg },
  Arrived:       { color: C.warning,  bg: C.warningBg },
  Assigned:      { color: C.info,     bg: C.infoBg },
  Pending:       { color: "#F59E0B",  bg: C.warningBg },
  Confirmed:     { color: C.purple,   bg: C.purpleBg },
  Authorized:    { color: "#06B6D4",  bg: "#ECFEFF" },
};

export const isWaitingForPayment = (b) => ["Pending", "Awaiting Payment"].includes(b?.status);
export const isRegularVisit = (b) => Boolean(b?.meta?.subscriptionId);

export function statusView(b) {
  if (isWaitingForPayment(b) && b.payment?.status === "Failed") return { label: "Payment needed", color: C.error, bg: C.errorBg };
  if (isRegularVisit(b) && isWaitingForPayment(b) && b.payment?.chargeOnArrival) return { label: "Booked · paid 24h before", color: C.info, bg: C.infoBg };
  if (isWaitingForPayment(b)) return { label: "Awaiting payment", color: "#F59E0B", bg: C.warningBg };
  return { label: LABEL[b?.status] || b?.status || "", ...(COLORS[b?.status] || { color: C.textMuted, bg: C.surfaceAlt }) };
}

// Bookings the customer can cancel themselves (same as the server).
export const canCustomerCancel = (b) => ["Confirmed", "Pending", "Assigned"].includes(b?.status);
