"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Dashboard() {
  const router = useRouter();
const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
   
    const supabase = createClient(); 
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(`
  *,
  services (
    title,
    category
  )
`)
      .eq("id", user.id)
      .single();

    if (error) {
      console.log(error.message);
    }

    setProfile(data);

const { data: orderData, error: orderError } = await supabase
  .from("order")
  .select(`
  *,
  services (
    title,
    category
  )
`)
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (orderError) {
  console.log(orderError.message);
} else {
  setOrders(orderData || []);
}

setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-sky-50 flex items-center justify-center">
        <p className="text-sky-700 font-bold text-xl">
          Loading Dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white p-8 rounded-2xl shadow-sm flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-extrabold text-sky-700">
              Welcome, {profile?.full_name || "User"} 👋
            </h1>

            <p className="mt-3 text-gray-600">
              Phone: {profile?.phone}
            </p>

            <p className="mt-2 text-gray-600">
              Manage your orders, account, and referral rewards from your dashboard.
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-600 transition"
          >
            Logout
          </button>

        </div>


        {/* Profile Information */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              Referral Code
            </h2>

            <p className="mt-3 text-gray-600 font-bold">
              {profile?.referral_code}
            </p>
          </div>


          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              Wallet Balance
            </h2>

            <p className="mt-3 text-gray-600 font-bold">
              ₦{profile?.wallet_balance}
            </p>
          </div>


          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              Account Settings
            </h2>

            <p className="mt-3 text-gray-600">
              Manage your profile information.
            </p>
          </div>

        </div>


        {/* Orders */}
        <div className="bg-white mt-8 p-8 rounded-2xl shadow-sm">

          <h2 className="text-2xl font-extrabold text-sky-700">
  My Orders
</h2>

{orders.length === 0 ? (
  <p className="mt-4 text-gray-600">
    You haven't placed any orders yet.
  </p>
) : (
  <div className="mt-6 space-y-5">
    {orders.map((order) => (
      <div
        key={order.id}
        className="border rounded-xl p-5"
      >
        <h3 className="text-xl font-bold text-sky-700">
  {order.services?.title}
</h3>

<p className="text-gray-600 mt-1">
  {order.services?.category}
</p>

<p className="mt-4">
  <span className="font-bold">Order ID:</span>{" "}
  {order.id}
</p>

        <p className="mt-2">
          <span className="font-bold">Amount:</span>{" "}
          ₦{Number(order.amount).toLocaleString()}
        </p>

        <p className="mt-2">
          <span className="font-bold">
            Payment Status:
          </span>{" "}
          {order.payment_status}
        </p>

        <p className="mt-2">
          <span className="font-bold">
            Order Status:
          </span>{" "}
          {order.order_status}
        </p>

        <p className="mt-2">
          <span className="font-bold">
            Payment Reference:
          </span>{" "}
          {order.payment_reference}
        </p>
{order.order_content && (
  <div className="mt-4 border-t pt-4">

    <p>
      <span className="font-bold">Quantity:</span>{" "}
      {order.order_content.quantity}
    </p>

    <p className="mt-2">
      <span className="font-bold">Account Link:</span>{" "}
      {order.order_content.accountLink}
    </p>

    <p className="mt-2">
      <span className="font-bold">Custom Details:</span>{" "}
      {order.order_content.customDetails}
    </p>

  </div>
)}
{order.delivered_stock && (
  <div className="mt-6 border-t pt-5">
    <h4 className="text-lg font-bold text-green-700 mb-4">
      🎉 Delivered Product
    </h4>

    {Object.entries(order.delivered_stock).map(([key, value]) => (
      <div
        key={key}
        className="mb-4"
      >
        <p className="font-semibold capitalize">
          {key.replace(/_/g, " ")}
        </p>

        <div className="flex justify-between items-center border rounded-lg p-3 mt-1">
          <span className="break-all">
            {String(value)}
          </span>

          <button
            onClick={() =>
              navigator.clipboard.writeText(String(value))
            }
            className="text-sky-600 font-semibold"
          >
            Copy
          </button>
        </div>
      </div>
    ))}
  </div>
)}
        <button
          onClick={() =>
            navigator.clipboard.writeText(order.id)
          }
          className="mt-4 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg"
        >
          Copy Order ID
        </button>
      </div>
    ))}
  </div>
)}

        </div>


        {/* Quick Action */}
        <div className="bg-sky-600 text-white mt-8 p-8 rounded-2xl">

          <h2 className="text-2xl font-extrabold">
            Ready to grow?
          </h2>

          <p className="mt-3">
            Share your referral code and start earning rewards.
          </p>

          <button className="mt-5 bg-white text-sky-700 px-6 py-3 rounded-xl font-bold">
            Share Referral Code
          </button>

        </div>


      </div>

    </main>
  );
}