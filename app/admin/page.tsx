import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
export default async function AdminDashboard() {
  const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  redirect("/login");
}

const { data: profile } = await supabase
  .from("profiles")
  .select("is_admin")
  .eq("id", user.id)
  .single();

if (!profile?.is_admin) {
  redirect("/");
}
  const { data: orders } = await supabase
  .from("order")
  .select("*");
  const totalOrders = orders?.length || 0;

const pendingOrders =
  orders?.filter(
    (order: any) =>
      order.order_status === "pending_verification"
  ).length || 0;

const completedOrders =
  orders?.filter(
    (order: any) =>
      order.order_status === "completed"
  ).length || 0;

const rejectedOrders =
  orders?.filter(
    (order: any) =>
      order.order_status === "rejected"
  ).length || 0;

const totalRevenue =
  orders
    ?.filter(
      (order: any) =>
        order.order_status === "completed"
    )
    .reduce(
      (sum: number, order: any) =>
        sum + Number(order.amount || 0),
      0
    ) || 0;
  return (
    <main className="min-h-screen bg-sky-50 p-8">

      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-start mb-4">

  <div>

    <h1 className="text-4xl font-extrabold text-sky-700">
      ProxySocials Admin Dashboard
    </h1>

    <p className="text-gray-600 mt-3">
      Manage your services, orders and business operations.
    </p>

  </div>

  <LogoutButton />

</div>
<div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-10 mb-12">

  <div className="bg-white rounded-2xl shadow-md p-6">
    <p className="text-gray-500 text-sm">Total Orders</p>
    <h2 className="text-4xl font-extrabold text-sky-700 mt-2">
      {totalOrders}
    </h2>
  </div>

  <div className="bg-yellow-50 rounded-2xl shadow-md p-6">
    <p className="text-yellow-700 text-sm">Pending</p>
    <h2 className="text-4xl font-extrabold text-yellow-600 mt-2">
      {pendingOrders}
    </h2>
  </div>

  <div className="bg-green-50 rounded-2xl shadow-md p-6">
    <p className="text-green-700 text-sm">Completed</p>
    <h2 className="text-4xl font-extrabold text-green-600 mt-2">
      {completedOrders}
    </h2>
  </div>

  <div className="bg-sky-50 rounded-2xl shadow-md p-6">
    <p className="text-sky-700 text-sm">Revenue</p>
    <h2 className="text-3xl font-extrabold text-sky-800 mt-2">
      ₦{totalRevenue.toLocaleString()}
    </h2>
  </div>

</div>

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