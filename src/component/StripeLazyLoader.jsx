import React, { useEffect, useState } from "react";

let stripePromise = null;
let reactStripePromise = null;
let stripePaymentPromise = null;

export const preloadStripe = () => {
  if (!stripePromise) {
    stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
      loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    );
  }
  if (!reactStripePromise) {
    reactStripePromise = import("@stripe/react-stripe-js");
  }
  if (!stripePaymentPromise) {
    stripePaymentPromise = import("../component/StripePayment");
  }
};

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
        preloadStripe();

        const [stripe, reactStripe, paymentModule] = await Promise.all([
          stripePromise,
          reactStripePromise,
          stripePaymentPromise,
        ]);

        if (!mounted) return;
        setStripeInstance(stripe);
        setElementsComp(() => reactStripe.Elements);
        setStripePaymentComp(() => paymentModule.default);
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
        <p className="font-medium text-slate-500 text-sm">Loading payment widget…</p>
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
