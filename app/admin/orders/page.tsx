import { supabase } from "@/lib/supabase";
import OrderActions from "@/components/OrderActions";

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

  if (error) {
    return <div>Error loading orders</div>;
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">
        ProxySocials Orders
      </h1>

      {orders?.map((order) => (
        <div
          key={order.id}
          className="bg-white border rounded-xl shadow-sm p-6 mb-6"
        >
          <h2 className="text-xl font-bold mb-2">
            {order.services?.title}
          </h2>

          <p className="text-gray-600 mb-4">
            {order.services?.category}
          </p>

          <div className="space-y-2">
  <p>
    <strong>Customer:</strong> {order.customer_name || "Not provided"}
  </p>

  <p>
    <strong>WhatsApp:</strong> {order.whatsapp_number || "Not provided"}
  </p>

  <p>
    <strong>Email:</strong> {order.email || "Not provided"}
  </p>

  <p>
    <strong>Order ID:</strong> {order.id}
  </p>

  <p>
    <strong>Amount:</strong> ₦{order.amount}
  </p>

  <p>
    <strong>Status:</strong> {order.order_status}
  </p>

  <p>
    <strong>Note:</strong> {order.note || "No note"}
  </p>
</div>

          <div className="mt-4">
            <a
              href={order.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-700 underline font-medium"
            >
              View Payment Receipt
            </a>
          </div>

          <OrderActions id={order.id} />
        </div>
      ))}
    </main>
  );
}