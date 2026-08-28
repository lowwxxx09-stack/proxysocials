"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomerMenu from "@/components/CustomerMenu";
import PromoCarousel from "@/components/PromoCarousel";

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

const categories = [
  { label: "🔥 All", value: "ALL", id: "all" },
  { label: "🔥 Proxy Special", value: "PROXY SPECIAL", id: "proxy-special" },
  { label: "📘 Facebook", value: "FACEBOOK", id: "facebook" },
  {
    label: "💕 Facebook Dating",
    value: "FACEBOOK DATING",
    id: "facebook-dating",
  },
  { label: "🎵 TikTok", value: "TIKTOK", id: "tiktok" },
  { label: "🐦 X", value: "X", id: "x" },
  { label: "🎬 Streaming", value: "STREAMING", id: "streaming" },
   { label: "💬 Texting", value: "TEXTING", id: "texting" },
  { label: "🌐 VPN", value: "VPN", id: "vpn" },
];

export default function ServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
  fetchServices();

  const interval = setInterval(() => {
    fetchServices();
  }, 10000);

  return () => clearInterval(interval);
}, []);

  async function fetchServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

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

  function scrollToCategory(id: string) {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function matchesSearch(service: Service) {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return (
      service.title.toLowerCase().includes(search) ||
      service.description.toLowerCase().includes(search) ||
      service.category.toLowerCase().includes(search)
    );
  }

  function getServicesForCategory(category: string) {
    return services.filter(
      (service) =>
        service.category.toUpperCase() === category.toUpperCase() &&
        matchesSearch(service)
    );
  }

  function renderService(service: Service, index: number) {
  return (
    <div
      key={service.id}
      className="service-card bg-white rounded-2xl sm:rounded-3xl border border-sky-100 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden"
      style={{
        animationDelay: `${Math.min(index * 0.08, 0.5)}s,`
      }}
    >
      <div className="flex flex-row items-stretch">

        {/* IMAGE */}
        <div className="w-24 sm:w-40 md:w-52 shrink-0">
          {service.image ? (
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full min-h-[150px] sm:min-h-[190px] object-cover"
            />
          ) : (
            <div className="w-full h-full min-h-[150px] bg-sky-100 flex items-center justify-center text-sky-600 font-black text-sm">
              ProxySocials
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-3 sm:p-5 md:p-6 min-w-0">

          <div className="flex flex-row justify-between gap-3">

            {/* SERVICE INFO */}
            <div className="flex-1 min-w-0">

              <span className="inline-block bg-sky-100 text-sky-700 text-[9px] sm:text-xs font-black uppercase tracking-wide px-2 sm:px-3 py-1 rounded-full">
                {service.category}
              </span>

              <h2 className="mt-2 text-base sm:text-xl md:text-2xl font-black text-gray-900 leading-tight">
                {service.title}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-5 line-clamp-3">
                {service.description}
              </p>

              <p className="mt-3 text-[10px] sm:text-sm font-semibold text-gray-500">
                🚚 Delivery:{" "}
                <span className="text-gray-800">
                  {service.delivery_time}
                </span>
              </p>

            </div>

            {/* PRICE + ORDER */}
            <div className="w-24 sm:w-36 md:w-44 shrink-0 text-right">

              <p className="text-[10px] sm:text-sm font-semibold text-gray-500">
                Price
              </p>

              <p className="text-lg sm:text-2xl md:text-3xl font-black text-sky-700">
                ₦{Number(service.price).toLocaleString()}
              </p>

              <div className="mt-2">

                {service.available_stock > 20 ? (
                  <p className="text-green-600 font-bold text-[10px] sm:text-sm">
                    🟢 {service.available_stock} Available
                  </p>
                ) : service.available_stock > 5 ? (
                  <p className="text-yellow-600 font-bold text-[10px] sm:text-sm">
                    🟡 {service.available_stock} Available
                  </p>
                ) : service.available_stock > 0 ? (
                  <p className="text-red-600 font-black text-[10px] sm:text-sm">
                    🔥 Only {service.available_stock} Left
                  </p>
                ) : (
                  <p className="text-gray-500 font-bold text-[10px] sm:text-sm">
                    ❌ Out of Stock
                  </p>
                )}

              </div>

              <button
                onClick={() => orderService(service.id)}
                disabled={service.available_stock <= 0}
                className={`mt-3 w-full rounded-xl sm:rounded-2xl py-2 sm:py-3 text-xs sm:text-sm font-black shadow-md transition-all ${
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

        </div>
      </div>
    </div>
  );
}
  if (loading) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin" />

        <h1 className="text-2xl font-black text-sky-700">
          ProxySocials
        </h1>

        <p className="mt-2 text-gray-500 font-medium">
          Preparing your services...
        </p>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-14 px-4 sm:px-6">
      <CustomerMenu />

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="services-fade-down text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-sky-700">
            ProxySocials Marketplace
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Buy verified social media services, subscriptions,
            gift cards and digital products instantly.
          </p>
        </div>

        {/* PROMOTIONAL CAROUSEL */}
        <PromoCarousel />

        {/* SEARCH */}
        <div className="services-fade-up services-delay-200 max-w-xl mx-auto mb-8">
          <input
            type="text"
            placeholder="Search Facebook, TikTok, VPN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-sky-200 px-5 py-4 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* CATEGORY BUTTONS */}
        <div className="services-fade-up services-delay-300 flex gap-3 overflow-x-auto pb-4 mb-10 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => scrollToCategory(category.id)}
              className="shrink-0 px-5 py-2.5 rounded-full font-bold bg-white border border-sky-200 text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition shadow-sm"
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-5 rounded-2xl mb-8 text-center font-semibold">
            {errorMessage}
          </div>
        )}

        {/* NO SERVICES */}
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

        {/* CATEGORY SECTIONS */}
        {!errorMessage && services.length > 0 && (
          <div className="space-y-14">

            {categories
              .filter((category) => category.value !== "ALL")
              .map((category) => {
                const categoryServices = getServicesForCategory(
                  category.value
                );

                if (categoryServices.length === 0) {
                  return null;
                }

                return (
                  <section
                    key={category.value}
                    id={category.id}
                    className="scroll-mt-8"
                  >
                    {/* CATEGORY HEADER */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-10 w-1.5 bg-sky-600 rounded-full" />

                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                          {category.label}
                        </h2>

                        <p className="text-sm text-gray-500 font-semibold mt-1">
                          {categoryServices.length}{" "}
                          {categoryServices.length === 1
                            ? "service"
                            : "services"}{" "}
                          available
                        </p>
                      </div>
                    </div>

                    {/* SERVICES DIRECTLY UNDER CATEGORY */}
                    <div className="space-y-5">
                      {categoryServices.map((service, index) =>
  renderService(service, index)
)}
                    </div>
                  </section>
                );
              })}

            {/* SEARCH RESULT MESSAGE */}
            {searchTerm &&
              categories
                .filter((category) => category.value !== "ALL")
                .every(
                  (category) =>
                    getServicesForCategory(category.value).length === 0
                ) && (
                <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
                  <h2 className="text-2xl font-black text-gray-700">
                    No Services Found
                  </h2>

                  <p className="text-gray-500 mt-3">
                    Try searching for another service or category.
                  </p>
                </div>
              )}

          </div>
        )}

      </div>
    </main>
  );
}