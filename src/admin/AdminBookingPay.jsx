import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePayment from "../component/StripePayment";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const AdminBookingPay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`);
        const data = await res.json();
        const b = data.find((x) => x._id === id);
        if (b) setBooking(b);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Update booking to completed and store transactionId
      const payload = {
        status: "Completed",
        payment: {
          ...booking.payment,
          transactionId: paymentIntent.id,
          status: "Paid",
        },
      };
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${booking._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error("Failed to update booking");
      navigate("/admin/bookings");
    } catch (err) {
      console.error(err);
      alert("Payment succeeded but failed to update booking.");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-sm font-medium text-slate-400">Loading…</div>
    );
  if (!booking)
    return (
      <div className="p-8 text-sm font-medium text-slate-400">
        Booking not found.
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Collect Payment
        </h2>
        <p className="text-sm text-slate-400 font-medium mt-1">
          Booking ref {booking.bookingId}
        </p>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
        <p className="text-sm font-semibold text-slate-700">
          {booking.customer.firstName} {booking.customer.lastName}
        </p>
        <p className="text-sm text-slate-400 font-medium">
          {booking.customer.email}
        </p>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
        <Elements stripe={stripePromise}>
          <StripePayment
            amount={booking.payment?.amount || 0}
            currency={booking.payment?.currency || "GBP"}
            customerInfo={{
              firstName: booking.customer.firstName,
              lastName: booking.customer.lastName,
              email: booking.customer.email,
              phone: booking.customer.phone,
              serviceType: booking.service,
            }}
            bookingId={booking._id}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </Elements>
      </div>
    </div>
  );
};

export default AdminBookingPay;
