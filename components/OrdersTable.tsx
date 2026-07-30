"use client";

import { useMemo, useState } from "react";
import OrderActions from "@/components/OrderActions";

export default function OrdersTable({
  orders,
}: {
  orders: any[];
}) {
  const [search, setSearch] = useState("");
const [filter, setFilter] = useState("all");
const [sortBy, setSortBy] = useState("newest");
const [dateFilter, setDateFilter] = useState("all");
const [currentPage, setCurrentPage] = useState(1);

const ordersPerPage = 10;
  const filteredOrders = useMemo(() => {
  let result = [...orders].filter((order) => {
    const text = search.toLowerCase();

    const matchesSearch =
      order.customer_name?.toLowerCase().includes(text) ||
      order.whatsapp_number?.toLowerCase().includes(text) ||
      order.email?.toLowerCase().includes(text) ||
      order.services?.title?.toLowerCase().includes(text) ||
      order.services?.category?.toLowerCase().includes(text);

    const matchesFilter =
      filter === "all" ||
      order.order_status === filter;

    return matchesSearch && matchesFilter;
  });
  if (sortBy === "newest") {
  result.sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );
}

if (sortBy === "oldest") {
  result.sort(
    (a: any, b: any) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
  );
}

if (sortBy === "highest") {
  result.sort(
    (a: any, b: any) =>
      Number(b.amount) - Number(a.amount)
  );
}

if (sortBy === "lowest") {
  result.sort(
    (a: any, b: any) =>
      Number(a.amount) - Number(b.amount)
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
      return (
        now.getTime() - created.getTime() <=
        7 * 24 * 60 * 60 * 1000
      );
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
const totalPages = Math.ceil(
  filteredOrders.length / ordersPerPage
);

const startIndex = (currentPage - 1) * ordersPerPage;

const paginatedOrders = filteredOrders.slice(
  startIndex,
  startIndex + ordersPerPage
);
  return (
    <>
    
      <div className="flex flex-col lg:flex-row gap-4 mb-8">

  <input
    type="text"
    placeholder="🔍 Search customer, WhatsApp, email or service..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="flex-1 p-4 text-lg bg-white border rounded-xl shadow"
  />

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="p-4 bg-white border rounded-xl shadow"
  >
    <option value="newest">🕒 Newest</option>
    <option value="oldest">📜 Oldest</option>
    <option value="highest">💰 Highest Amount</option>
    <option value="lowest">💵 Lowest Amount</option>
  </select>

  <select
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="p-4 bg-white border rounded-xl shadow"
  >
    <option value="all">📅 All Time</option>
    <option value="today">Today</option>
    <option value="week">Last 7 Days</option>
    <option value="month">This Month</option>
    <option value="year">This Year</option>
  </select>

</div>
<div className="flex flex-wrap gap-3 mb-8">

  <button
    onClick={() => setFilter("all")}
    className={`px-4 py-2 rounded-xl font-semibold ${
      filter === "all"
        ? "bg-sky-600 text-white"
        : "bg-white border"
    }`}
  >
    All
  </button>

  <button
    onClick={() => setFilter("pending_verification")}
    className={`px-4 py-2 rounded-xl font-semibold ${
      filter === "pending_verification"
        ? "bg-yellow-500 text-white"
        : "bg-white border"
    }`}
  >
    Pending
  </button>

  <button
    onClick={() => setFilter("completed")}
    className={`px-4 py-2 rounded-xl font-semibold ${
      filter === "completed"
        ? "bg-green-600 text-white"
        : "bg-white border"
    }`}
  >
    Completed
  </button>

  <button
    onClick={() => setFilter("rejected")}
    className={`px-4 py-2 rounded-xl font-semibold ${
      filter === "rejected"
        ? "bg-red-600 text-white"
        : "bg-white border"
    }`}
  >
    Rejected
  </button>

</div>
      <div className="space-y-6">

        {paginatedOrders.map((order: any) => (

          <div
            key={order.id}
            className="bg-white rounded-2xl shadow-md p-6"
          >

            <div className="flex justify-between items-start">

              <div>

                <h2 className="text-2xl font-bold">
                  {order.services?.title}
                </h2>

                <p className="text-sky-600 font-semibold">
                  {order.services?.category}
                </p>

              </div>

              <span
  className={`px-4 py-2 rounded-full font-semibold text-sm ${
    order.order_status === "pending_verification"
      ? "bg-yellow-100 text-yellow-700"
      : order.order_status === "completed"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700"
  }`}
>
  {order.order_status === "pending_verification"
    ? "🟡 Pending"
    : order.order_status === "completed"
    ? "🟢 Completed"
    : "🔴 Rejected"}
</span>

            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-6">

              <div>

                <p>
                  <strong>Customer:</strong>{" "}
                  {order.customer_name || "Not provided"}
                </p>

                <p>
                  <strong>WhatsApp:</strong>{" "}
                  {order.whatsapp_number || "Not provided"}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {order.email || "Not provided"}
                </p>

                <p>
                  <strong>Amount:</strong> ₦{order.amount}
                </p>

              </div>

              <div>

                <p>
                  <strong>Order ID:</strong>
                </p>

                <p className="text-gray-500 break-all">
                  {order.id}
                </p>

                <p className="mt-3">
                  <strong>Customer Note:</strong>
                </p>

                <p className="text-gray-600">
                  {order.note || "No note"}
                </p>

              </div>

            </div>

            {order.receipt_url && (

              <div className="mt-6">

                <p className="font-semibold mb-3">
                  Payment Receipt
                </p>

                <a
                  href={order.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >

                  <img
                    src={order.receipt_url}
                    alt="Payment Receipt"
                    className="w-full max-w-sm rounded-xl border shadow hover:scale-105 transition duration-300"
                  />

                </a>

                <p className="text-sm text-gray-500 mt-2">
                  Click the image to view full size.
                </p>

              </div>

            )}

            <div className="mt-6">
              <OrderActions id={order.id} />
            </div>

          </div>

        ))}

        {filteredOrders.length === 0 && (

          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">

            No matching orders found.

          </div>

        )}
{totalPages > 1 && (

  <div className="flex items-center justify-center gap-2 mt-8">

    <button
      onClick={() =>
        setCurrentPage((page) => Math.max(page - 1, 1))
      }
      disabled={currentPage === 1}
      className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
    >
      ← Previous
    </button>

    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-4 py-2 rounded-lg ${
          currentPage === i + 1
            ? "bg-sky-600 text-white"
            : "bg-gray-200"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() =>
        setCurrentPage((page) =>
          Math.min(page + 1, totalPages)
        )
      }
      disabled={currentPage === totalPages}
      className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
    >
      Next →
    </button>

  </div>

)}
      </div>

    </>

  );
}