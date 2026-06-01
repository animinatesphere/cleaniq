const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

module.exports = router;
