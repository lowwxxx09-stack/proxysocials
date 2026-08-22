"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white px-6 py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
  <div className="hero-glow hero-glow-one" />
  <div className="hero-glow hero-glow-two" />
</div>
      <div className="mx-auto w-full max-w-7xl">

        <div className="w-full text-center">

          <span className="hero-fade-down inline-flex items-center gap-2 rounded-full bg-sky-100 px-5 py-2 text-sm font-bold text-sky-700">
            🚀 Trusted Digital Marketplace
          </span>

          <h1 className="hero-fade-up delay-100 mx-auto mt-8 max-w-5xl text-4xl font-black leading-tight text-gray-900 sm:text-5xl md:text-7xl">
            Digital Growth
            <br />
            <span className="text-sky-700">Made Simple</span>
          </h1>

          <p className="hero-fade-up delay-200 mx-auto mt-6 max-w-3xl text-base leading-8 text-gray-600 sm:text-lg md:text-xl">
            ProxySocials helps creators, influencers and businesses grow faster
            through premium social media services, streaming subscriptions,
            gift cards, airtime and data — all from one secure marketplace.
          </p>

          <div className="hero-fade-up delay-300 mt-10 flex flex-col justify-center gap-4 sm:flex-row">

            <Link
              href="/services"
              className="rounded-2xl bg-sky-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-sky-700 hover:shadow-xl"
            >
              Browse Services
            </Link>

            <Link
              href="/signup"
              className="rounded-2xl border-2 border-sky-600 px-10 py-4 text-lg font-bold text-sky-700 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-sky-600 hover:text-white"
            >
              Join ProxySocials
            </Link>

          </div>

        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">

          <div className="hero-fade-up delay-400 rounded-3xl border border-sky-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="text-5xl transition-transform duration-300 hover:scale-110">
              ⚡️
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              Fast Delivery
            </h3>

            <p className="mt-3 leading-7 text-gray-600">
              Most services begin processing shortly after payment.
            </p>
          </div>

          <div className="hero-fade-up delay-500 rounded-3xl border border-sky-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="text-5xl transition-transform duration-300 hover:scale-110">
              🔒
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              Secure Payments
            </h3>

            <p className="mt-3 leading-7 text-gray-600">
              Every payment is securely processed through Paystack.
            </p>
          </div>

          <div className="hero-fade-up delay-600 rounded-3xl border border-sky-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <div className="text-5xl transition-transform duration-300 hover:scale-110">
              🎁
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              Earn Rewards
            </h3>

            <p className="mt-3 leading-7 text-gray-600">
              Invite friends and earn referral bonuses on every successful signup.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}