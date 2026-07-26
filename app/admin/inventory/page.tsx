import { supabase } from "@/lib/supabase";

export default async function InventoryPage() {
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("title");

  const { data: stock, error: stockError } = await supabase
  .from("stock")
  .select("*");

console.log("STOCK DATA:", stock);

  return (
    <main className="min-h-screen bg-sky-50 p-8">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-extrabold text-sky-700">
          Inventory
        </h1>

        <p className="text-gray-600 mt-2 mb-10">
          Monitor available stock for all services.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {services?.map((service) => {
            const availableStock =
              stock?.filter(
                (item) =>
                  item.service_id === service.id &&
                  item.is_used === false
              ).length || 0;

            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-md p-6"
              >
                <h2 className="text-2xl font-bold">
                  {service.title}
                </h2>

                <p className="text-sky-600 font-semibold mt-1">
                  {service.category}
                </p>

                <div className="mt-6">
  <p className="text-lg font-semibold">
    Available Stock
  </p>

  <p className="text-5xl font-extrabold text-sky-700 mt-2">
    {availableStock}
  </p>

  {availableStock === 0 ? (
    <p className="mt-4 inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
      ❌ Out of Stock
    </p>
  ) : availableStock <= 5 ? (
    <p className="mt-4 inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
      ⚠️ Low Stock
    </p>
  ) : (
    <p className="mt-4 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
      ✅ Healthy Stock
    </p>
  )}
</div>

              </div>
            );
          })}

        </div>

      </div>
    </main>
  );
}