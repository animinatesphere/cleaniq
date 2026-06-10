const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Worker = require("../models/Worker");
const Withdrawal = require("../models/Withdrawal");
const { sendEmail, templates } = require("../utils/emailService");

router.post("/create-intent", async (req, res) => {
  const { amount, currency, customerName, service, bookingId } = req.body;

  try {
    // Safety: Ensure we have a valid amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents/pence
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: Object.assign(
        {
          company: "Cleaniq Services",
          customer: customerName || "Unknown",
          service: service || "Cleaning Service",
        },
        bookingId ? { bookingId } : {},
      ),
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("❌ STRIPE ERROR:", error.message);

    // Better user-facing error messages
    let userMessage = "Could not initialize payment.";
    if (error.message.includes("currency")) {
      userMessage = `Payment failed: The currency ${currency.toUpperCase()} is not supported by your account.`;
    }

    res.status(500).json({ message: userMessage });
  }
});

// Create Stripe Checkout Session Link for Admin-Created Bookings
router.post("/create-checkout-session", async (req, res) => {
  const { bookingId, amount, currency, customerEmail, service, customerName } =
    req.body;

  try {
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Cleaniq - ${service || "Cleaning Service"}`,
              description: `Booking Reference: ${bookingId}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents/pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        company: "Cleaniq Services",
      },
      success_url: `${process.env.FRONTEND_URL || "https://cleaniqservices.com"}/account/bookings?payment=success&bookingId=${bookingId}`,
      cancel_url: `${process.env.FRONTEND_URL || "https://cleaniqservices.com"}/account/bookings?payment=cancelled`,
    });

    res.json({
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("❌ STRIPE CHECKOUT ERROR:", error.message);
    res.status(500).json({ message: "Failed to create payment link" });
  }
});

// ==================== WORKER WITHDRAWAL ENDPOINTS ====================

// GET worker wallet balance
router.get("/wallet/:workerId", async (req, res) => {
  try {
    const workerId = req.params.workerId;
    console.log(`💰 Fetching wallet for worker: ${workerId}`);

    let worker = await Worker.findById(workerId);
    if (!worker) {
      console.warn(`⚠️ Worker not found: ${workerId}`);
      return res.json({
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
      });
    }

    // Initialize wallet if it doesn't exist
    if (!worker.wallet) {
      worker.wallet = {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
        lastUpdated: new Date(),
      };
      await worker.save();
    }

    // ALWAYS recalculate totalEarned from completed bookings
    const Booking = require("../models/Booking");
    const completedBookings = await Booking.find({
      assignedWorker: workerId,
      status: "Completed",
    });

    let totalEarned = 0;
    if (completedBookings.length > 0) {
      totalEarned = completedBookings.reduce((sum, booking) => {
        const earnings =
          (booking.workerRate || 0) *
          (booking.details?.duration ||
            booking.workerDuration ||
            booking.duration ||
            0);
        return sum + earnings;
      }, 0);
      console.log(
        `✅ Found ${completedBookings.length} completed bookings, total earnings: £${totalEarned.toFixed(
          2,
        )}`,
      );
    }

    // Get onHold and withdrawn from wallet
    const onHold = worker.wallet.onHold || 0;
    const withdrawn = worker.wallet.withdrawn || 0;

    // Calculate available balance
    const balance = Math.max(0, totalEarned - onHold);

    console.log(
      `💼 Wallet Summary: totalEarned=£${totalEarned.toFixed(
        2,
      )}, onHold=£${onHold.toFixed(2)}, withdrawn=£${withdrawn.toFixed(
        2,
      )}, balance=£${balance.toFixed(2)}`,
    );

    res.json({
      totalEarned,
      balance,
      onHold,
      withdrawn,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("❌ Error fetching wallet:", error);
    res.json({
      totalEarned: 0,
      balance: 0,
      onHold: 0,
      withdrawn: 0,
    });
  }
});
// ===== NEW SCHEDULED PAYOUT SYSTEM =====

// GET upcoming payments for worker (earnings pending for next payout)
router.get("/upcoming-payments/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    console.log(`📊 Fetching upcoming payments for worker: ${workerId}`);

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Get earnings from completed jobs since last payout
    const Booking = require("../models/Booking");
    const completedBookings = await Booking.find({
      assignedWorker: workerId,
      status: "Completed",
    }).select("bookingId service workerRate details");

    let totalEarnings = 0;
    let jobsList = [];

    if (completedBookings.length > 0) {
      jobsList = completedBookings.map((booking) => {
        const earnings =
          (booking.workerRate || 0) *
          (booking.details?.duration || booking.workerDuration || 0);
        totalEarnings += earnings;
        return {
          bookingId: booking.bookingId,
          service: booking.service || "Cleaning Service",
          amount: earnings,
          completedDate: booking.updatedAt,
        };
      });
    }

    // Calculate next payout date (default weekly on Monday)
    const today = new Date();
    const payoutType = worker.payoutPreference || "weekly";
    let nextPayoutDate = new Date(today);

    if (payoutType === "weekly") {
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      nextPayoutDate.setDate(today.getDate() + daysUntilMonday);
    } else if (payoutType === "monthly") {
      nextPayoutDate.setMonth(today.getMonth() + 1);
      nextPayoutDate.setDate(1);
    }

    res.json({
      totalEarnings,
      jobsList,
      nextPayoutDate,
      payoutType,
      workerName: `${worker.firstName} ${worker.lastName}`,
    });
  } catch (error) {
    console.error("❌ Error fetching upcoming payments:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET withdrawal history (pending, approved, completed)
router.get("/withdrawal-history/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    console.log(`📋 Fetching withdrawal history for worker: ${workerId}`);

    const withdrawals = await Withdrawal.find({ workerId })
      .select(
        "-bankDetails.accountNumber -bankDetails.sortCode -transactionRef",
      )
      .sort({ createdAt: -1 });

    res.json(withdrawals || []);
  } catch (error) {
    console.error("❌ Error fetching withdrawal history:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET received payments (completed/paid out)
router.get("/received/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    console.log(`💰 Fetching received payments for worker: ${workerId}`);

    const received = await Withdrawal.find({
      workerId,
      status: "completed",
    })
      .select("-bankDetails")
      .sort({ completedAt: -1 });

    const totalReceived = received.reduce((sum, w) => sum + w.amount, 0);

    res.json({
      payments: received,
      totalReceived,
    });
  } catch (error) {
    console.error("❌ Error fetching received payments:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST create automatic withdrawal when job completed
router.post("/create-payout/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const { bookingId } = req.body;

    let worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Check if bank details exist
    if (
      !worker.bankDetails?.accountName ||
      !worker.bankDetails?.accountNumber
    ) {
      return res.status(400).json({
        error: "Bank details required for automatic payouts",
      });
    }

    // Initialize wallet if needed
    if (!worker.wallet) {
      worker.wallet = {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
      };
    }

    // Get all completed jobs and calculate earnings
    const Booking = require("../models/Booking");
    const completedBookings = await Booking.find({
      assignedWorker: workerId,
      status: "Completed",
    });

    let totalEarnings = 0;
    let jobsList = [];

    completedBookings.forEach((booking) => {
      const earnings =
        (booking.workerRate || 0) *
        (booking.details?.duration || booking.workerDuration || 0);
      totalEarnings += earnings;
      jobsList.push({
        bookingId: booking.bookingId,
        service: booking.service,
        amount: earnings,
        completedDate: booking.updatedAt,
      });
    });

    if (totalEarnings <= 0) {
      return res.status(400).json({ error: "No earnings to withdraw" });
    }

    // Calculate next payout date
    const payoutType = worker.payoutPreference || "weekly";
    let expectedPayoutDate = new Date();

    if (payoutType === "weekly") {
      const daysUntilMonday = (1 - expectedPayoutDate.getDay() + 7) % 7 || 7;
      expectedPayoutDate.setDate(
        expectedPayoutDate.getDate() + daysUntilMonday,
      );
    } else if (payoutType === "monthly") {
      expectedPayoutDate.setMonth(expectedPayoutDate.getMonth() + 1);
      expectedPayoutDate.setDate(1);
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      workerId,
      workerName: `${worker.firstName} ${worker.lastName}`,
      workerEmail: worker.email,
      workerPhone: worker.phone,
      workerAddress: worker.address,
      workerPostcode: worker.postcode,
      amount: totalEarnings,
      completedJobs: jobsList,
      bankDetails: {
        accountName: worker.bankDetails.accountName,
        accountNumber: worker.bankDetails.accountNumber,
        sortCode: worker.bankDetails.sortCode,
        bankName: worker.bankDetails.bankName,
      },
      status: "upcoming",
      payoutType,
      expectedPayoutDate,
    });

    await withdrawal.save();

    // Update wallet onHold
    worker.wallet.onHold += totalEarnings;
    worker.wallet.lastUpdated = new Date();
    await worker.save();

    console.log(
      `✅ Automatic payout created: £${totalEarnings.toFixed(2)} scheduled for ${payoutType}`,
    );

    // Send email to worker
    try {
      await sendEmail({
        to: worker.email,
        subject: "✅ Payment Scheduled - Cleaniq",
        html: `
          <h2>Payment Scheduled</h2>
          <p>Hi ${worker.firstName},</p>
          <p>Your completed cleaning work has been recorded and a payment of <strong>£${totalEarnings.toFixed(
            2,
          )}</strong> is scheduled.</p>
          <p><strong>Payout Schedule:</strong> ${payoutType}</p>
          <p><strong>Expected Payment Date:</strong> ${expectedPayoutDate.toLocaleDateString()}</p>
          <p>You'll receive another email confirmation when payment has been processed.</p>
          <p>Thank you for your hard work!</p>
        `,
      });
    } catch (emailErr) {
      console.error("⚠️ Failed to send email:", emailErr);
    }

    res.json({
      message: "Payout scheduled successfully",
      withdrawal,
    });
  } catch (error) {
    console.error("❌ Error creating payout:", error);
    res.status(500).json({ error: error.message });
  }
});
// DEBUG: Add test earnings to worker wallet
router.post("/wallet/:workerId/add-test-earnings", async (req, res) => {
  try {
    const workerId = req.params.workerId;
    const { amount = 100 } = req.body;

    console.log(
      `💰 [DEBUG] Adding £${amount} test earnings to worker: ${workerId}`,
    );

    let worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (!worker.wallet) {
      worker.wallet = {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
      };
    }

    worker.wallet.totalEarned += amount;
    worker.wallet.balance += amount;
    worker.wallet.lastUpdated = new Date();
    await worker.save();

    console.log(
      `✅ [DEBUG] Updated wallet. New balance: £${worker.wallet.balance}`,
    );
    res.json({
      message: "Test earnings added successfully",
      wallet: worker.wallet,
    });
  } catch (error) {
    console.error("❌ [DEBUG] Error adding test earnings:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET withdrawal history
router.get("/withdrawals/:workerId", async (req, res) => {
  try {
    const workerId = req.params.workerId;
    console.log(`📋 Fetching withdrawal history for worker: ${workerId}`);

    const withdrawals = await Withdrawal.find({ workerId: workerId })
      .sort({ createdAt: -1 })
      .select("-bankDetails.accountNumber"); // Don't expose full account numbers

    res.json(withdrawals || []);
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    // Return empty array instead of error
    res.json([]);
  }
});

// REQUEST withdrawal
router.post("/withdraw/:workerId", async (req, res) => {
  try {
    const { amount } = req.body;
    const workerId = req.params.workerId;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid withdrawal amount" });
    }

    const MIN_WITHDRAWAL = 20;
    const MAX_WITHDRAWAL = 1000;

    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is £${MIN_WITHDRAWAL}`,
      });
    }

    if (amount > MAX_WITHDRAWAL) {
      return res.status(400).json({
        error: `Maximum withdrawal amount is £${MAX_WITHDRAWAL}`,
      });
    }

    let worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (
      !worker.bankDetails?.accountName ||
      !worker.bankDetails?.accountNumber
    ) {
      return res.status(400).json({
        error: "Please add bank details before withdrawing",
      });
    }

    // Initialize wallet if it doesn't exist
    if (!worker.wallet) {
      worker.wallet = {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
        lastUpdated: new Date(),
      };
    }

    // RECALCULATE totalEarned from completed bookings (same as GET endpoint)
    const Booking = require("../models/Booking");
    const completedBookings = await Booking.find({
      assignedWorker: workerId,
      status: "Completed",
    });

    let totalEarned = 0;
    if (completedBookings.length > 0) {
      totalEarned = completedBookings.reduce((sum, booking) => {
        const earnings =
          (booking.workerRate || 0) *
          (booking.details?.duration ||
            booking.workerDuration ||
            booking.duration ||
            0);
        return sum + earnings;
      }, 0);
    }

    // Calculate available balance dynamically
    const onHold = worker.wallet.onHold || 0;
    const withdrawn = worker.wallet.withdrawn || 0;
    const availableBalance = Math.max(0, totalEarned - onHold);

    console.log(
      `💰 Withdrawal check: totalEarned=£${totalEarned.toFixed(
        2,
      )}, onHold=£${onHold.toFixed(2)}, withdrawn=£${withdrawn.toFixed(
        2,
      )}, available=£${availableBalance.toFixed(2)}, requested=£${amount}`,
    );

    if (availableBalance < amount) {
      return res.status(400).json({
        error: `Insufficient balance. Available: £${availableBalance.toFixed(
          2,
        )}`,
      });
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      workerId: workerId,
      workerName: `${worker.firstName} ${worker.lastName}`,
      workerEmail: worker.email,
      workerPhone: worker.phone,
      workerAddress: worker.address,
      workerPostcode: worker.postcode,
      amount: amount,
      bankDetails: {
        accountName: worker.bankDetails.accountName,
        accountNumber: worker.bankDetails.accountNumber,
        sortCode: worker.bankDetails.sortCode,
        bankName: worker.bankDetails.bankName,
      },
      status: "pending",
    });

    await withdrawal.save();

    // Update wallet: move from available balance to onHold
    worker.wallet.onHold += amount;
    worker.wallet.lastUpdated = new Date();
    await worker.save();

    console.log(
      `✅ Withdrawal request created: £${amount} moved to onHold. New balance: £${(
        totalEarned - worker.wallet.onHold
      ).toFixed(2)}`,
    );

    // Send confirmation email to worker
    try {
      await sendEmail({
        to: worker.email,
        subject: "Withdrawal Request Confirmed - Cleaniq Services",
        html: templates.withdrawalRequestWorker(worker, amount),
      });
      console.log(`✅ Confirmation email sent to worker: ${worker.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send worker email:", emailError);
    }

    // Send notification email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@cleaniqservices.com";
      await sendEmail({
        to: adminEmail,
        subject: `New Withdrawal Request - £${amount} from ${worker.firstName} ${worker.lastName}`,
        html: templates.withdrawalRequestAdmin(
          worker,
          amount,
          worker.bankDetails,
          withdrawal._id,
        ),
      });
      console.log(`✅ Admin notification email sent to: ${adminEmail}`);
    } catch (emailError) {
      console.error("❌ Failed to send admin email:", emailError);
    }

    console.log(
      `✅ Withdrawal request created: £${amount} for worker ${worker.workerId}`,
    );

    res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdrawal: withdrawal,
      newBalance: worker.wallet.balance,
    });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res.status(500).json({ error: "Failed to create withdrawal request" });
  }
});

// ADMIN: Get all pending withdrawals
router.get("/admin/withdrawals/pending", async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: "pending" }).sort({
      createdAt: 1,
    });

    res.json(withdrawals);
  } catch (error) {
    console.error("Error fetching pending withdrawals:", error);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

// ADMIN: Get all withdrawals (with all statuses)
router.get("/admin/withdrawals/all", async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({}).sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    console.error("Error fetching all withdrawals:", error);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

// ADMIN: Approve withdrawal
router.put("/admin/withdrawals/:withdrawalId/approve", async (req, res) => {
  try {
    const { adminId, action = "complete" } = req.body; // Default to complete for immediate payment
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    // Allow approval from upcoming or pending status
    const validStatuses = ["upcoming", "pending"];
    if (!validStatuses.includes(withdrawal.status)) {
      return res.status(400).json({
        error: `Cannot approve withdrawal with status: ${withdrawal.status}`,
      });
    }

    // Get worker to update wallet and send email
    const worker = await Worker.findById(withdrawal.workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Generate transaction reference
    const transactionRef = `TXN-${Date.now()}-${withdrawal.workerId.toString().slice(-6)}`;

    // Update withdrawal status and process payment
    withdrawal.status = "completed";
    withdrawal.completedAt = new Date();
    withdrawal.transactionRef = transactionRef;
    withdrawal.approvedBy = adminId;
    withdrawal.approvedAt = new Date();

    // Deduct from onHold, add to withdrawn
    if (!worker.wallet) {
      worker.wallet = {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
      };
    }

    // Ensure onHold is at least the withdrawal amount
    worker.wallet.onHold = Math.max(
      0,
      (worker.wallet.onHold || 0) - withdrawal.amount,
    );
    worker.wallet.withdrawn =
      (worker.wallet.withdrawn || 0) + withdrawal.amount;
    worker.wallet.balance =
      (worker.wallet.totalEarned || 0) - worker.wallet.withdrawn;
    worker.wallet.lastUpdated = new Date();

    console.log(
      `💳 Processing payment for ${worker.firstName}: £${withdrawal.amount.toFixed(2)}`,
    );
    console.log(
      `💰 Updated wallet - onHold: £${worker.wallet.onHold.toFixed(2)}, withdrawn: £${worker.wallet.withdrawn.toFixed(2)}, balance: £${worker.wallet.balance.toFixed(2)}`,
    );

    await withdrawal.save();
    await worker.save();

    // Send email with transaction reference
    try {
      await sendEmail({
        to: worker.email,
        subject: "✅ Payment Processed - Funds Transferred! Cleaniq Services",
        html: `
          <h2>Payment Successfully Transferred</h2>
          <p>Hi ${worker.firstName},</p>
          <p>Your payment has been successfully processed and transferred to your account.</p>
          <p><strong>Amount:</strong> £${withdrawal.amount.toFixed(2)}</p>
          <p><strong>Transaction Reference:</strong> ${transactionRef}</p>
          <p><strong>Transfer Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Expected in Bank:</strong> 1-2 working days</p>
          <p>Completed Services:</p>
          <ul>
            ${withdrawal.completedJobs
              .map(
                (job) =>
                  `<li>${job.service} - £${job.amount.toFixed(2)} (${new Date(job.completedDate).toLocaleDateString()})</li>`,
              )
              .join("")}
          </ul>
          <p>Thank you for your excellent work!</p>
        `,
      });
      console.log(`✅ Payment email sent to: ${worker.email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send payment email:", emailError);
    }

    console.log(
      `✅ Withdrawal completed: £${withdrawal.amount} for worker ${withdrawal.workerName}`,
    );

    res.json({
      message: "Payment processed and sent successfully",
      withdrawal,
      workerWallet: worker.wallet,
      transactionRef,
    });
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    res.status(500).json({ error: "Failed to approve withdrawal" });
  }
});

// ADMIN: Reject withdrawal
router.put("/admin/withdrawals/:withdrawalId/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    const validStatuses = ["upcoming", "pending", "approved"];
    if (!validStatuses.includes(withdrawal.status)) {
      return res.status(400).json({
        error: `Cannot reject withdrawal with status: ${withdrawal.status}`,
      });
    }

    // Refund to worker's balance
    const worker = await Worker.findById(withdrawal.workerId);
    if (worker) {
      worker.wallet.onHold -= withdrawal.amount;
      worker.wallet.balance =
        worker.wallet.totalEarned - worker.wallet.withdrawn;
      worker.wallet.lastUpdated = new Date();
      await worker.save();
    }

    withdrawal.status = "failed";
    withdrawal.reason = reason || "Rejected by admin";
    await withdrawal.save();

    // Send rejection email to worker
    if (worker) {
      try {
        await sendEmail({
          to: worker.email,
          subject: "⚠️ Payment Request Status Update - Cleaniq Services",
          html: `
            <h2>Payment Request Update</h2>
            <p>Hi ${worker.firstName},</p>
            <p>Your payment request of <strong>£${withdrawal.amount.toFixed(
              2,
            )}</strong> could not be processed at this time.</p>
            <p><strong>Reason:</strong> ${reason || "Rejected by admin"}</p>
            <p>Please contact support for more information or resubmit your request.</p>
          `,
        });
        console.log(`✅ Rejection email sent to: ${worker.email}`);
      } catch (emailError) {
        console.error("⚠️ Failed to send rejection email:", emailError);
      }
    }

    console.log(
      `❌ Withdrawal rejected: £${withdrawal.amount} for worker ${withdrawal.workerName}`,
    );

    res.json({
      message: "Withdrawal rejected and funds refunded to wallet",
      withdrawal,
      workerWallet: worker?.wallet,
    });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
});

module.exports = router;
