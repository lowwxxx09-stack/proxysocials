"use client";

import { useEffect, useState } from "react";

export default function TelegramBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  const telegramLink = "https://t.me/proxysocials";

  useEffect(() => {
    setMounted(true);

    /*
     * We intentionally use sessionStorage here, but the key is tied
     * to the current login session.
     *
     * A new login creates a new login-session key.
     */
    const loginSessionKey = sessionStorage.getItem(
      "proxysocials_login_session"
    );

    if (!loginSessionKey) {
      const newSessionKey =
        Date.now().toString() +
        "-" +
        Math.random().toString(36).substring(2);

      sessionStorage.setItem(
        "proxysocials_login_session",
        newSessionKey
      );

      sessionStorage.removeItem(
        "proxysocials_telegram_announcement"
      );
    }

    const alreadySeen = sessionStorage.getItem(
      "proxysocials_telegram_announcement"
    );

    if (!alreadySeen) {
      setVisible(true);
    }
  }, []);

  function closeAnnouncement() {
    sessionStorage.setItem(
      "proxysocials_telegram_announcement",
      "true"
    );

    setVisible(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(telegramLink);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "COPY TELEGRAM LINK ERROR:",
        error
      );

      alert(
        "Unable to copy the link. Please copy it manually."
      );
    }
  }

  function joinTelegram() {
    sessionStorage.setItem(
      "proxysocials_telegram_announcement",
      "true"
    );

    window.open(
      telegramLink,
      "_blank",
      "noopener,noreferrer"
    );

    setVisible(false);
  }

  if (!mounted || !visible) {
    return null;
  }

  return (
    <>
      {/* BACKDROP */}
      <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-[8px] sm:px-6">
        {/* SOFT BACKGROUND GLOW */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/[0.045] blur-[100px]" />

          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/[0.035] blur-[100px]" />

          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-500/[0.025] blur-[100px]" />
        </div>

        {/* MODAL */}
        <div className="telegram-modal relative my-auto w-full max-w-[500px] overflow-hidden rounded-[30px] border border-white/[0.10] bg-[#111827]/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
          {/* SOFT TOP LIGHT */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-sky-400/[0.06] blur-[65px]" />

          {/* CLOSE */}
          <button
            type="button"
            onClick={closeAnnouncement}
            aria-label="Close announcement"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] text-xl font-light text-slate-400 transition hover:bg-white/[0.08] hover:text-white active:scale-95 sm:right-5 sm:top-5"
          >
            ×
          </button>

          <div className="relative px-5 pb-6 pt-9 sm:px-8 sm:pb-8 sm:pt-11">
            {/* TELEGRAM ICON */}
            <div className="flex justify-center">
              <div className="telegram-icon-wrap relative flex h-[82px] w-[82px] items-center justify-center rounded-full border border-white/[0.10] bg-sky-500/80 shadow-[0_12px_35px_rgba(14,165,233,0.16)] sm:h-[92px] sm:w-[92px]">
                <div className="absolute inset-[-6px] rounded-full border border-sky-300/[0.08]" />

                <span className="relative text-[39px] drop-shadow-sm sm:text-[44px]">
                  ✈️
                </span>
              </div>
            </div>

            {/* LABEL */}
            <div className="mt-6 flex justify-center">
              <span className="rounded-full border border-sky-300/[0.10] bg-sky-400/[0.06] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-sky-300/80">
                ProxySocials Community
              </span>
            </div>

            {/* TITLE */}
            <h2 className="mt-4 text-center text-[27px] font-black leading-tight tracking-tight text-white sm:text-[33px]">
              Join the ProxySocials
              <span className="block text-sky-300">
                Community
              </span>
            </h2>

            {/* DESCRIPTION */}
            <p className="mx-auto mt-4 max-w-[420px] text-center text-sm font-medium leading-6 text-slate-400 sm:text-[15px] sm:leading-7">
              Get stock updates, giveaways, exclusive discounts
              and important announcements directly from
              ProxySocials.
            </p>

            {/* DIVIDER */}
            <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            {/* JOIN TELEGRAM */}
            <button
              type="button"
              onClick={joinTelegram}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-sky-400/[0.12] bg-sky-500/90 px-5 text-sm font-black text-white shadow-lg shadow-sky-500/[0.08] transition duration-200 hover:bg-sky-500 hover:shadow-xl hover:shadow-sky-500/[0.12] active:scale-[0.98] sm:h-15 sm:text-base"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.92] text-lg text-sky-600">
                ✈
              </span>

              <span>Join Telegram</span>

              <span className="text-lg text-white/80 transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </button>

            {/* COPY LINK */}
            <button
              type="button"
              onClick={copyLink}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-3.5 text-sm font-bold text-slate-400 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-slate-200 active:scale-[0.98]"
            >
              <span className="text-lg">
                {copied ? "✓" : "▣"}
              </span>

              <span>
                {copied
                  ? "Link Copied!"
                  : "Copy Telegram Link"}
              </span>
            </button>

            {/* GOT IT */}
            <div className="mt-6 border-t border-white/[0.07] pt-5">
              <button
                type="button"
                onClick={closeAnnouncement}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/[0.08] bg-transparent text-sm font-bold text-slate-500 transition hover:bg-white/[0.035] hover:text-slate-300 active:scale-[0.98]"
              >
                Got it, thanks!
              </button>

              <p className="mt-3 text-center text-[9px] font-medium text-slate-600">
                You can always find our community from ProxySocials.
              </p>
            </div>
          </div>

          {/* SUBTLE BOTTOM ACCENT */}
          <div className="h-px w-full bg-sky-400/20" />
        </div>
      </div>

      {/* ANIMATION */}
      <style jsx>{`
        .telegram-modal {
          animation: telegramModalIn 0.45s
            cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .telegram-icon-wrap {
          animation: telegramIconIn 0.65s
            cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
        }

        @keyframes telegramModalIn {
          0% {
            opacity: 0;
            transform: translateY(25px) scale(0.94);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes telegramIconIn {
          0% {
            opacity: 0;
            transform: scale(0.65) rotate(-8deg);
          }

          70% {
            transform: scale(1.05) rotate(2deg);
          }

          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .telegram-modal,
          .telegram-icon-wrap {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}