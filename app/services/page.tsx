"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomerMenu from "@/components/CustomerMenu";

type Service = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  delivery_time: string;
  image: string;
  available_stock: number;
};

export default function ServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
const [selectedCategory, setSelectedCategory] = useState("ALL");
const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    fetchServices();
  }, []);

const categories = [
  { label: "🔥 All", value: "ALL" },
  { label: "📘 Facebook", value: "FACEBOOK" },
  { label: "💕 Facebook Dating", value: "FACEBOOK DATING" },
  { label: "🎵 TikTok", value: "TIKTOK" },
  { label: "🐦 X", value: "X" },
  { label: "🎬 Streaming", value: "streaming" },
];

  async function fetchServices() {
    const { data, error } = await supabase
  .from("services")
  .select("*")
  .eq("is_active", true)
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
  const filteredServices = services.filter((service) => {
  const matchesCategory =
    selectedCategory === "ALL" ||
    service.category === selectedCategory;

  const matchesSearch =
    service.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    service.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

  return matchesCategory && matchesSearch;
});

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
      <CustomerMenu />
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

       <div className="max-w-xl mx-auto mb-8">
  <input
    type="text"
    placeholder="Search Netflix, Facebook, TikTok..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full rounded-2xl border border-sky-200 px-5 py-4 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
  />
</div>
        <div className="flex flex-wrap justify-center gap-3 mb-10">
  {categories.map((category) => (
    <button
      key={category.value}
      onClick={() => setSelectedCategory(category.value)}
      className={`px-5 py-2 rounded-full font-semibold transition ${
        selectedCategory === category.value
          ? "bg-sky-600 text-white"
          : "bg-white border border-sky-200 text-gray-700 hover:bg-sky-50"
      }`}
    >
      {category.label}
    </button>
  ))}
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

          {filteredServices.map((service) => (

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

                <div className="mt-4">
  {service.available_stock > 20 ? (
    <p className="text-green-600 font-semibold">
      🟢 {service.available_stock} Available
    </p>
  ) : service.available_stock > 5 ? (
    <p className="text-yellow-600 font-semibold">
      🟡 {service.available_stock} Available
    </p>
  ) : service.available_stock > 0 ? (
    <p className="text-red-600 font-bold">
      🔥 Only {service.available_stock} Left
    </p>
  ) : (
    <p className="text-gray-500 font-bold">
      ❌ Out of Stock
    </p>
  )}
</div>

                <button
  onClick={() => orderService(service.id)}
  disabled={service.available_stock <= 0}
  className={`mt-8 w-full rounded-2xl py-3 font-bold shadow-md transition-all ${
    service.available_stock > 0
      ? "bg-sky-600 hover:bg-sky-700 text-white hover:shadow-xl"
      : "bg-gray-300 text-gray-500 cursor-not-allowed"
  }`}
>
  {service.available_stock > 0
    ? "Order Now"
    : "Out of Stock"}
</button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}