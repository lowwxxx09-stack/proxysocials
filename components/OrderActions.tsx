"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function OrderActions({
  id,
}: {
  id: string;
}) {
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
  setLoading(true);

  if (status === "completed") {
    const response = await fetch("/api/admin/approve-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: id,
      }),
    });

    const text = await response.text();
console.log("API Response:", text);

let data;

try {
  data = JSON.parse(text);
} catch {
  alert("API did not return valid JSON:\n\n" + text);
  setLoading(false);
  return;
}

    setLoading(false);

    alert(data.message);

    if (data.status) {
      window.location.reload();
    }

    return;
  }

  const { error } = await supabase
    .from("order")
    .update({
      order_status: "rejected",
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