"use client";

import Link from "next/link";

export default function PromoBanner() {
  return (
    <section
      aria-label="Discover ProxySocials"
      className="bg-white px-2 py-5 sm:px-5 sm:py-8 lg:px-6 lg:py-12"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl shadow-slate-900/10 sm:rounded-3xl">
          {/* Landscape promotional video */}
          <div className="w-full overflow-hidden bg-slate-950">
            <video
              className="block h-auto w-full"
              src="/images/proxysocials-promo.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              controls
              disablePictureInPicture
              aria-label="ProxySocials promotional video"
            >
              Your browser does not support HTML video.
            </video>
          </div>

          {/* Responsive call to action */}
          <div className="flex flex-col gap-4 px-4 py-5 sm:px-7 sm:py-7 md:flex-row md:items-center md:justify-between md:gap-8 md:px-9 lg:px-10">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400 sm:text-xs sm:tracking-[0.18em]">
                Discover ProxySocials
              </p>

              <h2 className="mt-2 max-w-2xl break-words text-xl font-black leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
                Everything digital. One platform.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-3 sm:text-base sm:leading-7">
                Explore social media services, streaming subscriptions and
                digital products in one convenient marketplace.
              </p>
            </div>

            <Link
              href="/services"
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 self-stretch rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:min-h-12 sm:w-auto sm:self-start sm:px-7 sm:text-base md:self-center"
            >
              Explore Services
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}