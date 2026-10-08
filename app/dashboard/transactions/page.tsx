import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type Transaction = {
  id: string;
  type: string | null;
  amount: number | string | null;
  description: string | null;
  reference: string | null;
  status: string | null;
  created_at: string;
};

type TransactionCategory =
  | "deposit"
  | "purchase"
  | "reward"
  | "refund"
  | "adjustment"
  | "other";

type FilterType =
  | "all"
  | "deposit"
  | "purchase"
  | "reward"
  | "refund";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function normalizeStatus(status: string | null) {
  const value = String(status ?? "").toLowerCase();

  if (
    ["success", "completed", "complete", "successful"].includes(value)
  ) {
    return "completed";
  }

  if (["pending", "processing"].includes(value)) {
    return "pending";
  }

  if (
    ["failed", "failure", "rejected", "cancelled", "canceled"].includes(value)
  ) {
    return "failed";
  }

  return value || "unknown";
}

function isSuccessful(status: string | null) {
  return [
    "success",
    "completed",
    "complete",
    "successful",
  ].includes(String(status ?? "").toLowerCase());
}

function getCategory(transaction: Transaction): TransactionCategory {
  const type = String(transaction.type ?? "").toLowerCase();
  const description = String(transaction.description ?? "").toLowerCase();

  // Referral rewards
  if (
    type === "credit" &&
    (
      description.includes("referral") ||
      description.includes("refer") ||
      description.includes("reward")
    )
  ) {
    return "reward";
  }

  if (
    description.includes("referral first-purchase bonus") ||
    description.includes("referral signup bonus")
  ) {
    return "reward";
  }

  // Wallet deposits / funding
  if (
    type === "deposit" ||
    type === "fund_wallet" ||
    description.includes("wallet funding") ||
    description.includes("account funding") ||
    description.includes("fund wallet")
  ) {
    return "deposit";
  }

  // Purchases
  if (
    type === "wallet_payment" ||
    type === "debit" ||
    description.includes("purchase")
  ) {
    return "purchase";
  }

  // Refunds
  if (
    type === "refund" ||
    description.includes("refund")
  ) {
    return "refund";
  }

  // Manual/admin adjustments
  if (type === "adjustment") {
    return "adjustment";
  }

  return "other";
}

function getCategoryLabel(category: TransactionCategory) {
  switch (category) {
    case "deposit":
      return "Wallet Deposit";

    case "purchase":
      return "Purchase";

    case "reward":
      return "Referral Reward";

    case "refund":
      return "Refund";

    case "adjustment":
      return "Wallet Adjustment";

    default:
      return "Transaction";
  }
}

function getCustomerDescription(transaction: Transaction) {
  const category = getCategory(transaction);

  if (category === "deposit") {
    return "Wallet funding";
  }

  if (category === "purchase") {
    return "Service purchase";
  }

  if (category === "reward") {
    return "Referral reward";
  }

  if (category === "refund") {
    return "Wallet refund";
  }

  if (category === "adjustment") {
    return "Wallet adjustment";
  }

  const description = String(transaction.description ?? "").trim();

  return description || "Wallet transaction";
}

function isCreditTransaction(transaction: Transaction) {
  const category = getCategory(transaction);

  return (
    category === "deposit" ||
    category === "reward" ||
    category === "refund"
  );
}

function getTransactionIcon(category: TransactionCategory) {
  switch (category) {
    case "deposit":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </div>
      );

    case "purchase":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2h12v20l-6-3-6 3V2Z" />
          </svg>
        </div>
      );

    case "reward":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
            <path d="M2 7h20v5H2z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z" />
            <path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" />
          </svg>
        </div>
      );

    case "refund":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v6h6" />
          </svg>
        </div>
      );

    case "adjustment":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      );

    default:
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 3v18" />
            <path d="M17 7H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      );
  }
}

function StatusBadge({ status }: { status: string | null }) {
  const normalized = normalizeStatus(status);

  if (normalized === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }

  if (normalized === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  }

  if (normalized === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
      {normalized}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  valueClassName = "text-slate-950",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>

        {icon}
      </div>

      <p className={`text-lg font-black tracking-tight ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function MobileTransactionCard({
  transaction,
}: {
  transaction: Transaction;
}) {
  const category = getCategory(transaction);
  const credit = isCreditTransaction(transaction);
  const amount = Number(transaction.amount ?? 0);

  return (
    <Link
      href={`/dashboard/transactions/${transaction.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        {getTransactionIcon(category)}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-950">
                {getCustomerDescription(transaction)}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {getCategoryLabel(category)}
              </p>
            </div>

            <p
              className={`shrink-0 text-sm font-black ${
                credit ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {credit ? "+" : "-"}
              {formatNaira(amount)}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                {formatDate(transaction.created_at)}
              </p>

              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                {formatTime(transaction.created_at)}
              </p>
            </div>

            <StatusBadge status={transaction.status} />
          </div>

          {transaction.reference && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Reference
              </p>

              <p className="mt-1 break-all text-[10px] font-medium text-slate-500">
                {transaction.reference}
              </p>
            </div>
          )}
        </div>

        <span className="mt-1 shrink-0 text-slate-300">
          →
        </span>
      </div>
    </Link>
  );
}

function DesktopTransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const category = getCategory(transaction);
  const credit = isCreditTransaction(transaction);
  const amount = Number(transaction.amount ?? 0);

  return (
    <tr className="border-t border-slate-100 transition hover:bg-sky-50/40">
      <td className="px-5 py-4">
        <Link
          href={`/dashboard/transactions/${transaction.id}`}
          className="flex items-center gap-3"
        >
          {getTransactionIcon(category)}

          <div className="min-w-0">
            <p className="max-w-[260px] truncate text-sm font-extrabold text-slate-950">
              {getCustomerDescription(transaction)}
            </p>

            <p className="mt-0.5 text-xs font-medium text-slate-400">
              {getCategoryLabel(category)}
            </p>
          </div>
        </Link>
      </td>

      <td className="px-5 py-4">
        <Link href={`/dashboard/transactions/${transaction.id}`}>
          <p
            className={`text-sm font-black ${
              credit ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {credit ? "+" : "-"}
            {formatNaira(amount)}
          </p>
        </Link>
      </td>

      <td className="px-5 py-4">
        <Link href={`/dashboard/transactions/${transaction.id}`}>
          <p className="text-xs font-semibold text-slate-600">
            {formatDate(transaction.created_at)}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {formatTime(transaction.created_at)}
          </p>
        </Link>
      </td>

      <td className="px-5 py-4">
        <Link href={`/dashboard/transactions/${transaction.id}`}>
          <StatusBadge status={transaction.status} />
        </Link>
      </td>

      <td className="px-5 py-4">
        <Link href={`/dashboard/transactions/${transaction.id}`}>
          <p
            className="max-w-[220px] truncate text-[10px] font-medium text-slate-400"
            title={transaction.reference ?? ""}
          >
            {transaction.reference || "—"}
          </p>
        </Link>
      </td>
    </tr>
  );
}

function EmptyTransactions({
  filter,
}: {
  filter: FilterType;
}) {
  const label =
    filter === "deposit"
      ? "deposit"
      : filter === "purchase"
        ? "purchase"
        : filter === "reward"
          ? "reward"
          : filter === "refund"
            ? "refund"
            : "";

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
        <svg
          className="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M6 2h12v20H6z" />
          <path d="M9 6h6" />
          <path d="M9 10h6" />
          <path d="M9 14h4" />
        </svg>
      </div>

      <h3 className="mt-4 text-sm font-extrabold text-slate-900">
        No transactions found
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {filter === "all"
          ? "Your wallet activity will appear here when you fund your wallet, make purchases, or receive rewards."
          : `There are no ${label} transactions in your wallet history.`}
      </p>
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
        active
          ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
          : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    filter?: string;
  }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const requestedFilter = params.filter;

  const filter: FilterType =
    requestedFilter === "deposit" ||
    requestedFilter === "purchase" ||
    requestedFilter === "reward" ||
    requestedFilter === "refund"
      ? requestedFilter
      : "all";

  const [
    { data: wallet, error: walletError },
    { data: transactions, error: transactionsError },
  ] = await Promise.all([
    supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("wallet_transactions")
      .select(
        "id, type, amount, description, reference, status, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const balance = Number(wallet?.balance ?? 0);

  const allTransactions: Transaction[] = transactions ?? [];

  const successfulTransactions = allTransactions.filter((transaction) =>
    isSuccessful(transaction.status)
  );

  const totalDeposited = successfulTransactions
    .filter(
      (transaction) => getCategory(transaction) === "deposit"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount ?? 0),
      0
    );

  const totalSpent = successfulTransactions
    .filter(
      (transaction) => getCategory(transaction) === "purchase"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount ?? 0),
      0
    );

  const totalRewards = successfulTransactions
    .filter(
      (transaction) => getCategory(transaction) === "reward"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount ?? 0),
      0
    );

  const totalRefunded = successfulTransactions
    .filter(
      (transaction) => getCategory(transaction) === "refund"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount ?? 0),
      0
    );

  const filteredTransactions =
    filter === "all"
      ? allTransactions
      : allTransactions.filter(
          (transaction) =>
            getCategory(transaction) === filter
        );

  const hasError = Boolean(walletError || transactionsError);

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div>
        {/* Desktop top bar */}
        <div className="hidden h-16 items-center justify-between border-b border-white/10 px-8 lg:flex">
          <div>
            <p className="text-sm font-semibold text-white/80">
              Transaction Center
            </p>

            <p className="text-xs text-white/40">
              Review your complete wallet activity
            </p>
          </div>

          <Link
            href="/dashboard/wallet"
            className="rounded-xl border border-sky-400/20 bg-sky-400/5 px-4 py-2 text-xs font-bold text-sky-300 transition hover:border-sky-400/40 hover:bg-sky-400/10"
          >
            Wallet
          </Link>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 active:scale-[0.98]"
            >
              <span className="text-lg leading-none text-sky-500">
                ←
              </span>
              <span>Go Back</span>
            </Link>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />

                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
                    ProxySocials Wallet
                  </span>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Transaction History
                </h1>

                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
                  Keep track of your deposits, purchases, referral rewards,
                  refunds, and wallet activity.
                </p>
              </div>

              <Link
                href="/dashboard/wallet"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-300"
              >
                <span>Fund Wallet</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Error */}
          {hasError && (
            <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              We couldn't load some wallet information. Please refresh the
              page and try again.
            </div>
          )}

          {/* Summary */}
          <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {/* Current balance */}
            <div className="relative col-span-2 overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 p-4 shadow-xl shadow-sky-950/40 lg:col-span-1">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white/75">
                    Current Balance
                  </p>

                  <div className="rounded-lg border border-white/10 bg-white/10 p-2">
                    <svg
                      className="h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                      <path d="M16 12h.01" />
                      <path d="M2 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
                    </svg>
                  </div>
                </div>

                <p className="mt-3 text-xl font-black text-white">
                  {formatNaira(balance)}
                </p>
              </div>
            </div>

            <SummaryCard
              label="Deposited"
              value={formatNaira(totalDeposited)}
              icon={
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  ↓
                </div>
              }
              valueClassName="text-emerald-600"
            />

            <SummaryCard
              label="Spent"
              value={formatNaira(totalSpent)}
              icon={
                <div className="rounded-lg bg-red-50 p-2 text-red-600">
                  ↑
                </div>
              }
              valueClassName="text-red-600"
            />

            <SummaryCard
              label="Rewards"
              value={formatNaira(totalRewards)}
              icon={
                <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
                  ★
                </div>
              }
              valueClassName="text-sky-600"
            />

            <SummaryCard
              label="Refunded"
              value={formatNaira(totalRefunded)}
              icon={
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  ↩
                </div>
              }
              valueClassName="text-blue-600"
            />
          </div>

          {/* Transaction section */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-sky-950/10">
            <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Wallet Activity
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Showing {filteredTransactions.length} transaction
                    {filteredTransactions.length === 1 ? "" : "s"}
                  </p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <FilterLink
                    href="/dashboard/transactions"
                    label="All"
                    active={filter === "all"}
                  />

                  <FilterLink
                    href="/dashboard/transactions?filter=deposit"
                    label="Deposits"
                    active={filter === "deposit"}
                  />

                  <FilterLink
                    href="/dashboard/transactions?filter=purchase"
                    label="Purchases"
                    active={filter === "purchase"}
                  />

                  <FilterLink
                    href="/dashboard/transactions?filter=reward"
                    label="Rewards"
                    active={filter === "reward"}
                  />

                  <FilterLink
                    href="/dashboard/transactions?filter=refund"
                    label="Refunds"
                    active={filter === "refund"}
                  />
                </div>
              </div>
            </div>

            {/* Mobile transactions */}
            <div className="space-y-3 bg-slate-50 p-4 md:hidden">
              {filteredTransactions.length === 0 ? (
                <EmptyTransactions filter={filter} />
              ) : (
                filteredTransactions.map((transaction) => (
                  <MobileTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              )}
            </div>

            {/* Desktop transactions */}
            <div className="hidden overflow-x-auto md:block">
              {filteredTransactions.length === 0 ? (
                <div className="p-6">
                  <EmptyTransactions filter={filter} />
                </div>
              ) : (
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="bg-sky-50/50 text-left">
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Transaction
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Date
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Reference
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <DesktopTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Information note */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-sky-400/10 bg-sky-400/5 p-4">
            <div className="mt-0.5 text-sky-400">ⓘ</div>

            <p className="text-xs leading-5 text-slate-400">
              Transaction records are generated automatically whenever your
              wallet is funded, used for a purchase, receives a referral
              reward, or receives a refund. If you notice something unusual,
              contact support with the transaction reference.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}