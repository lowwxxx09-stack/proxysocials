export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import OrdersTable from "@/components/OrdersTable";

export default async function OrdersPage() {
  const { data: orders, error } = await supabase
    .from("order")
    .select(
      `
      *,
      services (
        title,
        category
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading orders:", error);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-800">
            Unable to load orders
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Please refresh the page and try again.
          </p>
        </div>
      </main>
    );
  }

  const allOrders = orders ?? [];

  const totalOrders = allOrders.length;

  const pendingOrders = allOrders.filter(
    (order: any) =>
      order.order_status === "pending" ||
      order.order_status === "pending_verification"
  ).length;

  const completedOrders = allOrders.filter(
    (order: any) => order.order_status === "completed"
  ).length;

  const rejectedOrders = allOrders.filter(
    (order: any) => order.order_status === "rejected"
  ).length;

  const totalRevenue = allOrders
    .filter(
      (order: any) => order.order_status === "completed"
    )
    .reduce(
      (sum: number, order: any) =>
        sum + Number(order.amount || 0),
      0
    );

  const metrics = [
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
      description: "All customer orders",
      accent: "bg-slate-800",
      icon: "01",
    },
    {
      label: "Pending",
      value: pendingOrders.toLocaleString(),
      description: "Awaiting review",
      accent: "bg-amber-500",
      icon: "02",
    },
    {
      label: "Completed",
      value: completedOrders.toLocaleString(),
      description: "Successfully fulfilled",
      accent: "bg-emerald-600",
      icon: "03",
    },
    {
      label: "Rejected",
      value: rejectedOrders.toLocaleString(),
      description: "Orders not approved",
      accent: "bg-rose-500",
      icon: "04",
    },
    {
      label: "Total Revenue",
      value: `₦${totalRevenue.toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`,
      description: "From completed orders",
      accent: "bg-slate-800",
      icon: "₦",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Management / Orders
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Orders
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Review customer orders, verify payments, and manage
                order fulfilment from one place.
              </p>
            </div>

            <div className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {totalOrders.toLocaleString()}
              </span>{" "}
              total records
            </div>
          </div>
        </div>

        {/* Summary metrics */}
        <section
          aria-label="Order summary"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  {metric.label}
                </p>

                <span
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold text-white ${metric.accent}`}
                >
                  {metric.icon}
                </span>
              </div>

              <p
                className={`mt-5 break-words font-bold tracking-tight text-slate-900 ${
                  metric.label === "Total Revenue"
                    ? "text-xl sm:text-2xl"
                    : "text-3xl"
                }`}
              >
                {metric.value}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {metric.description}
              </p>

              <div
                className={`absolute bottom-0 left-0 h-0.5 w-full opacity-70 ${metric.accent}`}
              />
            </div>
          ))}
        </section>

        {/* Orders list */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-slate-900">
              All orders
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search, filter, and manage individual orders below.
            </p>
          </div>

          {allOrders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
                —
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No orders yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Customer orders will appear here when available.
              </p>
            </div>
          ) : (
            <div className="p-3 sm:p-5">
              <OrdersTable orders={allOrders} />
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs text-slate-400">
          ProxySocials · Order Management
        </p>
      </div>
    </main>
  );
}