import React, { useState, useEffect } from 'react';
import {
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Zap, AlertCircle, ShieldCheck } from 'lucide-react';

const StripePayment = ({ amount, currency, onPaymentSuccess, customerInfo }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  // Create PaymentIntent as soon as the component loads
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency }),
        });
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError('Could not initialize payment. Please try again.');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, currency]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          phone: customerInfo.phone,
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
        fontSize: '18px',
        color: '#1a1a1a',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': {
          color: '#94a3b8',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-[32px] border-2 border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="text-primary" size={20} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Card Entry</span>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <CardElement options={cardElementOptions} />
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
        className="btn-primary w-full py-6 text-xl shadow-2xl shadow-primary/30 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </div>
        ) : (
          <>
            Pay {currency === 'GBP' ? '£' : '₦'}{amount} & Confirm
            <Zap size={20} className="fill-current group-hover:scale-125 transition-transform" />
          </>
        )}
      </button>
      
      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Encrypted by 256-bit SSL Security
      </p>
    </div>
  );
};

export default StripePayment;
