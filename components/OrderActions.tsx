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

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

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