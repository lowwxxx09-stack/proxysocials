
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import CustomerMenu from "@/components/CustomerMenu";

type Payment = {
  id: string;
  amount: number;
  payment_status: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  services: {
    title: string;
    category: string;
  } | null;
};

type StatusFilter = "ALL" | "SUCCESS" | "PENDING" | "FAILED";

export default function PaymentHistory() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");
  const [copiedId, setCopiedId] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

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
      setErrorMessage("Unable to load your payment history. Please try again.");
    } else {
      setPayments((data || []) as unknown as Payment[]);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  function getStatus(status: string | null) {
    const normalized = (status || "").toLowerCase().trim();

    if (["success", "successful", "completed", "paid"].includes(normalized)) {
      return {
        label: "Successful",
        color: "text-emerald-400",
        background: "bg-emerald-400/10",
        border: "border-emerald-400/20",
        dot: "bg-emerald-400",
        type: "SUCCESS",
      };
    }

    if (["failed", "rejected", "cancelled", "canceled"].includes(normalized)) {
      return {
        label: "Failed",
        color: "text-rose-400",
        background: "bg-rose-400/10",
        border: "border-rose-400/20",
        dot: "bg-rose-400",
        type: "FAILED",
      };
    }

    return {
      label: status || "Unknown",
      color: "text-amber-400",
      background: "bg-amber-400/10",
      border: "border-amber-400/20",
      dot: "bg-amber-400",
      type: "PENDING",
    };
  }

  const successfulPayments = payments.filter(
    (payment) => getStatus(payment.payment_status).type === "SUCCESS"
  );

  const pendingPayments = payments.filter(
    (payment) => getStatus(payment.payment_status).type === "PENDING"
  );

  const failedPayments = payments.filter(
    (payment) => getStatus(payment.payment_status).type === "FAILED"
  );

  const totalSuccessfulAmount = successfulPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const filteredPayments = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return payments.filter((payment) => {
      const status = getStatus(payment.payment_status).type;

      const matchesFilter =
        activeFilter === "ALL" || status === activeFilter;

      const matchesSearch =
        !search ||
        payment.services?.title?.toLowerCase().includes(search) ||
        payment.services?.category?.toLowerCase().includes(search) ||
        payment.payment_method?.toLowerCase().includes(search) ||
        payment.payment_reference?.toLowerCase().includes(search) ||
        payment.payment_status?.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [payments, searchTerm, activeFilter]);

  async function copyReference(reference: string, id: string) {
    if (!reference) return;

    try {
      await navigator.clipboard.writeText(reference);
      setCopiedId(id);

      setTimeout(() => {
        setCopiedId((current) => (current === id ? "" : current));
      }, 1800);
    } catch {
      console.error("Unable to copy payment reference");
    }
  }

  function formatDate(date: string) {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMoney(amount: number) {
    return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
  }

  function renderPayment(payment: Payment, index: number) {
    const status = getStatus(payment.payment_status);
    const reference = payment.payment_reference || "";

    return (
      <article
        key={payment.id}
        className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#101722] transition-all duration-300 hover:border-cyan-400/25 sm:rounded-2xl"
        style={{
          animation: "paymentFadeIn 0.45s ease both",
          animationDelay: `${Math.min(index * 0.05, 0.35)}s`,
        }}
      >
        <div className="p-3 sm:p-5">
          {/* TOP SECTION */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.08] text-sm text-cyan-300 sm:h-11 sm:w-11 sm:text-lg">
                ◈
              </div>

              <div className="min-w-0">
                <h3 className="line-clamp-1 text-xs font-extrabold text-white sm:text-base">
                  {payment.services?.title || "Service"}
                </h3>

                <p className="mt-1 truncate text-[9px] font-semibold text-cyan-300 sm:text-xs">
                  {payment.services?.category || "Digital Service"}
                </p>

                <p className="mt-1 text-[8px] text-gray-500 sm:text-[10px]">
                  {formatDate(payment.created_at)}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-white sm:text-xl">
                {formatMoney(payment.amount)}
              </p>

              <span
                className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-bold sm:text-[10px] ${status.color} ${status.background} ${status.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
          </div>

          {/* PAYMENT DETAILS */}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 sm:mt-4 sm:gap-3 sm:pt-4">
            <div className="min-w-0 rounded-lg bg-[#080c12] p-2.5 sm:rounded-xl sm:p-3">
              <p className="text-[8px] font-bold uppercase tracking-wider text-gray-500 sm:text-[10px]">
                Payment Method
              </p>

              <p className="mt-1 truncate text-[10px] font-bold capitalize text-gray-200 sm:text-sm">
                {payment.payment_method || "Unknown"}
              </p>
            </div>

            <div className="min-w-0 rounded-lg bg-[#080c12] p-2.5 sm:rounded-xl sm:p-3">
              <p className="text-[8px] font-bold uppercase tracking-wider text-gray-500 sm:text-[10px]">
                Payment Reference
              </p>

              <div className="mt-1 flex min-w-0 items-center justify-between gap-1">
                <p className="min-w-0 truncate text-[9px] font-semibold text-gray-200 sm:text-xs">
                  {reference || "Wallet payment"}
                </p>

                {reference && (
                  <button
                    onClick={() => copyReference(reference, payment.id)}
                    className="shrink-0 rounded-md bg-cyan-400/10 px-2 py-1 text-[8px] font-bold text-cyan-300 transition hover:bg-cyan-400/20 sm:text-[10px]"
                  >
                    {copiedId === payment.id ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080c12] px-6">
        <div className="text-center">
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-cyan-400/10 border-t-cyan-400" />
            <span className="text-2xl font-black text-cyan-400">P</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            Proxy<span className="text-cyan-400">Socials</span>
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Preparing your payment history...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080c12] px-3 pb-16 pt-5 text-white sm:px-6 sm:pt-8">
      <style jsx global>{`
        @keyframes paymentFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes paymentFadeDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .payment-scrollbar {
          scrollbar-width: none;
        }

        .payment-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .payment-header {
          animation: paymentFadeDown 0.5s ease both;
        }
      `}</style>

      <CustomerMenu />

      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <header className="payment-header mb-7 pt-5 sm:mb-9 sm:pt-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Account activity
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
                Payment <span className="text-cyan-400">History</span>
              </h1>

              <p className="mt-2 text-xs text-gray-400 sm:text-sm">
                Track and manage all your ProxySocials payments.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#101722] px-4 py-2.5 text-xs font-bold text-gray-300 transition hover:border-cyan-400/30 hover:text-cyan-300 sm:px-5 sm:py-3 sm:text-sm"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        {/* STATISTICS */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-white/[0.07] bg-[#101722] p-3 sm:rounded-3xl sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 sm:text-[10px]">
              Total Payments
            </p>
            <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {payments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/10 bg-[#101722] p-3 sm:rounded-3xl sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 sm:text-[10px]">
              Successful
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
              {successfulPayments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/10 bg-[#101722] p-3 sm:rounded-3xl sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 sm:text-[10px]">
              Pending
            </p>
            <p className="mt-2 text-2xl font-black text-amber-400 sm:text-3xl">
              {pendingPayments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-400/10 bg-[#101722] p-3 sm:rounded-3xl sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 sm:text-[10px]">
              Failed
            </p>
            <p className="mt-2 text-2xl font-black text-rose-400 sm:text-3xl">
              {failedPayments.length}
            </p>
          </div>
        </section>

        {/* TOTAL SPENDING */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-[#10283a] to-[#101722] p-4 sm:mb-8 sm:rounded-3xl sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">
            Total Successful Payments
          </p>

          <p className="mt-2 text-2xl font-black tracking-tight text-cyan-300 sm:text-4xl">
            {formatMoney(totalSuccessfulAmount)}
          </p>

          <p className="mt-1 text-[9px] text-gray-500 sm:text-xs">
            Based on your successful payment records.
          </p>
        </section>

        {/* SEARCH */}
        <section className="mb-5 sm:mb-7">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-500">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search service, reference or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#101722] pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 sm:h-14 sm:rounded-2xl sm:text-sm"
            />
          </div>
        </section>

        {/* FILTERS */}
        <section className="payment-scrollbar mb-5 flex gap-2 overflow-x-auto pb-2 sm:mb-7 sm:gap-3">
          {(
            [
              ["ALL", "All Payments"],
              ["SUCCESS", "Successful"],
              ["PENDING", "Pending"],
              ["FAILED", "Failed"],
            ] as [StatusFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-bold transition sm:px-5 sm:py-2.5 sm:text-xs ${
                activeFilter === value
                  ? "border-cyan-400 bg-cyan-400 text-[#07111c]"
                  : "border-white/[0.08] bg-[#101722] text-gray-400 hover:border-cyan-400/30 hover:text-cyan-300"
              }`}
            >
              {label}
            </button>
          ))}
        </section>

        {/* PAYMENT LIST HEADER */}
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-white sm:text-base">
            Transactions
          </h2>

          <span className="text-[10px] text-gray-500 sm:text-xs">
            {filteredPayments.length} found
          </span>
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-5 text-center">
            <p className="text-sm font-bold text-rose-300">
              Something went wrong
            </p>

            <p className="mt-2 text-xs text-gray-400">
              {errorMessage}
            </p>

            <button
              onClick={loadPayments}
              className="mt-4 rounded-xl bg-rose-400/10 px-5 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-400/20"
            >
              Try again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!errorMessage && payments.length === 0 && (
          <div className="rounded-3xl border border-white/[0.07] bg-[#101722] px-5 py-12 text-center sm:py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-3xl text-cyan-300">
              ◈
            </div>

            <h2 className="mt-5 text-xl font-black text-white sm:text-2xl">
              No Payments Yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-gray-500 sm:text-sm">
              Your payment history will appear here after you make a purchase.
            </p>

            <Link
              href="/services"
              className="mt-5 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-xs font-extrabold text-[#07111c] transition hover:bg-cyan-300"
            >
              Explore Services →
            </Link>
          </div>
        )}

        {/* NO FILTER RESULTS */}
        {!errorMessage && payments.length > 0 && filteredPayments.length === 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#101722] px-5 py-12 text-center">
            <div className="text-3xl text-gray-600">⌕</div>

            <h2 className="mt-3 text-lg font-black text-white">
              No Transactions Found
            </h2>

            <p className="mt-2 text-xs text-gray-500">
              Try a different search term or payment filter.
            </p>

            <button
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("ALL");
              }}
              className="mt-4 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-extrabold text-[#07111c] hover:bg-cyan-300"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* PAYMENT CARDS */}
        {!errorMessage && filteredPayments.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {filteredPayments.map((payment, index) =>
              renderPayment(payment, index)
            )}
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-14 border-t border-white/[0.06] py-7 text-center sm:mt-20">
          <p className="text-sm font-black tracking-tight text-white">
            Proxy<span className="text-cyan-400">Socials</span>
          </p>

          <p className="mt-2 text-[10px] text-gray-600 sm:text-xs">
            Your payments, organized in one place.
          </p>
        </footer>
      </div>
    </main>
  );
}
