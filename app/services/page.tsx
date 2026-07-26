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
      .limit(30);

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setServices(data || []);
    setLoading(false);
  }

  function orderService(id: string) {
    router.push("/checkout/" + id);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-sky-50">
        <h1 className="text-2xl font-bold text-sky-700">
          Loading Services...
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-14 px-6">

      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-14">

          <h1 className="text-5xl font-black text-sky-700">
            ProxySocials Marketplace
          </h1>

          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Buy verified social media services, subscriptions,
            gift cards and digital products instantly.
          </p>

        </div>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-5 rounded-2xl mb-8 text-center">
            {errorMessage}
          </div>
        )}

        {!errorMessage && services.length === 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-700">
              No Services Available
            </h2>

            <p className="text-gray-500 mt-3">
              Services will appear here once they are added.
            </p>
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

          {services.map((service) => (

            <div
              key={service.id}
              className="bg-white rounded-3xl overflow-hidden border border-sky-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >

              {service.image ? (
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-60 object-cover"
                />
              ) : (
                <div className="w-full h-60 bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xl">
                  ProxySocials
                </div>
              )}

              <div className="p-7">

                <span className="inline-block bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wide px-4 py-1 rounded-full">
                  {service.category}
                </span>

                <h2 className="mt-5 text-2xl font-black text-gray-900">
                  {service.title}
                </h2>

                <p className="mt-4 text-gray-600 leading-7">
                  {service.description}
                </p>

                <div className="mt-6 flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Delivery Time
                    </p>

                    <p className="font-semibold text-gray-800">
                      {service.delivery_time}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-sm text-gray-500">
                      Price
                    </p>
                    <p className="text-3xl font-black text-sky-700">
                      ₦{Number(service.price).toLocaleString()}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() => orderService(service.id)}
                  className="mt-8 w-full rounded-2xl bg-sky-600 hover:bg-sky-700 text-white py-3 font-bold shadow-md hover:shadow-xl transition-all"
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