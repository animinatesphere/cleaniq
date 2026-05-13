const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-intent', async (req, res) => {
  const { amount, currency, customerName, service } = req.body;
  
  try {
    // Safety: Ensure we have a valid amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents/pence
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        company: 'CleanIQ Services',
        customer: customerName || 'Unknown',
        service: service || 'Cleaning Service'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('❌ STRIPE ERROR:', error.message);
    
    // Better user-facing error messages
    let userMessage = 'Could not initialize payment.';
    if (error.message.includes('currency')) {
      userMessage = `Payment failed: The currency ${currency.toUpperCase()} is not supported by your account.`;
    }

    res.status(500).json({ message: userMessage });
  }
});

module.exports = router;
