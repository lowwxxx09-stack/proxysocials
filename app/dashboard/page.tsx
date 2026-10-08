"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import CustomerMenu from "@/components/CustomerMenu";
import TelegramBanner from "@/components/TelegramBanner";
import TelegramSupportButton from "@/components/TelegramSupportButton";
import NotificationBell from "@/components/NotificationBell";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [
      { data: profileData, error: profileError },
      { data: walletData, error: walletError },
      { data: orderData, error: orderError },
      { data: referralData, error: referralError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),

      supabase
        .from("wallets")
        .select("id, user_id, balance")
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase
        .from("order")
        .select(`*, services (title, category)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("referrals")
        .select("id, reward_amount, status, created_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileError) {
      console.error(
        "PROFILE FETCH ERROR:",
        JSON.stringify(profileError, null, 2)
      );
    } else {
      setProfile(profileData);
    }

    if (walletError) {
      console.error(
        "WALLET FETCH ERROR:",
        JSON.stringify(walletError, null, 2)
      );
      setWallet(null);
    } else {
      setWallet(walletData);
    }

    if (orderError) {
      console.error(
        "ORDER FETCH ERROR:",
        JSON.stringify(orderError, null, 2)
      );
      setOrders([]);
    } else {
      setOrders(orderData || []);
    }

    if (referralError) {
      console.error(
        "REFERRAL FETCH ERROR:",
        JSON.stringify(referralError, null, 2)
      );
      setReferrals([]);
    } else {
      setReferrals(referralData || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 shadow-xl shadow-slate-300/50">
            <div className="absolute inset-0 rounded-2xl bg-sky-500/20 blur-xl" />
            <span className="relative text-xl font-black text-white">P</span>
          </div>

          <h1 className="mt-4 text-xl font-black tracking-tight text-slate-900">
            ProxySocials
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Preparing your dashboard...
          </p>

          <div className="mt-4 flex justify-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500" />
          </div>
        </div>
      </main>
    );
  }

  const balance = Number(wallet?.balance || 0);
  const recentOrders = orders.slice(0, 4);

  const completedOrders = orders.filter(
    (order) =>
      String(order.order_status || "").toLowerCase() === "completed"
  ).length;

  const totalSpent = orders.reduce(
    (total, order) => total + Number(order.amount || 0),
    0
  );

  const referralCode = profile?.referral_code || "None";

  const successfulReferrals = referrals.filter(
    (referral) =>
      String(referral.status || "").toLowerCase() === "completed"
  ).length;

  const pendingReferrals = referrals.filter(
    (referral) =>
      String(referral.status || "").toLowerCase() === "pending"
  ).length;

  const totalReferralEarnings = referrals
    .filter(
      (referral) =>
        String(referral.status || "").toLowerCase() === "completed"
    )
    .reduce(
      (total, referral) =>
        total + Number(referral.reward_amount || 0),
      0
    );

  function copyText(value: string, successMessage: string) {
    if (!value || value === "None") return;

    navigator.clipboard
      .writeText(value)
      .then(() => alert(successMessage))
      .catch(() => alert("Unable to copy. Please try again."));
  }

  function shareReferral() {
    if (!referralCode || referralCode === "None") return;

    const message = `🚀 Join me on ProxySocials!

Use my referral code ${referralCode} when creating your account.

Sign up here:

https://proxysocials.com/signup

#ProxySocials`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");
  }

  function formatStatus(status: string) {
    const normalized = String(status || "pending").toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "success"
    ) {
      return "Completed";
    }

    if (
      normalized === "rejected" ||
      normalized === "failed"
    ) {
      return "Failed";
    }

    return "Pending";
  }

  function statusClasses(status: string) {
    const normalized = String(status || "").toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "success"
    ) {
      return "bg-emerald-50 text-emerald-700";
    }

    if (
      normalized === "rejected" ||
      normalized === "failed"
    ) {
      return "bg-red-50 text-red-700";
    }

    return "bg-amber-50 text-amber-700";
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 pb-8">
      <CustomerMenu />

      <div className="mx-auto w-full max-w-6xl px-3 py-3.5 sm:px-5 sm:py-6 lg:px-8">
        <TelegramBanner />

        {/* PREMIUM HERO */}
        <section className="relative mt-3.5 overflow-hidden rounded-[24px] bg-slate-950 shadow-2xl shadow-slate-300/40 sm:mt-4 sm:rounded-[28px]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl" />

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative p-3.5 sm:p-6 lg:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sm">
                    ✦
                  </span>

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
                    ProxySocials
                  </p>
                </div>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Welcome back
                </p>

                <h1 className="mt-0.5 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                  {profile?.full_name || "User"} 👋
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <NotificationBell />

                <Link
                  href="/profile"
                  className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-base shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-sky-500/10"
                  aria-label="Profile"
                >
                  👤
                </Link>
              </div>
            </div>

            {/* WALLET */}
            <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.065] shadow-inner backdrop-blur-xl sm:mt-5 sm:rounded-[22px]">
              <div className="p-3.5 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Available balance
                      </p>

                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-emerald-300">
                        Wallet
                      </span>
                    </div>

                    <p className="mt-1 break-all text-[30px] font-black tracking-tight text-white sm:text-[36px]">
                      ₦{balance.toLocaleString()}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Ready to use across ProxySocials
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/10 bg-sky-500/10 text-lg">
                    💳
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-4">
                  <Link
                    href="/fund-wallet"
                    className="flex h-10 items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-black text-white shadow-lg shadow-sky-500/10 transition hover:bg-sky-400 active:scale-[0.98] sm:h-11"
                  >
                    + Fund Wallet
                  </Link>

                  <Link
                    href="/dashboard/transactions"
                    className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-4 text-xs font-black text-white transition hover:border-sky-400/20 hover:bg-white/10 active:scale-[0.98] sm:h-11"
                  >
                    View Transactions
                  </Link>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:mt-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-2.5 py-2.5 sm:px-3 sm:py-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Orders
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {orders.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-2.5 py-2.5 sm:px-3 sm:py-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Completed
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {completedOrders}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-2.5 py-2.5 sm:px-3 sm:py-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Total spent
                </p>

                <p className="mt-1 truncate text-lg font-black text-white">
                  ₦{totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-5">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Quick access
              </p>

              <h2 className="mt-0.5 text-sm font-black text-slate-900">
                What do you need?
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              {
                href: "/services",
                icon: "🛍️",
                title: "Services",
                bg: "bg-sky-50",
              },
              {
                href: "/fund-wallet",
                icon: "💳",
                title: "Fund",
                bg: "bg-emerald-50",
              },
              {
                href: "/order-history",
                icon: "🧾",
                title: "Orders",
                bg: "bg-blue-50",
              },
              {
                href: "/dashboard/transactions",
                icon: "💰",
                title: "Transactions",
                bg: "bg-sky-50",
              },
              {
                href: "/profile",
                icon: "👤",
                title: "Profile",
                bg: "bg-slate-100",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-w-0 flex-col items-center rounded-2xl border border-slate-200 bg-white px-1.5 py-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md active:scale-[0.98] sm:px-2 sm:py-3"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} text-base transition group-hover:scale-105`}
                >
                  {item.icon}
                </div>

                <span className="mt-1.5 truncate text-[9px] font-black text-slate-800 sm:text-[10px]">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* REFER & EARN */}
        <section className="relative mt-5 overflow-hidden rounded-[26px] bg-slate-950 shadow-xl shadow-slate-300/30">
          <div className="pointer-events-none absolute -right-24 -top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative p-3.5 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sm">
                    🎁
                  </span>

                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-300">
                    Refer & Earn
                  </p>
                </div>

                <h2 className="mt-2 text-lg font-black tracking-tight text-white sm:text-xl">
                  Earn ₦1,500
                </h2>

                <p className="mt-0.5 max-w-sm text-[11px] leading-5 text-slate-400 sm:text-xs">
                  Refer a new customer and get rewarded after their first
                  successful purchase.
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Earned
                </p>

                <p className="mt-0.5 text-base font-black text-emerald-300">
                  ₦{totalReferralEarnings.toLocaleString()}
                </p>
              </div>
            </div>

            {/* REFERRAL STATS */}
            <div className="mt-3.5 grid grid-cols-3 gap-2 sm:mt-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-2.5 py-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Successful
                </p>

                <p className="mt-1 text-base font-black text-emerald-300">
                  {successfulReferrals}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-2.5 py-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Pending
                </p>

                <p className="mt-1 text-base font-black text-amber-300">
                  {pendingReferrals}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-2.5 py-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Earnings
                </p>

                <p className="mt-1 truncate text-base font-black text-white">
                  ₦{totalReferralEarnings.toLocaleString()}
                </p>
              </div>
            </div>

            {/* REFERRAL CODE */}
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white p-2.5">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Your referral code
                  </p>

                  <p className="mt-0.5 truncate text-sm font-black tracking-wide text-slate-900">
                    {referralCode}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Copy referral code"
                  onClick={() =>
                    copyText(
                      referralCode,
                      "Referral code copied!"
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm text-white transition hover:bg-sky-600 active:scale-95"
                >
                  📋
                </button>
              </div>
            </div>

            {/* WHATSAPP */}
            <button
              type="button"
              onClick={shareReferral}
              className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              💬 Share on WhatsApp
            </button>

            {/* REFERRAL ACTIVITY */}
            {referrals.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Referral activity
                  </p>

                  <span className="text-[9px] font-bold text-slate-600">
                    Latest
                  </span>
                </div>

                <div className="space-y-1.5">
                  {referrals.slice(0, 3).map((referral) => {
                    const completed =
                      String(referral.status || "").toLowerCase() ===
                      "completed";

                    return (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.045] px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              completed
                                ? "bg-emerald-500/10"
                                : "bg-amber-500/10"
                            } text-xs`}
                          >
                            {completed ? "✓" : "⌛"}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-slate-200">
                              {completed
                                ? "Successful referral"
                                : "Waiting for first purchase"}
                            </p>

                            <p className="text-[9px] text-slate-500">
                              {new Date(
                                referral.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 text-[10px] font-black ${
                            completed
                              ? "text-emerald-300"
                              : "text-amber-300"
                          }`}
                        >
                          {completed ? "+₦1,500" : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:mt-5 sm:rounded-[24px] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sm">
                  ◷
                </span>

                <h2 className="text-base font-black text-slate-900">
                  Recent activity
                </h2>
              </div>

              <p className="mt-1 text-[11px] text-slate-500">
                Your latest purchases
              </p>
            </div>

            <Link
              href="/order-history"
              className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-black text-sky-600 transition hover:bg-sky-50"
            >
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                🛍️
              </div>

              <h3 className="mt-2 text-xs font-black text-slate-900">
                Nothing here yet
              </h3>

              <p className="mt-1 text-[10px] text-slate-500">
                Your purchases will appear here.
              </p>

              <Link
                href="/services"
                className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-sky-600 px-3.5 text-[10px] font-black text-white shadow-sm transition hover:bg-sky-500"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="group flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sm transition group-hover:bg-sky-100">
                    🛍️
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-slate-900">
                      {order.services?.title || "Service order"}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {order.services?.category || "ProxySocials"} ·{" "}
                      {new Date(
                        order.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-black text-slate-900">
                      ₦{Number(order.amount || 0).toLocaleString()}
                    </p>

                    <span
                      className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-black ${statusClasses(
                        order.order_status
                      )}`}
                    >
                      {formatStatus(order.order_status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <div className="mt-5 flex items-center justify-center gap-2 px-3 text-center">
          <span className="h-1 w-1 rounded-full bg-sky-400" />

          <p className="text-[9px] font-bold text-slate-400">
            Secure wallet • Fast delivery • ProxySocials
          </p>

          <span className="h-1 w-1 rounded-full bg-sky-400" />
        </div>
      </div>

      <TelegramSupportButton />
    </main>
  );
}