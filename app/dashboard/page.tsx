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
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 shadow-lg shadow-sky-200">
            <span className="text-2xl font-black text-white">P</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900">
            ProxySocials
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Preparing your dashboard...
          </p>

          <div className="mt-5 flex justify-center gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-sky-600 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-sky-600 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-sky-600" />
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

  const totalReferralEarnings = referrals.reduce(
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
    <main className="min-h-screen overflow-x-hidden bg-slate-50 pb-10">
      <CustomerMenu />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        <TelegramBanner />

        {/* =========================
            WELCOME / WALLET
        ========================== */}
        <section className="mt-5 overflow-hidden rounded-[28px] bg-slate-950 shadow-xl shadow-slate-200">
          <div className="relative p-5 sm:p-7 lg:p-9">

            <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />

            <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                <div className="min-w-0">

                  <p className="text-sm font-semibold text-sky-300">
                    Welcome back
                  </p>

                  <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-white sm:text-4xl">
                    {profile?.full_name || 'User'} 👋
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                    Everything you need to manage your ProxySocials account in one place.
                  </p>

                </div>

                <Link
                  href="/profile"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 sm:w-auto"
                >
                  👤 Profile
                </Link>

              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">

                {/* WALLET */}
                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Wallet balance
                      </p>

                      <p className="mt-2 break-all text-3xl font-black tracking-tight text-white sm:text-4xl">
                        ₦{balance.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-lg">
                      💳
                    </div>

                  </div>

                  <Link
                    href="/fund-wallet"
                    className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white transition hover:bg-sky-400"
                  >
                    + Fund Wallet
                  </Link>

                </div>

                {/* ACCOUNT STATS */}
                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Orders
                    </p>

                    <p className="mt-2 text-2xl font-black text-white">
                      {orders.length}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Total orders
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Completed
                    </p>

                    <p className="mt-2 text-2xl font-black text-white">
                      {completedOrders}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Successfully delivered
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.07] p-4">

                    <div className="flex items-center justify-between gap-3">

                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          Total spent
                        </p>

                        <p className="mt-1 text-xl font-black text-white">
                          ₦{totalSpent.toLocaleString()}
                        </p>
                      </div>

                      <Link
                        href="/order-history"
                        className="shrink-0 text-xs font-bold text-sky-300 hover:text-sky-200"
                      >
                        View history →
                      </Link>

                    </div>

                  </div>

                </div>

              </div>

            </div>
          </div>
        </section>

        {/* =========================
            QUICK ACTIONS
        ========================== */}
        <section className="mt-7">

          <div className="mb-3 px-1">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              Quick actions
            </h2>

            <p className="text-sm text-slate-500">
              Get things done faster.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            {[
              {
                href: '/services',
                icon: '🛍️',
                title: 'Services',
                text: 'Browse marketplace',
                bg: 'bg-sky-50',
              },
              {
                href: '/fund-wallet',
                icon: '💳',
                title: 'Add Funds',
                text: 'Top up wallet',
                bg: 'bg-emerald-50',
              },
              {
                href: '/order-history',
                icon: '🧾',
                title: 'Activity',
                text: 'View order history',
                bg: 'bg-violet-50',
              },
              {
                href: '/profile',
                icon: '👤',
                title: 'Profile',
                text: 'Manage account',
                bg: 'bg-amber-50',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg} text-xl`}
                >
                  {item.icon}
                </div>

                <h3 className="mt-3 truncate text-sm font-black text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {item.text}
                </p>
              </Link>
            ))}

          </div>
        </section>

        {/* =========================
            DISCOVER
        ========================== */}
        <section className="mt-8">

          <div className="mb-3 flex items-end justify-between gap-3 px-1">

            <div>
              <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                Discover
              </h2>

              <p className="text-sm text-slate-500">
                Find something useful today.
              </p>
            </div>

            <Link
              href="/services"
              className="shrink-0 text-xs font-black text-sky-600 sm:text-sm"
            >
              Browse all →
            </Link>

          </div>

          <div className="grid gap-3 sm:grid-cols-3">

            {/* MARKETPLACE */}
            <Link
              href="/services"
              className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative z-10">

                <p className="text-xs font-bold uppercase tracking-wider text-sky-100">
                  Marketplace
                </p>

                <h3 className="mt-2 text-xl font-black">
                  Explore Services
                </h3>

                <p className="mt-1 max-w-[210px] text-xs leading-5 text-sky-50">
                  Browse available social media services.
                </p>

              </div>

              <span className="absolute -bottom-5 -right-2 text-7xl opacity-15">
                🛍️
              </span>
            </Link>

            {/* WALLET */}
            <Link
              href="/fund-wallet"
              className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Wallet
              </p>

              <h3 className="mt-2 text-xl font-black text-slate-900">
                Fund & Go
              </h3>

              <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-500">
                Add funds and keep your wallet ready for your next purchase.
              </p>

              <span className="absolute -bottom-4 -right-1 text-6xl opacity-10">
                💳
              </span>
            </Link>

            {/* REFERRAL MINI CARD */}
            <div className="relative min-w-0 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">

              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                Rewards
              </p>

              <h3 className="mt-2 text-xl font-black text-slate-900">
                Refer & Earn
              </h3>

              <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-500">
                Earn ₦1,500 for every successful referral.
              </p>

              <div className="mt-4 flex items-center justify-between gap-2">

                <span className="text-sm font-black text-violet-700">
                  {successfulReferrals}{' '}
                  {successfulReferrals === 1
                    ? 'referral'
                    : 'referrals'}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      referralCode,
                      'Referral code copied!'
                    )
                  }
                  className="min-h-10 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                >
                  Copy
                </button>

              </div>

            </div>

          </div>
        </section>

        {/* =========================
            COMPACT REFER & EARN
        ========================== */}
        <section className="relative mt-8 overflow-hidden rounded-[26px] bg-slate-950 shadow-xl">

          {/* BACKGROUND GLOW */}
          <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative p-4 sm:p-6 lg:p-7">

            {/* HEADER */}
            <div className="flex items-center justify-between gap-4">

              <div className="min-w-0">

                <div className="flex items-center gap-2">
                  <span className="text-xl">🎁</span>

                  <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                    Refer & Earn
                  </p>
                </div>

                <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                  Earn ₦1,500 per referral
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                  Invite friends and earn automatically when they join.
                </p>

              </div>

              {/* DESKTOP TOTAL */}
              <div className="hidden shrink-0 text-right sm:block">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total earned
                </p>

                <p className="mt-1 text-xl font-black text-emerald-300">
                  ₦{totalReferralEarnings.toLocaleString()}
                </p>

              </div>

            </div>

            {/* MOBILE / DESKTOP STATS */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">

              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3">

                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Referrals
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {successfulReferrals}
                </p>

              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3">

                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Total earned
                </p>

                <p className="mt-1 text-lg font-black text-emerald-300">
                  ₦{totalReferralEarnings.toLocaleString()}
                </p>

              </div>

            </div>

            {/* REFERRAL CODE */}
            <div className="mt-3 rounded-xl bg-white p-3">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your referral code
              </p>

              <div className="mt-1.5 flex min-w-0 items-center gap-2">

                <p className="min-w-0 flex-1 truncate text-base font-black tracking-wide text-slate-900 sm:text-lg">
                  {referralCode}
                </p>

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

            </div>

            {/* WHATSAPP */}
            <button
              type="button"
              onClick={shareReferral}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-400"
            >
              💬 Share on WhatsApp
            </button>

          </div>
        </section>

        {/* =========================
            RECENT ACTIVITY
        ========================== */}
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">

              <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                Recent activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                A quick look at your latest activity.
              </p>

            </div>

            <Link
              href="/order-history"
              className="shrink-0 text-xs font-black text-sky-600 sm:text-sm"
            >
              View all →
            </Link>

          </div>

          {recentOrders.length === 0 ? (

            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                🛍️
              </div>

              <h3 className="mt-3 text-sm font-black text-slate-900">
                Nothing here yet
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Your recent purchases will appear here.
              </p>

              <Link
                href="/services"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-black text-white"
              >
                Browse Services
              </Link>

            </div>

          ) : (

            <div className="mt-5 divide-y divide-slate-100">

              {recentOrders.map((order) => (

                <div
                  key={order.id}
                  className="flex min-w-0 items-center gap-3 py-4 first:pt-0 last:pb-0"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-base">
                    🛍️
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-black text-slate-900">
                      {order.services?.title || 'Service order'}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {order.services?.category || 'ProxySocials'} ·{' '}
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>

                  </div>

                  <div className="shrink-0 text-right">

                    <p className="text-sm font-black text-slate-900">
                      ₦{Number(order.amount || 0).toLocaleString()}
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-black ${statusClasses(
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