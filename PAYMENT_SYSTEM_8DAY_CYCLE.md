# Complete 8-Day Payment Cycle System ✅

## Overview

Workers get paid **automatically every 8 days** based on services they complete. Each job's earnings are accumulated and paid out as a single payment after 8 days.

---

## Payment Flow - Step by Step

### DAY 1: Worker Completes First Job

```
┌─────────────────────────────────────┐
│ Worker completes: House Cleaning    │
│ Earns: £25 (from Staff Pay hourly)  │
│ Time: 10:00 AM                      │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│ Backend Processing:                 │
│ 1. Calculate earnings (£25)         │
│ 2. Schedule payment date: +8 days   │
│ 3. Create Withdrawal record         │
│    status: "upcoming"               │
│    expectedPayoutDate: Day 9        │
│    amount: £25                      │
│ 4. Add to worker's balance "onHold" │
│    onHold: £0 → £25                 │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│ Worker Notification:                │
│ Email: "✅ Payment Scheduled"       │
│ Message: "£25 will be paid on Day 9"│
└─────────────────────────────────────┘
```

---

### DAY 2: Worker Completes Second Job (Same 8-Day Cycle)

```
┌─────────────────────────────────────┐
│ Worker completes: Office Cleaning   │
│ Earns: £30 (from Staff Pay hourly)  │
│ Time: 2:00 PM                       │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│ Backend Processing:                 │
│ 1. Calculate earnings (£30)         │
│ 2. Check for existing withdrawal    │
│    with payout date ~Day 9          │ ✅ FOUND
│ 3. ADD to existing Withdrawal       │
│    amount: £25 → £55                │
│    jobs: [House £25, Office £30]    │
│ 4. Update onHold balance            │
│    onHold: £25 → £55                │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│ Worker Notification:                │
│ Email: "✅ Additional Payment Added"│
│ Message: "£30 added, total now £55" │
│ New payout date still: Day 9        │
└─────────────────────────────────────┘
```

---

### DAY 3-8: Accumulation Phase

Workers can complete multiple jobs during this 8-day window. Each job:

- ✅ Calculates earnings from service hourly rates
- ✅ Finds existing withdrawal for same payout date
- ✅ Adds amount and job details to it
- ✅ Updates onHold balance (keeps accumulating)
- ✅ Sends email notification about added payment

**Worker's Wallet During Accumulation:**

```
Day 1: balance: £100, onHold: £25, withdrawn: £0, available: £75
Day 2: balance: £100, onHold: £55, withdrawn: £0, available: £45
Day 4: balance: £100, onHold: £80, withdrawn: £0, available: £20
Day 7: balance: £100, onHold: £120, withdrawn: £0, available: -£20 (negative OK)
```

---

### DAY 9: Payment Approval (Admin Approves & Pays)

**Admin Dashboard - Payment Approvals:**

```
┌─ Upcoming Tab ─────────────────────┐
│ Worker: John Smith                 │
│ Total Payment: £120.00             │
│                                    │
│ Services Completed:                │
│ • House Cleaning: £25 (Day 1)     │
│ • Office Cleaning: £30 (Day 2)    │
│ • Window Cleaning: £25 (Day 3)    │
│ • Bedroom Clean: £20 (Day 5)      │
│ • Kitchen Deep Clean: £20 (Day 7) │
│                                    │
│ Bank: John Smith (****1234)        │
│                                    │
│ [✓ APPROVE & PAY]  [✗ REJECT]     │
└────────────────────────────────────┘
```

**Admin Clicks "APPROVE & PAY":**

```
┌─────────────────────────────────────┐
│ Backend Processing:                 │
│ 1. Withdrawal status → "completed"  │
│ 2. Generate transactionRef          │
│    TXN-1718627201234-abc123         │
│ 3. Deduct from onHold:              │
│    onHold: £120 → £0                │
│ 4. Add to withdrawn:                │
│    withdrawn: £0 → £120             │
│ 5. Update balance:                  │
│    balance = totalEarned - withdrawn│
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│ Worker Email Sent:                  │
│ "✅ Payment Transferred!"           │
│ Amount: £120.00                     │
│ Ref: TXN-1718627201234-abc123      │
│ Date: 10 Jun 2026                   │
│ "Funds appear in 1-2 days"          │
└─────────────────────────────────────┘

Payment Approvals Dashboard Updated:
Payment moves to "Completed" tab ✅
```

---

### DAY 10-11: Money in Bank

Worker receives payment in their bank account (1-2 working days processing).

**Worker App - Payments Tab:**

```
Received Payments:
├─ £120.00 - 10 Jun 2026
│  Ref: TXN-1718627201234-abc123
│  Status: ✅ Received
├─ £95.00 - 3 Jun 2026
│  Ref: TXN-1718453421234-def456
│  Status: ✅ Received
└─ £80.00 - 27 May 2026
   Ref: TXN-1718213801234-ghi789
   Status: ✅ Received
```

---

### DAY 9+ (NEXT CYCLE): New Jobs Start New 8-Day Cycle

If worker completes another job on Day 9:

```
Day 9: 10:30 AM - Worker completes "Bathroom Cleaning" (£18)
├─ New payout date: +8 days = Day 17
├─ Create NEW Withdrawal (different payout date)
├─ NEW onHold: £18
├─ Email: "✅ New payment scheduled for Day 17"
└─ THIS IS SEPARATE from the Day 9 approval payout
```

---

## Wallet State Examples

### Example 1: During Accumulation (Days 1-8)

```
Worker Total Earned: £100 (from multiple jobs over time)

Day 1 (After job 1):
- balance: £100
- onHold: £25 (scheduled for payment)
- withdrawn: £0
- available_to_use: £75

Day 3 (After job 2):
- balance: £100 (same, no new jobs completed yet)
- onHold: £55 (now includes 2 jobs)
- withdrawn: £0
- available_to_use: £45
```

### Example 2: After Payment Approved (Admin clicked Pay)

```
Day 9 (Admin approved £55 payment):
- balance: £100
- onHold: £0 (deducted!)
- withdrawn: £55 (added!)
- available_to_use: £45 (balance - withdrawn = 100 - 55)
```

### Example 3: Multiple 8-Day Cycles Running

```
Cycle 1 (Days 1-8): 3 jobs = £100, onHold
Cycle 2 (Days 9-16): 2 jobs = £75, onHold (separate)

Day 9:
- balance: £175 (total earned)
- onHold: £100 + £75 = £175 (Cycle 1 + Cycle 2)
- withdrawn: £0

Day 9 after Cycle 1 approval:
- balance: £175
- onHold: £75 (only Cycle 2)
- withdrawn: £100 (Cycle 1 paid!)

Day 16 after Cycle 2 approval:
- balance: £175
- onHold: £0
- withdrawn: £175 (both cycles paid!)
```

---

## Admin Rejection Flow

If admin clicks "REJECT" instead of "APPROVE":

```
Admin selects reason (optional): "Documentation incomplete"
Clicks [REJECT]
        ↓
┌─────────────────────────────────────┐
│ Backend Processing:                 │
│ 1. Status → "failed"                │
│ 2. Refund from onHold:              │
│    onHold: £120 → £0                │
│ 3. Balance recalculated:            │
│    balance = totalEarned - withdrawn│
│ 4. Money goes BACK to available     │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│ Worker Email:                       │
│ "⚠️ Payment Status Update"          │
│ Amount: £120 REJECTED               │
│ Reason: "Documentation incomplete"  │
│ "Please contact support"            │
└─────────────────────────────────────┘

Worker Wallet Updated:
- onHold: £120 → £0
- balance: £100 (unchanged)
- available: Now includes the rejected amount
```

---

## Backend Implementation Details

### 1. Job Completion (bookings.js)

```javascript
// When booking status = "Completed":
1. Calculate jobEarnings using Service.workerHourlyRate or workerPaymentRate
2. Set expectedPayoutDate = now + 8 days
3. Check for existing Withdrawal with same expectedPayoutDate
4. IF EXISTS:
   - Add job to completedJobs array
   - Add jobEarnings to amount
   - Save (update)
5. IF NOT EXISTS:
   - Create new Withdrawal
   - Set status = "upcoming"
   - Set payoutType = "fixed_8days"
6. Update worker.wallet.onHold += jobEarnings
```

### 2. Payment Approval (payments.js)

```javascript
// When admin clicks "APPROVE & PAY":
1. Find Withdrawal record
2. Set status = "completed"
3. Generate transactionRef = "TXN-{timestamp}-{workerID}"
4. Deduct from onHold:
   worker.wallet.onHold -= withdrawal.amount
5. Add to withdrawn:
   worker.wallet.withdrawn += withdrawal.amount
6. Recalculate balance:
   balance = totalEarned - withdrawn
7. Send email with amount, ref, completion date
8. Return success response
```

### 3. Payment Rejection (payments.js)

```javascript
// When admin clicks "REJECT":
1. Find Withdrawal record
2. Set status = "failed"
3. Refund from onHold:
   worker.wallet.onHold -= withdrawal.amount
4. Recalculate balance (money goes back to available)
5. Send rejection email with reason
```

---

## Key Database Structures

### Withdrawal Model

```javascript
{
  _id: ObjectId,
  workerId: ObjectId,
  workerName: String,
  workerEmail: String,
  workerPhone: String,
  amount: Number,              // Total for this payment
  status: "upcoming" | "approved" | "processing" | "completed" | "failed",
  payoutType: "fixed_8days",
  expectedPayoutDate: Date,    // When payment scheduled for
  completedJobs: [
    {
      bookingId: String,
      service: String,
      amount: Number,          // Earned for this specific job
      completedDate: Date
    }
  ],
  transactionRef: String,      // Generated when approved
  approvedBy: String,          // Admin ID
  approvedAt: Date,
  completedAt: Date,
  reason: String,              // For rejection
  bankDetails: { accountName, accountNumber, sortCode }
}
```

### Worker Wallet Model

```javascript
wallet: {
  totalEarned: Number,    // All completed jobs
  balance: Number,        // totalEarned - withdrawn
  onHold: Number,         // Scheduled for payment (8-day window)
  withdrawn: Number,      // Already paid out
  lastUpdated: Date
}
```

---

## Summary - The 8-Day Cycle

| Stage            | Timeline   | Action                   | Wallet Change          |
| ---------------- | ---------- | ------------------------ | ---------------------- |
| **Accumulation** | Days 1-8   | Worker completes jobs    | onHold increases       |
| **Approval**     | Day 8-9    | Admin approves payment   | onHold → withdrawn     |
| **Transfer**     | Day 9      | Payment sent to bank     | No change              |
| **Received**     | Days 10-11 | Money in worker's bank   | Complete ✅            |
| **Next Cycle**   | Day 9+     | New jobs start new cycle | New onHold accumulates |

---

## Testing Checklist

- [ ] Complete a job → Check Withdrawal created with date +8 days
- [ ] Complete another job same 8-day window → Check added to same Withdrawal
- [ ] Wait until payout date → Check status in Payment Approvals
- [ ] Admin clicks Approve → Check onHold deducted
- [ ] Worker receives email → Verify transaction ref included
- [ ] Check worker wallet → onHold should be £0, withdrawn increased
- [ ] Check balance calculation → Should update correctly
- [ ] Reject a payment → Check money refunded to onHold
- [ ] Check next cycle jobs → Should create NEW Withdrawal

---

**Status:** ✅ COMPLETE IMPLEMENTATION
**Payment System:** 8-Day Automatic Cycle
**Last Updated:** 10 June 2026
