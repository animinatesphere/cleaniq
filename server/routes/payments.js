const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Worker = require("../models/Worker");
const Withdrawal = require("../models/Withdrawal");

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
    const worker = await Worker.findById(req.params.workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.json(
      worker.wallet || {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
      },
    );
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

// GET withdrawal history
router.get("/withdrawals/:workerId", async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ workerId: req.params.workerId })
      .sort({ createdAt: -1 })
      .select("-bankDetails.accountNumber"); // Don't expose full account numbers

    res.json(withdrawals);
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
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

    const worker = await Worker.findById(workerId);
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

    if (worker.wallet.balance < amount) {
      return res.status(400).json({
        error: `Insufficient balance. Available: £${worker.wallet.balance.toFixed(
          2,
        )}`,
      });
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      workerId: workerId,
      workerName: `${worker.firstName} ${worker.lastName}`,
      amount: amount,
      bankDetails: {
        accountName: worker.bankDetails.accountName,
        accountNumber: worker.bankDetails.accountNumber,
        sortCode: worker.bankDetails.sortCode,
      },
      status: "pending",
    });

    await withdrawal.save();

    // Deduct from balance, add to onHold
    worker.wallet.balance -= amount;
    worker.wallet.onHold += amount;
    worker.wallet.lastUpdated = new Date();
    await worker.save();

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

// ADMIN: Approve withdrawal
router.put("/admin/withdrawals/:withdrawalId/approve", async (req, res) => {
  try {
    const { adminId } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        error: `Cannot approve withdrawal with status: ${withdrawal.status}`,
      });
    }

    withdrawal.status = "approved";
    withdrawal.approvedBy = adminId;
    withdrawal.approvedAt = new Date();
    await withdrawal.save();

    console.log(
      `✅ Withdrawal approved: £${withdrawal.amount} for worker ${withdrawal.workerName}`,
    );

    res.json({ message: "Withdrawal approved", withdrawal });
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

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        error: `Cannot reject withdrawal with status: ${withdrawal.status}`,
      });
    }

    // Refund to worker's balance
    const worker = await Worker.findById(withdrawal.workerId);
    if (worker) {
      worker.wallet.balance += withdrawal.amount;
      worker.wallet.onHold -= withdrawal.amount;
      worker.wallet.lastUpdated = new Date();
      await worker.save();
    }

    withdrawal.status = "failed";
    withdrawal.reason = reason || "Rejected by admin";
    await withdrawal.save();

    console.log(
      `❌ Withdrawal rejected: £${withdrawal.amount} refunded to ${withdrawal.workerName}`,
    );

    res.json({ message: "Withdrawal rejected and refunded", withdrawal });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
});

module.exports = router;
