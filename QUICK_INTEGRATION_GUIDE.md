# 🔧 QUICK INTEGRATION SNIPPETS

## How to Integrate Validation into Bookings.jsx

### Step 1: Add Imports

```javascript
// At top of Bookings.jsx
import {
  canProceedToNextStep,
  getStepErrors,
} from "../utils/bookingValidation";
```

### Step 2: Add State

```javascript
const [formErrors, setFormErrors] = useState({});
const [fieldTouched, setFieldTouched] = useState({});
```

### Step 3: Add Validation Handler

```javascript
const validateStep = (step) => {
  const errors = getStepErrors(step, createData);
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};

const handleNextStep = () => {
  if (!validateStep(createStep)) {
    setStatusMessage({
      type: "error",
      text: "Please fix all errors before proceeding",
    });
    return;
  }
  setFormErrors({});
  setCreateStep(createStep + 1);
};

const handlePreviousStep = () => {
  setFormErrors({});
  setCreateStep(createStep - 1);
};

const handleCreateFinish = async () => {
  if (!validateStep(createStep)) {
    setStatusMessage({
      type: "error",
      text: "Please fix all errors before creating booking",
    });
    return;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createData),
    });

    if (!response.ok) throw new Error("Failed to create booking");

    const booking = await response.json();
    setSuccessBooking(booking);
    setShowSuccessModal(true);
    setShowCreateModal(false);
    fetchBookings();

    setStatusMessage({
      type: "success",
      text: "Booking created successfully! Two confirmation emails sent.",
    });
  } catch (error) {
    setStatusMessage({
      type: "error",
      text: `Error: ${error.message}`,
    });
  }
};
```

### Step 4: Create Error Display Component

```javascript
const FormError = ({ error, visible }) => {
  if (!visible || !error) return null;
  return (
    <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1">
      <span>⚠️</span> {error}
    </p>
  );
};
```

### Step 5: Update Form Inputs with Validation

```javascript
// Example for Step 1 Location input
<div className="space-y-1">
  <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
    Service Address <span className="text-rose-500">*</span>
  </label>
  <textarea
    value={createData.details?.address || ""}
    onChange={(e) => {
      setCreateData({
        ...createData,
        details: { ...createData.details, address: e.target.value },
      });
      setFieldTouched({ ...fieldTouched, "details.address": true });
    }}
    onBlur={() => setFieldTouched({ ...fieldTouched, "details.address": true })}
    className={`w-full p-4 rounded-2xl border-2 font-bold resize-none h-20 transition-all ${
      formErrors["details.address"] && fieldTouched["details.address"]
        ? "border-rose-300 bg-rose-50"
        : "border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10"
    }`}
    placeholder="Enter complete service address"
  />
  <FormError
    error={formErrors["details.address"]}
    visible={fieldTouched["details.address"]}
  />
</div>

// Required field indicator example
<div className="space-y-1">
  <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
    First Name <span className="text-rose-500 font-black">*</span>
  </label>
  <input
    type="text"
    required
    value={createData.customer?.firstName || ""}
    onChange={(e) => {
      setCreateData({
        ...createData,
        customer: { ...createData.customer, firstName: e.target.value },
      });
      setFieldTouched({ ...fieldTouched, "customer.firstName": true });
    }}
    className={`w-full p-4 rounded-2xl border-2 font-bold transition-all ${
      formErrors["customer.firstName"] && fieldTouched["customer.firstName"]
        ? "border-rose-300 bg-rose-50"
        : "border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
    }`}
    placeholder="John"
  />
  <FormError
    error={formErrors["customer.firstName"]}
    visible={fieldTouched["customer.firstName"]}
  />
</div>
```

### Step 6: Update Modal Buttons

```javascript
// Replace existing modal button logic with:
<div className="flex gap-4 shrink-0">
  {createStep > 1 && (
    <button
      onClick={handlePreviousStep}
      className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all"
    >
      ← Previous Step
    </button>
  )}

  {createStep < 4 ? (
    <button
      onClick={handleNextStep}
      className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
    >
      Next Step →
    </button>
  ) : (
    <button
      onClick={handleCreateFinish}
      className="flex-1 py-5 rounded-3xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
    >
      <CheckCircle2 size={18} /> Create Booking
    </button>
  )}
</div>
```

---

## How to Integrate Professional Calendar

### Step 1: Import Calendar

```javascript
import ProfessionalCalendar from "./ProfessionalCalendar";
```

### Step 2: Replace Step 4 Calendar Code

```javascript
{
  createStep === 4 && (
    <>
      {/* ... existing fields ... */}

      {/* REPLACE OLD CALENDAR WITH NEW ONE */}
      <ProfessionalCalendar
        bookings={bookings}
        onDateSelect={(date) => {
          setCreateData({
            ...createData,
            schedule: {
              ...createData.schedule,
              date: date.toISOString().split("T")[0],
            },
          });
          setFieldTouched({ ...fieldTouched, "schedule.date": true });
        }}
        selectedDate={
          createData.schedule?.date ? new Date(createData.schedule.date) : null
        }
        showTimeSlots={true}
        allowPastDates={false}
      />

      {/* Time Slot Selection (already in calendar, but manual option too) */}
      {createData.schedule?.date && (
        <div className="space-y-3">
          <label className="text-[9px] font-black text-slate-400 uppercase">
            Time Slot <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["Morning", "Afternoon", "Evening"].map((slot) => (
              <button
                key={slot}
                onClick={() => {
                  setCreateData({
                    ...createData,
                    schedule: {
                      ...createData.schedule,
                      timeSlot: slot,
                    },
                  });
                  setFieldTouched({
                    ...fieldTouched,
                    "schedule.timeSlot": true,
                  });
                }}
                className={`py-3 rounded-xl font-bold text-xs uppercase transition-all border-2 ${
                  createData.schedule?.timeSlot === slot
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-slate-200 hover:border-primary"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
          <FormError
            error={formErrors["schedule.timeSlot"]}
            visible={fieldTouched["schedule.timeSlot"]}
          />
        </div>
      )}

      {/* ... rest of step 4 fields ... */}
    </>
  );
}
```

---

## How to Add Bulk Delete Feature

### Step 1: Add Selection State

```javascript
const [selectedBookings, setSelectedBookings] = useState([]);

const toggleSelectBooking = (id) => {
  if (selectedBookings.includes(id)) {
    setSelectedBookings(selectedBookings.filter((bid) => bid !== id));
  } else {
    setSelectedBookings([...selectedBookings, id]);
  }
};

const selectAllBookings = () => {
  if (selectedBookings.length === filteredBookings.length) {
    setSelectedBookings([]);
  } else {
    setSelectedBookings(filteredBookings.map((b) => b._id));
  }
};
```

### Step 2: Add Checkboxes to Table

```javascript
// In table header:
<th className="px-4 py-5">
  <input
    type="checkbox"
    checked={selectedBookings.length === filteredBookings.length}
    onChange={selectAllBookings}
    className="w-4 h-4 cursor-pointer"
  />
</th>

// In table row:
<td className="px-4 py-6">
  <input
    type="checkbox"
    checked={selectedBookings.includes(b._id)}
    onChange={() => toggleSelectBooking(b._id)}
    className="w-4 h-4 cursor-pointer"
  />
</td>
```

### Step 3: Add Delete Selected Button

```javascript
// In header buttons section:
{
  selectedBookings.length > 0 && (
    <button
      onClick={() => {
        if (
          window.confirm(
            `Delete ${selectedBookings.length} booking(s)? This cannot be undone.`,
          )
        ) {
          handleBulkDelete();
        }
      }}
      className="p-4 px-6 rounded-2xl bg-rose-100 text-rose-600 hover:bg-rose-200 transition-all font-black text-[10px] uppercase tracking-widest border border-rose-200"
    >
      <Trash2 size={16} className="inline mr-2" />
      Delete {selectedBookings.length} Selected
    </button>
  );
}
```

### Step 4: Add Bulk Delete Handler

```javascript
const handleBulkDelete = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/bookings/delete-batch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedBookings }),
      },
    );

    if (!response.ok) throw new Error("Failed to delete bookings");

    const result = await response.json();
    setSelectedBookings([]);
    fetchBookings();
    setStatusMessage({
      type: "success",
      text: `${result.deletedCount} booking(s) deleted successfully`,
    });
  } catch (error) {
    setStatusMessage({
      type: "error",
      text: `Error: ${error.message}`,
    });
  }
};
```

### Step 5: Backend Endpoint

```javascript
// In server/routes/bookings.js
router.post("/delete-batch", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No booking IDs provided" });
    }

    // Validate all IDs are valid MongoDB ObjectIds
    const validIds = ids.filter((id) => {
      return /^[0-9a-fA-F]{24}$/.test(id);
    });

    if (validIds.length === 0) {
      return res.status(400).json({ message: "No valid booking IDs" });
    }

    const result = await Booking.deleteMany({
      _id: { $in: validIds },
    });

    res.json({
      message: `Successfully deleted ${result.deletedCount} bookings`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

---

## Email Testing

### Test Email 1

```javascript
// Manual test in browser console:
fetch("https://api.cleaniqservices.com/api/bookings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customer: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "07700900123",
    },
    service: "Residential Cleaning",
    details: {
      address: "123 Test Street, London, UK",
      frequency: "Once",
      duration: 2,
      extras: ["Windows", "Carpets"],
    },
    schedule: {
      date: "2026-06-10",
      timeSlot: "Morning",
      preferredTime: "ASAP",
    },
    payment: {
      amount: 150,
      currency: "GBP",
      status: "Completed",
    },
  }),
});
```

### Expected Emails

1. ✅ Email 1 received immediately
2. ✅ Email 2 received 2 seconds later
3. ✅ Both show booking details
4. ✅ All links clickable

---

## Common Issues & Solutions

### Issue: Validation not showing

**Solution:** Make sure `fieldTouched` is set to `true` before showing error

### Issue: Calendar not rendering dates

**Solution:** Check that `bookings` array is properly passed and formatted

### Issue: Email not sending

**Solution:** Verify `RESEND_API_KEY` in `.env` file

### Issue: Bulk delete fails

**Solution:** Check MongoDB ObjectId format in validation

---

## Performance Tips

1. **Memoize calendar rendering:**

   ```javascript
   const MemoizedCalendar = React.memo(ProfessionalCalendar);
   ```

2. **Debounce validation:**

   ```javascript
   const debouncedValidate = useCallback(
     debounce((step) => validateStep(step), 500),
     [],
   );
   ```

3. **Lazy load email templates:**
   - Import only when needed in modal
   - Don't render all 4 steps at once

---

**Ready to start implementation? Pick one phase and go for it! 🚀**
