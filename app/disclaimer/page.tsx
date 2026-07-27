"use client";

import CustomerMenu from "@/components/CustomerMenu";

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">

      <CustomerMenu />

      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl font-black text-sky-400 mb-8">
          Disclaimer
        </h1>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 space-y-6">

          <section>
            <h2 className="text-2xl font-black text-white mb-3">
              Digital Products
            </h2>

            <p className="text-gray-300">
              ProxySocials sells digital products and services. Once a product
              has been successfully delivered, it is considered received by the
              customer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-3">
              Refund Policy
            </h2>

            <p className="text-gray-300">
              Due to the nature of digital products, refunds are generally not
              available after successful delivery except where required by law
              or where ProxySocials determines that a genuine issue occurred.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-3">
              Customer Responsibility
            </h2>

            <p className="text-gray-300">
              Customers are responsible for providing accurate account
              information before making a purchase. ProxySocials is not liable
              for errors caused by incorrect information supplied by the
              customer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-3">
              Terms Updates
            </h2>

            <p className="text-gray-300">
              ProxySocials reserves the right to modify these terms and
              disclaimers at any time without prior notice.
            </p>
          </section>

        </div>

      </div>

    </main>
  );
}