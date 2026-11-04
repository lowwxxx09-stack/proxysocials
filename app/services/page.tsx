
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  { label: "🔥 All Services", value: "ALL", id: "all" },
  { label: "🔥 Proxy Special", value: "PROXY SPECIAL", id: "proxy-special" },
  { label: "📘 Facebook", value: "FACEBOOK", id: "facebook" },
  { label: "💕 Facebook Dating", value: "FACEBOOK DATING", id: "facebook-dating" },
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
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  const fetchServices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setServices((data || []) as Service[]);
    setErrorMessage("");
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchServices();

    const interval = setInterval(() => {
      fetchServices(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchServices]);

  const filteredServices = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return services.filter((service) => {
      const matchesCategory =
        activeCategory === "ALL" ||
        service.category?.toUpperCase() === activeCategory;

      const matchesSearch =
        !search ||
        service.title?.toLowerCase().includes(search) ||
        service.description?.toLowerCase().includes(search) ||
        service.category?.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [services, searchTerm, activeCategory]);

  const groupedServices = useMemo(() => {
    return categories
      .filter((category) => category.value !== "ALL")
      .map((category) => ({
        ...category,
        services: filteredServices.filter(
          (service) =>
            service.category?.toUpperCase() === category.value
        ),
      }))
      .filter((category) => category.services.length > 0);
  }, [filteredServices]);

  const totalStock = services.reduce(
    (total, service) =>
      total + Math.max(0, Number(service.available_stock) || 0),
    0
  );

  function orderService(id: string) {
    router.push("/checkout/" + id);
  }

  function scrollToCategory(id: string, value: string) {
    setActiveCategory(value);

    if (value === "ALL") {
      document.getElementById("all")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function getStockLabel(stock: number) {
    if (stock > 20) {
      return {
        label: `${stock} Available`,
        color: "text-emerald-400",
        dot: "bg-emerald-400",
      };
    }

    if (stock > 5) {
      return {
        label: `${stock} Available`,
        color: "text-amber-400",
        dot: "bg-amber-400",
      };
    }

    if (stock > 0) {
      return {
        label: `Only ${stock} Left`,
        color: "text-rose-400",
        dot: "bg-rose-400",
      };
    }

    return {
      label: "Out of Stock",
      color: "text-gray-500",
      dot: "bg-gray-500",
    };
  }

  function renderService(service: Service, index: number) {
    const stock = Number(service.available_stock) || 0;
    const stockInfo = getStockLabel(stock);

    return (
      <article
        key={service.id}
        className="group overflow-hidden rounded-lg border border-white/[0.08] bg-[#101722] transition-all duration-300 hover:border-cyan-400/30 hover:shadow-lg sm:rounded-2xl md:rounded-3xl"
        style={{
          animation: "serviceFadeIn 0.5s ease both",
          animationDelay: `${Math.min(index * 0.06, 0.4)}s`,
        }}
      >
        <div className="flex min-h-[96px] items-stretch sm:min-h-[160px] md:min-h-[190px]">
          {/* IMAGE */}
          <div className="relative w-[58px] shrink-0 overflow-hidden bg-[#172433] min-[380px]:w-[64px] sm:w-36 md:w-48">
            {service.image ? (
              <img
                src={service.image}
                alt={service.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#102b40] to-[#101722]">
                <span className="text-lg font-black text-cyan-400 sm:text-3xl">
                  P
                </span>
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-1.5 min-[380px]:p-2 sm:p-4 md:p-5">
            <div>
              <span className="inline-block max-w-full truncate rounded-full border border-cyan-400/15 bg-cyan-400/[0.08] px-1.5 py-[2px] text-[6px] font-bold uppercase tracking-wide text-cyan-300 sm:px-2.5 sm:py-1 sm:text-[10px]">
                {service.category}
              </span>

              <h2 className="mt-0.5 line-clamp-1 text-[10px] font-extrabold leading-tight text-white min-[380px]:text-[11px] sm:mt-2 sm:line-clamp-2 sm:text-lg md:text-xl">
                {service.title}
              </h2>

              <p className="mt-0.5 line-clamp-1 text-[8px] leading-3 text-gray-400 sm:mt-1.5 sm:line-clamp-2 sm:text-xs sm:leading-5">
                {service.description || "Quality digital service from ProxySocials."}
              </p>
            </div>

            <div className="mt-1.5 flex items-end justify-between gap-1 border-t border-white/[0.06] pt-1 sm:mt-3 sm:gap-3 sm:pt-3">
              <div className="min-w-0">
                <p className="text-[7px] text-gray-500 sm:text-[10px]">
                  Delivery
                </p>

                <p className="truncate text-[8px] font-semibold text-gray-300 sm:text-xs">
                  {service.delivery_time || "Contact support"}
                </p>

                <div
                  className={`mt-0.5 flex items-center gap-1 text-[7px] font-bold sm:mt-2 sm:text-[10px] ${stockInfo.color}`}
                >
                  <span className={`h-1 w-1 shrink-0 rounded-full sm:h-1.5 sm:w-1.5 ${stockInfo.dot}`} />
                  {stockInfo.label}
                </div>
              </div>

              <div className="w-[76px] shrink-0 text-right sm:w-32 md:w-36">
                <p className="text-[7px] text-gray-500 sm:text-[10px]">
                  Price
                </p>

                <p className="text-xs font-black leading-tight text-cyan-300 min-[380px]:text-sm sm:text-xl md:text-2xl">
                  ₦{Number(service.price).toLocaleString("en-NG")}
                </p>

                <button
                  onClick={() => orderService(service.id)}
                  disabled={stock <= 0}
                  className={`mt-1 w-full rounded px-1 py-1 text-[8px] font-extrabold transition-all sm:mt-2 sm:rounded-xl sm:py-2.5 sm:text-xs ${
                    stock > 0
                      ? "bg-cyan-400 text-[#07111c] hover:bg-cyan-300 active:scale-95"
                      : "cursor-not-allowed bg-white/[0.05] text-gray-500"
                  }`}
                >
                  {stock > 0 ? "Order Now →" : "Unavailable"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080c12] px-6">
        <div className="text-center">
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-cyan-400/10 border-t-cyan-400" />
            <span className="text-2xl font-black text-cyan-400">P</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            Proxy<span className="text-cyan-400">Socials</span>
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Preparing your marketplace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080c12] px-3 pb-16 pt-5 text-white sm:px-6 sm:pt-8">
      <style jsx global>{`
        @keyframes serviceFadeIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes serviceFadeDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .marketplace-scrollbar {
          scrollbar-width: none;
        }

        .marketplace-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .marketplace-header {
          animation: serviceFadeDown 0.6s ease both;
        }
      `}</style>

      <CustomerMenu />

      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="marketplace-header mb-7 pt-5 text-center sm:mb-10 sm:pt-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300 sm:text-[10px]">
              Your digital marketplace
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            Proxy<span className="text-cyan-400">Socials</span>
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-gray-400 sm:mt-4 sm:text-base sm:leading-7">
            Discover social media accounts, subscriptions and digital
            products, all in one place.
          </p>
        </header>

        {/* MARKETPLACE OVERVIEW */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-white/[0.07] bg-[#101722] p-3.5 sm:rounded-3xl sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-sm text-cyan-300">
                ◈
              </span>
              <p className="text-[10px] font-semibold text-gray-400 sm:text-xs">
                Available services
              </p>
            </div>

            <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {services.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#101722] p-3.5 sm:rounded-3xl sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10 text-sm text-emerald-300">
                ✓
              </span>
              <p className="text-[10px] font-semibold text-gray-400 sm:text-xs">
                Items in stock
              </p>
            </div>

            <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {totalStock.toLocaleString("en-NG")}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-white/[0.07] bg-gradient-to-r from-[#10283a] to-[#101722] p-3.5 sm:col-span-1 sm:rounded-3xl sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 sm:text-xs">
                  Marketplace status
                </p>
                <p className="mt-2 text-sm font-extrabold text-emerald-300 sm:text-base">
                  ● Online
                </p>
              </div>

              <span className="text-3xl text-cyan-400">✦</span>
            </div>
          </div>
        </section>

        {/* PROMOTIONAL CAROUSEL */}
        <div className="mb-8 overflow-hidden rounded-2xl sm:mb-10 sm:rounded-3xl">
          <PromoCarousel />
        </div>

        {/* SEARCH AND REFRESH */}
        <section className="mb-5 sm:mb-7">
          <div className="flex gap-2.5">
            <div className="relative min-w-0 flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search services, platforms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#101722] pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 sm:h-14 sm:rounded-2xl sm:text-sm"
              />
            </div>

            <button
              onClick={() => fetchServices(true)}
              disabled={refreshing}
              title="Refresh services"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#101722] text-lg text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:opacity-50 sm:h-14 sm:w-14 sm:rounded-2xl"
            >
              <span className={refreshing ? "animate-spin" : ""}>↻</span>
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <p className="text-[10px] text-gray-500 sm:text-xs">
              {filteredServices.length} service
              {filteredServices.length === 1 ? "" : "s"} found
            </p>

            <p className="text-[9px] text-gray-600 sm:text-[10px]">
              Stock updates automatically
            </p>
          </div>
        </section>

        {/* CATEGORY NAVIGATION */}
        <nav className="marketplace-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2 sm:mb-10 sm:gap-3">
          {categories.map((category) => {
            const active = activeCategory === category.value;

            return (
              <button
                key={category.value}
                onClick={() =>
                  scrollToCategory(category.id, category.value)
                }
                className={`shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-bold transition-all duration-200 sm:px-5 sm:py-3 sm:text-xs ${
                  active
                    ? "border-cyan-400 bg-cyan-400 text-[#07111c] shadow-lg shadow-cyan-500/10"
                    : "border-white/[0.08] bg-[#101722] text-gray-400 hover:border-cyan-400/30 hover:text-cyan-300"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </nav>

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-5 text-center">
            <p className="font-bold text-rose-300">
              Unable to load services
            </p>

            <p className="mt-2 text-xs text-gray-400">
              {errorMessage}
            </p>

            <button
              onClick={() => fetchServices()}
              className="mt-4 rounded-xl bg-rose-400/10 px-5 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-400/20"
            >
              Try again
            </button>
          </div>
        )}

        {/* EMPTY MARKETPLACE */}
        {!errorMessage && services.length === 0 && (
          <div className="rounded-3xl border border-white/[0.07] bg-[#101722] px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-3xl text-cyan-300">
              ◈
            </div>

            <h2 className="mt-5 text-xl font-black text-white sm:text-2xl">
              Nothing here yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-gray-500 sm:text-sm">
              New services will appear here once they are added to the
              marketplace.
            </p>
          </div>
        )}

        {/* SERVICE LIST */}
        {!errorMessage && services.length > 0 && (
          <div id="all" className="scroll-mt-6">
            {filteredServices.length === 0 ? (
              <div className="rounded-3xl border border-white/[0.07] bg-[#101722] px-5 py-14 text-center">
                <div className="text-4xl text-gray-600">⌕</div>

                <h2 className="mt-4 text-xl font-black text-white">
                  No services found
                </h2>

                <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                  Try another search term or select a different category.
                </p>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("ALL");
                  }}
                  className="mt-5 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-extrabold text-[#07111c] transition hover:bg-cyan-300"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-9 sm:space-y-12">
                {groupedServices.map((category) => (
                  <section
                    key={category.value}
                    id={category.id}
                    className="scroll-mt-6"
                  >
                    {/* CATEGORY HEADING */}
                    <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-9 w-1 shrink-0 rounded-full bg-cyan-400 sm:h-11" />

                        <div className="min-w-0">
                          <h2 className="truncate text-base font-black text-white sm:text-2xl">
                            {category.label}
                          </h2>

                          <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">
                            {category.services.length} service
                            {category.services.length === 1 ? "" : "s"} available
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-white/[0.07] bg-[#101722] px-3 py-1.5 text-[9px] font-bold text-gray-400 sm:text-xs">
                        {category.services.length} ITEMS
                      </span>
                    </div>

                    {/* SERVICE CARDS */}
                    <div className="space-y-3 sm:space-y-4">
                      {category.services.map((service, index) =>
                        renderService(service, index)
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-14 border-t border-white/[0.06] py-7 text-center sm:mt-20">
          <p className="text-sm font-black tracking-tight text-white">
            Proxy<span className="text-cyan-400">Socials</span>
          </p>

          <p className="mt-2 text-[10px] text-gray-600 sm:text-xs">
            Your digital marketplace. Simple, secure and convenient.
          </p>
        </footer>
      </div>
    </main>
  );
}
