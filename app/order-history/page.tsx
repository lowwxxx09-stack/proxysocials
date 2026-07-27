"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function OrderHistory() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
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

    if (error) {
      console.error(error);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-2xl font-black text-white">
          Loading Orders...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-10 px-6">

      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-10">

          <div>
            <h1 className="text-5xl font-black">
              Order History
            </h1>

            <p className="text-gray-400 mt-2 font-semibold">
              View every purchase you've made on ProxySocials.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="bg-sky-600 hover:bg-sky-700 px-6 py-3 rounded-xl font-bold transition"
          >
            ← Dashboard
          </Link>

        </div>

        {orders.length === 0 ? (

          <div className="bg-zinc-900 rounded-3xl p-10 text-center border border-zinc-800">

            <h2 className="text-3xl font-black">
              No Orders Yet
            </h2>

            <p className="text-gray-400 mt-3">
              Once you purchase a service it will appear here.
            </p>

          </div>

        ) : (

          <div className="space-y-8">

            {orders.map((order) => (

              <div
                key={order.id}
                className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-lg"
              >

                <div className="flex flex-col md:flex-row justify-between gap-6">

                  <div>

                    <h2 className="text-3xl font-black">
                      {order.services?.title}
                    </h2>

                    <p className="text-sky-400 font-bold mt-2">
                      {order.services?.category}
                    </p>

                  </div>

                  <div className="text-left md:text-right">

                    <p className="text-3xl font-black text-green-400">
                      ₦{Number(order.amount).toLocaleString()}
                    </p>

                    <p className="text-gray-400 font-semibold mt-2">
                      {new Date(order.created_at).toLocaleString()}
                    </p>

                  </div>

                </div>

                <div className="grid md:grid-cols-2 gap-5 mt-8">

                  <div className="bg-black rounded-2xl p-5 border border-zinc-800">

                    <p className="text-gray-400 text-sm font-bold">
                      PAYMENT STATUS
                    </p>

                    <p className="text-green-400 text-xl font-black mt-2">
                      {order.payment_status}
                    </p>

                  </div>

                  <div className="bg-black rounded-2xl p-5 border border-zinc-800">

                    <p className="text-gray-400 text-sm font-bold">
                      ORDER STATUS
                    </p>

                    <p className="text-sky-400 text-xl font-black mt-2">
                     {order.order_status}
                    </p>

                  </div>

                </div>

                {order.delivered_stock && (

                  <div className="mt-10">

                    <h3 className="text-2xl font-black text-green-400 mb-6">
                      Delivered Product
                    </h3>

                    <div className="space-y-5">

                      {Object.entries(order.delivered_stock).map(
                        ([key, value]) => (

                          <div
                            key={key}
                            className="bg-black border border-zinc-800 rounded-2xl p-5 flex justify-between items-center gap-4"
                          >

                            <div>

                              <p className="uppercase text-xs font-black text-gray-500">
                                {key.replace(/_/g, " ")}
                              </p>

                              <p className="font-bold mt-2 break-all">
                                {String(value)}
                              </p>

                            </div>

                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(String(value))
                              }
                              className="bg-sky-600 hover:bg-sky-700 px-5 py-2 rounded-lg font-bold transition"
                            >
                              Copy
                            </button>

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

    </main>
  );
}   