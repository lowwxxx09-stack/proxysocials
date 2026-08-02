import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteServiceButton from "@/components/DeleteServiceButton";

export default async function AdminServicesPage() {
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-sky-50 flex items-center justify-center">
        <h1 className="text-xl font-bold text-red-600">
          Error loading services
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 p-8">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-extrabold text-sky-700">
          Manage Services
        </h1>

        <p className="text-gray-600 mt-2">
          Add, edit and remove your ProxySocials services.
        </p>


        <div className="mt-6">
          <Link
            href="/admin/services/new"
            className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-xl"
          >
            + Add New Service
          </Link>
        </div>


        <div className="mt-8">
          <Link
            href="/admin"
            className="text-sky-600 font-semibold hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>


        <div className="mt-10 bg-white rounded-2xl shadow-md p-8">

          <h2 className="text-2xl font-bold mb-6">
            Services
          </h2>


          {services?.length === 0 ? (

            <p className="text-gray-500">
              No services found.
            </p>

          ) : (

            <div className="space-y-4">

              {services?.map((service: any) => (

                <div
                  key={service.id}
                  className="border rounded-xl p-5 flex justify-between items-center"
                >

                  <div className="flex gap-4 items-center">

                    {service.image && (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                    )}


                    <div>

                      <h3 className="text-xl font-bold">
                        {service.title}
                      </h3>


                      <p className="text-gray-600">
                        {service.category}
                      </p>


                      <p className="font-semibold text-sky-700 mt-2">
                        ₦{service.price}
                      </p>

                      <p
  className={`mt-2 font-semibold ${
    service.is_active
      ? "text-green-600"
      : "text-gray-500"
  }`}
>
  {service.is_active ? "🟢 Active" : "⚪ Inactive"}
</p>

                    </div>

                  </div>



                  <div className="flex gap-3">

                    <Link
                      href={"/admin/services/" + service.id + "/edit"}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 text-sm rounded-lg"
                    >
                      Edit
                    </Link>


                    <DeleteServiceButton id={service.id} />

                  </div>


                </div>

              ))}

            </div>

          )}

        </div>


      </div>

    </main>
  );
}