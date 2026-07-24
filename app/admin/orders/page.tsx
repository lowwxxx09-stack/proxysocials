import { supabase } from "@/lib/supabase";
import OrdersTable from "@/components/OrdersTable";

export default async function OrdersPage() {
  const { data: orders, error } = await supabase
    .from("order")
    .select(
      `
      *,
      services (
        title,
        category
      )
    `
    )
    .order("created_at", { ascending: false });
const totalOrders = orders?.length || 0;

const pendingOrders =
  orders?.filter(
    (order: any) => order.order_status === "pending_verification"
  ).length || 0;

const completedOrders =
  orders?.filter(
    (order: any) => order.order_status === "completed"
  ).length || 0;

const rejectedOrders =
  orders?.filter(
    (order: any) => order.order_status === "rejected"
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
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-red-600 text-xl font-bold">
          Error loading orders
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 p-8">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-extrabold text-sky-700 mb-2">
          Orders Dashboard
        </h1>

        <p className="text-gray-600 mb-8">
          Manage customer orders and payment receipts.
        </p>
<div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">

  <div className="bg-white rounded-2xl shadow-md p-6">
    <p className="text-gray-500 text-sm">
      Total Orders
    </p>

    <h2 className="text-4xl font-extrabold text-sky-700 mt-2">
      {totalOrders}
    </h2>
  </div>

  <div className="bg-yellow-50 rounded-2xl shadow-md p-6">
    <p className="text-yellow-700 text-sm">
      Pending
    </p>

    <h2 className="text-4xl font-extrabold text-yellow-600 mt-2">
      {pendingOrders}
    </h2>
  </div>

  <div className="bg-green-50 rounded-2xl shadow-md p-6">
    <p className="text-green-700 text-sm">
      Completed
    </p>

    <h2 className="text-4xl font-extrabold text-green-600 mt-2">
      {completedOrders}
    </h2>
  </div>

  <div className="bg-red-50 rounded-2xl shadow-md p-6">
    <div className="bg-sky-100 rounded-2xl shadow-md p-6">

  <p className="text-sky-700 text-sm">
    Revenue
  </p>

  <h2 className="text-3xl font-extrabold text-sky-800 mt-2">
    ₦{totalRevenue.toLocaleString()}
  </h2>

</div>
    <p className="text-red-700 text-sm">
      Rejected
    </p>

    <h2 className="text-4xl font-extrabold text-red-600 mt-2">
      {rejectedOrders}
    </h2>
  </div>

</div>
        {orders?.length === 0 ? (

  <div className="bg-white rounded-xl p-8 text-center shadow">
    No orders yet.
  </div>

) : (

  <OrdersTable orders={orders} />

)}
          

      </div>

    </main>
  );
}