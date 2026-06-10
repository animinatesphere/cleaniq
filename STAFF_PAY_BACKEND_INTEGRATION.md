# Staff Pay Backend Integration - Verification ✅

## Complete Integration Checklist

### ✅ Database Layer (MongoDB)

**File:** `server/models/Service.js`

```javascript
// Hourly Services
workerHourlyRate: {
  type: Number,
  default: 0,
  description: "Amount paid to worker per hour for hourly services"
}

// Flat-Rate Services
workerPaymentRate: {
  type: Number,
  default: 0,
  description: "Fixed amount paid to worker per service completion"
}
```

Both fields stored in Service collection automatically.

---

### ✅ Backend API Endpoint

**File:** `server/routes/services.js`

```javascript
// PUT /services/:id
router.put('/:id', async (req, res) => {
  const { workerHourlyRate, workerPaymentRate, ... } = req.body;

  if (workerHourlyRate !== undefined)
    updateFields.workerHourlyRate = workerHourlyRate;

  if (workerPaymentRate !== undefined)
    updateFields.workerPaymentRate = workerPaymentRate;

  // Saves to database
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true }
  );
});
```

Endpoint accepts both hourly and flat-rate payments from frontend.

---

### ✅ Frontend - Staff Pay Page

**File:** `src/admin/StaffPay.jsx`

**Data Flow:**

1. Fetches all services: `GET /api/services` ✅
2. Displays hourly rates from backend ✅
3. User edits rates in UI ✅
4. Sends update: `PUT /api/services/:id` with `{ workerHourlyRate: value }` ✅
5. Updates local state with new value ✅

```javascript
await axios.put(`${API_URL}/services/${serviceId}`, {
  workerHourlyRate: newRate, // ← Sent to backend
});
```

---

### ✅ Payment Calculation Logic

**File:** `server/routes/bookings.js`

When booking marked "Completed":

```javascript
// 1. Fetch the service
const service = await Service.findOne({ name: booking.service });

// 2. Check service type
if (service?.type === "hourly") {
  // Hourly: Rate × Hours
  const duration = booking.details?.duration || 0;
  earnings = (service?.workerHourlyRate || 0) * duration;
} else {
  // Flat-rate: Fixed payment
  earnings = service?.workerPaymentRate || 0;
}

// 3. Create withdrawal with calculated amount
const withdrawal = new Withdrawal({
  workerId: worker._id,
  amount: totalEarnings, // ← Uses calculated earnings
  completedJobs: jobsList,
  status: "upcoming",
});
```

---

## Integration Flow Chart

```
┌─────────────────────────────────────┐
│  Admin Staff Pay Page                │
│  (src/admin/StaffPay.jsx)           │
│  - Fetches services                  │
│  - Displays hourly rates             │
│  - User edits rates                  │
└──────────────┬──────────────────────┘
               │
               │ PUT /services/:id
               │ { workerHourlyRate: 12.50 }
               ↓
┌──────────────────────────────────────┐
│  Backend API Route                   │
│  (server/routes/services.js)        │
│  - Receives hourly rate              │
│  - Updates service record            │
└──────────────┬──────────────────────┘
               │
               │ Save to DB
               ↓
┌──────────────────────────────────────┐
│  MongoDB Database                    │
│  (server/models/Service.js)         │
│  - Stores workerHourlyRate           │
│  - Stores workerPaymentRate          │
└──────────────┬──────────────────────┘
               │
               │ Query on booking completion
               ↓
┌──────────────────────────────────────┐
│  Booking Completion Logic             │
│  (server/routes/bookings.js)        │
│  - Fetches service rates             │
│  - Calculates earnings:              │
│    Hourly: rate × duration           │
│    Flat: fixed payment               │
│  - Creates withdrawal with amount    │
└──────────────┬──────────────────────┘
               │
               │ Withdrawal record
               ↓
┌──────────────────────────────────────┐
│  Admin Payment Approvals              │
│  - Reviews calculated amount         │
│  - Approves payment to worker        │
└──────────────────────────────────────┘
```

---

## Real-World Example

### Setup:

**Staff Pay Page** → Set House Cleaning hourly rate to £12.50/hr

### When Booking Completed:

```
Service: House Cleaning (type: "hourly")
Duration: 3 hours
Calculation: £12.50/hr × 3 hours = £37.50
```

### Payment Created:

```
Withdrawal {
  workerId: "worker123",
  amount: 37.50,  ← Calculated from service rate
  status: "upcoming",
  completedJobs: [{
    service: "House Cleaning",
    amount: 37.50,  ← From calculation
    completedDate: ...
  }]
}
```

### Admin Sees:

Payment Approvals Dashboard shows:

- Service: "House Cleaning"
- Amount: £37.50
- Click "Approve & Pay" → Payment sent

---

## Data Sync Points

| Component          | Action                    | Data Field                 | Backend Update           |
| ------------------ | ------------------------- | -------------------------- | ------------------------ |
| StaffPay UI        | User edits hourly rate    | `workerHourlyRate`         | ✅ PUT /services/:id     |
| Booking completion | System calculates pay     | `service.workerHourlyRate` | ✅ Queried from DB       |
| Payment creation   | System creates withdrawal | `amount`                   | ✅ Uses calculated value |
| Admin approval     | Admin reviews & approves  | `withdrawal.amount`        | ✅ Deducted from balance |

---

## Testing the Integration

### Step 1: Verify Database Field

```bash
# Connect to MongoDB and check:
db.services.findOne({ name: "House Cleaning" })
# Should show: { ..., workerHourlyRate: 12.50, ... }
```

### Step 2: Test Frontend Upload

1. Go to Admin → Staff Pay
2. Edit a service's hourly rate
3. Check MongoDB - should be updated ✅

### Step 3: Test Payment Calculation

1. Create booking for hourly service
2. Complete the booking
3. Check withdrawal created with correct amount:
   - Amount should = `workerHourlyRate × duration`
4. Verify in Admin → Payment Approvals ✅

### Step 4: Verify Backend Calculation

```javascript
// In console or logs:
console.log(service.workerHourlyRate); // 12.50
console.log(duration); // 3
console.log(earnings); // 37.50 ✓
```

---

## All Endpoints Connected

✅ `GET /api/services` - Fetch services with rates
✅ `PUT /api/services/:id` - Update hourly rates (backend linked)
✅ `POST /api/bookings` - Create bookings
✅ `PUT /api/bookings/:id` - Complete bookings (triggers payment calc)
✅ `POST /api/withdrawals` - Create payment record with amounts
✅ `PUT /api/withdrawals/:id/approve` - Process payment

---

## Summary

**✅ Fully Integrated**

- Backend model stores both hourly and flat rates
- Frontend Staff Pay page fetches and updates rates
- Backend endpoint accepts rate updates
- Booking completion logic reads rates from database
- Payment amounts calculated based on service type
- Admin dashboard shows correct calculated amounts

Everything is linked and ready to test! 🚀
