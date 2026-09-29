"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type VirtualAccount = {
  id: string;
  user_id: string;
  account_number: string;
  account_name: string | null;
  bank_name: string | null;
  bank_code: string | null;
  alias: string;
  account_reference: string | null;
  status: string;
};

export default function FundWalletPage() {
  const supabase = createClient();

  const [amount, setAmount] = useState("");
  const [virtualAccount, setVirtualAccount] =
    useState<VirtualAccount | null>(null);

  const [loadingAccount, setLoadingAccount] =
    useState(true);

  const [accountError, setAccountError] =
    useState("");

  const [copied, setCopied] = useState(false);

  async function loadVirtualAccount() {
    try {
      setLoadingAccount(true);
      setAccountError("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.access_token) {
        throw new Error("Please login again.");
      }

      const response = await fetch(
        "/api/transactpay/virtual-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(
          data.message ||
            "Unable to load your dedicated bank account."
        );
      }

      setVirtualAccount(data.data);
    } catch (error: any) {
      console.error(
        "VIRTUAL ACCOUNT LOAD ERROR:",
        error
      );

      setAccountError(
        error?.message ||
          "Unable to load your dedicated bank account."
      );
    } finally {
      setLoadingAccount(false);
    }
  }

  useEffect(() => {
    loadVirtualAccount();
  }, []);

  async function copyAccountNumber() {
    if (!virtualAccount?.account_number) return;

    try {
      await navigator.clipboard.writeText(
        virtualAccount.account_number
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert("Unable to copy account number.");
    }
  }

  async function continueToPayment() {
    if (!amount || Number(amount) < 100) {
      alert("Minimum funding amount is ₦100.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login again.");
      return;
    }

    if (!user.email) {
      alert(
        "Your account does not have an email address."
      );
      return;
    }

    const response = await fetch(
      "/api/flutterwave/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: Number(amount),
          userId: user.id,
        }),
      }
    );

    const data = await response.json();

    if (!data.status) {
      alert(
        data.message ||
          "Unable to initialize payment."
      );
      return;
    }

    window.location.href = data.data.link;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-lg">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Fund Wallet
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add money to your ProxySocials wallet.
          </p>
        </div>

        {/* =========================
            BANK TRANSFER
        ========================== */}
        <section className="overflow-hidden rounded-[26px] bg-slate-950 shadow-xl">
          <div className="p-5 sm:p-6">

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-xl">
                🏦
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-sky-300">
                  Bank Transfer
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Your Dedicated Account
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Transfer money to this account anytime.
                  Your wallet will be credited automatically
                  after the payment is received.
                </p>
              </div>
            </div>

            {loadingAccount ? (
              <div className="mt-5 rounded-2xl bg-white/[0.07] p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="h-7 w-40 rounded bg-white/10" />
                  <div className="h-3 w-32 rounded bg-white/10" />
                </div>
              </div>
            ) : accountError ? (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                <p className="text-sm font-bold text-red-300">
                  Unable to load account
                </p>

                <p className="mt-1 text-xs text-red-200/80">
                  {accountError}
                </p>

                <button
                  type="button"
                  onClick={loadVirtualAccount}
                  className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900"
                >
                  Try Again
                </button>
              </div>
            ) : virtualAccount ? (
              <div className="mt-5 space-y-2.5">

                {/* Bank */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Bank
                  </p>

                  <p className="mt-1 text-sm font-black text-white">
                    {virtualAccount.bank_name ||
                      "TransactPay"}
                  </p>
                </div>

                {/* Account name */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Account Name
                  </p>

                  <p className="mt-1 text-sm font-black text-white">
                    {virtualAccount.account_name ||
                      "ProxySocials"}
                  </p>
                </div>

                {/* Account number */}
                <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-sky-300">
                    Account Number
                  </p>

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="break-all text-2xl font-black tracking-wider text-white">
                      {virtualAccount.account_number}
                    </p>

                    <button
                      type="button"
                      onClick={copyAccountNumber}
                      className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-900 transition hover:bg-slate-100"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-500/10 px-3 py-2.5">
                  <p className="text-center text-[11px] font-bold text-emerald-300">
                    ✓ This is your dedicated account
                  </p>
                </div>

              </div>
            ) : null}

          </div>
        </section>

        {/* =========================
            FLUTTERWAVE
        ========================== */}
        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-sky-600">
              Online Payment
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-900">
              Fund with Flutterwave
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Prefer to pay online? Enter an amount below
              and continue to Flutterwave.
            </p>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-black text-slate-700">
              Amount (₦)
            </label>

            <input
              type="number"
              min="100"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-black outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={continueToPayment}
            className="mt-4 w-full rounded-2xl bg-sky-600 py-3.5 text-sm font-black text-white transition hover:bg-sky-700"
          >
            Continue to Payment
          </button>

        </section>

        {/* Information */}
        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <p className="text-xs font-black text-sky-900">
            💡 How bank transfer funding works
          </p>

          <p className="mt-1.5 text-[11px] leading-5 text-sky-800/80">
            Transfer from your bank to your dedicated account
            above. Once TransactPay confirms the payment,
            your ProxySocials wallet will be credited
            automatically.
          </p>
        </div>

      </div>
    </main>
  );
}