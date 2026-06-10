# Service-Based Worker Payment System - Complete Flow Guide

## Overview

The worker payment system now operates on **service-based rates** instead of hourly rates. Each service (e.g., "House Cleaning", "Office Cleaning") has a fixed payment amount that workers receive when the service is completed.

---

## 1. Setting Up Service Pricing

### Admin: Configure Service Pricing

**Location:** Admin Dashboard → **Service Pricing**

**Steps:**

1. Navigate to "Service Pricing" menu
2. Browse through services by category (Base, Rooms, Extras)
3. For each service, set the "Worker Payment" amount
4. Example:
   - House Cleaning → £25 per service
   - Office Cleaning → £30 per service
   - Window Cleaning → £15 per service

**What Happens:**

- This amount is stored in the `Service.workerPaymentRate` field
- When a booking for this service is completed, the worker earns this exact amount

---

## 2. Booking Created → Payment Triggered

### Flow:

```
Customer Books Service
    ↓
Booking Created (status: "Pending")
    ↓
Worker Accepts Job (status: "Assigned")
    ↓
Worker Completes Job (status: "Completed")
    ↓
[AUTOMATIC PAYMENT TRIGGER]
```

### What Happens When Booking Marked "Completed":

1. **System calculates worker earnings:**
   - Looks up the Service in database
   - Gets the `workerPaymentRate` from the service
   - Adds this amount to `totalEarnings`

2. **Creates automatic payout record (Withdrawal):**
   - Status: "upcoming"
   - Amount: Total earnings from all completed jobs
   - Expected Payout Date:
     - Weekly: Next Monday (8 days default)
     - Monthly: 1st of next month
   - Marks worker's balance as "onHold"

3. **Sends Email to Worker:**
   - Subject: "✅ Payment Scheduled - Cleaniq"
   - Body includes:
     - Total amount: £X.XX
     - Payout type (weekly/monthly)
     - Expected payment date
     - Message: "You'll receive another confirmation when payment is processed"

4. **Admin sees automatic notification:**
   - Email sent to admin about pending payout
   - Shows worker details and payment amount

---

## 3. Admin Reviews & Approves Payment

### Admin: Payment Approvals Dashboard

**Location:** Admin Dashboard → **Payment Approvals**

### Tabs:

- **Upcoming:** Payouts scheduled but not yet approved (status: "upcoming", "pending")
- **Processing:** Payouts being processed (status: "approved", "processing")
- **Completed:** Paid out payouts (status: "completed")

### Expanded Payout Details Show:

```
┌─ Worker Info ─────────────────────┐
│ • Name: John Smith                │
│ • Email: john@example.com         │
│ • Phone: +44 7000 000000          │
│ • Address: 123 Main St, London    │
└───────────────────────────────────┘

┌─ Payment Amount ──────────────────┐
│ • Total: £75.00                   │
│ • Payment Type: Weekly            │
│ • Expected Payout: Mon, 17 Jun    │
└───────────────────────────────────┘

┌─ Completed Services ──────────────┐
│ 📋 House Cleaning    £25  | 10 Jun│
│ 📋 Office Cleaning   £30  | 11 Jun│
│ 📋 Window Cleaning   £20  | 12 Jun│
└───────────────────────────────────┘

┌─ Bank Details (Masked) ───────────┐
│ • Account: John Smith             │
│ • Number: ****1234                │
│ • Sort Code: **01**               │
└───────────────────────────────────┘
```

### Approval Process:

**Option 1: Approve Individual Payment**

1. Click "Details" to expand payout card
2. Click "✓ Approve & Pay" button
3. System processes payment:
   - Updates withdrawal status: "completed"
   - Sets transaction reference: `TXN-{timestamp}-{workerID}`
   - Deducts amount from worker's "onHold" balance
   - Adds to "withdrawn" total

**Option 2: Bulk Approve Multiple Payments**

1. Check boxes next to payouts to select
2. Click "Approve & Pay All" button
3. All selected payments processed at once

### Result:

- Payout moves to "Completed" tab
- Worker receives email with transaction details

---

## 4. Worker Receives Payment Notification

### Email Sent to Worker:

```
Subject: ✅ Payment Processed - Funds Transferred! Cleaniq Services

Hi John,

Your payment has been successfully processed and transferred to your account.

Amount: £75.00
Transaction Reference: TXN-1718543201234-7fk3h2
Transfer Date: 13 Jun 2026

The funds should appear in your bank account within 1-2 working days.
Thank you for your excellent work!

- Cleaniq Services Team
```

### Worker App:

- Worker can check "Payments" tab
- View "Received" section to see completed payment
- Shows transaction reference and payment date

---

## 5. Rejection Workflow (Optional)

If admin rejects a payout:

1. **Rejection Email Sent to Worker:**

   ```
   Subject: ⚠️ Payment Request Status Update - Cleaniq Services

   Hi John,

   Your payment request of £75.00 could not be processed at this time.

   Reason: Documentation incomplete

   Please contact support to resubmit your request.
   ```

2. **Worker Balance Refunded:**
   - Amount deducted from "onHold"
   - Added back to "balance"
   - Worker can see available balance again

---

## 6. Complete Payment Flow Summary

```
DAY 1 - JOB COMPLETED
┌─────────────────────────────────────┐
│ 1. Booking marked "Completed"       │
│ 2. Service payment calculated       │
│ 3. Withdrawal record created        │
│ 4. Worker email sent (scheduled)    │
│ 5. Admin notified                   │
└─────────────────────────────────────┘

DAY 2-7 - PENDING APPROVAL
┌─────────────────────────────────────┐
│ 1. Payout shows in Admin dashboard  │
│ 2. Admin reviews details            │
│ 3. Admin clicks "Approve & Pay"     │
│ 4. Payment processed instantly      │
│ 5. Worker receives email            │
│ 6. Money deducted from onHold       │
└─────────────────────────────────────┘

DAY 8+ - PAYMENT RECEIVED
┌─────────────────────────────────────┐
│ 1. Payout status: "completed"       │
│ 2. Worker sees "Received" in app    │
│ 3. Money in worker's bank (1-2 days)│
│ 4. Transaction ref available        │
└─────────────────────────────────────┘
```

---

## Testing Checklist

### Setup Phase:

- [ ] Navigate to Service Pricing page
- [ ] Set worker payment rate for at least 3 services
- [ ] Verify amounts saved (refresh page)

### Booking Completion:

- [ ] Create a test booking in admin
- [ ] Assign to a worker
- [ ] Mark as "Completed"
- [ ] Check worker email inbox for "Payment Scheduled" email
- [ ] Verify Withdrawal record created in database

### Payment Approval:

- [ ] Log into admin
- [ ] Go to "Payment Approvals"
- [ ] Click "Details" to expand payment
- [ ] Verify service details show correctly
- [ ] Click "✓ Approve & Pay"
- [ ] Check worker email for "Payment Transferred" email
- [ ] Verify transaction reference shown

### Worker App View:

- [ ] Log into worker app
- [ ] Navigate to Payments tab
- [ ] Check "Upcoming" section (before approval)
- [ ] Check "Received" section (after approval)
- [ ] Verify transaction reference visible

---

## Database Changes

### Service Model (Updated)

```javascript
{
  name: "House Cleaning",
  region: "UK",
  rate: 49.99,          // Customer price
  type: "flat",
  workerPaymentRate: 25 // ← NEW: What worker earns
}
```

### Withdrawal Model (Existing)

```javascript
{
  workerId: ObjectId,
  amount: 75.00,
  status: "completed",
  expectedPayoutDate: Date,
  payoutType: "weekly",
  completedJobs: [
    {
      bookingId: ObjectId,
      service: "House Cleaning",
      amount: 25,           // From Service.workerPaymentRate
      completedDate: Date
    }
  ],
  transactionRef: "TXN-1718543201234-7fk3h2"
}
```

---

## Key Differences from Hourly System

| Aspect              | Before (Hourly)             | After (Service-Based)      |
| ------------------- | --------------------------- | -------------------------- |
| Payment Calculation | Rate × Duration             | Fixed service rate         |
| Admin Configuration | Global default rate         | Per-service rates          |
| Worker Earnings     | Varies by duration          | Consistent per service     |
| Setup Location      | Staff Pay page              | Service Pricing page       |
| Flexibility         | One rate for all            | Different rate per service |
| Scaling             | Complex with many durations | Simple flat amounts        |

---

## Troubleshooting

### Payment not triggering?

1. Check that booking status = "Completed"
2. Verify Service has `workerPaymentRate > 0`
3. Ensure worker has valid bank details
4. Check browser console for errors

### Email not sent?

1. Verify `RESEND_API_KEY` set on VPS
2. Check server logs for email errors
3. Test with test booking in non-prod environment

### Amount incorrect?

1. Verify Service.workerPaymentRate in database
2. Check Booking.service matches Service.name exactly
3. Review Withdrawal record amount field

---

## Configuration Variables

```javascript
// Payout Schedule (in Worker model)
payoutPreference: "weekly"  // or "monthly"

// Email Template
Subject: "✅ Payment Scheduled - Cleaniq"
"✅ Payment Processed - Funds Transferred!"
"⚠️ Payment Request Status Update"

// Transaction Reference Format
TXN-{timestamp}-{workerID.slice(-6)}
```

---

## Support Notes

- Service pricing can be updated anytime (affects future jobs only)
- Withdrawals are immutable once created
- Workers cannot request withdrawals (automatic only)
- Admin cannot delete payouts, only approve/reject
- All transactions logged with timestamp and reference

---

**Last Updated:** 2026-06-10
**Version:** 2.0 (Service-Based)
