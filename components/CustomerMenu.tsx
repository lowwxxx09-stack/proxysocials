"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export default function CustomerMenu() {
  const [open, setOpen] = useState(false);
  function closeMenu() {
  setOpen(false);
}

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-5 left-5 z-50 bg-sky-600 text-white w-12 h-12 rounded-xl text-2xl font-bold shadow-lg"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-zinc-900 text-white z-50 shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">

          <h2 className="text-3xl font-black text-sky-400 mb-8">
            ProxySocials
          </h2>

          <div className="space-y-5">

            <Link
  href="/dashboard"
  onClick={closeMenu}
  className={`block font-bold text-lg transition ${
    pathname === "/dashboard"
      ? "text-sky-400"
      : "hover:text-sky-400"
  }`}
>
  🏠 Dashboard
</Link>

            <Link
  href="/services"
  onClick={closeMenu}
  className={`block font-bold text-lg transition ${
    pathname === "/services"
      ? "text-sky-400"
      : "hover:text-sky-400"
  }`}
>
  🛒 Services
</Link>

            <Link
  href="/order-history"
  onClick={closeMenu}
  className={`block font-bold text-lg transition ${
    pathname === "/order-history"
      ? "text-sky-400"
      : "hover:text-sky-400"
  }`}
>
  📦 Order History
</Link>

            <Link
  href="/profile"
  onClick={closeMenu}
  className={`block font-bold text-lg transition ${
    pathname === "/profile"
      ? "text-sky-400"
      : "hover:text-sky-400"
  }`}
>
  👤 My Profile
</Link>

<Link
  href="/support"
  onClick={closeMenu}
  className={`block font-bold text-lg transition ${
    pathname === "/support"
      ? "text-sky-400"
      : "hover:text-sky-400"
  }`}
>
  💬 Contact Support
</Link>

<Link
  href="/disclaimer"
  onClick={closeMenu}
  className={`block font-bold text-lg transition ${
    pathname === "/disclaimer"
      ? "text-sky-400"
      : "hover:text-sky-400"
  }`}
>
  ⚠ Disclaimer
</Link>

            <button
              onClick={logout}
              className="text-red-400 font-bold text-lg"
            >
              🚪 Logout
            </button>

          </div>

        </div>
      </div>
    </>
  );
}