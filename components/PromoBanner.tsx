"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function PromoBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;

    video.play()
      .then(() => {
        setIsPlaying(true);
        setPlaybackError(false);
      })
      .catch(() => {
        // Some mobile browsers block autoplay.
        setIsPlaying(false);
      });
  }, []);

  async function handlePlay() {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = true;
      await video.play();
      setIsPlaying(true);
      setPlaybackError(false);
    } catch {
      setPlaybackError(true);
    }
  }

  return (
    <section
      aria-label="Discover ProxySocials"
      className="bg-white px-2 py-5 sm:px-5 sm:py-8 lg:px-6 lg:py-12"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl shadow-slate-900/10 sm:rounded-3xl">
          {/* Landscape video */}
          <div className="relative w-full overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="block h-auto w-full"
              src="/images/proxysocials-promo.mp4"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="auto"
              disablePictureInPicture
              onPlaying={() => {
                setIsPlaying(true);
                setPlaybackError(false);
              }}
              onPause={() => setIsPlaying(false)}
              onError={() => setPlaybackError(true)}
              aria-label="ProxySocials promotional video"
            >
              Your browser does not support HTML video.
            </video>

            {!isPlaying && (
              <button
                type="button"
                onClick={handlePlay}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white"
                aria-label="Play ProxySocials promotional video"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-2xl shadow-lg sm:h-16 sm:w-16">
                  ▶
                </span>
                <span className="text-sm font-bold sm:text-base">
                  {playbackError ? "Tap to try playing video" : "Play video"}
                </span>
              </button>
            )}
          </div>

          {/* Call to action */}
          <div className="flex flex-col gap-4 px-4 py-5 sm:px-7 sm:py-7 md:flex-row md:items-center md:justify-between md:gap-8 md:px-9 lg:px-10">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400 sm:text-xs sm:tracking-[0.18em]">
                Discover ProxySocials
              </p>

              <h2 className="mt-2 break-words text-xl font-black leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
                Everything digital. One platform.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-3 sm:text-base sm:leading-7">
                Explore social media services, streaming subscriptions and
                digital products in one convenient marketplace.
              </p>
            </div>

            <Link
              href="/services"
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 sm:min-h-12 sm:w-auto sm:px-7 sm:text-base"
            >
              Explore Services <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}