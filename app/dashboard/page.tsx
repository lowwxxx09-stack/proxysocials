export default function Dashboard() {
  return (
    <main className="min-h-screen bg-sky-50 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white p-8 rounded-2xl shadow-sm">

          <h1 className="text-3xl font-extrabold text-sky-700">
            Welcome to ProxySocials 👋
          </h1>

          <p className="mt-3 text-gray-600">
            Manage your orders, account, and referral rewards from your dashboard.
          </p>

        </div>


        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">


          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              My Orders
            </h2>

            <p className="mt-3 text-gray-600">
              View your previous and active orders.
            </p>
          </div>


          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              Referral Rewards
            </h2>

            <p className="mt-3 text-gray-600">
              Track your referrals and rewards.
            </p>
          </div>


          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              Account Settings
            </h2>

            <p className="mt-3 text-gray-600">
              Manage your profile information.
            </p>
          </div>


        </div>


        {/* Quick Action */}
        <div className="bg-sky-600 text-white mt-8 p-8 rounded-2xl">

          <h2 className="text-2xl font-extrabold">
            Ready to grow?
          </h2>

          <p className="mt-3">
            Explore our services and place your first order.
          </p>

          <button className="mt-5 bg-white text-sky-700 px-6 py-3 rounded-xl font-bold">
            Browse Services
          </button>

        </div>


      </div>

    </main>
  );
}