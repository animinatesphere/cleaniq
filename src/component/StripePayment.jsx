import React, { useState, useEffect } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { Zap, AlertCircle, ShieldCheck } from "lucide-react";

const StripePayment = ({
  amount,
  currency,
  onPaymentSuccess,
  customerInfo,
  bookingId,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [billingPostcode, setBillingPostcode] = useState(
    customerInfo.postcode || "",
  );

  // Create PaymentIntent as soon as the component loads
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/payments/create-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount,
              currency,
              customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
              service: customerInfo.serviceType,
              bookingId: bookingId || undefined,
            }),
          },
        );
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Could not initialize payment. Please try again.");
        }
      } catch (err) {
        setError("Network error. Please check your connection.");
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, currency]);

  // Handle Payment Request (Apple Pay / Google Pay)
  useEffect(() => {
    if (stripe && amount > 0) {
      const pr = stripe.paymentRequest({
        country: currency.toUpperCase() === "GBP" ? "GB" : "NG",
        currency: currency.toLowerCase(),
        total: {
          label: `Cleaniq - ${customerInfo.serviceType}`,
          amount: Math.round(amount * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        }
      });

      pr.on("paymentmethod", async (ev) => {
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false },
        );

        if (confirmError) {
          ev.complete("fail");
          setError(`Payment failed: ${confirmError.message}`);
        } else {
          ev.complete("success");
          onPaymentSuccess(ev.paymentMethod);
        }
      });
    }
  }, [stripe, amount, clientSecret]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardNumberElement),
        billing_details: {
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: {
            postal_code: billingPostcode,
          },
        },
      },
    });

    if (payload.error) {
      setError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      onPaymentSuccess(payload.paymentIntent);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1a1a1a",
        fontFamily: "Inter, sans-serif",
        "::placeholder": {
          color: "#94a3b8",
        },
      },
      invalid: {
        color: "#ef4444",
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] bg-white border-2 sm:border-4 border-primary/10 shadow-xl shadow-primary/5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-primary-dark uppercase tracking-tight">
                Secure Payment
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Powered by Stripe
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {/* Visa */}
            <div className="px-2 py-1 bg-white border border-slate-200 rounded-md flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 48 16"
                width="36"
                height="12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <text
                  x="0"
                  y="13"
                  fontFamily="Arial"
                  fontWeight="900"
                  fontSize="14"
                  fill="#1A1F71"
                >
                  VISA
                </text>
              </svg>
            </div>
            {/* Mastercard */}
            <div className="px-1.5 py-1 bg-white border border-slate-200 rounded-md flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 38 24"
                width="28"
                height="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="14" cy="12" r="10" fill="#EB001B" />
                <circle cx="24" cy="12" r="10" fill="#F79E1B" />
                <path
                  d="M19 5.5a10 10 0 010 13A10 10 0 0119 5.5z"
                  fill="#FF5F00"
                />
              </svg>
            </div>
            {/* Verve */}
            <div className="px-2 py-1 bg-white border border-slate-200 rounded-md flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 52 18"
                width="36"
                height="12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <text
                  x="0"
                  y="13"
                  fontFamily="Arial"
                  fontWeight="900"
                  fontSize="13"
                  fill="#00425F"
                >
                  VERVE
                </text>
              </svg>
            </div>
          </div>
        </div>

        {canMakePayment && paymentRequest && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <PaymentRequestButtonElement options={{ paymentRequest }} />
            <div className="relative mt-8 mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-4">
                Or pay with card
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-primary/30 transition-all">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Card Number
            </label>
            <CardNumberElement options={cardElementOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-primary/30 transition-all">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Expiry Date
              </label>
              <CardExpiryElement options={cardElementOptions} />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-primary/30 transition-all">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                CVC
              </label>
              <CardCvcElement options={cardElementOptions} />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-primary/30 transition-all">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Billing Postcode
            </label>
            <input
              type="text"
              placeholder="e.g. M4 5JW"
              className="w-full bg-transparent border-none outline-none font-bold text-sm text-primary-dark placeholder:text-slate-300"
              value={billingPostcode}
              onChange={(e) => setBillingPostcode(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <button
        disabled={!stripe || processing || !clientSecret}
        onClick={handleSubmit}
        className="w-full btn-primary py-6 text-xl shadow-2xl shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
      >
        {processing ? (
          <div className="flex items-center gap-3 justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying Card...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            Confirm Booking
          </div>
        )}
      </button>

      <div className="flex items-center justify-center gap-3 py-2">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
          We accept
        </span>
        {/* Visa */}
        <div className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">
          <svg
            viewBox="0 0 48 16"
            width="32"
            height="11"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="0"
              y="13"
              fontFamily="Arial"
              fontWeight="900"
              fontSize="14"
              fill="#1A1F71"
            >
              VISA
            </text>
          </svg>
        </div>
        {/* Mastercard */}
        <div className="px-1.5 py-1 bg-white border border-slate-200 rounded shadow-sm">
          <svg
            viewBox="0 0 38 24"
            width="24"
            height="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="14" cy="12" r="10" fill="#EB001B" />
            <circle cx="24" cy="12" r="10" fill="#F79E1B" />
            <path d="M19 5.5a10 10 0 010 13A10 10 0 0119 5.5z" fill="#FF5F00" />
          </svg>
        </div>
        {/* Verve */}
        <div className="px-2 py-1 bg-white border border-slate-200 rounded shadow-sm">
          <svg
            viewBox="0 0 52 18"
            width="32"
            height="11"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="0"
              y="13"
              fontFamily="Arial"
              fontWeight="900"
              fontSize="13"
              fill="#00425F"
            >
              VERVE
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StripePayment;
