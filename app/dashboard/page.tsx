"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

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
  .select("*")
  .eq("id", user.id)
  .single();

    if (error) {
  console.error(error);
  return;
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
  <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-5 py-12">

    <div className="max-w-6xl mx-auto">


      {/* Dashboard Header */}

      <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-8 flex flex-col md:flex-row justify-between gap-6">


        <div>

          <h1 className="text-4xl md:text-5xl font-black text-sky-700">
            Welcome, {profile?.full_name || "User"} 👋
          </h1>


          <p className="mt-3 text-gray-600 text-lg">
            Manage your orders, delivered products, and rewards.
          </p>


          <p className="mt-2 text-gray-500">
  WhatsApp: {profile?.phone}
</p>

<div className="mt-6">
  <Link
    href="/profile"
    className="inline-block bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-2xl font-bold transition"
  >
    👤 My Profile
  </Link>
</div>

</div>

<button
  onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold transition"
        >
          Logout
        </button>


      </div>



      {/* Stats Cards */}

      <div className="grid md:grid-cols-3 gap-6 mt-8">


        <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-6">

          <p className="text-gray-500 font-semibold">
            Total Orders
          </p>

          <h2 className="text-4xl font-black text-sky-700 mt-3">
            {orders.length}
          </h2>

        </div>



        <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-6">

          <p className="text-gray-500 font-semibold">
            Wallet Balance
          </p>

          <h2 className="text-4xl font-black text-sky-700 mt-3">
            ₦{profile?.wallet_balance || 0}
          </h2>

        </div>



        <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-6">

          <p className="text-gray-500 font-semibold">
            Referral Code
          </p>

          <h2 className="text-2xl font-black text-sky-700 mt-4 break-all">
            {profile?.referral_code || "None"}
          </h2>

        </div>


      </div>
      {/* Orders Section */}

      <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-8 mt-8">


        <div className="flex justify-between items-center mb-8">

          <h2 className="text-3xl font-black text-sky-700">
            My Orders
          </h2>


          <span className="text-gray-500 font-semibold">
            {orders.length} total
          </span>

        </div>



        {orders.length === 0 ? (

          <div className="bg-sky-50 rounded-2xl p-6 text-center">

            <p className="text-gray-600">
              You haven't placed any orders yet.
            </p>

          </div>


        ) : (


          <div className="space-y-6">


            {orders.map((order) => (


              <div
                key={order.id}
                className="border border-gray-200 rounded-3xl p-6 hover:shadow-md transition"
              >


                <div className="flex flex-col md:flex-row justify-between gap-4">


                  <div>


                    <h3 className="text-2xl font-black text-gray-900">
                      {order.services?.title}
                    </h3>


                    <p className="text-sky-600 font-semibold mt-1">
                      {order.services?.category}
                    </p>


                  </div>



                  <div className="md:text-right">


                    <p className="text-2xl font-black text-sky-700">
                      ₦{Number(order.amount).toLocaleString()}
                    </p>


                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>


                  </div>


                </div>




                <div className="grid md:grid-cols-2 gap-4 mt-6">


                  <div className="bg-sky-50 rounded-2xl p-4">

                    <p className="text-sm text-gray-500">
                      Payment Status
                    </p>

                    <p className="font-bold text-gray-900 mt-1">
                      {order.payment_status}
                    </p>

                  </div>



                  <div className="bg-sky-50 rounded-2xl p-4">

                    <p className="text-sm text-gray-500">
                      Order Status
                    </p>

                    <p className="font-bold text-gray-900 mt-1">
                      {order.order_status}
                    </p>

                  </div>


                </div>



                <div className="mt-5">


                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(order.id)
                    }
                    className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-xl font-bold transition"
                  >
                    Copy Order ID
                  </button>


                </div>
{/* Delivered Products */}

      {order.delivered_stock && (
        <div className="mt-8 border-t pt-6">


          <h4 className="text-xl font-black text-green-700 mb-5">
            🎉 Delivered Product
          </h4>



          <div className="space-y-4">

            {Object.entries(order.delivered_stock).map(
              ([key, value]) => (

                <div key={key}>


                  <p className="font-bold capitalize text-gray-700">
                    {key.replace(/_/g, " ")}
                  </p>


                  <div className="mt-2 flex justify-between items-center gap-3 border rounded-xl p-4">

                    <span className="break-all text-gray-800">
                      {String(value)}
                    </span>


                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(String(value))
                      }
                      className="text-sky-600 font-bold whitespace-nowrap"
                    >
                      Copy
                    </button>


                  </div>


                </div>

              )
            )}

          </div>


        </div>
      )}

              </div>

            ))}


          </div>


        )}

      </div>


      


      {/* Referral Section */}


      <div className="bg-sky-600 text-white rounded-3xl shadow-xl p-8 mt-8">


        <h2 className="text-3xl font-black">
          Grow & Earn 🚀
        </h2>


        <p className="mt-3 text-sky-100 text-lg">
          Share your referral code and earn rewards when people join ProxySocials.
        </p>



        <div className="mt-6 bg-white text-sky-700 rounded-2xl p-5">


          <p className="font-semibold">
            Your Referral Code
          </p>


          <p className="text-3xl font-black mt-2 break-all">
            {profile?.referral_code || "None"}
          </p>


        </div>



        <button
          className="mt-6 bg-white text-sky-700 px-6 py-3 rounded-xl font-bold hover:bg-sky-50 transition"
          onClick={() =>
            navigator.clipboard.writeText(profile?.referral_code)
          }
        >
          Copy Referral Code
        </button>


      </div>



    </div>


  </main>
);
}
