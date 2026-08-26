"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const slides = [
  {
    emoji: "🚀",
    title: "Welcome to ProxySocials",
    description: "Quality digital products delivered instantly",
    button: "Shop Now",
    href: "#all",
  },
  {
    emoji: "💬",
    title: "Join Our WhatsApp Group",
    description:
      "Get updates, new products, offers & important announcements",
    button: "Join WhatsApp",
    href: "https://chat.whatsapp.com/BDSpfpi5g7KBJZeaIYUhBm",
  },
  {
    emoji: "📢",
    title: "Stay Updated",
    description: "Join our Telegram platform today for more updates",
    button: "Join Telegram",
    href: "https://t.me/proxysocials",
  },
  {
    emoji: "⚡",
    title: "Fast. Simple. Reliable.",
    description: "Get your digital products without the hassle",
    button: "Explore Products",
    href: "#all",
  },
];

export default function PromoCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function goToNextSlide() {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }

  function goToPreviousSlide() {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (touchStartX.current === null || touchEndX.current === null) {
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const minimumSwipeDistance = 50;

    if (Math.abs(distance) < minimumSwipeDistance) {
      return;
    }

    if (distance > 0) {
      goToNextSlide();
    } else {
      goToPreviousSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  const slide = slides[currentSlide];

  return (
    <section className="mb-8">
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 shadow-lg touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10" />

        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10" />

        {/* Slide Content */}
        <div
          key={currentSlide}
          className="relative min-h-[165px] sm:min-h-[190px] md:min-h-[210px] flex items-center px-5 py-6 sm:px-8 sm:py-7 md:px-10"
        >
          <div className="max-w-2xl text-white">
            {/* Emoji */}
            <div className="text-2xl sm:text-3xl mb-1">
              {slide.emoji}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
              {slide.title}
            </h2>

            {/* Description */}
            <p className="mt-1.5 text-xs sm:text-sm md:text-base text-white/90 font-medium max-w-xl">
              {slide.description}
            </p>

            {/* Button */}
            <Link
              href={slide.href}
              onClick={(e) => e.stopPropagation()}
              className="inline-block mt-3 rounded-lg bg-white px-5 py-2 text-xs sm:text-sm font-black text-sky-700 shadow-md hover:bg-sky-50 hover:-translate-y-0.5 transition-all"
            >
              {slide.button}
            </Link>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
            key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index
                  ? "w-7 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}