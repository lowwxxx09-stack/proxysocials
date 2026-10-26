"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CustomerMenu from "@/components/CustomerMenu";
import TelegramSupportButton from "@/components/TelegramSupportButton";

type SmmService = {
  id: string | number;
  name: string;
  category: string | null;
  description: string | null;
  service_type: string | null;
  retail_rate: number | string;
  min_quantity: number | string;
  max_quantity: number | string;
  supports_refill: boolean | null;
  supports_cancel: boolean | null;
  currency: string | null;
};

type RecentOrder = {
  id?: string | number;
  order_id?: string | number;
  service_name?: string;
  service?: string;
  target_url?: string;
  link?: string;
  quantity?: number | string;
  charge?: number | string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
};

const INITIAL_MOBILE_SERVICES = 8;
const MORE_MOBILE_SERVICES = 8;

const PLATFORMS: Record<string, { label: string; icon: string }> = {
  Instagram: { label: "Instagram", icon: "◎" },
  TikTok: { label: "TikTok", icon: "♪" },
  YouTube: { label: "YouTube", icon: "▶" },
  Telegram: { label: "Telegram", icon: "➤" },
  Facebook: { label: "Facebook", icon: "f" },
  Twitter: { label: "X / Twitter", icon: "𝕏" },
  Spotify: { label: "Spotify", icon: "♫" },
  Twitch: { label: "Twitch", icon: "▣" },
  LinkedIn: { label: "LinkedIn", icon: "in" },
  Snapchat: { label: "Snapchat", icon: "S" },
  Pinterest: { label: "Pinterest", icon: "P" },
  Other: { label: "Other", icon: "✳" },
};

function getPlatform(service: SmmService): string {
  const value =
    `${service.category ?? ""} ${service.name ?? ""}`.toLowerCase();

  if (value.includes("instagram")) return "Instagram";
  if (value.includes("tiktok") || value.includes("tik tok")) return "TikTok";
  if (value.includes("youtube")) return "YouTube";
  if (value.includes("telegram")) return "Telegram";
  if (value.includes("facebook")) return "Facebook";
  if (value.includes("twitter")) return "Twitter";
  if (value.includes("spotify")) return "Spotify";
  if (value.includes("twitch")) return "Twitch";
  if (value.includes("linkedin")) return "LinkedIn";
  if (value.includes("snapchat")) return "Snapchat";
  if (value.includes("pinterest")) return "Pinterest";

  return "Other";
}

function getCategory(service: SmmService): string {
  let category = (service.category || "General").trim();

  const platformPrefix =
    /^(Instagram|TikTok|Tik Tok|YouTube|Telegram|Facebook|Twitter|Spotify|Twitch|LinkedIn|Snapchat|Pinterest)\s*[-:|/]\s*/i;

  category = category.replace(platformPrefix, "");

  return category.trim() || "General";
}

function money(
  value: number | string | null | undefined,
  currency = "NGN",
) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) return "—";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₦${amount.toLocaleString("en-NG", {
      maximumFractionDigits: 2,
    })}`;
  }
}

function readableStatus(status?: string) {
  if (!status) return "Processing";

  return status
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(status?: string) {
  const value = (status || "").toLowerCase();

  if (
    value.includes("complete") ||
    value.includes("success") ||
    value.includes("delivered")
  ) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (
    value.includes("cancel") ||
    value.includes("reject") ||
    value.includes("fail") ||
    value.includes("refund")
  ) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }

  if (
    value.includes("pending") ||
    value.includes("process") ||
    value.includes("review")
  ) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-white/10 bg-white/5 text-slate-300";
}

function orderId(order: RecentOrder) {
  return order.order_id ?? order.id ?? "—";
}

function orderServiceName(order: RecentOrder) {
  return order.service_name ?? order.service ?? "Social media service";
}

function orderTarget(order: RecentOrder) {
  return order.target_url ?? order.link ?? "";
}

export default function SmmPage() {
  const supabase = useMemo(() => createClient(), []);

  const [services, setServices] = useState<SmmService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("recommended");
  const [mobileCount, setMobileCount] = useState(INITIAL_MOBILE_SERVICES);

  const [selectedId, setSelectedId] = useState("");
  const [target, setTarget] = useState("");
  const [quantity, setQuantity] = useState("100");

  const [submitting, setSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data, error } = await supabase
        .from("smm_services")
        .select(
          "id,name,category,description,service_type,retail_rate,min_quantity,max_quantity,supports_refill,supports_cancel,currency",
        )
        .eq("is_enabled", true)
        .eq("provider_available", true)
        .order("name", { ascending: true });

      if (error) throw error;

      setServices((data ?? []) as SmmService[]);
    } catch (error) {
      console.error("Unable to load SMM services:", error);
      setLoadError("Services could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await fetch("/api/smm/orders", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401) {
        setOrders([]);
        return;
      }

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.error || "Unable to retrieve orders.");
      }

      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.orders)
          ? result.orders
          : Array.isArray(result?.data)
            ? result.data
            : [];

      setOrders(list as RecentOrder[]);
    } catch (error) {
      console.error("Unable to load recent orders:", error);
      setOrdersError("Recent orders are temporarily unavailable.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        setSignedIn(Boolean(user));
        setSessionReady(true);
      } catch (error) {
        console.error("Unable to check user session:", error);

        if (active) {
          setSignedIn(false);
          setSessionReady(true);
        }
      }

      if (active) {
        await Promise.all([loadServices(), loadOrders()]);
      }
    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      setSessionReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadServices, loadOrders]);

  const platformList = useMemo(() => {
    return Array.from(new Set(services.map(getPlatform))).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    });
  }, [services]);

  const availableCategories = useMemo(() => {
    const source =
      platform === "All"
        ? services
        : services.filter((item) => getPlatform(item) === platform);

    return Array.from(new Set(source.map(getCategory))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [services, platform]);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = services.filter((service) => {
      const matchesPlatform =
        platform === "All" || getPlatform(service) === platform;

      const matchesCategory =
        category === "All" || getCategory(service) === category;

      const matchesSearch =
        !term ||
        service.name.toLowerCase().includes(term) ||
        (service.category || "").toLowerCase().includes(term) ||
        (service.description || "").toLowerCase().includes(term) ||
        (service.service_type || "").toLowerCase().includes(term);

      return matchesPlatform && matchesCategory && matchesSearch;
    });

    if (sort === "price-low") {
      result.sort(
        (a, b) => Number(a.retail_rate) - Number(b.retail_rate),
      );
    } else if (sort === "price-high") {
      result.sort(
        (a, b) => Number(b.retail_rate) - Number(a.retail_rate),
      );
    } else if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [services, platform, category, search, sort]);

  const selectedService = useMemo(
    () =>
      services.find((item) => String(item.id) === String(selectedId)) ?? null,
    [services, selectedId],
  );

  const qty = Number(quantity);
  const minimum = Number(selectedService?.min_quantity ?? 1);
  const maximum = Number(selectedService?.max_quantity ?? 1000000);
  const rate = Number(selectedService?.retail_rate ?? 0);
  const currency = selectedService?.currency || "NGN";

  const estimatedCost =
    selectedService && Number.isFinite(qty) && qty > 0
      ? (qty / 1000) * rate
      : 0;

  function resetMobileCount() {
    setMobileCount(INITIAL_MOBILE_SERVICES);
  }

  function choosePlatform(value: string) {
    setPlatform(value);
    setCategory("All");
    setSearch("");
    resetMobileCount();
  }

  function chooseService(service: SmmService) {
    setSelectedId(String(service.id));
    setQuantity(String(service.min_quantity || 100));
    setOrderMessage("");
    setMessageType("info");

    window.setTimeout(() => {
      document.getElementById("order-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 60);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrderMessage("");

    if (!sessionReady) {
      setOrderMessage("Please wait while we check your account.");
      setMessageType("info");
      return;
    }

    if (!signedIn) {
      setOrderMessage("Please sign in before placing an order.");
      setMessageType("error");
      return;
    }

    if (!selectedService) {
      setOrderMessage("Please select a service first.");
      setMessageType("error");
      return;
    }

    if (!target.trim()) {
      setOrderMessage("Enter the target link or username.");
      setMessageType("error");
      return;
    }

    if (!Number.isInteger(qty) || qty < minimum || qty > maximum) {
      setOrderMessage(
        `Quantity must be a whole number between ${minimum.toLocaleString()} and ${maximum.toLocaleString()}.`,
      );
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/smm/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          targetUrl: target.trim(),
          quantity: qty,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Your order could not be placed.",
        );
      }

      if (result?.duplicate) {
        setOrderMessage(
          result?.message ||
            "This order was already received. Check your recent orders.",
        );
        setMessageType("info");
      } else if (
        result?.manual_review ||
        result?.status === "manual_review"
      ) {
        setOrderMessage(
          result?.message || "Your order has been received for review.",
        );
        setMessageType("info");
      } else {
        setOrderMessage(
          result?.message || "Your order has been submitted successfully.",
        );
        setMessageType("success");
      }

      setTarget("");
      await loadOrders();
    } catch (error) {
      setOrderMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  const shownCount = Math.min(mobileCount, filteredServices.length);

  return (
    <main className="smm-page relative min-h-screen overflow-x-clip bg-[#070a12] pb-24 text-white md:pb-12">
      <style jsx global>{`
        @keyframes smm-fade-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes smm-drift {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -8px, 0);
          }
        }

        @keyframes smm-orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes smm-pulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.04);
          }
        }

        @keyframes smm-shimmer {
          from {
            background-position: 0% 50%;
          }
          to {
            background-position: 200% 50%;
          }
        }

        .smm-reveal {
          animation: smm-fade-up 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }

        .smm-delay-1 {
          animation-delay: 90ms;
        }

        .smm-delay-2 {
          animation-delay: 180ms;
        }

        .smm-delay-3 {
          animation-delay: 270ms;
        }

        .smm-float {
          animation: smm-drift 5s ease-in-out infinite;
        }

        .smm-float-delay {
          animation: smm-drift 6s ease-in-out 0.7s infinite;
        }

        .smm-orbit {
          animation: smm-orbit 36s linear infinite;
        }

        .smm-glow {
          animation: smm-pulse 5s ease-in-out infinite;
        }

        .smm-shimmer {
          background-size: 200% 100%;
          animation: smm-shimmer 5s ease-in-out infinite alternate;
        }

        @media (prefers-reduced-motion: reduce) {
          .smm-page *,
          .smm-page *::before,
          .smm-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="smm-glow absolute -left-36 top-24 h-72 w-72 rounded-full bg-cyan-500/[0.09] blur-[110px]" />
        <div className="smm-glow absolute -right-36 top-[38%] h-80 w-80 rounded-full bg-blue-600/[0.08] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:42px_42px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      </div>

      {/* Main content container */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <header className="relative z-50 mb-4 flex min-w-0 items-center justify-between gap-3 py-4 sm:mb-6 sm:py-5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/20 to-blue-500/10 text-lg font-black text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.08)]">
              P
              <span className="absolute inset-x-1 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-black tracking-tight sm:text-base">
                ProxySocials
              </span>
              <span className="hidden text-[9px] uppercase tracking-[0.17em] text-slate-500 sm:block sm:text-[10px]">
                Social growth marketplace
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-300/30 hover:text-white sm:inline-flex"
            >
              Dashboard
            </Link>

            <CustomerMenu />
          </div>
        </header>

        {/* Hero */}
        <section className="smm-reveal smm-delay-1 relative isolate z-0 mt-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b1220]/90 shadow-2xl shadow-black/20 sm:rounded-3xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(34,211,238,0.12),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(59,130,246,0.12),transparent_48%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

          <div className="relative grid min-w-0 items-center gap-7 p-5 sm:p-7 md:grid-cols-[minmax(0,1.35fr)_minmax(220px,.65fr)] md:gap-5 md:p-9 lg:p-10">
            <div className="relative z-10 min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-cyan-200 sm:px-3 sm:text-[10px] sm:tracking-[0.17em]">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
                </span>
                <span className="truncate">Social media marketplace</span>
              </div>

              <h1 className="mt-4 max-w-full break-words text-[clamp(1.85rem,4.1vw,3.65rem)] font-black leading-[1.04] tracking-[-0.055em] sm:mt-5">
                <span className="block">Your social presence.</span>
                <span className="smm-shimmer mt-1 block bg-gradient-to-r from-blue-400 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                  Your next level.
                </span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:mt-4 sm:text-base">
                Discover services. Build your presence. Manage everything in
                one place.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
                <a
                  href="#services"
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-extrabold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-200"
                >
                  Explore services
                  <span className="transition-transform group-hover:translate-y-0.5">
                    ↓
                  </span>
                </a>

                <a
                  href="#order-form"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-slate-200 transition duration-200 hover:border-cyan-300/25 hover:bg-white/[0.07]"
                >
                  Place an order <span>↗</span>
                </a>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400 sm:mt-6 sm:text-sm">
                <span>
                  <span className="mr-1.5 text-cyan-300">✓</span>
                  Easy ordering
                </span>
                <span>
                  <span className="mr-1.5 text-cyan-300">✓</span>
                  Order tracking
                </span>
              </div>
            </div>

            {/* Decorative illustration */}
            <div className="relative hidden min-h-64 items-center justify-center md:flex">
              <div className="smm-glow absolute h-48 w-48 rounded-full bg-cyan-400/[0.08] blur-3xl lg:h-56 lg:w-56" />

              <div className="smm-orbit absolute h-48 w-48 rounded-full border border-dashed border-cyan-200/20 lg:h-56 lg:w-56">
                <span className="absolute -top-2 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-xl border border-cyan-200/20 bg-[#111d2c] text-lg text-cyan-200 shadow-lg">
                  ◎
                </span>
              </div>

              <div className="smm-orbit absolute h-36 w-36 rounded-full border border-blue-300/20 [animation-direction:reverse]">
                <span className="absolute -right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-blue-300/20 bg-[#111d2c] text-sm text-blue-200 shadow-lg">
                  ▶
                </span>
              </div>

              <div className="smm-float relative flex h-24 w-24 items-center justify-center rounded-[1.7rem] border border-cyan-200/25 bg-gradient-to-br from-cyan-300/20 via-[#13243a] to-blue-500/20 text-5xl font-black text-cyan-200 shadow-[0_0_60px_rgba(34,211,238,0.12)] lg:h-28 lg:w-28">
                P
                <span className="absolute inset-1 rounded-[1.35rem] border border-white/[0.06]" />
              </div>

              <div className="smm-float-delay absolute bottom-3 left-0 flex items-center gap-2 rounded-xl border border-white/10 bg-[#101a29]/95 px-3 py-2 shadow-xl lg:bottom-5 lg:-left-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-300">
                  ↗
                </span>
                <span>
                  <span className="block text-xs font-bold text-white">
                    Your next move
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Starts here
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Compact stats */}
        <section className="smm-reveal smm-delay-2 mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
          {[
            {
              label: "Services",
              value: loading ? "…" : services.length.toLocaleString(),
              detail: "To explore",
            },
            {
              label: "Platforms",
              value: platformList.length.toLocaleString(),
              detail: "Communities",
            },
            {
              label: "Recent orders",
              value: ordersLoading ? "…" : orders.length.toLocaleString(),
              detail: "Order activity",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="group relative min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 transition duration-200 hover:border-cyan-300/20 hover:bg-white/[0.04] sm:rounded-2xl sm:p-4"
            >
              <div className="absolute right-0 top-0 h-10 w-10 rounded-full bg-cyan-300/[0.04] blur-xl transition group-hover:bg-cyan-300/[0.1]" />
              <p className="relative truncate text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 sm:text-[10px] sm:tracking-[0.15em]">
                {item.label}
              </p>
              <p className="relative mt-1 text-lg font-black tracking-tight sm:text-2xl">
                {item.value}
              </p>
              <p className="relative mt-0.5 hidden text-[10px] text-slate-500 sm:block">
                {item.detail}
              </p>
            </div>
          ))}
        </section>
                {/* Catalogue */}
        <section id="services" className="scroll-mt-6 pt-9 sm:pt-12">
          <div className="smm-reveal flex min-w-0 items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 sm:text-xs">
                The catalogue
              </p>
              <h2 className="mt-1.5 text-xl font-black tracking-tight sm:text-3xl">
                Find your service<span className="text-cyan-300">.</span>
              </h2>
              <p className="mt-1.5 max-w-lg text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                Search, filter, compare, and choose what works for you.
              </p>
            </div>

            <div className="shrink-0 pb-1 text-[10px] text-slate-500 sm:text-xs">
              <span className="md:hidden">
                {shownCount} / {filteredServices.length}
              </span>
              <span className="hidden md:inline">
                {filteredServices.length} services
              </span>
            </div>
          </div>

          {/* Platform selector */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => choosePlatform("All")}
              className={`shrink-0 rounded-lg border px-3.5 py-2 text-xs font-bold transition duration-200 ${
                platform === "All"
                  ? "border-cyan-300/40 bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.1)]"
                  : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              All platforms
            </button>

            {platformList.map((item) => {
              const info = PLATFORMS[item] || PLATFORMS.Other;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => choosePlatform(item)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition duration-200 ${
                    platform === item
                      ? "border-cyan-300/40 bg-cyan-300 text-slate-950"
                      : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{info.icon}</span>
                  {info.label}
                </button>
              );
            })}
          </div>

          {/* Search and sort */}
          <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px]">
            <label className="relative block min-w-0">
              <span className="sr-only">Search services</span>
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-500">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetMobileCount();
                }}
                placeholder="Search services..."
                className="w-full rounded-xl border border-white/[0.09] bg-[#0b111c] py-3 pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 sm:text-sm"
              />
            </label>

            <label className="block min-w-0">
              <span className="sr-only">Sort services</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  resetMobileCount();
                }}
                className="w-full rounded-xl border border-white/[0.09] bg-[#0b111c] px-3 py-3 text-xs text-slate-300 outline-none transition focus:border-cyan-300/40 sm:text-sm"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>

          {/* Categories */}
          {availableCategories.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Categories
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["All", ...availableCategories].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCategory(item);
                      resetMobileCount();
                    }}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${
                      category === item
                        ? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-200"
                        : "border-white/[0.08] text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    {item === "All" ? "All categories" : item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadError && (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-200">
              {loadError}{" "}
              <button
                type="button"
                onClick={() => void loadServices()}
                className="font-bold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                >
                  <div className="h-3 w-2/3 rounded bg-white/10" />
                  <div className="mt-4 h-3 rounded bg-white/[0.06]" />
                  <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.06]" />
                  <div className="mt-5 h-9 rounded-lg bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
              <p className="text-2xl text-slate-600">⌕</p>
              <p className="mt-2 text-sm font-bold">Nothing found</p>
              <p className="mt-1 text-xs text-slate-500">
                Try another search or clear your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPlatform("All");
                  setCategory("All");
                  setSort("recommended");
                  resetMobileCount();
                }}
                className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.05]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
                {filteredServices
                  .slice(0, mobileCount)
                  .map((service, index) => {
                    const servicePlatform = getPlatform(service);
                    const info = PLATFORMS[servicePlatform] || PLATFORMS.Other;
                    const isSelected =
                      String(selectedId) === String(service.id);

                    return (
                      <article
                        key={service.id}
                        style={{
                          animationDelay: `${Math.min(index, 8) * 35}ms`,
                        }}
                        className={`smm-reveal group flex min-w-0 flex-col rounded-2xl border bg-gradient-to-br from-[#101827]/95 to-[#0b111b]/95 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:shadow-[0_12px_35px_rgba(0,0,0,0.18)] sm:p-4 ${
                          isSelected
                            ? "border-cyan-300/35 ring-1 ring-cyan-300/10"
                            : "border-white/[0.075]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] text-base font-black text-cyan-200 transition duration-200 group-hover:border-cyan-300/30 group-hover:bg-cyan-300/[0.1]">
                            {info.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-300/90">
                              {info.label}
                            </p>
                            <h3 className="mt-1 break-words text-sm font-extrabold leading-5 text-slate-100">
                              {service.name}
                            </h3>
                          </div>

                          {isSelected && (
                            <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-2 py-1 text-[9px] font-bold text-cyan-200">
                              Selected
                            </span>
                          )}
                        </div>

                        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                          {service.description ||
                            "Select this service to view its requirements and place an order."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[9px] text-slate-500">
                            {getCategory(service)}
                          </span>
                          {service.supports_refill && (
                            <span className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.04] px-2 py-1 text-[9px] text-emerald-300">
                              Refill
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-3">
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-wider text-slate-600">
                              Per 1,000
                            </p>
                            <p className="mt-1 break-words text-base font-black tracking-tight text-white">
                              {money(
                                service.retail_rate,
                                service.currency || "NGN",
                              )}
                            </p>
                            <p className="mt-1 text-[9px] text-slate-600">
                              {Number(service.min_quantity).toLocaleString()}–
                              {Number(service.max_quantity).toLocaleString()}{" "}
                              units
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => chooseService(service)}
                            className={`shrink-0 rounded-lg px-3 py-2.5 text-[10px] font-extrabold transition duration-200 sm:text-xs ${
                              isSelected
                                ? "border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200"
                                : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                            }`}
                          >
                            {isSelected ? "Selected ✓" : "Choose service"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
              </div>

              {filteredServices.length > INITIAL_MOBILE_SERVICES && (
                <div className="mt-4 md:hidden">
                  {mobileCount < filteredServices.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setMobileCount((current) =>
                          Math.min(
                            current + MORE_MOBILE_SERVICES,
                            filteredServices.length,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs font-bold text-slate-300 transition hover:border-cyan-300/25 hover:bg-white/[0.05]"
                    >
                      Load more services ·{" "}
                      {filteredServices.length - mobileCount} remaining
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileCount(INITIAL_MOBILE_SERVICES);
                        document.getElementById("services")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs font-bold text-slate-400 transition hover:bg-white/[0.05]"
                    >
                      Show fewer services ↑
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
                {/* Order form */}
        <section id="order-form" className="scroll-mt-6 pt-9 sm:pt-12">
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:gap-4">
            <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#101827] to-[#0b111b] p-4 sm:rounded-3xl sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Checkout
                  </p>
                  <h2 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
                    Place an order
                  </h2>
                  <p className="mt-1.5 max-w-lg text-xs leading-5 text-slate-400">
                    Select a service, provide the target details, and review
                    your estimated charge.
                  </p>
                </div>

                <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] text-lg text-cyan-200 sm:flex">
                  ↗
                </span>
              </div>

              {!signedIn && sessionReady && (
                <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100">
                  Sign in to place an order.{" "}
                  <Link href="/login" className="font-bold underline">
                    Sign in here
                  </Link>
                </div>
              )}

              <form onSubmit={submitOrder} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="smm-service"
                    className="mb-2 block text-xs font-bold text-slate-300"
                  >
                    Select service
                  </label>

                  <select
                    id="smm-service"
                    value={selectedId}
                    onChange={(event) => {
                      const service = services.find(
                        (item) => String(item.id) === event.target.value,
                      );

                      if (service) {
                        setSelectedId(String(service.id));
                        setQuantity(String(service.min_quantity || 100));
                        setOrderMessage("");
                      } else {
                        setSelectedId("");
                      }
                    }}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#080e18] px-3.5 py-3 text-xs text-white outline-none transition focus:border-cyan-300/40 sm:text-sm"
                  >
                    <option value="">Choose a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={String(service.id)}>
                        {service.name} —{" "}
                        {money(service.retail_rate, service.currency || "NGN")}{" "}
                        / 1,000
                      </option>
                    ))}
                  </select>

                  {selectedService && (
                    <p className="mt-2 text-[10px] leading-5 text-slate-500">
                      Minimum {minimum.toLocaleString()} · Maximum{" "}
                      {maximum.toLocaleString()} · Rate per 1,000 units
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="smm-target"
                    className="mb-2 block text-xs font-bold text-slate-300"
                  >
                    Target link or username
                  </label>

                  <input
                    id="smm-target"
                    type="text"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    required
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-[#080e18] px-3.5 py-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 sm:text-sm"
                  />

                  <p className="mt-1.5 text-[10px] text-slate-600">
                    Check the target carefully before submitting.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="smm-quantity"
                    className="mb-2 block text-xs font-bold text-slate-300"
                  >
                    Quantity
                  </label>

                  <input
                    id="smm-quantity"
                    type="number"
                    inputMode="numeric"
                    min={selectedService ? minimum : 1}
                    max={selectedService ? maximum : undefined}
                    step={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#080e18] px-3.5 py-3 text-xs text-white outline-none transition focus:border-cyan-300/40 sm:text-sm"
                  />
                </div>

                <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.045] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      Estimated total
                    </span>
                    <span className="text-right text-lg font-black text-cyan-200 sm:text-xl">
                      {selectedService ? money(estimatedCost, currency) : "—"}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-600">
                    The final charge is determined by the order system.
                  </p>
                </div>

                {orderMessage && (
                  <div
                    role="status"
                    className={`rounded-xl border p-3 text-xs leading-5 ${
                      messageType === "success"
                        ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"
                        : messageType === "error"
                          ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-200"
                          : "border-sky-400/20 bg-sky-400/[0.06] text-sky-200"
                    }`}
                  >
                    {orderMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !sessionReady}
                  className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-slate-950 transition duration-200 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  {submitting
                    ? "Submitting order..."
                    : !sessionReady
                      ? "Checking account..."
                      : "Submit order"}

                  {!submitting && (
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Order summary and checklist */}
            <aside className="min-w-0 space-y-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:rounded-3xl sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Order summary
                </p>

                {selectedService ? (
                  <>
                    <div className="mt-4 flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] text-lg text-cyan-200">
                        {(
                          PLATFORMS[getPlatform(selectedService)] ||
                          PLATFORMS.Other
                        ).icon}
                      </span>

                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-extrabold">
                          {selectedService.name}
                        </h3>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {getPlatform(selectedService)} ·{" "}
                          {getCategory(selectedService)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-white/[0.07] pt-4 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Quantity</span>
                        <span className="font-bold text-slate-200">
                          {Number.isFinite(qty) && qty > 0
                            ? qty.toLocaleString()
                            : "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Rate / 1,000</span>
                        <span className="font-bold text-slate-200">
                          {money(rate, currency)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 border-t border-white/[0.07] pt-3">
                        <span className="font-bold text-slate-300">
                          Estimated total
                        </span>
                        <span className="text-right font-black text-cyan-200">
                          {money(estimatedCost, currency)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-white/10 px-3 py-7 text-center">
                    <div className="text-xl text-slate-600">＋</div>
                    <p className="mt-2 text-xs font-bold text-slate-300">
                      Select a service
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                      Your chosen service and estimated cost will appear here.
                    </p>
                    <a
                      href="#services"
                      className="mt-3 inline-block text-xs font-bold text-cyan-300 hover:text-cyan-200"
                    >
                      Browse catalogue ↑
                    </a>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:rounded-3xl sm:p-5">
                <h3 className="text-sm font-extrabold">Quick checklist</h3>
                <div className="mt-3 space-y-3">
                  {[
                    "Verify the target link or username.",
                    "Stay within the service quantity limits.",
                    "Review the estimated charge.",
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-cyan-300/15 bg-cyan-300/[0.06] text-[9px] font-black text-cyan-200">
                        0{index + 1}
                      </span>
                      <p className="text-xs leading-5 text-slate-400">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Recent orders */}
        <section
          id="recent-orders"
          className="scroll-mt-6 pt-9 sm:pt-12"
        >
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                Activity
              </p>
              <h2 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
                Recent orders
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Your latest available order records.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadOrders()}
              disabled={ordersLoading}
              className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 transition hover:border-cyan-300/25 hover:text-white disabled:opacity-50 sm:text-xs"
            >
              {ordersLoading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {ordersError && (
            <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs text-amber-200">
              {ordersError}
            </div>
          )}

          {ordersLoading ? (
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 text-xs text-slate-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
              <p className="text-2xl text-slate-600">↗</p>
              <p className="mt-2 text-sm font-bold text-slate-300">
                No recent orders
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Available order records will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {orders.slice(0, 8).map((order, index) => (
                <article
                  key={`${String(orderId(order))}-${index}`}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition hover:border-white/[0.13] sm:rounded-2xl sm:p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-cyan-300">
                          Order #{String(orderId(order))}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-1 text-[9px] font-bold ${statusClasses(order.status)}`}
                        >
                          {readableStatus(order.status)}
                        </span>
                      </div>

                      <h3 className="mt-2 break-words text-xs font-bold text-slate-100 sm:text-sm">
                        {orderServiceName(order)}
                      </h3>

                      {orderTarget(order) && (
                        <p className="mt-1 break-all text-[10px] text-slate-600">
                          {orderTarget(order)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-2 sm:min-w-32 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <span className="text-[10px] text-slate-500">
                        Qty:{" "}
                        <span className="font-bold text-slate-300">
                          {Number(order.quantity ?? 0).toLocaleString()}
                        </span>
                      </span>

                      <span className="text-xs font-black text-white">
                        {order.charge !== undefined
                          ? money(order.charge)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-white/[0.07] py-5 text-center">
          <p className="text-[10px] font-semibold tracking-wide text-slate-600">
            ProxySocials · © {new Date().getFullYear()}
          </p>
          <p className="mt-1 text-[10px] text-slate-700">
            Social growth marketplace
          </p>
        </footer>
      </div>

      {/* Telegram support */}
      <TelegramSupportButton />
    </main>
  );
}