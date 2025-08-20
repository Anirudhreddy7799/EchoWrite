// src/pages/BuyMinutes.jsx
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function BuyMinutes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const purchase = async (minutes, priceId) => {
    setLoading(true);
    try {
      const stripe = await stripePromise;
      
      // 1) Create Checkout Session on your server
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          minutes,
          uid: user.uid       // pass the logged-in user's UID
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { sessionId } = await res.json();
      
      // 2) Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe error:', error);
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Buy More Minutes</h2>
        <p className="text-gray-600">Add more conversation time to your account</p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Starter Pack</h3>
          <p className="text-2xl font-bold text-indigo-600 mb-2">$2.00</p>
          <p className="text-gray-600 mb-4">60 minutes of conversation time</p>
          <button
            onClick={() => purchase(60, "price_1RpxtPGXWa8Lrlo1mWfba76y")}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Buy 60 Minutes'}
          </button>
        </div>

        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow border-indigo-200 bg-indigo-50">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">Pro Pack</h3>
            <span className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium">BEST VALUE</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600 mb-2">$5.00</p>
          <p className="text-gray-600 mb-4">200 minutes of conversation time</p>
          <button
            onClick={() => purchase(200, "price_1RpxtPGXWa8Lrlo1zrPABjMq")}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Buy 200 Minutes'}
          </button>
        </div>
      </div>

      <div className="text-center">
        <Link 
          to="/dashboard" 
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="text-xs text-gray-500">
        <p>• Secure payment processing by Stripe</p>
        <p>• Minutes added to your account immediately</p>
        <p>• No expiration date on purchased minutes</p>
      </div>
    </div>
  );
}
