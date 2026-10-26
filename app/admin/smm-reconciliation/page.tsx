
"use client";

import { useCallback, useEffect, useState } from "react";

type SmmOrder = {
  id: string;
  user_id: string;
  service_id: string;
  target_url: string;
  quantity: number;
  retail_charge: number | string;
  provider_cost: number | string | null;
  provider_order_id: string | null;
  status: string;
  last_error: string | null;
  refund_amount: number | string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  customer_email?: string;
};

type ProviderStatusResult = {
  success: boolean;
  orderId?: string;
  internalStatus?: string;
  providerOrderId?: string;
  providerStatus?: string;
  charge?: string | number | null;
  startCount?: string | number | null;
  remains?: string | number | null;
  currency?: string | null;
  checkedAt?: string;
  message?: string;
  error?: string;
};

function money(value: number | string | null | undefined) {
  return `₦${Number(value ?? 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SmmReconciliationPage() {
  const [orders, setOrders] = useState<SmmOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, ProviderStatusResult>
  >({});

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await fetch("/api/admin/smm/reconciliation", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(data.error || "Unable to load SMM orders.");
      }

      setOrders(data.orders ?? []);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to load SMM orders.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function checkProviderStatus(order: SmmOrder) {
    setCheckingId(order.id);
    setResults((current) => {
      const next = { ...current };
      delete next[order.id];
      return next;
    });

    try {
      const response = await fetch("/api/admin/smm/reconcile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
        cache: "no-store",
      });

      const data = (await response.json()) as ProviderStatusResult;

      setResults((current) => ({
        ...current,
        [order.id]: {
          ...data,
          success: data.success === true && response.ok,
        },
      }));
    } catch {
      setResults((current) => ({
        ...current,
        [order.id]: {
          success: false,
          message: "Could not reach the reconciliation API.",
        },
      }));
    } finally {
      setCheckingId(null);
    }
  }

  const totalReserved = orders.reduce(
    (sum, order) => sum + Number(order.retail_charge || 0),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              ProxySocials / Administration
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              SMM Reconciliation
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Investigate uncertain provider orders and check their current
              provider status before taking further action.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="w-fit rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh orders"}
          </button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Orders needing review</p>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "…" : orders.length.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total customer funds reserved
            </p>
            <p className="mt-3 break-words text-2xl font-bold text-cyan-300 sm:text-3xl">
              {money(totalReserved)}
            </p>
          </div>
        </section>

        {pageError && (
          <div className="mb-6 rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-200">
            {pageError}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading orders…
          </div>
        ) : !pageError && orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950 text-xl text-emerald-300">
              ✓
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              No orders need manual review
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Orders requiring investigation will appear here.
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            {orders.map((order) => {
              const result = results[order.id];
              const isChecking = checkingId === order.id;

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                >
                  <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-all font-mono text-xs text-slate-500">
                        Order ID: {order.id}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold">
                        {order.service_name ?? "SMM service"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Created {dateTime(order.created_at)}
                      </p>
                    </div>

                    <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-amber-700 bg-amber-950/60 px-3 py-1.5 text-xs font-semibold text-amber-300">
                      Manual review
                    </span>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Customer
                      </p>
                      <p className="mt-2 break-all text-sm">
                        {order.customer_email ?? order.user_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Customer charge
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {money(order.retail_charge)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Quantity
                      </p>
                      <p className="mt-2 text-sm">
                        {order.quantity.toLocaleString()}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Provider order ID
                      </p>
                      <p className="mt-2 break-all font-mono text-sm">
                        {order.provider_order_id ?? "Not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Refund recorded
                      </p>
                      <p className="mt-2 text-sm">
                        {money(order.refund_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Last updated
                      </p>
                      <p className="mt-2 text-sm">
                        {dateTime(order.updated_at)}
                      </p>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Target URL
                      </p>
                      <p className="mt-2 break-all text-sm text-cyan-300">
                        {order.target_url}
                      </p>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Recorded error / reason
                      </p>
                      <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950 p-4 font-sans text-sm leading-6 text-slate-300">
                        {order.last_error || "No error details recorded."}
                      </pre>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 bg-slate-950/50 p-5">
                    <button
                      type="button"
                      onClick={() => void checkProviderStatus(order)}
                      disabled={isChecking || !order.provider_order_id}
                      title={
                        !order.provider_order_id
                          ? "No provider order ID is recorded"
                          : undefined
                      }
                      className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    >
                      {isChecking
                        ? "Checking provider..."
                        : "Check Provider Status"}
                    </button>

                    {!order.provider_order_id && (
                      <p className="mt-3 text-sm text-amber-300">
                        No provider order ID is recorded. This order needs
                        manual investigation with the provider.
                      </p>
                    )}

                    {result && (
                      <div
                        className={`mt-4 rounded-xl border p-4 ${
                          result.success
                            ? "border-cyan-900 bg-cyan-950/30"
                            : "border-amber-900 bg-amber-950/30"
                        }`}
                      >
                        <h3 className="font-semibold">
                          {result.success
                            ? "Provider response"
                            : "Status check needs attention"}
                        </h3>

                        {result.success && (
                          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs text-slate-400">
                                Provider status
                              </p>
                              <p className="mt-1 font-semibold text-cyan-300">
                                {result.providerStatus ?? "Unknown"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Remaining quantity
                              </p>
                              <p className="mt-1 font-semibold">
                                {result.remains ?? "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Start count
                              </p>
                              <p className="mt-1 font-semibold">
                                {result.startCount ?? "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Provider charge
                              </p>
                              <p className="mt-1 font-semibold">
                                {result.charge == null
                                  ? "Not provided"
                                  : `${result.charge} ${result.currency ?? ""}`}
                              </p>
                            </div>
                          </div>
                        )}

                        <p className="mt-3 break-words text-sm text-slate-300">
                          {result.message ??
                            result.error ??
                            "Review the provider response."}
                        </p>

                        {result.checkedAt && (
                          <p className="mt-2 text-xs text-slate-500">
                            Checked {dateTime(result.checkedAt)}
                          </p>
                        )}

                        <p className="mt-3 text-xs leading-5 text-amber-200">
                          This check does not change the order status or
                          refund funds. Confirm the outcome before taking
                          financial action.
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <p className="mt-8 text-center text-xs text-slate-600">
          ProxySocials · SMM Operations
        </p>
      </div>
    </main>
  );
}
