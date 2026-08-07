"use client";

import { useState } from "react";

export default function FundWalletPage() {
  const [amount, setAmount] = useState("");
  function continueToPayment() {
  if (!amount || Number(amount) < 100) {
    alert("Minimum funding amount is ₦100.");
    return;
  }

  alert(`Funding ₦${Number(amount).toLocaleString()}`);
}
  return (
    <main className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-black text-sky-700 text-center">
          Fund Wallet
        </h1>

        <p className="text-gray-500 text-center mt-3">
          Add money to your ProxySocials wallet.
        </p>

        <div className="mt-8">

          <label className="block font-semibold text-gray-700 mb-2">
            Amount (₦)
          </label>

          <input
  type="number"
  placeholder="Enter amount"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-black placeholder:text-gray-400 focus:outline-none focus:border-sky-600"
/>

        </div>

        <button
  onClick={continueToPayment}
  className="mt-8 w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-2xl font-bold transition"
>
  Continue to Payment
</button>

      </div>
    </main>
  );
}