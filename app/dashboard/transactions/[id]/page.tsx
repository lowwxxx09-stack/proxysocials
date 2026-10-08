import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Transaction = {
  id: string;
  type: string | null;
  amount: number | string | null;
  description: string | null;
  reference: string | null;
  status: string | null;
  created_at: string;
};

type Order = {
  id: string;
  service_id: string | null;
  quantity: number | null;
  amount: number | string | null;
  payment_status: string | null;
  order_status: string | null;
  created_at: string;
  payment_method: string | null;
  payment_reference: string | null;
  customer_name: string | null;
  whatsapp_number: string | null;
  email: string | null;
  note: string | null;
  order_content: unknown;
  services:
    | {
        title: string | null;
        category: string | null;
      }
    | {
        title: string | null;
        category: string | null;
      }[]
    | null;
};

type TransactionCategory =
  | "Deposit"
  | "Purchase"
  | "Reward"
  | "Refund"
  | "Adjustment"
  | "Transaction";

function formatNaira(amount: number | string | null) {
  const value = Number(amount ?? 0);

  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status: string | null) {
  return (status ?? "").trim().toLowerCase();
}

function getStatusLabel(status: string | null) {
  const normalized = normalizeStatus(status);

  if (
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "completed"
  ) {
    return "Completed";
  }

  if (normalized === "pending" || normalized === "processing") {
    return "Pending";
  }

  if (
    normalized === "failed" ||
    normalized === "failure" ||
    normalized === "rejected" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return "Failed";
  }

  return status || "Unknown";
}

function isSuccessful(status: string | null) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "completed"
  );
}

function getCategory(
  type: string | null,
  description: string | null
): TransactionCategory {
  const normalizedType = String(type ?? "").trim().toLowerCase();
  const normalizedDescription = String(description ?? "")
    .trim()
    .toLowerCase();

  // Purchases MUST be checked first.
  if (
    normalizedType === "wallet_payment" ||
    normalizedType === "debit" ||
    normalizedDescription.includes("purchase") ||
    normalizedDescription.includes("order") ||
    normalizedDescription.includes("service")
  ) {
    return "Purchase";
  }

  // Wallet deposits / funding
  if (
    normalizedType === "fund_wallet" ||
    normalizedType === "deposit" ||
    normalizedDescription.includes("wallet funding") ||
    normalizedDescription.includes("account funding") ||
    normalizedDescription.includes("fund wallet")
  ) {
    return "Deposit";
  }

  // Referral rewards
  if (
    normalizedType === "credit" &&
    (normalizedDescription.includes("referral") ||
      normalizedDescription.includes("refer") ||
      normalizedDescription.includes("reward") ||
      normalizedDescription.includes("bonus"))
  ) {
    return "Reward";
  }

  if (
    normalizedDescription.includes("referral first-purchase bonus") ||
    normalizedDescription.includes("referral signup bonus")
  ) {
    return "Reward";
  }

  // Refunds
  if (
    normalizedType === "refund" ||
    normalizedDescription.includes("refund")
  ) {
    return "Refund";
  }

  // Manual/admin adjustments
  if (normalizedType === "adjustment") {
    return "Adjustment";
  }

  return "Transaction";
}

function isCreditTransaction(transaction: Transaction) {
  const category = getCategory(
    transaction.type,
    transaction.description
  );

  return (
    category === "Deposit" ||
    category === "Reward" ||
    category === "Refund"
  );
}

function getIcon(category: TransactionCategory) {
  switch (category) {
    case "Deposit":
      return "＋";

    case "Purchase":
      return "🛍";

    case "Reward":
      return "🎁";

    case "Refund":
      return "↩";

    case "Adjustment":
      return "⚙";

    default:
      return "₦";
  }
}

function getTransactionTitle(
  category: TransactionCategory,
  transaction: Transaction
) {
  if (category === "Deposit") {
    return "Wallet Deposit";
  }

  if (category === "Purchase") {
    return "Service Purchase";
  }

  if (category === "Reward") {
    return "Referral Reward";
  }

  if (category === "Refund") {
    return "Wallet Refund";
  }

  if (category === "Adjustment") {
    return "Wallet Adjustment";
  }

  return transaction.description || "Wallet Transaction";
}

function getTransactionTypeLabel(type: string | null) {
  switch (String(type ?? "").toLowerCase()) {
    case "wallet_payment":
      return "Wallet Payment";

    case "fund_wallet":
      return "Wallet Funding";

    case "deposit":
      return "Deposit";

    case "credit":
      return "Credit";

    case "debit":
      return "Debit";

    case "refund":
      return "Refund";

    case "adjustment":
      return "Adjustment";

    default:
      return type || "—";
  }
}

function getPaymentMethod(transaction: Transaction) {
  const type = String(transaction.type ?? "").toLowerCase();
  const description = String(transaction.description ?? "").toLowerCase();
  const reference = String(transaction.reference ?? "").toUpperCase();

  if (
    type === "fund_wallet" ||
    type === "deposit" ||
    description.includes("flutterwave") ||
    reference.startsWith("TRANSACTPAY-") ||
    reference.startsWith("PROXY-WALLET-")
  ) {
    if (
      description.includes("flutterwave") ||
      reference.startsWith("PROXY-WALLET-")
    ) {
      return "Flutterwave";
    }

    if (reference.startsWith("TRANSACTPAY-")) {
      return "TransactPay";
    }

    return "Wallet Funding";
  }

  if (type === "wallet_payment") {
    return "ProxySocials Wallet";
  }

  return null;
}

function getOrderService(order: Order) {
  if (Array.isArray(order.services)) {
    return order.services[0] ?? null;
  }

  return order.services;
}

function getOrderStatusClass(status: string | null) {
  const normalized = normalizeStatus(status);

  if (
    normalized === "completed" ||
    normalized === "success" ||
    normalized === "successful"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized === "pending" || normalized === "processing") {
    return "bg-amber-50 text-amber-700";
  }

  if (
    normalized === "failed" ||
    normalized === "rejected" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function StatusBadge({ status }: { status: string | null }) {
  const normalized = normalizeStatus(status);

  const successful =
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "completed";

  const pending =
    normalized === "pending" ||
    normalized === "processing";

  const failed =
    normalized === "failed" ||
    normalized === "failure" ||
    normalized === "rejected" ||
    normalized === "cancelled" ||
    normalized === "canceled";

  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
        successful
          ? "bg-emerald-50 text-emerald-700"
          : pending
            ? "bg-amber-50 text-amber-700"
            : failed
              ? "bg-red-50 text-red-700"
              : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          successful
            ? "bg-emerald-500"
            : pending
              ? "bg-amber-500"
              : failed
                ? "bg-red-500"
                : "bg-slate-400"
        }`}
      />

      {label}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-100 py-4 last:border-b-0">
      <span className="text-sm font-medium text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] break-all text-right text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

export default async function TransactionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * 1. Get the transaction.
   *
   * The user_id restriction ensures a customer can only
   * access their own transaction.
   */
  const { data: transaction } = await supabase
    .from("wallet_transactions")
    .select(
      "id, type, amount, description, reference, status, created_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!transaction) {
    notFound();
  }

  const category = getCategory(
    transaction.type,
    transaction.description
  );

  const isCredit = isCreditTransaction(transaction);
  const amount = Number(transaction.amount ?? 0);

  const title = getTransactionTitle(
    category,
    transaction
  );

  const paymentMethod = getPaymentMethod(transaction);

  /*
   * 2. If this is a wallet purchase, find the matching order.
   *
   * wallet_transactions.reference
   *        ↓
   * order.payment_reference
   *
   * The user_id condition prevents another user's order
   * from being displayed even if a reference is manipulated.
   */
  let order: Order | null = null;

  if (
  category === "Purchase" &&
  transaction.reference
) {
  const reference = transaction.reference.trim();

  // Wallet purchase references are generated as:
  // WALLET-{order.id}
  const orderId = reference.startsWith("WALLET-")
    ? reference.replace(/^WALLET-/, "")
    : null;

  if (orderId) {
    const { data: orderData } = await supabase
      .from("order")
      .select(
        `
          id,
          service_id,
          quantity,
          amount,
          payment_status,
          order_status,
          created_at,
          payment_method,
          payment_reference,
          customer_name,
          whatsapp_number,
          email,
          note,
          order_content,
          services (
            title,
            category
          )
        `
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    order = orderData as Order | null;
  }
}

  const orderService = order
    ? getOrderService(order)
    : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <span className="text-lg leading-none">
              ←
            </span>

            Transactions
          </Link>

          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              ProxySocials
            </p>

            <p className="text-sm font-extrabold text-slate-900">
              Transaction Details
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Page heading */}
        <div className="mb-6">
          <p className="mb-1 text-sm font-bold text-sky-600">
            Transaction Center
          </p>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Transaction Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review the details of this wallet transaction.
          </p>
        </div>

        {/* Main amount card */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  {category}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-2xl text-sky-400">
                    {getIcon(category)}
                  </div>

                  <div>
                    <p className="text-lg font-extrabold">
                      {title}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(transaction.created_at)} •{" "}
                      {formatTime(transaction.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <StatusBadge status={transaction.status} />
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Amount
              </p>

              <p
                className={`mt-2 text-4xl font-black tracking-tight sm:text-5xl ${
                  isCredit
                    ? "text-sky-300"
                    : "text-white"
                }`}
              >
                {isCredit ? "+" : "-"}
                {formatNaira(Math.abs(amount))}
              </p>

              <p className="mt-2 text-xs font-medium text-slate-500">
                {isCredit
                  ? "Amount credited to your wallet"
                  : "Amount deducted from your wallet"}
              </p>
            </div>
          </div>
        </section>

        {/* Order Details */}
        {category === "Purchase" && order && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-600">
                    Purchase
                  </p>

                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    Order Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Details of the service purchased.
                  </p>
                </div>

                <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-xl sm:flex">
                  🛍️
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6">
              {orderService?.title && (
                <div className="py-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Service
                  </p>

                  <p className="mt-1 text-lg font-black text-slate-950">
                    {orderService.title}
                  </p>

                  {orderService.category && (
                    <p className="mt-1 text-sm text-slate-500">
                      {orderService.category}
                    </p>
                  )}
                </div>
              )}

              <DetailRow
                label="Order ID"
                value={order.id}
              />

              <DetailRow
                label="Quantity"
                value={order.quantity?.toLocaleString("en-NG") ?? "—"}
              />

              <DetailRow
                label="Order amount"
                value={formatNaira(order.amount)}
              />

              <DetailRow
                label="Order status"
                value={
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold capitalize ${getOrderStatusClass(
                      order.order_status
                    )}`}
                  >
                    {getStatusLabel(order.order_status)}
                  </span>
                }
              />

              <DetailRow
                label="Payment status"
                value={
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold capitalize ${getOrderStatusClass(
                      order.payment_status
                    )}`}
                  >
                    {getStatusLabel(order.payment_status)}
                  </span>
                }
              />

              {order.payment_method && (
                <DetailRow
                  label="Payment method"
                  value={order.payment_method}
                />
              )}

              <DetailRow
                label="Order date"
                value={formatDate(order.created_at)}
              />
            </div>

            {order.note && (
              <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Order Note
                </p>

                <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {order.note}
                </p>
              </div>
            )}

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-5 sm:px-6">
              <Link
                href="/order-history"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600"
              >
                View Order History
                <span>→</span>
              </Link>
            </div>
          </section>
        )}

        {/* Purchase but order could not be found */}
        {category === "Purchase" && !order && (
          <section className="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-5 sm:p-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                ⚠️
              </div>

              <div>
                <p className="text-sm font-extrabold text-amber-900">
                  Order details unavailable
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  This purchase transaction was recorded, but the
                  associated order could not be found.
                </p>

                <Link
                  href="/order-history"
                  className="mt-3 inline-flex text-sm font-extrabold text-amber-900 underline underline-offset-4"
                >
                  Check order history
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Transaction Information */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-black text-slate-950">
              Transaction Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete information recorded for this transaction.
            </p>
          </div>

          <div className="px-5 sm:px-6">
            <DetailRow
              label="Transaction type"
              value={getTransactionTypeLabel(transaction.type)}
            />

            <DetailRow
              label="Category"
              value={category}
            />

            {paymentMethod && (
              <DetailRow
                label="Payment method"
                value={paymentMethod}
              />
            )}

            <DetailRow
              label="Status"
              value={
                <StatusBadge status={transaction.status} />
              }
            />

            <DetailRow
              label="Date"
              value={formatDate(transaction.created_at)}
            />

            <DetailRow
              label="Time"
              value={formatTime(transaction.created_at)}
            />

            <DetailRow
              label="Transaction ID"
              value={transaction.id}
            />
          </div>
        </section>

        {/* Description */}
        {transaction.description && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-extrabold text-slate-950">
              Description
            </p>

            <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {transaction.description}
            </p>
          </section>
        )}

        {/* Reference */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-extrabold text-slate-950">
            Payment Reference
          </p>

          <p className="mt-2 break-all rounded-2xl bg-slate-50 p-4 font-mono text-xs font-semibold text-slate-600">
            {transaction.reference || "No reference available"}
          </p>
        </section>

        {/* Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/transactions"
            className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            View All Transactions
          </Link>

          <Link
            href="/fund-wallet"
            className="flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600"
          >
            Fund Wallet
          </Link>
        </div>

        {/* Support note */}
        <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-center">
          <p className="text-xs leading-5 text-slate-600">
            If you notice anything unusual with this transaction,
            contact ProxySocials support with the transaction
            reference above.
          </p>
        </div>
      </div>
    </main>
  );
}