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
  {
    label: "🔥 Proxy Special",
    value: "PROXY SPECIAL",
    id: "proxy-special",
  },
  {
    label: "📘 Facebook",
    value: "FACEBOOK",
    id: "facebook",
  },
  {
    label: "💕 Facebook Dating",
    value: "FACEBOOK DATING",
    id: "facebook-dating",
  },
  {
    label: "🎵 TikTok",
    value: "TIKTOK",
    id: "tiktok",
  },
  {
    label: "🐦 X",
    value: "X",
    id: "x",
  },
  {
    label: "🎬 Streaming",
    value: "STREAMING",
    id: "streaming",
  },
  {
    label: "💬 Texting",
    value: "TEXTING",
    id: "texting",
  },
  {
    label: "🌐 VPN",
    value: "VPN",
    id: "vpn",
  },
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
        className="service-card overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl"
        style={{
          animationDelay: `${Math.min(index * 0.08, 0.5)}s`,
        }}
      >
        <div className="flex flex-row items-stretch">

          {/* IMAGE */}
          <div className="w-[84px] shrink-0 sm:w-40 md:w-52">
            {service.image ? (
              <img
                src={service.image}
                alt={service.title}
                className="h-full min-h-[128px] w-full object-cover sm:min-h-[190px]"
              />
            ) : (
              <div className="flex h-full min-h-[128px] w-full items-center justify-center bg-sky-100 px-2 text-center text-xs font-black text-sky-600 sm:min-h-[190px] sm:text-sm">
                ProxySocials
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="min-w-0 flex-1 p-2.5 sm:p-5 md:p-6">

            <div className="flex flex-row justify-between gap-2.5 sm:gap-3">

              {/* SERVICE INFO */}
              <div className="min-w-0 flex-1">

                <span className="inline-block max-w-full truncate rounded-full bg-sky-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-sky-700 sm:px-3 sm:py-1 sm:text-xs">
                  {service.category}
                </span>

                <h2 className="mt-1.5 line-clamp-2 text-sm font-black leading-tight text-gray-900 sm:mt-2 sm:text-xl md:text-2xl">
                  {service.title}
                </h2>

                <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-gray-600 sm:mt-2 sm:line-clamp-3 sm:text-sm sm:leading-5">
                  {service.description}
                </p>

                <p className="mt-2 text-[9px] font-semibold text-gray-500 sm:mt-3 sm:text-sm">
                  🚚 Delivery:{" "}
                  <span className="text-gray-800">
                    {service.delivery_time}
                  </span>
                </p>

              </div>

              {/* PRICE + ORDER */}
              <div className="w-[88px] shrink-0 text-right sm:w-36 md:w-44">

                <p className="text-[9px] font-semibold text-gray-500 sm:text-sm">
                  Price
                </p>

                <p className="mt-0.5 text-base font-black leading-tight text-sky-700 sm:mt-0 sm:text-2xl md:text-3xl">
                  ₦{Number(service.price).toLocaleString()}
                </p>

                <div className="mt-1.5 sm:mt-2">

                  {service.available_stock > 20 ? (
                    <p className="text-[8px] font-bold leading-3 text-green-600 sm:text-sm sm:leading-normal">
                      🟢 {service.available_stock} Available
                    </p>
                  ) : service.available_stock > 5 ? (
                    <p className="text-[8px] font-bold leading-3 text-yellow-600 sm:text-sm sm:leading-normal">
                      🟡 {service.available_stock} Available
                    </p>
                  ) : service.available_stock > 0 ? (
                    <p className="text-[8px] font-black leading-3 text-red-600 sm:text-sm sm:leading-normal">
                      🔥 Only {service.available_stock} Left
                    </p>
                  ) : (
                    <p className="text-[8px] font-bold leading-3 text-gray-500 sm:text-sm sm:leading-normal">
                      ❌ Out of Stock
                    </p>
                  )}

                </div>

                <button
                  onClick={() => orderService(service.id)}
                  disabled={service.available_stock <= 0}
                  className={`mt-2 w-full rounded-lg py-1.5 text-[10px] font-black shadow-md transition-all sm:mt-3 sm:rounded-2xl sm:py-3 sm:text-sm ${
                    service.available_stock > 0
                      ? "bg-sky-600 text-white hover:bg-sky-700 hover:shadow-xl"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
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
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-white px-6">
        <div className="text-center">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600 sm:h-14 sm:w-14" />

          <h1 className="text-xl font-black text-sky-700 sm:text-2xl">
            ProxySocials
          </h1>

          <p className="mt-2 text-xs font-medium text-gray-500 sm:text-sm">
            Preparing your services...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-3 py-8 sm:px-6 sm:py-14">

      <CustomerMenu />

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="services-fade-down mb-7 text-center sm:mb-10">

          <h1 className="text-2xl font-black text-sky-700 sm:text-5xl">
            ProxySocials Marketplace
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-gray-600 sm:mt-4 sm:text-lg">
            Buy verified social media services, subscriptions,
            gift cards and digital products instantly.
          </p>

        </div>

        {/* PROMOTIONAL CAROUSEL */}
        <PromoCarousel />

        {/* SEARCH */}
        <div className="services-fade-up services-delay-200 mx-auto mb-6 max-w-xl sm:mb-8">

          <input
            type="text"
            placeholder="Search Facebook, TikTok, VPN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-sky-200 px-3.5 py-3 text-xs shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-lg"
          />

        </div>

        {/* CATEGORY BUTTONS */}
        <div className="services-fade-up services-delay-300 mb-7 flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide sm:mb-10 sm:gap-3 sm:pb-4">

          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => scrollToCategory(category.id)}
              className="shrink-0 rounded-full border border-sky-200 bg-white px-3.5 py-2 text-[10px] font-bold text-gray-700 shadow-sm transition hover:bg-sky-50 hover:text-sky-700 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              {category.label}
            </button>
          ))}

        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl bg-red-100 p-4 text-center text-xs font-semibold text-red-700 sm:mb-8 sm:p-5 sm:text-sm">
            {errorMessage}
          </div>
        )}

        {/* NO SERVICES */}
        {!errorMessage && services.length === 0 && (
          <div className="rounded-2xl bg-white p-7 text-center shadow-lg sm:rounded-3xl sm:p-10">

            <h2 className="text-lg font-bold text-gray-700 sm:text-2xl">
              No Services Available
            </h2>

            <p className="mt-2 text-xs text-gray-500 sm:mt-3 sm:text-sm">
              Services will appear here once they are added.
            </p>

          </div>
        )}

        {/* CATEGORY SECTIONS */}
        {!errorMessage && services.length > 0 && (
          <div className="space-y-9 sm:space-y-14">

            {categories
              .filter((category) => category.value !== "ALL")
              .map((category) => {
                const categoryServices =
                  getServicesForCategory(category.value);

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
                    <div className="mb-3 flex items-center gap-3 sm:mb-5 sm:gap-4">

                      <div className="h-8 w-1 rounded-full bg-sky-600 sm:h-10 sm:w-1.5" />

                      <div>

                        <h2 className="text-lg font-black text-gray-900 sm:text-3xl">
                          {category.label}
                        </h2>

                        <p className="mt-0.5 text-[10px] font-semibold text-gray-500 sm:mt-1 sm:text-sm">
                          {categoryServices.length}{" "}
                          {categoryServices.length === 1
                            ? "service"
                            : "services"}{" "}
                          available
                        </p>

                      </div>

                    </div>

                    {/* SERVICES */}
                    <div className="space-y-3 sm:space-y-5">

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
                <div className="rounded-2xl bg-white p-7 text-center shadow-lg sm:rounded-3xl sm:p-10">

                  <h2 className="text-lg font-black text-gray-700 sm:text-2xl">
                    No Services Found
                  </h2>

                  <p className="mt-2 text-xs text-gray-500 sm:mt-3 sm:text-sm">
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