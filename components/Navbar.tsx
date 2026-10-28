"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = [
  { label: "Services", href: "/#services" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

  return (
    <nav className="sticky top-0 z-[9999] border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="ProxySocials home"
          className="group flex min-w-0 shrink items-center gap-2"
        >
          <svg
            width="42"
            height="42"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-9 w-9 shrink-0 sm:h-11 sm:w-11"
            aria-hidden="true"
          >
            <path
              d="M11 7.5C8.8 7.5 7 9.3 7 11.5V36.5C7 38.7 8.8 40.5 11 40.5C13.2 40.5 15 38.7 15 36.5V29H25.5C32.7 29 38.5 24.2 38.5 18C38.5 11.8 32.7 7.5 25.5 7.5H11Z"
              fill="#1476E8"
            />
            <path
              d="M15 14.5H24.5C27.8 14.5 30.5 15.8 30.5 18C30.5 20.2 27.8 22 24.5 22H15V14.5Z"
              fill="white"
            />
            <path
              d="M4 15H12M3 21H11M4 27H11"
              stroke="#1476E8"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M27 31L37 31L33 35"
              stroke="#1476E8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
            Proxy<span className="text-sky-600">Socials</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-7">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap text-sm font-semibold text-slate-600 transition-colors hover:text-sky-600"
            >
              {item.label}
            </Link>
          ))}

          <a
            href="https://wa.me/2348161250950"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            WhatsApp
          </a>

          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl border border-sky-600 px-4 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl bg-sky-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 hover:shadow-md"
          >
            Get Started
          </Link>
        </div>

        {/* Compact actions for medium screens */}
        <div className="hidden items-center gap-2 md:flex lg:hidden">
          <Link
            href="/login"
            className="rounded-xl border border-sky-600 px-3 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:hidden"
        >
          {open ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-100 bg-white shadow-xl md:hidden"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-3 py-4 sm:px-6">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
              >
                {item.label}
              </Link>
            ))}

            <div className="my-1 border-t border-slate-100" />

            <a
              href="https://wa.me/2348161250950"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              WhatsApp Support
              <span aria-hidden="true">↗</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-xl border border-sky-600 px-4 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
              >
                Login
              </Link>

              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}