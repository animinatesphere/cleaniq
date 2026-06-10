# 🧪 Payment System - Quick Testing Guide

## Pre-Testing Checklist

- [ ] Backend running on VPS (api.cleaniqservices.com)
- [ ] Worker app pointing to correct API_URL
- [ ] Admin dashboard accessible
- [ ] RESEND_API_KEY configured on backend (for emails)
- [ ] Database connected and initialized

---

## Test Scenario 1: Auto-Payout Creation

**Goal**: Verify that completing a job automatically creates a withdrawal record

### Steps:

1. **Admin Side**:
   - Login to admin dashboard
   - Go to Bookings → Find a pending booking
   - Mark job as "Completed"
   - Look at server logs - should see: `✅ Auto-payout scheduled: £X.XX`

2. **Database Check**:

   ```javascript
   // In MongoDB
   db.withdrawals.findOne({ status: "upcoming" });
   // Should show the newly created record
   ```

3. **Expected Result**:
   - ✓ Withdrawal record created with status "upcoming"
   - ✓ Amount = workerRate × duration
   - ✓ completedJobs array populated
   - ✓ expectedPayoutDate calculated
   - ✓ Worker onHold updated

4. **Worker Email**:
   - [ ] Check email received: "✅ Payment Scheduled"
   - [ ] Verify date and amount correct

---

## Test Scenario 2: Worker Checks Payments Tab

**Goal**: Verify worker app displays upcoming payments correctly

### Steps:

1. **Worker App**:
   - Login to worker account that completed the job
   - Tap "Payments" tab (bottom navigation)
   - Should see new "Payments" tab

2. **Upcoming Sub-tab**:
   - [ ] Click "Upcoming" sub-tab
   - [ ] See total earnings (should match payout amount)
   - [ ] See next payout date
   - [ ] See payment type (Weekly/Monthly)
   - [ ] See list of completed jobs with amounts

3. **Expected Data**:
   - ✓ Total earnings: £50.00
   - ✓ Next payment date: Next Monday/1st of month
   - ✓ Job list shows service name, amount, date
   - ✓ No loading spinners (data loaded quickly)

### API Call (if testing manually):

```bash
curl "https://api.cleaniqservices.com/api/payments/upcoming-payments/WORKER_ID"

# Expected response:
{
  "totalEarnings": 50.00,
  "jobsList": [
    {
      "bookingId": "booking123",
      "service": "Regular Cleaning",
      "amount": 50.00,
      "completedDate": "2024-06-20"
    }
  ],
  "nextPayoutDate": "2024-06-24",
  "payoutType": "weekly"
}
```

---

## Test Scenario 3: Admin Approves Payment

**Goal**: Verify admin can approve payouts and worker receives confirmation

### Steps:

1. **Admin Dashboard**:
   - Go to Admin → "Payment Approvals" (NEW menu item)
   - Should see "Upcoming" tab with pending payouts
   - Find the payout from Test Scenario 1

2. **Expand Details**:
   - Click "▶ Details" button
   - Verify all information:
     - [ ] Worker name correct
     - [ ] Amount matches (£50.00)
     - [ ] Bank details shown (masked)
     - [ ] Jobs listed with breakdown
     - [ ] Expected payout date visible

3. **Approve Payment**:
   - Click "✓ Approve & Pay" button
   - Should say "Processing..." briefly
   - Status should change to "completed"
   - Card should move to "Completed" tab
   - Button should show "✓ Paid on DATE"

4. **Database Check**:

   ```javascript
   db.withdrawals.findOne({ _id: ObjectId("...") });
   // Should show:
   // - status: "completed"
   // - completedAt: current date
   // - transactionRef: "TXN-xxxxx"
   ```

5. **Worker Email**:
   - [ ] Check email: "✅ Payment Processed - Funds Transferred!"
   - [ ] Verify transaction reference shown
   - [ ] Amount correct (£50.00)

---

## Test Scenario 4: Worker Checks Received Payments

**Goal**: Verify worker can see completed payments

### Steps:

1. **Worker App**:
   - Go to Payments tab → "Received" sub-tab
   - Should see the payment just approved

2. **Verify Information**:
   - [ ] Amount shows: £50.00
   - [ ] Date shows: Today's date
   - [ ] Transaction ref visible
   - [ ] "Transferred" badge shown in green
   - [ ] Total Received updated

### API Call (if testing manually):

```bash
curl "https://api.cleaniqservices.com/api/payments/received/WORKER_ID"

# Expected response:
{
  "payments": [
    {
      "_id": "withdrawal123",
      "amount": 50.00,
      "completedAt": "2024-06-20",
      "transactionRef": "TXN-1718884800-abc123"
    }
  ],
  "totalReceived": 50.00
}
```

---

## Test Scenario 5: Withdrawal History

**Goal**: Verify all payment statuses tracked correctly

### Steps:

1. **Worker App**:
   - Go to Payments tab → "Withdrawal" sub-tab
   - Should show all non-received payouts

2. **Status Indicators**:
   - [ ] Upcoming payouts: Blue badge "upcoming"
   - [ ] Pending payouts: Yellow badge "pending"
   - [ ] Approved payouts: Green badge "approved"
   - [ ] All show expected payout date

---

## Test Scenario 6: Bulk Approve (Admin)

**Goal**: Test admin can approve multiple payouts at once

### Steps:

1. **Complete 3 Jobs**:
   - Mark 3 different jobs as "Completed"
   - Each should create a withdrawal record

2. **Admin Dashboard**:
   - Go to /admin/payments
   - "Upcoming" tab should show 3 payouts
   - Check all 3 checkboxes
   - Should see: "3 selected"

3. **Bulk Approve**:
   - Click "Approve & Pay All" button
   - Alert: "✅ 3 payouts approved successfully!"
   - All 3 should move to "Completed" tab
   - All workers should receive emails

---

## Test Scenario 7: Rejection Workflow

**Goal**: Verify payment rejection and refund process

### Steps:

1. **Admin Dashboard**:
   - Go to /admin/payments → Upcoming tab
   - Find a payout to reject
   - Click expand → "✕ Reject" button

2. **Enter Reason**:
   - Prompt appears: "Enter reason for rejection"
   - Type: "Bank account verification needed"

3. **Check Results**:
   - Payout should move to "Completed" tab with "failed" status
   - Worker balance should be refunded (onHold decreased)
   - Email sent to worker explaining reason

4. **Worker Notification**:
   - [ ] Email received: "⚠️ Payment Request Status Update"
   - [ ] Reason displayed in email
   - [ ] Amount refunded

---

## Test Scenario 8: Balance Verification

**Goal**: Ensure balance calculations are correct

### Steps:

1. **Complete Jobs**:
   - Complete Job 1: £30 (rate: £15/hr, duration: 2 hrs)
   - Complete Job 2: £25 (rate: £25/hr, duration: 1 hr)
   - Total should be: £55

2. **Check Wallet**:

   ```bash
   curl "https://api.cleaniqservices.com/api/payments/wallet/WORKER_ID"
   ```

   Expected:

   ```json
   {
     "totalEarned": 55.0,
     "balance": 0.0, // All in onHold
     "onHold": 55.0, // Pending payout
     "withdrawn": 0.0
   }
   ```

3. **After Approval**:
   Expected:
   ```json
   {
     "totalEarned": 55.0,
     "balance": 0.0, // Still 0
     "onHold": 0.0, // Moved from onHold
     "withdrawn": 55.0 // Added here
   }
   ```

---

## Test Scenario 9: Payout Date Calculation

**Goal**: Verify payout dates calculated correctly for weekly/monthly

### Steps:

1. **Weekly Payout Test**:
   - Worker has "weekly" payout type
   - Complete job on Monday
   - Check expectedPayoutDate
   - Should be next Monday (7 days later)

2. **Monthly Payout Test**:
   - Change worker to "monthly" (in Worker profile)
   - Complete job on any day
   - Check expectedPayoutDate
   - Should be 1st of next month

---

## API Testing (cURL Examples)

### 1. Get Upcoming Payments:

```bash
curl -X GET "https://api.cleaniqservices.com/api/payments/upcoming-payments/WORKER_ID"
```

### 2. Get Withdrawal History:

```bash
curl -X GET "https://api.cleaniqservices.com/api/payments/withdrawal-history/WORKER_ID"
```

### 3. Get Received Payments:

```bash
curl -X GET "https://api.cleaniqservices.com/api/payments/received/WORKER_ID"
```

### 4. Approve Payout:

```bash
curl -X PUT "https://api.cleaniqservices.com/api/payments/admin/withdrawals/WITHDRAWAL_ID/approve" \
  -H "Content-Type: application/json" \
  -d '{"adminId": "ADMIN_ID", "action": "complete"}'
```

### 5. Reject Payout:

```bash
curl -X PUT "https://api.cleaniqservices.com/api/payments/admin/withdrawals/WITHDRAWAL_ID/reject" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Bank details need verification"}'
```

---

## Email Verification Checklist

- [ ] Welcome email when worker joins
- [ ] "Payment Scheduled" when job completed
- [ ] "Payment Processed" when approved
- [ ] "Payment Rejected" if rejected
- [ ] All emails contain:
  - [ ] Correct worker name
  - [ ] Correct amount
  - [ ] Correct date
  - [ ] Transaction reference (if applicable)
  - [ ] Cleaniq branding

---

## Database Queries for Testing

### Check all pending payouts:

```javascript
db.withdrawals.find({ status: { $in: ["upcoming", "pending"] } }).pretty();
```

### Check all completed payouts:

```javascript
db.withdrawals.find({ status: "completed" }).pretty();
```

### Check worker's total payouts:

```javascript
db.withdrawals.aggregate([
  { $match: { workerId: ObjectId("WORKER_ID") } },
  {
    $group: {
      _id: "$workerId",
      total: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
]);
```

### Check payout accuracy:

```javascript
// Get all withdrawals for a worker
db.withdrawals.findOne({ workerId: ObjectId("WORKER_ID") });

// Sum of all completed jobs
db.bookings.aggregate([
  { $match: { assignedWorker: ObjectId("WORKER_ID"), status: "Completed" } },
  {
    $group: {
      _id: "$assignedWorker",
      total: { $sum: { $multiply: ["$workerRate", "$duration"] } },
    },
  },
]);

// Should match!
```

---

## Common Issues & Solutions

### Issue: Payout not created

**Solution**:

- Check job status is exactly "Completed" (case-sensitive)
- Verify worker has bank details filled in
- Check server logs for errors
- Verify booking.assignedWorker field is populated

### Issue: Wrong amount calculated

**Solution**:

- Check workerRate field is populated
- Verify duration field correct
- Look for field name mismatches (duration vs workerDuration)

### Issue: Payout date wrong

**Solution**:

- Check timezone on server
- Verify payoutPreference in worker document
- Look for date calculation logic in payments.js

### Issue: Email not sent

**Solution**:

- Ensure RESEND_API_KEY set on VPS
- Check worker email in database is valid
- Look at server error logs for email service errors
- Test email service manually

### Issue: Admin approval not working

**Solution**:

- Ensure admin authenticated
- Check withdrawal status is "upcoming" or "pending"
- Verify amount in database is valid number
- Check onHold calculation before approval

---

## Performance Testing

### Load Test Scenario:

- Create 100 pending payouts
- Try bulk approve
- Monitor response time
- Should complete in < 5 seconds

### Data Validation:

- All amounts must be positive numbers
- All dates must be valid ISO strings
- All worker IDs must exist in Worker collection

---

## Sign-Off Checklist

- [ ] All scenarios 1-8 passed
- [ ] API endpoints responding correctly
- [ ] Emails sent and received
- [ ] Balance calculations accurate
- [ ] Database records created correctly
- [ ] Admin approval workflow complete
- [ ] Worker app displays payments correctly
- [ ] No console errors or warnings
- [ ] Bulk operations working
- [ ] Rejection workflow functional

---

## Next: Production Deployment

Once all tests pass:

1. Deploy code to VPS
2. Run smoke tests on production
3. Monitor first 24 hours for errors
4. Gather user feedback
5. Make adjustments if needed

---

**Status**: Ready for QA testing! 🚀
