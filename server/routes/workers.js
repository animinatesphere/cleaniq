const express = require("express");
const router = express.Router();
const Worker = require("../models/Worker");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const { moveToTrash } = require("../utils/trash");
const jwt = require("jsonwebtoken");
const { sendEmail, templates } = require("../utils/emailService");
const Customer = require("../models/Customer");
const { sendCustomerPush } = require("../utils/pushNotifications");

const notifyCustomer = async (booking, { title, body }) => {
  try {
    const customer = await Customer.findOne({ email: (booking.customer?.email || "").toLowerCase() });
    if (customer?.expoPushToken) await sendCustomerPush(customer.expoPushToken, { title, body, data: { bookingId: booking.bookingId } });
  } catch (err) { console.error("Customer push error:", err.message); }
};

const findBookingByIdOrBookingId = async (id) => {
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    return await Booking.findById(id);
  } else {
    return await Booking.findOne({ bookingId: id });
  }
};

// Mobile App Login Endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find worker by email
    const worker = await Worker.findOne({ email });
    if (!worker) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if access is granted and not suspended
    if (!worker.appAccessGranted || worker.status === "Suspended") {
      return res
        .status(403)
        .json({ error: "App access is denied or suspended." });
    }

    // Verify password (currently using tempPassword, in future hash check)
    // Note: If they set a permanent password later, you'd check that instead or alongside.
    if (worker.tempPassword !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Automatically activate the worker if they were Pending and successfully logged in
    if (worker.status === "Pending") {
      worker.status = "Active";
      await worker.save();
    }

    // Workers who already filled in their address/bank details before this
    // flag existed shouldn't be blocked by the "Complete Your Profile" gate.
    const hasCompletedProfileData = Boolean(
      worker.address && worker.postcode && worker.bankDetails?.accountNumber,
    );
    if (hasCompletedProfileData && !worker.profileCompleted) {
      worker.profileCompleted = true;
      await worker.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { workerId: worker._id, email: worker.email, region: worker.region },
      process.env.JWT_SECRET || "cleaniq_super_secret_mobile_key",
      { expiresIn: "30d" },
    );

    res.json({
      message: "Login successful",
      token,
      worker: {
        id: worker._id,
        workerId: worker.workerId,
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        phone: worker.phone,
        status: worker.status,
        region: worker.region,
        rating: worker.rating || 5.0,
        jobsCompleted: worker.jobsCompleted || 0,
        address: worker.address || "",
        postcode: worker.postcode || "",
        profileCompleted: worker.profileCompleted || false,
        bankDetails: worker.bankDetails || {},
        wallet: worker.wallet || {
          totalEarned: 0,
          balance: 0,
          onHold: 0,
          withdrawn: 0,
        },
      },
    });
  } catch (error) {
    console.error("Login error detailed:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// Save worker push token for notifications
router.post("/push-token", async (req, res) => {
  try {
    const { workerId, token } = req.body;
    if (!workerId || !token) return res.status(400).json({ error: "workerId and token required" });
    await Worker.findByIdAndUpdate(workerId, { expoPushToken: token });
    res.json({ message: "Push token saved." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate random password
const generateTempPassword = () => {
  return (
    Math.random().toString(36).slice(-8) +
    Math.floor(Math.random() * 10).toString()
  );
};

// GET available jobs — pass ?region=UK or ?region=NG to only see jobs in
// the worker's own area (defaults to all regions if omitted).
// "Confirmed"  = admin confirmed the booking / customer-app default
// "Authorized" = customer paid via Stripe authorize flow (web booking)
// "Accepted"   = booked via customer app / legacy flow
// "Pending"    = awaiting payment — NOT shown to workers
router.get("/jobs", async (req, res) => {
  try {
    const { region } = req.query;
    const filter = {
      status: { $in: ["Confirmed", "Authorized", "Accepted"] },
      $or: [{ assignedWorker: null }, { assignedWorker: { $exists: false } }],
    };
    if (region) filter.region = region;

    const jobs = await Booking.find(filter).sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal server error fetching jobs" });
  }
});

// GET jobs accepted by a specific worker
router.get("/jobs/my-jobs/:workerId", async (req, res) => {
  try {
    const wId = req.params.workerId;
    // Match by string OR ObjectId (so it works regardless of how the ID was stored)
    const jobs = await Booking.find({
      $or: [
        { assignedWorker: wId },
        { assignedWorkerName: { $exists: true }, assignedWorker: wId },
      ],
    }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching my jobs:", error);
    res.status(500).json({ error: "Internal server error fetching my jobs" });
  }
});

// GET a specific job detail
router.get("/jobs/:id", async (req, res) => {
  try {
    const job = await findBookingByIdOrBookingId(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    console.error("Error fetching job details:", error);
    res
      .status(500)
      .json({ error: "Internal server error fetching job details" });
  }
});

// POST accept a job
router.post("/jobs/:id/accept", async (req, res) => {
  try {
    const { workerId, workerName } = req.body;

    // Find the booking and make sure it is not already assigned
    const booking = await findBookingByIdOrBookingId(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.assignedWorker) {
      return res
        .status(400)
        .json({ error: "Job has already been accepted by someone else" });
    }

    // Update booking
    booking.assignedWorker = workerId;
    booking.assignedWorkerName = workerName;
    booking.status = "Assigned";
    booking.jobAcceptedTime = new Date();

    await booking.save();

    // Create notification
    await Notification.create({
      workerId: workerId,
      title: "Job Accepted",
      message: `You have successfully accepted the job for ${booking.customer?.firstName} (${booking.service}). Check your schedule.`,
      type: "success",
    });

    // Notify customer
    await notifyCustomer(booking, {
      title: "Cleaner Assigned!",
      body: `${workerName} has accepted your ${booking.service} booking. See you on ${new Date(booking.schedule?.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}.`,
    });

    // Send email log to Admin
    await sendEmail({
      to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
      subject: `Staff Accepted Job: ${booking.bookingId}`,
      html: templates.staffActionAlert(
        booking,
        "Job Accepted",
        `Staff member <strong>${workerName}</strong> has accepted this clean and committed to the schedule.`,
      ),
    });

    res.json({ message: "Job accepted successfully", booking });
  } catch (error) {
    console.error("Error accepting job:", error);
    res.status(500).json({ error: "Internal server error accepting job" });
  }
});

// PUT admin directly assigns a worker to a booking (rota/shift assignment) —
// distinct from a worker self-accepting from the open jobs feed.
router.put("/jobs/:id/assign", async (req, res) => {
  try {
    const { workerId, workerDuration, workerRate } = req.body;
    if (!workerId) return res.status(400).json({ error: "workerId is required" });

    const booking = await findBookingByIdOrBookingId(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: "Worker not found" });

    booking.assignedWorker = worker._id;
    booking.assignedWorkerName = `${worker.firstName} ${worker.lastName}`;
    if (workerDuration != null && workerDuration !== "") {
      booking.workerDuration = Number(workerDuration);
    }
    if (workerRate != null && workerRate !== "") {
      booking.workerRate = Number(workerRate);
    }
    if (booking.status === "Confirmed" || booking.status === "Pending") {
      booking.status = "Assigned";
    }
    booking.jobAcceptedTime = booking.jobAcceptedTime || new Date();
    await booking.save();

    await Notification.create({
      workerId: worker._id,
      title: "New Shift Assigned",
      message: `You've been scheduled for ${booking.service} on ${new Date(booking.schedule?.date).toLocaleDateString("en-GB")} (${booking.schedule?.timeSlot || ""}). Check your schedule.`,
      type: "info",
    });

    try {
      await sendEmail({
        to: worker.email,
        subject: `📅 New Shift Assigned — ${booking.bookingId}`,
        html: templates.staffShiftAssigned(booking, worker),
      });
    } catch (emailErr) {
      console.error("⚠️ Failed to send shift assignment email:", emailErr.message);
    }

    res.json({ message: "Worker assigned to shift", booking });
  } catch (error) {
    console.error("Error assigning worker to shift:", error);
    res.status(500).json({ error: "Internal server error assigning shift" });
  }
});

// POST cancel accepted job
router.post("/jobs/:id/cancel", async (req, res) => {
  try {
    const booking = await findBookingByIdOrBookingId(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const previousWorkerName = booking.assignedWorkerName || "Staff";

    // Revert status to Confirmed (so it becomes available on the job feed again)
    booking.assignedWorker = null;
    booking.assignedWorkerName = null;
    booking.status = "Confirmed";
    booking.jobAcceptedTime = null;
    booking.jobArrivedTime = null;
    booking.jobStartTime = null;
    booking.jobEndTime = null;
    booking.jobDurationActual = 0;

    await booking.save();

    // Send email log to Admin
    await sendEmail({
      to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
      subject: `Staff Cancelled Job: ${booking.bookingId} ❌`,
      html: templates.staffActionAlert(
        booking,
        "Job Cancelled",
        `Staff member <strong>${previousWorkerName}</strong> has CANCELLED their acceptance of this clean. The job is back on the feed and available for other staff.`,
      ),
    });

    res.json({ message: "Job acceptance cancelled successfully", booking });
  } catch (error) {
    console.error("Error cancelling job:", error);
    res.status(500).json({ error: "Internal server error cancelling job" });
  }
});

// POST reject a job proposal
router.post("/jobs/:id/reject", async (req, res) => {
  try {
    const { workerId } = req.body;
    const booking = await findBookingByIdOrBookingId(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Add workerId to rejectedBy array if not already present
    if (!booking.rejectedBy.includes(workerId)) {
      booking.rejectedBy.push(workerId);
      await booking.save();
    }

    res.json({ message: "Job rejected successfully", booking });
  } catch (error) {
    console.error("Error rejecting job:", error);
    res.status(500).json({ error: "Internal server error rejecting job" });
  }
});

// POST suggest another time
router.post("/jobs/:id/suggest-time", async (req, res) => {
  try {
    const { workerId, suggestedTime } = req.body;
    const booking = await findBookingByIdOrBookingId(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Find worker info
    const worker = await Worker.findById(workerId);
    const workerName = worker
      ? `${worker.firstName} ${worker.lastName}`
      : workerId;

    // Send email alert to admin
    await sendEmail({
      to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
      subject: `Staff Suggested Time: ${booking.bookingId}`,
      html: templates.staffActionAlert(
        booking,
        "Suggested New Time",
        `Staff member <strong>${workerName}</strong> has suggested an alternative time for this clean:<br/><br/><strong>"${suggestedTime}"</strong>`,
      ),
    });

    res.json({ message: "Time suggestion sent successfully" });
  } catch (error) {
    console.error("Error suggesting time:", error);
    res.status(500).json({ error: "Internal server error suggesting time" });
  }
});

// POST mark arrived at customer location
router.post("/jobs/:id/arrive", async (req, res) => {
  try {
    const booking = await findBookingByIdOrBookingId(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    booking.status = "Arrived";
    booking.jobArrivedTime = new Date();
    await booking.save();

    // Notify customer
    await notifyCustomer(booking, {
      title: "Your Cleaner Has Arrived!",
      body: `${booking.assignedWorkerName} is at your door. Open up and let the magic happen.`,
    });

    // Send email log to Admin
    await sendEmail({
      to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
      subject: `Staff Arrived: ${booking.bookingId}`,
      html: templates.staffActionAlert(
        booking,
        "Arrived at Property",
        `Staff member <strong>${booking.assignedWorkerName}</strong> has reached the customer's property.`,
      ),
    });

    res.json({ message: "Arrived at customer location", booking });
  } catch (error) {
    console.error("Error marking arrival:", error);
    res.status(500).json({ error: "Internal server error marking arrival" });
  }
});

// POST start clean (counting down duration)
router.post("/jobs/:id/start", async (req, res) => {
  try {
    const booking = await findBookingByIdOrBookingId(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    booking.status = "Cleaning";
    booking.jobStartTime = new Date();
    await booking.save();

    // Notify customer
    await notifyCustomer(booking, {
      title: "Cleaning Has Started!",
      body: `${booking.assignedWorkerName} has started your ${booking.service}. Sit back and relax.`,
    });

    // Send email log to Admin
    await sendEmail({
      to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
      subject: `Staff Started Cleaning: ${booking.bookingId}`,
      html: templates.staffActionAlert(
        booking,
        "Cleaning Started",
        `Staff member <strong>${booking.assignedWorkerName}</strong> has started active cleaning. The duration timer is counting.`,
      ),
    });

    res.json({ message: "Clean started successfully", booking });
  } catch (error) {
    console.error("Error starting job:", error);
    res.status(500).json({ error: "Internal server error starting job" });
  }
});

// POST complete clean (job done)
router.post("/jobs/:id/complete", async (req, res) => {
  try {
    const booking = await findBookingByIdOrBookingId(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    booking.status = "Completed";
    booking.jobEndTime = new Date();

    // Calculate total duration in minutes if startTime was recorded
    if (booking.jobStartTime) {
      const diffMs = booking.jobEndTime - booking.jobStartTime;
      booking.jobDurationActual = Math.round(diffMs / 1000 / 60); // minutes
    } else {
      // Fallback to booked duration in hours * 60
      const bookedHours = booking.details?.duration || 2;
      booking.jobDurationActual = bookedHours * 60;
    }

    await booking.save();

    // Update worker wallet and create Withdrawal
    if (booking.assignedWorker) {
      const Worker = require("../models/Worker");
      const Withdrawal = require("../models/Withdrawal");
      
      const workerEarnings =
        (booking.workerRate || 0) *
        (booking.details?.duration ||
          booking.workerDuration ||
          booking.duration ||
          0);

      if (workerEarnings > 0) {
        const worker = await Worker.findById(booking.assignedWorker);
        if (worker) {
          if (!worker.wallet) {
            worker.wallet = {
              totalEarned: 0,
              balance: 0,
              onHold: 0,
              withdrawn: 0,
            };
          }
          
          // Create an automatic 8-day payout withdrawal
          const expectedPayoutDate = new Date();
          expectedPayoutDate.setDate(expectedPayoutDate.getDate() + 8);
          expectedPayoutDate.setHours(0, 0, 0, 0);

          const jobRecord = {
            bookingId: booking.bookingId,
            service: booking.service,
            amount: workerEarnings,
            completedDate: booking.jobEndTime || new Date(),
          };

          const withdrawal = new Withdrawal({
            workerId: worker._id,
            workerName: `${worker.firstName} ${worker.lastName}`,
            workerEmail: worker.email,
            workerPhone: worker.phone,
            workerAddress: worker.address,
            workerPostcode: worker.postcode,
            amount: workerEarnings,
            completedJobs: [jobRecord],
            bankDetails: {
              accountName: worker.bankDetails?.accountName || "Pending Setup",
              accountNumber: worker.bankDetails?.accountNumber || "Pending Setup",
              sortCode: worker.bankDetails?.sortCode || "Pending Setup",
              bankName: worker.bankDetails?.bankName || "Pending Setup",
            },
            status: "pending",
            payoutType: "fixed_8days",
            expectedPayoutDate,
          });

          await withdrawal.save();
          console.log(`✅ Created withdrawal: £${workerEarnings.toFixed(2)} for ${booking.service} on ${expectedPayoutDate.toDateString()}`);

          // Add to onHold
          worker.wallet.onHold = (worker.wallet.onHold || 0) + workerEarnings;
          worker.wallet.lastUpdated = new Date();
          await worker.save();
          console.log(
            `💰 Job completed: Worker ${booking.assignedWorkerName} earned £${workerEarnings.toFixed(2)}`,
          );
        }
      }
    }

    // CAPTURE AUTHORIZED PAYMENT when the worker marks the job complete —
    // mirrors the same capture-on-complete logic in bookings.js PUT /:id,
    // since jobs are most commonly completed from the worker app, not the
    // admin dashboard.
    if (
      booking.payment?.stripePaymentIntentId &&
      booking.payment.status === "Authorized"
    ) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const capturedPayment = await stripe.paymentIntents.capture(
          booking.payment.stripePaymentIntentId,
        );
        booking.payment.status = "Completed";
        booking.payment.capturedAt = new Date();
        await booking.save();
        console.log(
          `💳 ✅ Payment captured for booking ${booking.bookingId} - Status: ${capturedPayment.status}`,
        );

        try {
          await sendEmail({
            to: booking.customer.email,
            subject: `✓ Payment Captured: Cleaniq Booking ${booking.bookingId}`,
            html: `
              <h2>Payment Captured</h2>
              <p>Hi ${booking.customer.firstName},</p>
              <p>Your cleaning service has been completed successfully!</p>
              <p><strong>Booking Reference:</strong> ${booking.bookingId}</p>
              <p><strong>Service:</strong> ${booking.service}</p>
              <p><strong>Amount Charged:</strong> ${booking.payment.currency === "GBP" ? "£" : "₦"}${booking.payment.amount}</p>
              <p>Your payment has been successfully processed. Thank you for choosing Cleaniq!</p>
            `,
          });
        } catch (emailErr) {
          console.error(
            "⚠️ Failed to send payment capture email:",
            emailErr,
          );
        }
      } catch (captureErr) {
        console.error(
          `❌ Failed to capture payment for booking ${booking.bookingId}:`,
          captureErr.message,
        );
      }
    }

    // Notify customer
    await notifyCustomer(booking, {
      title: "All Done — Spotless!",
      body: `Your ${booking.service} is complete. Check your inbox for the invoice. Thank you for choosing Cleaniq!`,
    });

    // Send email log to Admin
    await sendEmail({
      to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
      subject: `Staff Finished Clean: ${booking.bookingId} ✅`,
      html: templates.staffActionAlert(
        booking,
        "Cleaning Completed",
        `Staff member <strong>${booking.assignedWorkerName}</strong> has marked this clean as completed. Actual Duration: <strong>${booking.jobDurationActual} minutes</strong>.`,
      ),
    });

    res.json({ message: "Job completed successfully", booking });
  } catch (error) {
    console.error("Error completing job:", error);
    res.status(500).json({ error: "Internal server error completing job" });
  }
});

// GET all workers
router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new worker
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, region, role } = req.body;

    // Check if email exists
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res
        .status(400)
        .json({ error: "Staff member with this email already exists" });
    }

    const workerId = `WK-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempPassword = generateTempPassword();

    const worker = new Worker({
      workerId,
      firstName,
      lastName,
      email,
      phone,
      region,
      role: role || "Cleaner",
      status: "Pending",
      tempPassword,
      appAccessGranted: true,
      wallet: {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
        lastUpdated: new Date(),
      },
    });

    await worker.save();

    // Automatically send email invite to new Staff member with their credentials and the app download portal link
    try {
      console.log(`📧 Sending welcome invite email to new staff: ${email}...`);
      await sendEmail({
        to: email,
        subject: "Welcome to Cleaniq! Download Your Staff App 🧹📱",
        html: templates.staffAppInvite(worker),
      });
    } catch (inviteEmailErr) {
      console.error(
        "❌ Failed to send staff welcome invite email:",
        inviteEmailErr,
      );
    }

    res.status(201).json(worker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update worker status
router.put("/:id", async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(updatedWorker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a notification (must come before DELETE /:id)
router.delete("/notifications/:id", async (req, res) => {
  try {
    const Message = require("../models/Message");
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// GET notifications for a worker (messages from admin)
router.get("/:id/notifications", async (req, res) => {
  try {
    const Message = require("../models/Message");
    const notifications = await Message.find({ workerId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications || []);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET worker's schedule (assigned bookings)
router.get("/:id/schedule", async (req, res) => {
  try {
    const schedule = await Booking.find({
      assignedWorker: req.params.id,
    })
      .sort({ "schedule.date": 1 })
      .select(
        "bookingId service status schedule details customer payment assignedWorkerName",
      );

    res.json(schedule || []);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// GET conversations for worker (unique customer bookings for messaging)
router.get("/:id/conversations", async (req, res) => {
  try {
    const wId = req.params.id;
    // Match by string or ObjectId
    const workerBookings = await Booking.find({
      $or: [
        { assignedWorker: wId },
        {
          assignedWorkerName: { $exists: true, $ne: null },
          assignedWorker: wId,
        },
      ],
    }).select("bookingId customer service status createdAt");

    const conversations = workerBookings.map((booking) => ({
      _id: booking._id, // ← actual MongoDB _id for React key
      bookingId: booking.bookingId,
      customerId: booking.customer?._id || booking.customerId,
      customerName:
        `${booking.customer?.firstName || "Customer"} ${booking.customer?.lastName || ""}`.trim(),
      customerEmail: booking.customer?.email,
      service: booking.service,
      status: booking.status,
      lastMessage: `Booking: ${booking.service || "Cleaning"}`,
      lastMessageTime: booking.createdAt,
      unreadCount: 0,
    }));

    // Sort by most recent
    conversations.sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
    );

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// DELETE a worker (must come last to avoid route conflicts)
router.delete("/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    await moveToTrash(
      "Worker",
      worker,
      `${worker.firstName} ${worker.lastName} — ${worker.workerId}`,
    );
    await worker.deleteOne();
    res.json({ message: "Worker deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update worker profile (bank details, personal info)
router.put("/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      email,
      address,
      postcode,
      bankDetails,
    } = req.body;

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Update personal info
    if (firstName) worker.firstName = firstName;
    if (lastName) worker.lastName = lastName;
    if (phone) worker.phone = phone;
    if (email && email !== worker.email) {
      // Check if new email already exists
      const existingWorker = await Worker.findOne({
        email: email,
        _id: { $ne: id },
      });
      if (existingWorker) {
        return res.status(400).json({ error: "Email already in use" });
      }
      worker.email = email;
    }
    if (address) worker.address = address;
    if (postcode) worker.postcode = postcode;

    // Update bank details
    if (bankDetails) {
      worker.bankDetails = {
        ...worker.bankDetails,
        ...bankDetails,
      };
    }

    // Once the essentials are filled in, the mandatory "Complete Your
    // Profile" gate in the app no longer needs to show.
    if (
      worker.address &&
      worker.postcode &&
      worker.bankDetails?.accountNumber
    ) {
      worker.profileCompleted = true;
    }

    await worker.save();

    // Create notification
    await Notification.create({
      workerId: worker._id,
      title: "Profile Updated",
      message: "Your profile and bank details have been successfully updated.",
      type: "success",
    });

    res.json(worker);
  } catch (error) {
    console.error("Error updating worker profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/workers/active-locations — admin: all workers currently sharing location
router.get("/active-locations", async (req, res) => {
  try {
    const workers = await Worker.find({ "location.sharing": true })
      .select("firstName lastName workerId location assignedWorker")
      .lean();
    res.json(
      workers.map((w) => ({
        id: w._id,
        name: `${w.firstName} ${w.lastName}`,
        workerId: w.workerId,
        lat: w.location?.lat,
        lng: w.location?.lng,
        lastUpdated: w.location?.lastUpdated,
        activeBookingId: w.location?.activeBookingId,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update worker's current location - called repeatedly by the worker
// app while location sharing is switched on for an active job. Sharing is
// always an explicit, worker-initiated toggle (foreground only) - never
// silent background tracking.
router.put("/:id/location", async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, sharing, bookingId } = req.body;

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (sharing === false) {
      worker.location = {
        ...worker.location,
        sharing: false,
        activeBookingId: null,
      };
      await worker.save();
      return res.json({ message: "Location sharing turned off" });
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    worker.location = {
      lat,
      lng,
      lastUpdated: new Date(),
      sharing: true,
      activeBookingId: bookingId || worker.location?.activeBookingId || null,
    };
    await worker.save();

    res.json({ message: "Location updated", location: worker.location });
  } catch (error) {
    console.error("Error updating worker location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET a booking's assigned worker's current shared location - used by
// admin (and later the customer app) to show where the worker is.
router.get("/jobs/:id/worker-location", async (req, res) => {
  try {
    const booking = await findBookingByIdOrBookingId(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (!booking.assignedWorker) {
      return res.status(404).json({ error: "No worker assigned to this job" });
    }

    const worker = await Worker.findById(booking.assignedWorker);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (
      !worker.location?.sharing ||
      worker.location?.activeBookingId !== String(booking._id)
    ) {
      return res.json({ sharing: false });
    }

    res.json({
      sharing: true,
      lat: worker.location.lat,
      lng: worker.location.lng,
      lastUpdated: worker.location.lastUpdated,
      workerName: `${worker.firstName} ${worker.lastName}`,
    });
  } catch (error) {
    console.error("Error fetching worker location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update worker availability
router.put("/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (availability) {
      worker.availability = availability;
    }

    await worker.save();

    console.log(`✅ Updated availability for worker ${worker.workerId}`);
    res.json({
      message: "Availability updated successfully",
      availability: worker.availability,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res
      .status(500)
      .json({ error: "Internal server error updating availability" });
  }
});

// GET worker availability
router.get("/:id/availability", async (req, res) => {
  try {
    const workerId = req.params.id;
    console.log(`📅 Fetching availability for worker: ${workerId}`);

    const worker = await Worker.findById(workerId);

    if (!worker) {
      console.warn(`⚠️ Worker not found: ${workerId}`);
      // Return empty availability instead of 404
      return res.json({});
    }

    // Return availability as object, or empty object if not set
    const availability =
      worker.availability && typeof worker.availability === "object"
        ? worker.availability
        : {};

    res.json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    // Return empty object on error to prevent app crash
    res.json({});
  }
});

module.exports = router;
