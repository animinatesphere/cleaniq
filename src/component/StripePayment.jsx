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
          body: JSON.stringify({ 
            amount, 
            currency,
            customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
            service: customerInfo.serviceType
          }),
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
      <div className="p-8 rounded-[40px] bg-white border-4 border-primary/10 shadow-xl shadow-primary/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-primary-dark uppercase tracking-tight">Secure Payment</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by Stripe</p>
            </div>
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-5 bg-slate-100 rounded-md" />
            <div className="w-8 h-5 bg-slate-100 rounded-md" />
            <div className="w-8 h-5 bg-slate-100 rounded-md" />
          </div>
        </div>
        
        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus-within:border-primary/30 transition-all">
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
        className="w-full btn-primary py-6 text-xl shadow-2xl shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
      >
        {processing ? (
          <div className="flex items-center gap-3 justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying Card...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
           Confirm Payment
            <Zap size={20} className="fill-current group-hover:scale-125 transition-transform" />
          </div>
        )}
      </button>
      
      <div className="flex items-center justify-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
      </div>
    </div>
  );
};

export default StripePayment;
