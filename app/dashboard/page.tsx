'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import CustomerMenu from '@/components/CustomerMenu';
import TelegramBanner from '@/components/TelegramBanner';
import TelegramSupportButton from '@/components/TelegramSupportButton';
import Link from 'next/link';

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
      router.push('/login');
      return;
    }

    const [
      { data: profileData, error: profileError },
      { data: walletData, error: walletError },
      { data: orderData, error: orderError },
      { data: referralData, error: referralError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),

      supabase
        .from('wallets')
        .select('id, user_id, balance')
        .eq('user_id', user.id)
        .maybeSingle(),

      supabase
        .from('order')
        .select(`*, services (title, category)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('referrals')
        .select('id, reward_amount, status, created_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (profileError) {
      console.error('PROFILE FETCH ERROR:', profileError);
    } else {
      setProfile(profileData);
    }

    if (walletError) {
      console.error('WALLET FETCH ERROR:', walletError);
      setWallet(null);
    } else {
      setWallet(walletData);
    }

    if (orderError) {
      console.error('ORDER FETCH ERROR:', orderError);
      setOrders([]);
    } else {
      setOrders(orderData || []);
    }

    if (referralError) {
      console.error('REFERRAL FETCH ERROR:', referralError);
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 shadow-lg">
            <span className="text-xl font-black text-white">P</span>
          </div>

          <h1 className="mt-4 text-xl font-black text-slate-900">
            ProxySocials
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Preparing your dashboard...
          </p>

          <div className="mt-4 flex justify-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-600 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-600 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-600" />
          </div>
        </div>
      </main>
    );
  }

  const balance = Number(wallet?.balance || 0);

  const recentOrders = orders.slice(0, 4);

  const completedOrders = orders.filter(
    (order) =>
      String(order.order_status || '').toLowerCase() === 'completed'
  ).length;

  const totalSpent = orders.reduce(
    (total, order) => total + Number(order.amount || 0),
    0
  );

  const referralCode = profile?.referral_code || 'None';

  const successfulReferrals = referrals.filter(
    (referral) =>
      String(referral.status || '').toLowerCase() === 'completed'
  ).length;

  const pendingReferrals = referrals.filter(
    (referral) =>
      String(referral.status || '').toLowerCase() === 'pending'
  ).length;

  const totalReferralEarnings = referrals
    .filter(
      (referral) =>
        String(referral.status || '').toLowerCase() === 'completed'
    )
    .reduce(
      (total, referral) =>
        total + Number(referral.reward_amount || 0),
      0
    );

  function copyText(value: string, successMessage: string) {
    if (!value || value === 'None') return;

    navigator.clipboard
      .writeText(value)
      .then(() => alert(successMessage))
      .catch(() => alert('Unable to copy. Please try again.'));
  }

  function shareReferral() {
    if (!referralCode || referralCode === 'None') return;

    const message = `🚀 Join me on ProxySocials!

Use my referral code ${referralCode} when creating your account.

Sign up here:
https://proxysocials.com/signup

#ProxySocials`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, '_blank');
  }

  function formatStatus(status: string) {
    const normalized = String(status || 'pending').toLowerCase();

    if (
      normalized === 'completed' ||
      normalized === 'success'
    ) {
      return 'Completed';
    }

    if (
      normalized === 'rejected' ||
      normalized === 'failed'
    ) {
      return 'Failed';
    }

    return 'Pending';
  }

  function statusClasses(status: string) {
    const normalized = String(status || '').toLowerCase();

    if (
      normalized === 'completed' ||
      normalized === 'success'
    ) {
      return 'bg-emerald-50 text-emerald-700';
    }

    if (
      normalized === 'rejected' ||
      normalized === 'failed'
    ) {
      return 'bg-red-50 text-red-700';
    }

    return 'bg-amber-50 text-amber-700';
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 pb-8">
      <CustomerMenu />

      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8">

        {/* TELEGRAM */}
        <TelegramBanner />

        {/* =========================
            PREMIUM HEADER
        ========================== */}
        <section className="mt-4 overflow-hidden rounded-[24px] bg-slate-950 shadow-xl shadow-slate-200">
          <div className="relative p-4 sm:p-6">

            {/* subtle glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">

              {/* Greeting */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                    Welcome back
                  </p>

                  <h1 className="mt-0.5 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                    {profile?.full_name || 'User'} 👋
                  </h1>
                </div>

                <Link
                  href="/profile"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-base transition hover:bg-white/15"
                  aria-label="Profile"
                >
                  👤
                </Link>
              </div>

              {/* Wallet */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Wallet balance
                    </p>

                    <p className="mt-1 break-all text-2xl font-black tracking-tight text-white sm:text-3xl">
                      ₦{balance.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-base">
                    💳
                  </div>
                </div>

                <Link
                  href="/fund-wallet"
                  className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-black text-white transition hover:bg-sky-400"
                >
                  + Fund Wallet
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Orders
                  </p>

                  <p className="mt-1 text-lg font-black text-white">
                    {orders.length}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Completed
                  </p>

                  <p className="mt-1 text-lg font-black text-white">
                    {completedOrders}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Spent
                  </p>

                  <p className="mt-1 truncate text-lg font-black text-white">
                    ₦{totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================
            QUICK ACTIONS
        ========================== */}
        <section className="mt-5">
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                href: '/services',
                icon: '🛍️',
                title: 'Services',
                bg: 'bg-sky-50',
              },
              {
                href: '/fund-wallet',
                icon: '💳',
                title: 'Fund',
                bg: 'bg-emerald-50',
              },
              {
                href: '/order-history',
                icon: '🧾',
                title: 'Orders',
                bg: 'bg-violet-50',
              },
              {
                href: '/profile',
                icon: '👤',
                title: 'Profile',
                bg: 'bg-amber-50',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-w-0 flex-col items-center rounded-2xl border border-slate-200 bg-white px-2 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} text-base`}
                >
                  {item.icon}
                </div>

                <span className="mt-1.5 truncate text-[11px] font-black text-slate-800">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================
            REFER & EARN
        ========================== */}
        <section className="relative mt-5 overflow-hidden rounded-[24px] bg-slate-950 shadow-xl shadow-slate-200">

          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative p-4 sm:p-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎁</span>

                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-300">
                    Refer & Earn
                  </p>
                </div>

                <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">
                  Earn ₦1,500
                </h2>

                <p className="mt-0.5 text-[11px] leading-5 text-slate-400 sm:text-xs">
                  Get rewarded after your friend's first purchase.
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

            {/* Referral stats */}
            <div className="mt-3 grid grid-cols-3 gap-2">

              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Successful
                </p>

                <p className="mt-1 text-base font-black text-emerald-300">
                  {successfulReferrals}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Pending
                </p>

                <p className="mt-1 text-base font-black text-amber-300">
                  {pendingReferrals}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Earned
                </p>

                <p className="mt-1 truncate text-base font-black text-white">
                  ₦{totalReferralEarnings.toLocaleString()}
                </p>
              </div>

            </div>

            {/* Referral code */}
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-2.5">

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
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
                    'Referral code copied!'
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm text-white transition hover:bg-slate-800"
              >
                📋
              </button>

            </div>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={shareReferral}
              className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black text-white transition hover:bg-emerald-400"
            >
              💬 Share on WhatsApp
            </button>

            {/* Referral activity */}
            {referrals.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3">

                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Referral activity
                  </p>
                </div>

                <div className="space-y-1.5">
                  {referrals.slice(0, 3).map((referral) => {
                    const completed =
                      String(referral.status || '').toLowerCase() ===
                      'completed';

                    return (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.05] px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-xs">
                            {completed ? '🟢' : '🟡'}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-slate-200">
                              {completed
                                ? 'Successful referral'
                                : 'Waiting for first purchase'}
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
                              ? 'text-emerald-300'
                              : 'text-amber-300'
                          }`}
                        >
                          {completed ? '+₦1,500' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </section>

        {/* =========================
            RECENT ACTIVITY
        ========================== */}
        <section className="mt-5 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="flex items-center justify-between gap-3">

            <div>
              <h2 className="text-base font-black text-slate-900">
                Recent activity
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Your latest purchases
              </p>
            </div>

            <Link
              href="/order-history"
              className="shrink-0 text-[11px] font-black text-sky-600"
            >
              View all →
            </Link>

          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center">

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
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
                className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-sky-600 px-3 text-[10px] font-black text-white"
              >
                Browse Services
              </Link>

            </div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">

              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex min-w-0 items-center gap-2.5 py-3 first:pt-0 last:pb-0"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm">
                    🛍️
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-slate-900">
                      {order.services?.title || 'Service order'}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {order.services?.category || 'ProxySocials'} ·{' '}
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

      </div>

      <TelegramSupportButton />
    </main>
  );
}