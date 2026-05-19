import React, { useEffect, useState } from "react";

const StripeLazyLoader = ({
  amount,
  currency,
  customerInfo,
  onPaymentSuccess,
}) => {
  const [stripeInstance, setStripeInstance] = useState(null);
  const [ElementsComp, setElementsComp] = useState(null);
  const [StripePaymentComp, setStripePaymentComp] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [{ loadStripe }, reactStripe] = await Promise.all([
          import("@stripe/stripe-js"),
          import("@stripe/react-stripe-js"),
        ]);

        const stripe = await loadStripe(
          import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
        );
        const { default: StripePayment } =
          await import("../component/StripePayment");

        if (!mounted) return;
        setStripeInstance(stripe);
        setElementsComp(() => reactStripe.Elements);
        setStripePaymentComp(() => StripePayment);
      } catch (err) {
        // silent fail - fallback UI will show
        // eslint-disable-next-line no-console
        console.error("Failed to load Stripe libraries:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ElementsComp || !StripePaymentComp || !stripeInstance) {
    return (
      <div className="text-center py-6">
        <p className="font-medium">Loading payment widget…</p>
      </div>
    );
  }

  const Elements = ElementsComp;
  const StripePayment = StripePaymentComp;

  return (
    <Elements stripe={stripeInstance}>
      <StripePayment
        amount={amount}
        currency={currency}
        customerInfo={customerInfo}
        onPaymentSuccess={onPaymentSuccess}
      />
    </Elements>
  );
};

export default StripeLazyLoader;
