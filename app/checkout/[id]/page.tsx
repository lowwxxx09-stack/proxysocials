"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Service = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  price: number;
};

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

const money = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const id = String(params.id ?? "");

  const [service, setService] = useState<Service | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [processingWallet, setProcessingWallet] = useState(false);
  const [processingFlutterwave, setProcessingFlutterwave] =
    useState(false);
  const [error, setError] = useState("");

  const total = Number(service?.price ?? 0) * quantity;

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const [serviceResult, profileResult, walletResult] =
          await Promise.all([
            supabase
              .from("services")
              .select("*")
              .eq("id", id)
              .single(),

            supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("id", user.id)
              .maybeSingle(),

            supabase
              .from("wallets")
              .select("balance")
              .eq("user_id", user.id)
              .maybeSingle(),
          ]);

        if (!mounted) return;

        if (serviceResult.error || !serviceResult.data) {
          setError("This service could not be found.");
          return;
        }

        const loadedService = serviceResult.data as Service;

        if (
          !Number.isFinite(Number(loadedService.price)) ||
          Number(loadedService.price) <= 0
        ) {
          setError("This service is currently unavailable for purchase.");
          return;
        }

        setService(loadedService);
        setUserId(user.id);
        setEmail(user.email ?? "");
        setCustomerName(profileResult.data?.full_name ?? "");
        setWhatsappNumber(profileResult.data?.phone ?? "");
        setWalletBalance(Number(walletResult.data?.balance ?? 0));
      } catch (err) {
        console.error("Checkout loading error:", err);

        if (mounted) {
          setError("Unable to load checkout. Please refresh and try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) loadData();

    return () => {
      mounted = false;
    };
  }, [id, router, supabase]);

  function updateQuantity(nextQuantity: number) {
    setQuantity(
      Math.min(
        MAX_QUANTITY,
        Math.max(MIN_QUANTITY, Math.floor(nextQuantity))
      )
    );
    setError("");
  }

  async function payWithWallet() {
    if (!service || !userId || processingWallet) return;

    if (walletBalance < total) {
      setError("Your wallet balance is insufficient. Choose Flutterwave or fund your wallet.");
      return;
    }

    try {
      setProcessingWallet(true);
      setError("");

      const response = await fetch("/api/wallet/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          serviceId: service.id,
          amount: total,
          customerName,
          whatsappNumber,
          email,
          orderContent: {
            quantity,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(
          result.message || "Wallet payment failed. Please try again."
        );
      }

      router.push("/order-history");
router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Wallet payment failed. Please try again."
      );
    } finally {
      setProcessingWallet(false);
    }
  }

  async function payWithFlutterwave() {
    if (!service || !userId || processingFlutterwave) return;

    if (!email) {
      setError(
        "Your account needs an email address before you can pay online."
      );
      return;
    }

    try {
      setProcessingFlutterwave(true);
      setError("");

      const response = await fetch("/api/flutterwave/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          customerName,
          whatsappNumber,
          serviceId: service.id,
          userId,
          orderContent: {
            quantity,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status === false) {
        throw new Error(
          result.message || "Unable to initialize payment."
        );
      }

      const paymentLink =
        result.data?.link ??
        result.data?.checkout_url ??
        result.link;

      if (!paymentLink) {
        throw new Error(
          "Payment link was not returned. Please try again."
        );
      }

      window.location.href = paymentLink;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start online payment."
      );
      setProcessingFlutterwave(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] px-5">
        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">
            Preparing your secure checkout...
          </p>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f8ff] px-5">
        <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-600">
            !
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Checkout unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "We could not load this service."}
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const walletIsInsufficient = walletBalance < total;

  return (
    <main className="min-h-screen bg-[#f3f8ff] text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-blue-100 pb-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3 text-left"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-black text-white shadow-md shadow-blue-200">
              P
            </span>

            <span>
              <span className="block text-lg font-bold tracking-tight text-slate-900">
                ProxySocials
              </span>
              <span className="block text-sm text-slate-500">
                Secure checkout
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-medium text-blue-700 sm:px-4 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Secure payment
          </div>
        </header>

        {/* Page heading */}
        <section className="py-7 sm:py-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Order confirmation
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Complete your purchase
          </h1>

          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Select how many accounts you want and choose a payment method.
          </p>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr] lg:gap-6">
          {/* Left column */}
          <div className="space-y-4">
            {/* Service details */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60 sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  {service.category && (
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {service.category}
                    </span>
                  )}

                  <h2 className="mt-3 break-words text-lg font-bold leading-7 text-slate-900 sm:text-xl">
                    {service.title}
                  </h2>

                  {service.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 border-t border-blue-100 pt-4 sm:min-w-36 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
                  <p className="text-xs text-slate-500">
                    Price per account
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-blue-600">
                    {money(Number(service.price))}
                  </p>
                </div>
              </div>
            </section>

            {/* Quantity */}
            <section className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="font-bold text-slate-900">
                  Number of accounts
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Each account is charged at the listed price.
                </p>
              </div>

              <div className="flex w-fit items-center rounded-xl border border-blue-100 bg-blue-50/60 p-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= MIN_QUANTITY}
                  onClick={() => updateQuantity(quantity - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  −
                </button>

                <span className="min-w-12 px-2 text-center font-bold text-slate-900">
                  {quantity}
                </span>

                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= MAX_QUANTITY}
                  onClick={() => updateQuantity(quantity + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  +
                </button>
              </div>
            </section>

            {/* Payment methods */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60 sm:p-6">
              <h2 className="font-bold text-slate-900">
                Payment method
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose how you would like to pay.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {/* Wallet */}
                <div className="flex min-w-0 flex-col rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="6" width="18" height="14" rx="2" />
                        <path d="M3 9h18M16 14h2" />
                        <path d="M6 6V4h12" />
                      </svg>
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">
                        Wallet
                      </h3>
                      <p className="mt-0.5 break-words text-xs text-slate-500 sm:text-sm">
                        Balance: {money(walletBalance)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={payWithWallet}
                    disabled={
                      processingWallet ||
                      processingFlutterwave ||
                      walletIsInsufficient
                    }
                    className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {processingWallet
                      ? "Processing payment..."
                      : walletIsInsufficient
                        ? "Insufficient balance"
                        : "Pay with wallet"}
                  </button>
                </div>

                {/* Flutterwave */}
                <div className="flex min-w-0 flex-col rounded-2xl border border-blue-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 10h18M7 15h3" />
                      </svg>
                    </span>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Flutterwave
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                        Pay online
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={payWithFlutterwave}
                    disabled={processingWallet || processingFlutterwave}
                    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingFlutterwave
                      ? "Preparing payment..."
                      : "Continue to payment"}
                    {!processingFlutterwave && (
                      <span aria-hidden="true">→</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-3 text-xs leading-5 text-blue-800 sm:text-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 12 6Zm-1 5h2v6h-2v-6Z"
                    clipRule="evenodd"
                  />
                </svg>

                <p>
                  Your accounts will be delivered to your order history
                  after successful payment and order processing.
                </p>
              </div>
            </section>
          </div>

          {/* Order summary */}
          <aside className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60 sm:p-6 lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Order summary
              </h2>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 3h2l2.3 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6" />
                  <circle cx="10" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                  <path d="M10 10h7M13.5 6.5v7" />
                </svg>
              </span>
            </div>

            <div className="mt-5 flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 text-xl font-black text-blue-600">
                P
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-semibold leading-5 text-slate-800">
                  {service.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {quantity} {quantity === 1 ? "account" : "accounts"} ×{" "}
                  {money(Number(service.price))}
                </p>
              </div>

              <span className="shrink-0 text-sm font-bold text-slate-900">
                {money(total)}
              </span>
            </div>

            <div className="my-5 border-t border-blue-100" />

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Quantity</span>
                <span className="font-medium text-slate-800">
                  {quantity}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Price per account</span>
                <span className="font-medium text-slate-800">
                  {money(Number(service.price))}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 p-5">
              <p className="text-sm font-medium text-blue-800">
                Total payable
              </p>
              <p className="mt-1 break-words text-3xl font-extrabold tracking-tight text-blue-700">
                {money(total)}
              </p>
            </div>

            <p className="mt-4 rounded-xl bg-blue-50/80 p-3 text-xs leading-5 text-slate-600">
              Any additional charges will be shown by the payment provider
              before you confirm payment.
            </p>

            <div className="mt-6 space-y-4">
              {[
                "Secure payment processing",
                "Order processing after payment",
                "Accounts delivered to your order history",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    ✓
                  </span>
                  <p className="text-sm leading-5 text-slate-600">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-9 border-t border-blue-100 py-6 text-center text-sm text-slate-400">
          ProxySocials <span className="mx-1.5">·</span> Secure Checkout
        </footer>
      </div>
    </main>
  );
}