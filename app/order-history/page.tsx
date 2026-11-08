
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import CustomerMenu from "@/components/CustomerMenu";

type DeliveredStock = {
  id?: string;
  username?: string | null;
  password?: string | null;
  email?: string | null;
  recovery_email?: string | null;
  twofa?: string | null;
  license_key?: string | null;
  download_link?: string | null;
};

type Order = {
  id: string;
  amount: number | string;
  payment_status: string | null;
  order_status: string | null;
  created_at: string;
  delivered_stock?: DeliveredStock[] | null;
  services?: {
    title?: string;
    category?: string;
  } | null;
};

type FilterStatus = "all" | "completed" | "pending" | "failed";

const formatMoney = (amount: number | string) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function normalizeStatus(value: string | null | undefined) {
  return String(value || "unknown")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ");
}

function getStatusStyle(value: string | null | undefined) {
  const status = normalizeStatus(value);

  if (
    ["completed", "success", "successful", "delivered", "paid"].includes(status)
  ) {
    return {
      color: "text-emerald-400",
      background: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      dot: "bg-emerald-400",
    };
  }

  if (
    ["pending", "processing", "in progress", "awaiting"].includes(status)
  ) {
    return {
      color: "text-amber-400",
      background: "bg-amber-400/10",
      border: "border-amber-400/20",
      dot: "bg-amber-400",
    };
  }

  if (
    ["failed", "rejected", "cancelled", "canceled", "refunded"].includes(status)
  ) {
    return {
      color: "text-rose-400",
      background: "bg-rose-400/10",
      border: "border-rose-400/20",
      dot: "bg-rose-400",
    };
  }

  return {
    color: "text-zinc-400",
    background: "bg-zinc-400/10",
    border: "border-zinc-400/20",
    dot: "bg-zinc-400",
  };
}

function StatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const style = getStatusStyle(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs ${style.color} ${style.background} ${style.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {normalizeStatus(status)}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
  accent,
  delay,
}: {
  title: string;
  value: number;
  icon: string;
  description: string;
  accent: string;
  delay: string;
}) {
  return (
    <div
      className={`animate-page-in rounded-2xl border border-white/[0.07] bg-[#101722] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/15 ${delay}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">{title}</span>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${accent}`}
        >
          {icon}
        </span>
      </div>

      <p className="mt-5 text-3xl font-black tracking-tight text-white">
        {value.toLocaleString()}
      </p>

      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

export default function OrderHistory() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [copied, setCopied] = useState("");
  const [copyingAll, setCopyingAll] = useState(false);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data, error: queryError } = await supabase
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

      if (queryError) {
        console.error("Order history error:", queryError);
        setError("We couldn't load your orders. Please try again.");
        return;
      }

      setOrders((data || []) as Order[]);
    } catch (err) {
      console.error("Unexpected order history error:", err);
      setError("Something went wrong while loading your orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const stats = useMemo(() => {
    const completed = orders.filter((order) =>
      ["completed", "success", "successful", "delivered"].includes(
        normalizeStatus(order.order_status)
      )
    ).length;

    const pending = orders.filter((order) =>
      ["pending", "processing", "in progress", "awaiting"].includes(
        normalizeStatus(order.order_status)
      )
    ).length;

    const failed = orders.filter((order) =>
      ["failed", "rejected", "cancelled", "canceled", "refunded"].includes(
        normalizeStatus(order.order_status)
      )
    ).length;

    return {
      total: orders.length,
      completed,
      pending,
      failed,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = normalizeStatus(order.order_status);
      const searchTerm = search.toLowerCase().trim();

      const matchesSearch =
        !searchTerm ||
        order.id.toLowerCase().includes(searchTerm) ||
        (order.services?.title || "").toLowerCase().includes(searchTerm) ||
        (order.services?.category || "").toLowerCase().includes(searchTerm);

      let matchesFilter = true;

      if (filter === "completed") {
        matchesFilter = [
          "completed",
          "success",
          "successful",
          "delivered",
        ].includes(status);
      }

      if (filter === "pending") {
        matchesFilter = [
          "pending",
          "processing",
          "in progress",
          "awaiting",
        ].includes(status);
      }

      if (filter === "failed") {
        matchesFilter = [
          "failed",
          "rejected",
          "cancelled",
          "canceled",
          "refunded",
        ].includes(status);
      }

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  function toggleOrder(id: string) {
    setExpandedOrders((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  async function copyText(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Unable to copy. Please select and copy the text manually.");
    }
  }

  async function copyAll(stock: DeliveredStock[], orderId: string) {
    const fields = [
      ["Username", "username"],
      ["Password", "password"],
      ["Email", "email"],
      ["Recovery Email", "recovery_email"],
      ["2FA", "twofa"],
      ["License Key", "license_key"],
      ["Download Link", "download_link"],
    ] as const;

    const content = stock
      .map((item, index) => {
        const details = fields
          .filter(([_, key]) => {
            const value = item[key];
            return value !== null && value !== undefined && value !== "";
          })
          .map(([label, key]) => `${label}: ${item[key]}`)
          .join("\n");

        return `PRODUCT ${index + 1}\n${details}`;
      })
      .join("\n\n--------------------\n\n");

    if (!content) return;

    setCopyingAll(true);
    await copyText(content, `all-${orderId}`);
    setCopyingAll(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080c12] px-4 py-8 text-white sm:px-5 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex animate-pulse items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-zinc-800" />
            <div>
              <div className="h-4 w-36 rounded bg-zinc-800" />
              <div className="mt-2 h-3 w-24 rounded bg-zinc-900" />
            </div>
          </div>

          <div className="mb-8 hidden h-36 animate-pulse rounded-3xl bg-zinc-900 md:block" />

          <div className="hidden grid-cols-4 gap-4 md:grid">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-zinc-900"
              />
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-zinc-900"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080c12] text-white selection:bg-cyan-400/30">
      <style jsx global>{`
        @keyframes page-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.35;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.08);
          }
        }

        .animate-page-in {
          animation: page-in 0.5s ease both;
        }

        .glow-pulse {
          animation: glow-pulse 6s ease-in-out infinite;
        }

        .order-scrollbar {
          scrollbar-width: none;
        }

        .order-scrollbar::-webkit-scrollbar {
          display: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-page-in,
          .glow-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <CustomerMenu />

      <div className="pointer-events-none absolute left-1/2 top-0 hidden h-[450px] w-[850px] -translate-x-1/2 rounded-full bg-cyan-500/[0.06] blur-[120px] md:block" />

      <div className="relative mx-auto max-w-7xl px-3 pb-12 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">

        {/* MOBILE HEADER */}
        <header className="mb-5 flex items-center justify-between gap-3 md:hidden">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Customer dashboard
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              My <span className="text-cyan-400">Orders</span>
            </h1>
            <p className="mt-1 text-[11px] text-zinc-500">
              Track and manage your purchases.
            </p>
          </div>

          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            aria-label="Refresh orders"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#101722] text-lg text-cyan-300 transition hover:border-cyan-400/30 disabled:opacity-50"
          >
            <span className={refreshing ? "animate-spin" : ""}>↻</span>
          </button>
        </header>

        {/* DESKTOP HEADER */}
        <div className="animate-page-in mb-8 hidden flex-col justify-between gap-5 sm:flex-row sm:items-center md:flex">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
              Customer dashboard
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Order <span className="text-cyan-400">History.</span>
            </h1>

            <p className="mt-2 max-w-xl text-sm text-zinc-400 sm:text-base">
              Every purchase, every delivery, all in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300 disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>↻</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-[#061018] shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:bg-cyan-400"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <section className="mb-3 md:hidden">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-zinc-500">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders or services..."
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#101722] pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
            />
          </div>
        </section>

        {/* MOBILE FILTERS */}
        <section className="mb-5 md:hidden">
          <div className="order-scrollbar flex gap-2 overflow-x-auto pb-1">
            {(
              [
                ["all", "All", stats.total],
                ["pending", "Pending", stats.pending],
                ["completed", "Completed", stats.completed],
                ["failed", "Failed", stats.failed],
              ] as [FilterStatus, string, number][]
            ).map(([value, label, count]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-bold transition ${
                  filter === value
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                    : "border-white/[0.07] bg-[#101722] text-zinc-400"
                }`}
              >
                {label}
                <span className="text-[9px] opacity-70">{count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* DESKTOP HERO */}
        <section className="animate-page-in relative mb-7 hidden overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#102a38] via-[#101b29] to-[#10131d] p-8 shadow-2xl shadow-black/20 md:block">
          <div className="glow-pulse pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-cyan-400/15 blur-[75px]" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
                <span>✦</span>
                YOUR PROXYSOCIALS ACTIVITY
              </div>

              <h2 className="max-w-xl text-3xl font-black leading-tight">
                Your purchases,
                <br />
                <span className="text-cyan-300">beautifully organized.</span>
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">
                Track your purchases, monitor delivery progress and access
                your digital products whenever you need them.
              </p>
            </div>

            <div className="min-w-[150px] rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                All-time orders
              </p>
              <p className="mt-2 text-4xl font-black tracking-tight text-white">
                {stats.total.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-cyan-300">
                Your purchase activity
              </p>
            </div>
          </div>
        </section>

        {/* DESKTOP STATISTICS */}
        <section className="mb-9 hidden grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5 md:grid">
          <StatCard
            title="Total orders"
            value={stats.total}
            icon="▤"
            description="All purchases"
            accent="bg-cyan-400/10 text-cyan-300"
            delay="[animation-delay:50ms]"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon="✓"
            description="Successfully completed"
            accent="bg-emerald-400/10 text-emerald-400"
            delay="[animation-delay:100ms]"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon="◷"
            description="Awaiting completion"
            accent="bg-amber-400/10 text-amber-400"
            delay="[animation-delay:150ms]"
          />

          <StatCard
            title="Failed"
            value={stats.failed}
            icon="!"
            description="Failed or cancelled"
            accent="bg-rose-400/10 text-rose-400"
            delay="[animation-delay:200ms]"
          />
        </section>

        {/* DESKTOP SEARCH AND FILTERS */}
        <section className="animate-page-in mb-6 hidden rounded-2xl border border-white/[0.07] bg-[#101722] p-5 md:block">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">Your transactions</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Find and manage your previous purchases.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-zinc-500">
                ⌕
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search service or order ID..."
                className="w-full rounded-xl border border-white/10 bg-[#080c12] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {(
              [
                ["all", "All orders", stats.total],
                ["completed", "Completed", stats.completed],
                ["pending", "Pending", stats.pending],
                ["failed", "Failed", stats.failed],
              ] as [FilterStatus, string, number][]
            ).map(([value, label, count]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  filter === value
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                    : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    filter === value
                      ? "bg-cyan-400/15 text-cyan-300"
                      : "bg-white/5 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-xs text-rose-300 sm:text-sm">
            <span>{error}</span>
            <button
              onClick={() => loadOrders(true)}
              className="shrink-0 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ORDER LIST */}
        <section className="space-y-3 sm:space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="animate-page-in rounded-2xl border border-white/[0.07] bg-[#101722] px-5 py-12 text-center sm:rounded-3xl sm:px-6 sm:py-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.06] text-3xl text-cyan-300 sm:h-20 sm:w-20 sm:rounded-3xl sm:text-4xl">
                {orders.length === 0 ? "▤" : "⌕"}
              </div>

              <h3 className="mt-5 text-lg font-black sm:mt-6 sm:text-xl">
                {orders.length === 0
                  ? "Your journey starts here."
                  : "No matching orders found."}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-zinc-500 sm:text-sm">
                {orders.length === 0
                  ? "You haven't made a purchase yet. Explore our marketplace and your orders will appear here."
                  : "Try a different search term or select another order filter."}
              </p>

              {orders.length === 0 ? (
                <Link
                  href="/"
                  className="mt-6 inline-flex rounded-xl bg-cyan-500 px-6 py-3 text-xs font-black text-[#061018] transition hover:bg-cyan-400 sm:mt-7 sm:text-sm"
                >
                  Explore marketplace →
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="mt-5 rounded-xl border border-white/10 px-5 py-3 text-xs font-bold text-zinc-300 transition hover:bg-white/5 sm:mt-6 sm:text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const expanded = expandedOrders.includes(order.id);
              const stock = Array.isArray(order.delivered_stock)
                ? order.delivered_stock
                : [];

              const hasDelivery = stock.length > 0;

              return (
                <article
                  key={order.id}
                  className="animate-page-in overflow-hidden rounded-xl border border-white/[0.07] bg-[#101722] shadow-xl shadow-black/10 transition duration-300 hover:border-cyan-400/20 sm:rounded-2xl"
                  style={{
                    animationDelay: `${Math.min(index * 50, 350)}ms`,
                  }}
                >
                  {/* ORDER SUMMARY */}
                  <button
                    type="button"
                    onClick={() => toggleOrder(order.id)}
                    aria-expanded={expanded}
                    className="w-full p-3.5 text-left transition hover:bg-white/[0.015] sm:p-6"
                  >
                    {/* MOBILE SUMMARY */}
                    <div className="md:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07] text-base text-cyan-300">
                            ◈
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-extrabold text-white">
                              {order.services?.title || "ProxySocials Service"}
                            </h3>
                            <p className="mt-1 truncate text-[10px] text-zinc-500">
                              {order.services?.category || "Digital service"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black text-white">
                            {formatMoney(order.amount)}
                          </p>
                          <div className="mt-1">
                            <StatusBadge status={order.order_status} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                        <p className="text-[10px] text-zinc-500">
                          {formatDate(order.created_at)}
                        </p>

                        <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300">
                          {expanded ? "Hide details" : "View details"}
                          <span
                            className={`transition-transform duration-300 ${
                              expanded ? "rotate-180" : ""
                            }`}
                          >
                            ↓
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* DESKTOP SUMMARY */}
                    <div className="hidden flex-col gap-5 sm:flex-row sm:items-center sm:justify-between md:flex">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.07] text-xl text-cyan-300">
                          ◈
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-white sm:text-lg">
                            {order.services?.title || "ProxySocials Service"}
                          </h3>

                          <p className="mt-1 text-xs font-semibold text-cyan-400">
                            {order.services?.category || "Digital service"}
                          </p>

                          <p className="mt-2 break-all font-mono text-[10px] text-zinc-600 sm:text-xs">
                            ORDER #{order.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="sm:text-right">
                          <p className="text-xl font-black tracking-tight text-white sm:text-2xl">
                            {formatMoney(order.amount)}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {formatDate(order.created_at)}
                          </p>
                        </div>

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition-transform duration-300 ${
                            expanded ? "rotate-180" : ""
                          }`}
                        >
                          ↓
                        </span>
                      </div>
                    </div>

                    {/* DESKTOP STATUS INFORMATION */}
                    <div className="mt-5 hidden flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4 md:flex">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Payment
                      </span>
                      <StatusBadge status={order.payment_status} />

                      <span className="ml-2 mr-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Order
                      </span>
                      <StatusBadge status={order.order_status} />

                      {hasDelivery && (
                        <span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400">
                          ✓ Product delivered
                        </span>
                      )}
                    </div>
                  </button>

                  {/* EXPANDED ORDER DETAILS */}
                  {expanded && (
                    <div className="animate-page-in border-t border-white/[0.07] bg-black/20 p-3.5 sm:p-6">
                      {/* MOBILE ORDER REFERENCE */}
                      <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#0b111a] p-3 md:hidden">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                          Order reference
                        </p>
                        <p className="mt-1 break-all font-mono text-[10px] text-zinc-300">
                          {order.id}
                        </p>
                      </div>

                      {/* PAYMENT AND ORDER STATUS */}
                      <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">
                        <div className="rounded-xl border border-white/[0.06] bg-[#0b111a] p-3">
                          <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                            Payment
                          </p>
                          <StatusBadge status={order.payment_status} />
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-[#0b111a] p-3">
                          <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                            Order status
                          </p>
                          <StatusBadge status={order.order_status} />
                        </div>
                      </div>

                      {/* DESKTOP ORDER INFORMATION */}
                      <div className="mb-5 hidden gap-3 sm:grid-cols-2 md:grid">
                        <div className="rounded-xl border border-white/[0.06] bg-[#0b111a] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Order reference
                          </p>
                          <p className="mt-2 break-all font-mono text-xs text-zinc-300">
                            {order.id}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-[#0b111a] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Purchase date
                          </p>
                          <p className="mt-2 text-sm font-semibold text-zinc-300">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* DELIVERED PRODUCTS */}
                      {hasDelivery ? (
                        <div className="mt-4 md:mt-6">
                          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg text-emerald-400">
                                  ✓
                                </span>
                                <h4 className="text-base font-black sm:text-lg">
                                  Delivered products
                                </h4>
                              </div>
                              <p className="mt-1 text-[10px] leading-5 text-zinc-500 sm:text-xs">
                                Keep these details secure. Only share them with
                                people you trust.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyAll(stock, order.id)}
                              disabled={copyingAll}
                              className="w-full rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-xs font-black text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50 sm:w-auto"
                            >
                              {copied === `all-${order.id}`
                                ? "✓ Copied all"
                                : copyingAll
                                  ? "Copying..."
                                  : "Copy all credentials"}
                            </button>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            {stock.map((item, itemIndex) => {
                              const fields = [
                                ["Username", item.username],
                                ["Password", item.password],
                                ["Email", item.email],
                                ["Recovery Email", item.recovery_email],
                                ["2FA", item.twofa],
                                ["License Key", item.license_key],
                                ["Download Link", item.download_link],
                              ].filter(
                                ([, value]) =>
                                  value !== null &&
                                  value !== undefined &&
                                  value !== ""
                              ) as [string, string][];

                              return (
                                <div
                                  key={item.id || itemIndex}
                                  className="rounded-xl border border-white/[0.07] bg-[#0b111a] p-3 sm:rounded-2xl sm:p-5"
                                >
                                  <div className="mb-3 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                      Product {String(itemIndex + 1).padStart(2, "0")}
                                    </span>
                                    <span className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-400">
                                      Delivered
                                    </span>
                                  </div>

                                  <div className="space-y-2.5">
                                    {fields.map(([label, value]) => {
                                      const key = `${order.id}-${itemIndex}-${label}`;

                                      return (
                                        <div
                                          key={label}
                                          className="flex flex-col justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:rounded-xl"
                                        >
                                          <div className="min-w-0">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                                              {label}
                                            </p>
                                            <p className="mt-1 break-all text-xs font-semibold text-zinc-200 sm:text-sm">
                                              {value}
                                            </p>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => copyText(value, key)}
                                            className="shrink-0 self-start rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold text-zinc-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300 sm:self-center sm:px-4 sm:text-xs"
                                          >
                                            {copied === key ? "✓ Copied" : "Copy"}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 rounded-xl border border-white/[0.06] bg-[#0b111a] p-4 sm:mt-5 sm:p-5">
                          <p className="text-xs font-bold text-zinc-300 sm:text-sm">
                            {[
                              "completed",
                              "success",
                              "successful",
                              "delivered",
                            ].includes(normalizeStatus(order.order_status))
                              ? "Your order is completed."
                              : "Delivery details are not available yet."}
                          </p>
                          <p className="mt-2 text-[10px] leading-5 text-zinc-500 sm:text-xs">
                            {[
                              "completed",
                              "success",
                              "successful",
                              "delivered",
                            ].includes(normalizeStatus(order.order_status))
                              ? "There are no digital credentials attached to this order."
                              : "Your order details will appear here when they become available."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-5 text-center sm:mt-10 sm:flex-row sm:pt-6 sm:text-left">
          <p className="text-[10px] text-zinc-600 sm:text-xs">
            © {new Date().getFullYear()} ProxySocials. All rights reserved.
          </p>

          <p className="text-[10px] text-zinc-600 sm:text-xs">
            Need help with an order? Contact our support team.
          </p>
        </footer>

        {/* MOBILE DASHBOARD LINK */}
        <div className="mt-5 md:hidden">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#101722] py-3 text-xs font-bold text-zinc-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
