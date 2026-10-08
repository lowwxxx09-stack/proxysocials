"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function OrderActions({
  id,
}: {
  id: string;
}) {
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "completed" | "rejected") {
    setLoading(true);

    const { error } = await supabase
      .from("order")
      .update({
        order_status: status,
      })
      .eq("id", id);

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    // Create notification when an order is rejected
    if (status === "rejected") {
      const { data: order, error: orderError } = await supabase
        .from("order")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();

      if (!orderError && order?.user_id) {
        const { error: notificationError } = await supabase.rpc(
          "create_notification",
          {
            p_user_id: order.user_id,
            p_type: "order_rejected",
            p_title: "Order rejected",
            p_message:
              "Your order has been rejected. Please check your order details or contact support.",
          }
        );

        if (notificationError) {
          console.error(
            "ORDER REJECTION NOTIFICATION ERROR:",
            notificationError
          );
        }
      }
    }

    setLoading(false);

    window.location.reload();
  }

  return (
    <div className="flex gap-3 mt-5">
      <button
        disabled={loading}
        onClick={() => updateStatus("completed")}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
      >
        {loading ? "Working..." : "✅ Approve"}
      </button>

      <button
        disabled={loading}
        onClick={() => updateStatus("rejected")}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
      >
        {loading ? "Working..." : "❌ Reject"}
      </button>
    </div>
  );
}