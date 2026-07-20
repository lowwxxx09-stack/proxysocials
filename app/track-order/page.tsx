"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function trackOrder() {
    setError("");
    setOrder(null);

    if (!orderId) {
      setError("Please enter your Order ID.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("order")
      .select(
        `
        *,
        services (
          title,
          category
        )
        `
      )
      .eq("id", orderId)
      .single();

    setLoading(false);

    if (error || !data) {
      setError("Order not found. Check your Order ID and try again.");
      return;
    }

    setOrder(data);
  }

  return (
    <main className="min-h-screen bg-sky-50 px-6 py-10">

      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-extrabold text-sky-700">
          Track Your Order
        </h1>

        <p className="text-gray-600 mt-2">
          Enter your order ID to check your progress.
        </p>


        {error && (
          <div className="mt-5 bg-red-100 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}


        <div className="mt-6 space-y-4">

          <input
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full border rounded-xl p-3"
          />


          <button
            onClick={trackOrder}
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-bold"
          >
            {loading ? "Checking..." : "Track Order"}
          </button>

        </div>


        {order && (
          <div className="mt-8 bg-sky-50 rounded-xl p-5">

            <h2 className="text-xl font-bold text-sky-700">
              {order.services?.title}
            </h2>

            <p className="mt-3">
              <strong>Status:</strong>{" "}
              {order.order_status}
            </p>

            <p>
              <strong>Amount:</strong>{" "}
              ₦{order.amount}
            </p>

            <p>
              <strong>Note:</strong>{" "}
              {order.note || "No note"}
            </p>

          </div>
        )}

      </div>

    </main>
  );
}