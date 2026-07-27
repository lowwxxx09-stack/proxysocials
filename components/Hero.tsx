import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-sky-50 to-white py-16 md:py-24 px-6 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto overflow-x-hidden">

        <div className="text-center w-full">

          <span className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-5 py-2 rounded-full text-sm font-bold">
            🚀 Trusted Digital Marketplace
          </span>

          <h1 className="mt-8 text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 leading-tight max-w-5xl mx-auto">
            Digital Growth
            <br />
            <span className="text-sky-700">
              Made Simple
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-600 leading-8 max-w-3xl mx-auto">
            ProxySocials helps creators, influencers and businesses grow faster
            through premium social media services, streaming subscriptions,
            gift cards, airtime and data — all from one secure marketplace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

            <Link
              href="/services"
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg rounded-2xl px-10 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Browse Services
            </Link>

            <Link
              href="/signup"
              className="border-2 border-sky-600 hover:bg-sky-600 hover:text-white text-sky-700 font-bold text-lg rounded-2xl px-10 py-4 transition-all duration-300"
            >
              Join ProxySocials
            </Link>

          </div>

        </div>

        {/* Trust Cards */}

        <div className="grid md:grid-cols-3 gap-6 mt-16">

          <div className="bg-white rounded-3xl border border-sky-100 shadow-lg p-8">

            <div className="text-5xl">
              ⚡️
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              Fast Delivery
            </h3>

            <p className="mt-3 text-gray-600 leading-7">
              Most services begin processing shortly after payment.
            </p>

          </div>

          <div className="bg-white rounded-3xl border border-sky-100 shadow-lg p-8">

            <div className="text-5xl">
              🔒
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              Secure Payments
            </h3>

            <p className="mt-3 text-gray-600 leading-7">
              Every payment is securely processed through Paystack.
            </p>

          </div>

          <div className="bg-white rounded-3xl border border-sky-100 shadow-lg p-8">

            <div className="text-5xl">
              🎁
            </div>

            <h3 className="mt-5 text-2xl font-black text-gray-900">
              Earn Rewards
            </h3>

            <p className="mt-3 text-gray-600 leading-7">
              Invite friends and earn referral bonuses on every successful signup.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}