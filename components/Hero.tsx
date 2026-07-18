export default function Hero() {
  return (
    <section className="bg-sky-100 py-24 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-sky-700">
          Grow Your Digital Presence
        </h1>

        <p className="mt-6 text-lg text-gray-700 max-w-2xl mx-auto">
          ProxySocials is your trusted marketplace for Social Media Growth,
          Streaming Subscriptions, Gift Cards, and Airtime & Data.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-sky-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-sky-700 transition">
            Order Now
          </button>

          <button className="border-2 border-sky-600 text-sky-700 px-8 py-3 rounded-xl font-semibold hover:bg-sky-600 hover:text-white transition">
            Join Referral Contest
          </button>
        </div>
      </div>
    </section>
  );
}