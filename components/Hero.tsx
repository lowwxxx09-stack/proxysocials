"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    eyebrow: "Trusted Digital Marketplace",
    title: "Everything digital.",
    highlight: "One platform.",
    description:
      "Social media services, subscriptions and digital products, all in one place.",
    primaryText: "Browse Services",
    primaryHref: "/services",
    secondaryText: "Join ProxySocials",
    secondaryHref: "/signup",
    accent: "from-sky-500/30 via-blue-500/10 to-transparent",
  },
  {
    eyebrow: "Your Digital World",
    title: "Grow your",
    highlight: "online presence.",
    description:
      "Discover digital products and social media services built for creators, streamers and businesses.",
    primaryText: "Explore Services",
    primaryHref: "/services",
    secondaryText: "Get Started",
    secondaryHref: "/signup",
    accent: "from-cyan-400/25 via-sky-500/10 to-transparent",
  },
  {
    eyebrow: "Discover More",
    title: "Find it all",
    highlight: "right here.",
    description:
      "Explore social media accounts, subscriptions and digital products through one convenient marketplace.",
    primaryText: "Explore Marketplace",
    primaryHref: "/services",
    secondaryText: "Create Account",
    secondaryHref: "/signup",
    accent: "from-blue-600/30 via-indigo-500/10 to-transparent",
  },
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [paused]);

  function showPrevious() {
    setActiveSlide(
      (current) => (current - 1 + slides.length) % slides.length
    );
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % slides.length);
  }

  const currentSlide = slides[activeSlide];

  return (
    <section className="overflow-hidden bg-gradient-to-b from-sky-50 to-white px-2 py-3 sm:px-5 sm:py-6">
      <div
        className="relative mx-auto aspect-[4/3] w-full max-w-7xl overflow-hidden rounded-2xl bg-slate-950 shadow-xl shadow-sky-950/10 sm:aspect-[16/8] sm:rounded-3xl md:aspect-auto md:min-h-[500px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background design */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-gradient-to-br ${currentSlide.accent}`}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl sm:h-96 sm:w-96"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl sm:h-80 sm:w-80"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Slide content */}
        <div className="relative z-10 flex h-full min-h-[320px] items-center px-5 pb-12 pt-8 sm:min-h-[380px] sm:px-12 sm:py-14 md:min-h-[500px] md:px-16 lg:px-20">
          <div
            key={activeSlide}
            className="hero-carousel-content w-full max-w-2xl"
          >
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-sky-200 sm:px-4 sm:py-2 sm:text-sm">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-sky-400 sm:h-2 sm:w-2" />
              <span className="truncate">{currentSlide.eyebrow}</span>
            </span>

            <h1 className="mt-4 text-[clamp(1.8rem,6.2vw,3rem)] font-black leading-[1.05] tracking-tight text-white sm:mt-6 sm:text-5xl md:text-6xl lg:text-7xl">
              {currentSlide.title}
              <br />
              <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {currentSlide.highlight}
              </span>
            </h1>

            <p className="mt-3 max-w-lg text-xs leading-5 text-slate-200 sm:mt-5 sm:text-base sm:leading-7 md:text-lg">
              {currentSlide.description}
            </p>

            <div className="mt-5 flex flex-row flex-wrap gap-2 sm:mt-7 sm:gap-3">
              <Link
                href={currentSlide.primaryHref}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-400 sm:min-h-12 sm:gap-2 sm:rounded-xl sm:px-6 sm:text-sm md:px-7"
              >
                {currentSlide.primaryText}
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href={currentSlide.secondaryHref}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-[11px] font-bold text-white backdrop-blur-sm transition hover:bg-white/10 sm:min-h-12 sm:rounded-xl sm:px-6 sm:text-sm md:px-7"
              >
                {currentSlide.secondaryText}
              </Link>
            </div>
          </div>
        </div>

        {/* Previous slide */}
        <button
          type="button"
          onClick={showPrevious}
          aria-label="Previous banner"
          className="absolute right-12 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-lg text-white backdrop-blur transition hover:bg-sky-500 sm:right-16 sm:top-5 sm:h-10 sm:w-10 md:left-5 md:right-auto md:top-1/2 md:h-12 md:w-12 md:-translate-y-1/2"
        >
          ‹
        </button>

        {/* Next slide */}
        <button
          type="button"
          onClick={showNext}
          aria-label="Next banner"
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-lg text-white backdrop-blur transition hover:bg-sky-500 sm:right-5 sm:top-5 sm:h-10 sm:w-10 md:right-5 md:top-1/2 md:h-12 md:w-12 md:-translate-y-1/2"
        >
          ›
        </button>

        {/* Slide indicators */}
        <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-2 sm:bottom-5">
          {slides.map((slide, index) => (
            <button
              key={slide.eyebrow}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === activeSlide ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeSlide
                  ? "w-7 bg-sky-400"
                  : "w-2 bg-white/50 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <FeatureCard
          icon="⚡"
          title="Fast Delivery"
          description="Services are processed according to their listed delivery times."
        />

        <FeatureCard
          icon="🔒"
          title="Secure Payments"
          description="Payments are handled through the payment options configured on our platform."
        />

        <FeatureCard
          icon="🎁"
          title="Earn Rewards"
          description="Discover referral rewards and other benefits available to eligible members."
        />
      </div>

      <style jsx>{`
        .hero-carousel-content {
          animation: hero-enter 650ms ease both;
        }

        @keyframes hero-enter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-carousel-content {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-2xl sm:p-7">
      <div className="text-3xl sm:text-4xl" aria-hidden="true">
        {icon}
      </div>

      <h3 className="mt-3 text-lg font-black text-gray-900 sm:mt-4 sm:text-xl">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
        {description}
      </p>
    </div>
  );
}