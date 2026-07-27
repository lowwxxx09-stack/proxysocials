"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[9999] bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold text-sky-700"
        >
          ProxySocials
        </Link>

    

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">

          <a href="#services" className="text-gray-700 hover:text-sky-700">
            Services
          </a>

          <a href="#how-it-works" className="text-gray-700 hover:text-sky-700">
            How It Works
          </a>

          <a href="#faq" className="text-gray-700 hover:text-sky-700">
            FAQ
          </a>

          <a
            href="https://wa.me/2348161250950"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-green-600 transition"
          >
            WhatsApp
          </a>

          <Link
            href="/login"
            className="border-2 border-sky-600 text-sky-700 px-5 py-2 rounded-xl font-semibold hover:bg-sky-600 hover:text-white transition"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="bg-sky-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Sign Up
          </Link>

        </div>

        {/* Mobile Menu Button */}
        <button
  onClick={() => setOpen(!open)}
  className="md:hidden text-sky-700 text-3xl"
>
  ☰
</button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t z-50 md:hidden">

          <div className="flex flex-col p-4 gap-4">

            <a
              href="#services"
              onClick={() => setOpen(false)}
              className="text-gray-700"
            >
              Services
            </a>

            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              className="text-gray-700"
            >
              How It Works
            </a>

            <a
              href="#faq"
              onClick={() => setOpen(false)}
              className="text-gray-700"
            >
              FAQ
            </a>

            <a
              href="https://wa.me/2348161250950"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white text-center py-3 rounded-xl font-semibold"
            >
              WhatsApp
            </a>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="border-2 border-sky-600 text-sky-700 text-center py-3 rounded-xl font-semibold"
            >
              Login
            </Link>

            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="bg-sky-600 text-white text-center py-3 rounded-xl font-semibold"
            >
              Sign Up
            </Link>

          </div>
        </div>
      )}
    </nav>
  );
}