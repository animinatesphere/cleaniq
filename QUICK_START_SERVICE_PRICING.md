# Quick Start Guide - Service-Based Payment System

## 🚀 What You Have Now

A **complete service-based worker payment system** where:

- Admin sets a fixed payment per service (not hourly rates)
- Payments trigger automatically when jobs are completed
- Admin approves payments in a dashboard
- Workers get emails and payments automatically

---

## 📋 Step-by-Step Setup

### Step 1: Login to Admin Dashboard

Go to: `https://yoursite.com/admin`

### Step 2: Configure Service Pricing

1. Click **"Service Pricing"** in the sidebar menu
2. You'll see all services grouped by category:
   - Base (House Cleaning, Office Cleaning, etc.)
   - Rooms (Bedroom, Kitchen, Bathroom)
   - Extras (Window Cleaning, Carpet Cleaning, etc.)

3. For each service, enter the **"Worker Payment"** amount
   - Example: "House Cleaning" = £25
   - Example: "Office Cleaning" = £30

4. Click **"Save"** - changes apply to all new bookings

### Step 3: Test the Flow

1. Create a test booking in your system
2. Assign it to a worker
3. Mark it as **"Completed"**

**What happens automatically:**

- ✅ Email sent to worker: "✅ Payment Scheduled"
- ✅ Payment appears in your dashboard

### Step 4: Approve the Payment

1. Click **"Payment Approvals"** in sidebar
2. You'll see a card for the worker's payment
3. Click **"Details"** to expand and see:
   - Worker name, email, phone
   - Services completed (with amounts)
   - Total payment
   - Bank details (masked for security)

4. Click **"✓ Approve & Pay"** button

**What happens:**

- ✅ Email sent to worker: "✅ Payment Transferred"
- ✅ Payment moves to "Completed" tab
- ✅ Money deducted from worker's pending balance

---

## 💰 Payment Dashboard

### Three Tabs:

#### 1. **Upcoming** (Not yet approved)

- Payments waiting for your approval
- Shows "Approve & Pay" button

#### 2. **Processing** (In progress)

- Payments being processed
- Shows status and reference number

#### 3. **Completed** (Paid out)

- All paid payments
- Shows transaction reference and date

---

## 📧 Emails Workers Receive

### Email 1: "✅ Payment Scheduled" (When job completes)

```
Subject: ✅ Payment Scheduled - Cleaniq

Hi John,
Your payment of £75.00 has been scheduled.
Expected payment date: Mon, 17 Jun
You'll receive confirmation when payment is processed.
```

### Email 2: "✅ Payment Transferred" (When you approve)

```
Subject: ✅ Payment Processed - Funds Transferred!

Hi John,
Your payment has been successfully transferred!
Amount: £75.00
Transaction Reference: TXN-1718543201234-abc123
Transfer Date: 13 Jun 2026
```

---

## 🎯 Example Workflow

```
Monday 10 June
└─ Worker completes "House Cleaning" service
   └─ Worth £25 (from Service Pricing settings)
   └─ Email sent: "Payment Scheduled"
   └─ Shows in Payment Approvals as "Upcoming"

Tuesday 11 June
└─ You review payment in admin dashboard
   └─ Click "Approve & Pay"
   └─ Email sent to worker: "Payment Transferred"
   └─ Payment moves to "Completed"

Wednesday 12 June
└─ Money appears in worker's bank account (1-2 days)
   └─ Worker sees it in app under "Payments → Received"
```

---

## ⚙️ Common Tasks

### How to change a service payment rate?

1. Go to Service Pricing page
2. Find the service
3. Enter new amount in "Worker Payment" field
4. Click Save
   ✅ Takes effect for all future bookings

### How to reject a payment?

1. Go to Payment Approvals
2. Click "Details" on a payment
3. Click "Reject" button
4. Enter reason (optional)
   ✅ Money goes back to worker's available balance

### How to approve multiple payments at once?

1. Go to Payment Approvals
2. Check boxes next to payments you want to approve
3. Click "Approve & Pay All" button
   ✅ All selected payments processed instantly

### How to see all worker payments?

1. Click "Withdrawals" in sidebar
2. Shows complete history of all payments
3. Filter by worker, date range, or status

---

## 📱 Worker App Experience

Workers see their payments in the **"Payments"** tab:

**Upcoming Section:**

- Shows payments scheduled but not yet transferred
- Amount and expected date

**Received Section:**

- Shows all completed payments
- Amount, date, and transaction reference

---

## ✅ Verification Checklist

Before going live, test these:

- [ ] Set a service payment rate in Service Pricing
- [ ] Create and complete a test booking
- [ ] Check if payment appears in Payment Approvals
- [ ] Click "Approve & Pay"
- [ ] Check worker's email inbox for "Payment Transferred" email
- [ ] Verify email includes transaction reference
- [ ] Check worker app shows payment in "Received"
- [ ] Test rejecting a payment (money should go back to available)
- [ ] Test bulk approve with multiple payments

---

## 🔧 Troubleshooting

### "Service Pricing" page not showing?

- Make sure you're logged in as admin
- Check the sidebar menu for "Service Pricing" link
- Refresh the page

### Payment not creating after job completion?

1. Check that service has a payment rate set (not 0)
2. Verify service name matches exactly
3. Check server logs for errors
4. Ensure RESEND_API_KEY is configured

### Worker didn't receive email?

1. Check worker's spam/junk folder
2. Verify email address in worker profile
3. Check RESEND_API_KEY is set on server

### Payment amount is wrong?

1. Go to Service Pricing
2. Verify the service has the correct payment rate
3. Check that booking was for the right service

---

## 📞 Support

If something isn't working:

1. **Check the logs:**
   - Server logs for API errors
   - Admin browser console (F12)
   - Worker app console (React Native debugger)

2. **Verify setup:**
   - Service has payment rate > 0
   - Service name matches booking
   - RESEND_API_KEY configured
   - Worker has valid email

3. **Test with known data:**
   - Use a test service and test worker
   - Create booking, complete it, approve it
   - Check each step works

---

## 🎓 Key Differences from Old System

| Old System                 | New System                       |
| -------------------------- | -------------------------------- |
| Hourly rates (£/hour)      | Service rates (£/service)        |
| Rate based on duration     | Fixed amount per service         |
| Manual payment requests    | Automatic payouts                |
| One rate for all workers   | Different rates per service      |
| Settings page: "Staff pay" | Settings page: "Service Pricing" |

---

## 📝 Notes

- **Service rates apply to NEW bookings only** - existing bookings keep their old rates
- **Payments are automatic** - no manual intervention needed, just approve in dashboard
- **All payments have transaction references** - for tracking and reconciliation
- **Workers can't delete payments** - only admin can approve or reject
- **Email is critical** - make sure RESEND_API_KEY is set, otherwise workers won't get notifications

---

## 🚀 You're Ready!

Your system is now set up for service-based worker payments.

**Next steps:**

1. Set service pricing for your services
2. Try a test booking workflow
3. Go live with confidence!

For detailed information, see: `PAYMENT_FLOW_SERVICE_BASED.md`

---

**Last Updated:** 10 June 2026
**System Version:** 2.0 (Service-Based Payments)
**Status:** Ready for Production ✅
