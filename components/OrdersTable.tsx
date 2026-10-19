"use client";

import { useMemo, useState } from "react";
import OrderActions from "@/components/OrderActions";

type Order = {
  id: string;
  customer_name?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  amount?: number | string | null;
  order_status?: string | null;
  created_at: string;
  note?: string | null;
  receipt_url?: string | null;
  services?: {
    title?: string | null;
    category?: string | null;
  } | null;
};

const formatMoney = (amount: number | string | null | undefined) =>
  `₦${Number(amount ?? 0).toLocaleString("en-NG", {
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

const statusConfig: Record<
  string,
  { label: string; classes: string; dot: string }
> = {
  pending_verification: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const ordersPerPage = 10;

  const filteredOrders = useMemo(() => {
    let result = orders.filter((order) => {
      const text = search.toLowerCase().trim();

      const matchesSearch =
        order.customer_name?.toLowerCase().includes(text) ||
        order.whatsapp_number?.toLowerCase().includes(text) ||
        order.email?.toLowerCase().includes(text) ||
        order.services?.title?.toLowerCase().includes(text) ||
        order.services?.category?.toLowerCase().includes(text) ||
        order.id.toLowerCase().includes(text);

      const matchesStatus =
        filter === "all" || order.order_status === filter;

      return Boolean(matchesSearch) && matchesStatus;
    });

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
    } else if (sortBy === "highest") {
      result.sort(
        (a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0)
      );
    } else if (sortBy === "lowest") {
      result.sort(
        (a, b) => Number(a.amount ?? 0) - Number(b.amount ?? 0)
      );
    }

    const now = new Date();

    if (dateFilter !== "all") {
      result = result.filter((order) => {
        const created = new Date(order.created_at);

        if (dateFilter === "today") {
          return created.toDateString() === now.toDateString();
        }

        if (dateFilter === "week") {
          const age = now.getTime() - created.getTime();
          return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
        }

        if (dateFilter === "month") {
          return (
            created.getMonth() === now.getMonth() &&
            created.getFullYear() === now.getFullYear()
          );
        }

        if (dateFilter === "year") {
          return created.getFullYear() === now.getFullYear();
        }

        return true;
      });
    }

    return result;
  }, [orders, search, filter, sortBy, dateFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * ordersPerPage;

  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ordersPerPage
  );

  const pendingCount = orders.filter(
    (order) => order.order_status === "pending_verification"
  ).length;

  const completedCount = orders.filter(
    (order) => order.order_status === "completed"
  ).length;

  const rejectedCount = orders.filter(
    (order) => order.order_status === "rejected"
  ).length;

  const filters = [
    { value: "all", label: "All orders", count: orders.length },
    { value: "pending_verification", label: "Pending", count: pendingCount },
    { value: "completed", label: "Completed", count: completedCount },
    { value: "rejected", label: "Rejected", count: rejectedCount },
  ];

  function resetFilters() {
    setSearch("");
    setFilter("all");
    setDateFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "All orders",
            count: orders.length,
            description: "Orders received",
            color: "text-slate-900",
          },
          {
            label: "Awaiting review",
            count: pendingCount,
            description: "Require attention",
            color: "text-amber-600",
          },
          {
            label: "Completed",
            count: completedCount,
            description: "Successful orders",
            color: "text-emerald-600",
          },
          {
            label: "Rejected",
            count: rejectedCount,
            description: "Rejected orders",
            color: "text-rose-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500">
              {item.label}
            </p>
            <p className={`mt-2 text-2xl font-black ${item.color}`}>
              {item.count}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row">
          <input
            type="search"
            placeholder="Search customer, email, service or order ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
          />

          <div className="grid grid-cols-2 gap-3 xl:w-[360px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold sm:text-sm"
              aria-label="Sort orders"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold sm:text-sm"
              aria-label="Filter by date"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => {
            const active = filter === item.value;

            return (
              <button
                key={item.value}
                onClick={() => {
                  setFilter(item.value);
                  setCurrentPage(1);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold sm:text-sm ${
                  active
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    active
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            Showing {filteredOrders.length === 0 ? 0 : startIndex + 1}–
            {Math.min(startIndex + ordersPerPage, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
          </p>

          {(search ||
            filter !== "all" ||
            dateFilter !== "all" ||
            sortBy !== "newest") && (
            <button
              onClick={resetFilters}
              className="shrink-0 text-xs font-bold text-sky-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Orders */}
      <div className="space-y-4">
        {paginatedOrders.map((order) => {
          const status = statusConfig[order.order_status ?? ""] ?? {
            label: order.order_status ?? "Unknown",
            classes: "bg-slate-100 text-slate-600 ring-slate-200",
            dot: "bg-slate-400",
          };

          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Heading */}
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-lg text-sky-700">
                    ◈
                  </div>

                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-extrabold leading-6 text-slate-900 sm:text-base">
                      {order.services?.title || "Untitled service"}
                    </h2>
                    <p className="mt-0.5 text-xs font-semibold text-sky-700">
                      {order.services?.category || "Uncategorised"}
                    </p>
                    <p className="mt-2 break-all font-mono text-[10px] text-slate-400 sm:text-xs">
                      ID: {order.id}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${status.classes}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {/* Amount and date */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/80 px-4 py-4 sm:px-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Order amount
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900 sm:text-xl">
                    {formatMoney(order.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Order date
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-700 sm:text-sm">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              {/* Customer and notes */}
              <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Customer information
                  </p>

                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Customer name
                    </p>
                    <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">
                      {order.customer_name || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      WhatsApp
                    </p>
                    <p className="mt-0.5 break-words text-sm text-slate-700">
                      {order.whatsapp_number || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Email address
                    </p>
                    <p className="mt-0.5 break-all text-sm text-slate-700">
                      {order.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Order notes
                  </p>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {order.note || "No customer note was provided."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {order.receipt_url && (
                <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                  <p className="mb-3 text-xs font-bold text-slate-700">
                    Payment receipt
                  </p>
                  <a
                    href={order.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block max-w-full"
                  >
                    <img
                      src={order.receipt_url}
                      alt="Payment receipt"
                      loading="lazy"
                      className="max-h-56 max-w-full rounded-xl border border-slate-200 object-contain"
                    />
                    <span className="mt-2 block text-xs font-semibold text-sky-700">
                      Open full receipt ↗
                    </span>
                  </a>
                </div>
              )}

              {/* Order actions */}
              <div className="border-t border-slate-100 p-4 sm:px-5">
                <OrderActions id={order.id} />
              </div>
            </article>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <h3 className="text-sm font-extrabold text-slate-800">
              No orders found
            </h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Try another search term or clear your filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            Page {safePage} of {totalPages}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              onClick={() =>
                setCurrentPage((page) => Math.max(page - 1, 1))
              }
              disabled={safePage === 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - safePage) <= 1
              )
              .map((page, index, pages) => (
                <span key={page} className="contents">
                  {index > 0 && pages[index - 1] !== page - 1 && (
                    <span className="px-1 text-xs text-slate-400">…</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold ${
                      safePage === page
                        ? "bg-sky-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}

            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              disabled={safePage === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}