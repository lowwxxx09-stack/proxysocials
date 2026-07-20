import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-sky-50 p-8">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-extrabold text-sky-700">
          ProxySocials Admin Dashboard
        </h1>

        <p className="text-gray-600 mt-3">
          Manage your services, orders and business operations.
        </p>


        <div className="grid md:grid-cols-3 gap-6 mt-10">


          <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Services
            </h2>

            <p className="text-gray-600 mt-2">
              Add, edit and delete your ProxySocials services.
            </p>

            <Link
              href="/admin/services"
              className="inline-block mt-5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-xl"
            >
              Manage Services
            </Link>

          </div>



          <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Orders
            </h2>

            <p className="text-gray-600 mt-2">
              View and manage customer orders.
            </p>

            <Link
              href="/admin/orders"
              className="inline-block mt-5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-xl"
            >
              Manage Orders
            </Link>

          </div>



          <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Account
            </h2>

            <p className="text-gray-600 mt-2">
              Manage your admin account settings.
            </p>

            <Link
              href="/"
              className="inline-block mt-5 bg-gray-700 hover:bg-gray-800 text-white font-bold px-5 py-3 rounded-xl"
            >
              Back Home
            </Link>

          </div>


        </div>

      </div>

    </main>
  );
}