import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-sky-100 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl font-bold text-sky-700">
          Welcome to ProxySocials
        </h1>

        <p className="mt-6 text-lg text-gray-700 max-w-2xl">
          Nigeria's trusted digital marketplace for social media services,
          subscriptions, gift cards, airtime, and referral contests.
        </p>

        <button className="mt-8 bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition">
          Order Now
        </button>
      </main>
    </>
  );
}