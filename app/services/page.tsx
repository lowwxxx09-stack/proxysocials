"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Service = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  delivery_time: string;
  image: string;
};

export default function ServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .limit(10);

    console.log("SUPABASE DATA:", data);
    console.log("SUPABASE ERROR:", error);

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setServices(data || []);
    setLoading(false);
  }

  function orderService(serviceId: string) {
    router.push("/checkout/" + serviceId);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-sky-50 flex items-center justify-center">
        <h1 className="text-xl font-bold text-sky-700">
          Loading Services...
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-10">

          <h1 className="text-4xl font-extrabold text-sky-700">
            ProxySocials Marketplace
          </h1>

          <p className="mt-3 text-gray-600">
            Choose a service and grow your digital presence.
          </p>

        </div>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">
            {errorMessage}
          </div>
        )}

        {services.length === 0 && !errorMessage && (
          <div className="bg-white p-6 rounded-xl text-center text-gray-600">
            No services available yet.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">

          {services.map((service) => (

            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >

              {service.image && (
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-52 object-cover"
                />
              )}

              <div className="p-6">

                <p className="text-sky-600 font-bold text-sm">
                  {service.category}
                </p>

                <h2 className="text-2xl font-extrabold mt-2">
                  {service.title}
                </h2>

                <p className="text-gray-600 mt-3">
                  {service.description}
                </p>

                <p className="mt-4 text-gray-700">
                  Delivery:
                  <span className="font-bold ml-2">
                    {service.delivery_time}
                  </span>
                </p>

                <p className="mt-3 text-xl font-extrabold text-sky-700">
                  ₦{service.price}
                </p>

                <button
                  onClick={() => orderService(service.id)}
                  className="mt-6 w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700"
                >
                  Order Now
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}