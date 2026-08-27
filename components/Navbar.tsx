"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[9999] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-6 py-4">

        {/* LOGO */}
        <Link
          href="/"
          className="group flex items-center gap-2"
        >
          {/* ProxySocials P LOGO */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-label="ProxySocials logo"
          >
            {/* Main P shape */}
            <path
              d="M11 7.5C8.8 7.5 7 9.3 7 11.5V36.5C7 38.7 8.8 40.5 11 40.5C13.2 40.5 15 38.7 15 36.5V29H25.5C32.7 29 38.5 24.2 38.5 18C38.5 11.8 32.7 7.5 25.5 7.5H11Z"
              fill="#1476E8"
            />

            {/* Inner cutout */}
            <path
              d="M15 14.5H24.5C27.8 14.5 30.5 15.8 30.5 18C30.5 20.2 27.8 22 24.5 22H15V14.5Z"
              fill="white"
            />

            {/* Speed lines */}
            <path
              d="M4 15H12"
              stroke="#1476E8"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M3 21H11"
              stroke="#1476E8"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M4 27H11"
              stroke="#1476E8"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Forward arrow / motion accent */}
            <path
              d="M27 31L37 31L33 35"
              stroke="#1476E8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* BRAND NAME */}
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            Proxy<span className="text-sky-600">Socials</span>
          </span>
        </Link>


        {/* DESKTOP NAVIGATION */}
        <div className="hidden md:flex items-center gap-7">

          <a
            href="#services"
            className="relative text-sm font-semibold text-gray-600 transition-colors duration-200 hover:text-sky-600"
          >
            Services
          </a>

          <a
            href="#how-it-works"
            className="text-sm font-semibold text-gray-600 transition-colors duration-200 hover:text-sky-600"
          >
            How It Works
          </a>

          <a
            href="#faq"
            className="text-sm font-semibold text-gray-600 transition-colors duration-200 hover:text-sky-600"
          >
            FAQ
          </a>


          {/* WHATSAPP */}
          <a
            href="https://wa.me/2348161250950"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold shadow-sm hover:bg-green-600 hover:-translate-y-0.5 transition-all duration-200"
          >
            WhatsApp
          </a>


          {/* LOGIN */}
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl border border-sky-600 text-sky-700 text-sm font-bold hover:bg-sky-50 hover:-translate-y-0.5 transition-all duration-200"
          >
            Login
          </Link>


          {/* SIGN UP */}
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold shadow-md hover:bg-sky-700 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          >
            Get Started
          </Link>

        </div>


        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition"
        >
          <span className="text-2xl">
            {open ? "✕" : "☰"}
          </span>
        </button>

      </div>


      {/* MOBILE MENU */}
      {open && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl md:hidden">

          <div className="flex flex-col p-5 gap-3">

            <a
              href="#services"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-gray-700 font-semibold hover:bg-sky-50 hover:text-sky-600 transition"
            >
              Services
            </a>

            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-gray-700 font-semibold hover:bg-sky-50 hover:text-sky-600 transition"
            >
              How It Works
            </a>

            <a
              href="#faq"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-gray-700 font-semibold hover:bg-sky-50 hover:text-sky-600 transition"
            >
              FAQ
            </a>


            {/* WHATSAPP */}
            <a
              href="https://wa.me/2348161250950"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="bg-green-500 text-white text-center py-3 rounded-xl font-bold hover:bg-green-600 transition"
            >
              WhatsApp
            </a>


            {/* LOGIN */}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="border border-sky-600 text-sky-700 text-center py-3 rounded-xl font-bold hover:bg-sky-50 transition"
            >
              Login
            </Link>


            {/* GET STARTED */}
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="bg-sky-600 text-white text-center py-3 rounded-xl font-bold hover:bg-sky-700 transition shadow-md"
            >
              Get Started
            </Link>

          </div>

        </div>
      )}

    </nav>
  );
}