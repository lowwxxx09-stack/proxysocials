
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
  return String(value || "unknown").toLowerCase().trim().replace(/[_-]+/g, " ");
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
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${style.color} ${style.background} ${style.border}`}
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
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${accent}`}>
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

      const matchesSearch =
        !search ||
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        (order.services?.title || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (order.services?.category || "")
          .toLowerCase()
          .includes(search.toLowerCase());

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
      <main className="min-h-screen bg-[#080c12] px-5 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex animate-pulse items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-zinc-800" />
            <div>
              <div className="h-4 w-36 rounded bg-zinc-800" />
              <div className="mt-2 h-3 w-24 rounded bg-zinc-900" />
            </div>
          </div>

          <div className="mb-10 h-36 animate-pulse rounded-3xl bg-zinc-900" />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-zinc-900"
              />
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-zinc-900"
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
            transform: translateY(16px);
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
          animation: page-in 0.65s ease both;
        }

        .glow-pulse {
          animation: glow-pulse 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-page-in,
          .glow-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <CustomerMenu />

      <div className="pointer-events-none absolute left-1/2 top-0 h-[450px] w-[850px] -translate-x-1/2 rounded-full bg-cyan-500/[0.06] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-page-in mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
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

        {/* Hero card */}
        <section className="animate-page-in relative mb-7 overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#102a38] via-[#101b29] to-[#10131d] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="glow-pulse pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-cyan-400/15 blur-[75px]" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
                <span>✦</span>
                YOUR PROXYSOCIALS ACTIVITY
              </div>

              <h2 className="max-w-xl text-2xl font-black leading-tight sm:text-3xl">
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

        {/* Statistics */}
        <section className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
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

        {/* Search and filters */}
        <section className="animate-page-in mb-6 rounded-2xl border border-white/[0.07] bg-[#101722] p-4 sm:p-5">
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

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
            <span>{error}</span>
            <button
              onClick={() => loadOrders(true)}
              className="shrink-0 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Order list */}
        <section className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="animate-page-in rounded-3xl border border-white/[0.07] bg-[#101722] px-6 py-16 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.06] text-4xl text-cyan-300">
                {orders.length === 0 ? "▤" : "⌕"}
              </div>

              <h3 className="mt-6 text-xl font-black">
                {orders.length === 0
                  ? "Your journey starts here."
                  : "No matching orders found."}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                {orders.length === 0
                  ? "You haven't made a purchase yet. Explore our marketplace and your orders will appear here."
                  : "Try a different search term or select another order filter."}
              </p>

              {orders.length === 0 ? (
                <Link
                  href="/"
                  className="mt-7 inline-flex rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-[#061018] transition hover:bg-cyan-400"
                >
                  Explore marketplace →
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="mt-6 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/5"
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
                  className="animate-page-in overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101722] shadow-xl shadow-black/10 transition duration-300 hover:border-cyan-400/20"
                  style={{
                    animationDelay: `${Math.min(index * 50, 350)}ms`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleOrder(order.id)}
                    aria-expanded={expanded}
                    className="w-full p-4 text-left sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
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

                  {/* Expanded details */}
                  {expanded && (
                    <div className="animate-page-in border-t border-white/[0.07] bg-black/20 p-4 sm:p-6">
                      <div className="grid gap-3 sm:grid-cols-2">
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

                      {hasDelivery ? (
                        <div className="mt-6">
                          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg text-emerald-400">
                                  ✓
                                </span>
                                <h4 className="text-lg font-black">
                                  Your delivered products
                                </h4>
                              </div>
                              <p className="mt-1 text-xs text-zinc-500">
                                Keep these details secure. Only share them with
                                people you trust.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyAll(stock, order.id)}
                              disabled={copyingAll}
                              className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-xs font-black text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
                            >
                              {copied === `all-${order.id}`
                                ? "✓ Copied all"
                                : copyingAll
                                  ? "Copying..."
                                  : "Copy all credentials"}
                            </button>
                          </div>

                          <div className="space-y-4">
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
                                  className="rounded-2xl border border-white/[0.07] bg-[#0b111a] p-4 sm:p-5"
                                >
                                  <div className="mb-4 flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                                      Product {String(itemIndex + 1).padStart(2, "0")}
                                    </span>
                                    <span className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                                      Delivered
                                    </span>
                                  </div>

                                  <div className="space-y-3">
                                    {fields.map(([label, value]) => {
                                      const key = `${order.id}-${itemIndex}-${label}`;

                                      return (
                                        <div
                                          key={label}
                                          className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 sm:flex-row sm:items-center"
                                        >
                                          <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                              {label}
                                            </p>
                                            <p className="mt-1 break-all text-sm font-semibold text-zinc-200">
                                              {value}
                                            </p>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => copyText(value, key)}
                                            className="shrink-0 self-start rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300 sm:self-center"
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
                        <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#0b111a] p-5">
                          <p className="text-sm font-bold text-zinc-300">
                            {["completed", "success", "successful", "delivered"].includes(
                              normalizeStatus(order.order_status)
                            )
                              ? "Your order is completed."
                              : "Delivery details are not available yet."}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-zinc-500">
                            {["completed", "success", "successful", "delivered"].includes(
                              normalizeStatus(order.order_status)
                            )
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

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} ProxySocials. All rights reserved.
          </p>

          <p className="text-xs text-zinc-600">
            Need help with an order? Contact our support team.
          </p>
        </div>
      </div>
    </main>
  );
}
