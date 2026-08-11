"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import CustomerMenu from "@/components/CustomerMenu";

export default function PaymentHistory() {
  const router = useRouter();

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
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
        id,
        amount,
        payment_status,
        payment_method,
        payment_reference,
        created_at,
        services (
          title,
          category
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("PAYMENT HISTORY ERROR:", error);
    } else {
      setPayments(data || []);
    }

    setLoading(false);
  }

  if (loading) {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-zinc-700 border-t-sky-500 animate-spin" />

        <h1 className="text-2xl font-black text-sky-400">
          ProxySocials
        </h1>

        <p className="mt-2 text-gray-400 font-medium">
          Preparing your payment history...
        </p>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-black text-white py-10 px-6">

      <CustomerMenu />

      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">

          <div>
            <h1 className="text-5xl font-black">
              Payment History
            </h1>

            <p className="text-gray-400 mt-2 font-semibold">
              View all your ProxySocials payments.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="bg-sky-600 hover:bg-sky-700 px-6 py-3 rounded-xl font-bold transition text-center"
          >
            ← Dashboard
          </Link>

        </div>

        {payments.length === 0 ? (

          <div className="bg-zinc-900 rounded-3xl p-10 text-center border border-zinc-800">

            <h2 className="text-3xl font-black">
              No Payments Yet
            </h2>

            <p className="text-gray-400 mt-3">
              Your payment history will appear here after you make a purchase.
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {payments.map((payment) => (

              <div
                key={payment.id}
                className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 md:p-8 shadow-lg"
              >

                <div className="flex flex-col md:flex-row justify-between gap-6">

                  <div>

                    <h2 className="text-2xl md:text-3xl font-black">
                      {payment.services?.title || "Service"}
                    </h2>

                    <p className="text-sky-400 font-bold mt-2">
                      {payment.services?.category || "Digital Service"}
                    </p>

                  </div>

                  <div className="md:text-right">

                    <p className="text-3xl font-black text-green-400">
                      ₦{Number(payment.amount).toLocaleString()}
                    </p>

                    <p className="text-gray-400 text-sm font-semibold mt-2">
                      {new Date(payment.created_at).toLocaleString()}
                    </p>

                  </div>

                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-7">

                  <div className="bg-black rounded-2xl p-5 border border-zinc-800">

                    <p className="text-gray-500 text-xs font-black uppercase">
                      Payment Status
                    </p>

                    <p className="text-green-400 text-lg font-black mt-2">
                        {payment.payment_status || "Unknown"}
                    </p>

                  </div>

                  <div className="bg-black rounded-2xl p-5 border border-zinc-800">

                    <p className="text-gray-500 text-xs font-black uppercase">
                      Payment Method
                    </p>

                    <p className="text-sky-400 text-lg font-black mt-2 capitalize">
                      {payment.payment_method || "Unknown"}
                    </p>

                  </div>

                  <div className="bg-black rounded-2xl p-5 border border-zinc-800">

                    <p className="text-gray-500 text-xs font-black uppercase">
                      Reference
                    </p>

                    <p className="text-white text-sm font-bold mt-2 break-all">
                      {payment.payment_reference || "Wallet payment"}
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </main>
  );
}