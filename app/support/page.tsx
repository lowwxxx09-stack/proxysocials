"use client";

import CustomerMenu from "@/components/CustomerMenu";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">

      <CustomerMenu />

      <div className="max-w-4xl mx-auto">

        <h1 className="text-5xl font-black text-sky-400 mb-8">
          Contact Support
        </h1>

        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">

          <h2 className="text-2xl font-black mb-6">
            Need Help?
          </h2>

          <p className="text-gray-300 mb-6">
            Our support team is available to assist you with purchases,
            deliveries, payment issues and account-related questions.
          </p>

          <div className="space-y-5">

            <div className="bg-black rounded-2xl p-5 border border-zinc-800">

              <h3 className="font-black text-sky-400">
                WhatsApp
              </h3>

              <p className="mt-2">
                +234 816 125 0950
              </p>

            </div>

            <div className="bg-black rounded-2xl p-5 border border-zinc-800">

              <h3 className="font-black text-sky-400">
                Telegram
              </h3>

              <p className="mt-2">
                @proxy_socials
              </p>

            </div>

            <div className="bg-black rounded-2xl p-5 border border-zinc-800">

              <h3 className="font-black text-sky-400">
                Email
              </h3>

              <p className="mt-2">
                support@proxysocials.com
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}