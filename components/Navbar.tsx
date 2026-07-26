"use client";

import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm px-4 md:px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="text-xl md:text-2xl font-extrabold text-sky-700">
          ProxySocials
        </a>

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
            className="bg-green-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-green-600"
          >
            WhatsApp
          </a>

          <a
            href="/login"
            className="border-2 border-sky-600 text-sky-700 px-5 py-2 rounded-xl font-semibold hover:bg-sky-600 hover:text-white"
          >
            Login
          </a>

          <a
            href="/signup"
            className="bg-sky-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-sky-700"
          >
            Sign Up
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-3xl text-sky-700"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-4 flex flex-col gap-3">

          <a href="#services" onClick={() => setOpen(false)}>
            Services
          </a>

          <a href="#how-it-works" onClick={() => setOpen(false)}>
            How It Works
          </a>

          <a href="#faq" onClick={() => setOpen(false)}>
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

          <a
            href="/login"
            className="border-2 border-sky-600 text-sky-700 text-center py-3 rounded-xl font-semibold"
          >
            Login
          </a>

          <a
            href="/signup"
            className="bg-sky-600 text-white text-center py-3 rounded-xl font-semibold"
          >
            Sign Up
          </a>

        </div>
      )}
    </nav>
  );
}