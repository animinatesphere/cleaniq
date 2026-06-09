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
      console.log(`📊 Initializing wallet for worker: ${workerId}`);
      worker.wallet = {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
        lastUpdated: new Date(),
      };
      await worker.save();
      console.log(`✅ Wallet initialized for worker: ${workerId}`);
    }

    // Ensure balance is always: totalEarned - (onHold + withdrawn)
    // This way if totalEarned increases, balance automatically increases
    const onHold = worker.wallet.onHold || 0;
    const withdrawn = worker.wallet.withdrawn || 0;
    const totalEarned = worker.wallet.totalEarned || 0;
    const calculatedBalance = totalEarned - onHold - withdrawn;

    // If balance is incorrect, fix it
    if (worker.wallet.balance !== calculatedBalance) {
      console.log(
        `🔄 Correcting balance: was £${worker.wallet.balance}, now £${calculatedBalance} (totalEarned: £${totalEarned}, onHold: £${onHold}, withdrawn: £${withdrawn})`,
      );
      worker.wallet.balance = Math.max(0, calculatedBalance); // Never negative
      worker.wallet.lastUpdated = new Date();
      await worker.save();
    }

    console.log(`💼 Returning wallet:`, worker.wallet);
    res.json(worker.wallet);
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

    // Deduct from balance, add to onHold
    worker.wallet.balance -= amount;
    worker.wallet.onHold += amount;
    worker.wallet.lastUpdated = new Date();
    await worker.save();

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

    // Get worker to update wallet and send email
    const worker = await Worker.findById(withdrawal.workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Update withdrawal status
    withdrawal.status = "approved";
    withdrawal.approvedBy = adminId;
    withdrawal.approvedAt = new Date();
    await withdrawal.save();

    // Update worker wallet: deduct from onHold, add to withdrawn
    worker.wallet.onHold -= withdrawal.amount;
    worker.wallet.withdrawn += withdrawal.amount;
    worker.wallet.lastUpdated = new Date();
    await worker.save();

    // Send approval email to worker
    try {
      await sendEmail({
        to: worker.email,
        subject: "Withdrawal Approved - Funds on the Way! 🎉 Cleaniq Services",
        html: templates.withdrawalApprovedWorker(
          worker,
          withdrawal.amount,
          withdrawal._id,
        ),
      });
      console.log(`✅ Approval email sent to worker: ${worker.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send approval email:", emailError);
    }

    console.log(
      `✅ Withdrawal approved: £${withdrawal.amount} for worker ${withdrawal.workerName}`,
    );

    res.json({
      message: "Withdrawal approved and funds deducted from wallet",
      withdrawal,
      workerWallet: worker.wallet,
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

    // Send rejection email to worker
    if (worker) {
      try {
        await sendEmail({
          to: worker.email,
          subject: "Withdrawal Request Declined - Cleaniq Services",
          html: templates.withdrawalRejectedWorker(
            worker,
            withdrawal.amount,
            reason || "Your withdrawal request does not meet our criteria.",
          ),
        });
        console.log(`✅ Rejection email sent to worker: ${worker.email}`);
      } catch (emailError) {
        console.error("❌ Failed to send rejection email:", emailError);
      }
    }

    console.log(
      `❌ Withdrawal rejected: £${withdrawal.amount} refunded to ${withdrawal.workerName}`,
    );

    res.json({
      message: "Withdrawal rejected and refunded",
      withdrawal,
      workerWallet: worker?.wallet,
    });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
});

module.exports = router;
