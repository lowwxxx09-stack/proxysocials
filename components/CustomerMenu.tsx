
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";

type CustomerMenuProps = {
  buttonPosition?: "fixed" | "inline";
};

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/services", label: "Services", icon: "▦" },
  { href: "/smm", label: "Social Boost", icon: "✳", featured: true },
  { href: "/fund-wallet", label: "Fund Wallet", icon: "◈" },
  { href: "/order-history", label: "Order History", icon: "▤" },
  { href: "/payment-history", label: "Payment History", icon: "⇄" },
  { href: "/profile", label: "My Profile", icon: "♙" },
  { href: "/support", label: "Contact Support", icon: "◌" },
  { href: "/disclaimer", label: "Disclaimer", icon: "ⓘ" },
];

export default function CustomerMenu({
  buttonPosition = "fixed",
}: CustomerMenuProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  function closeMenu() {
    setOpen(false);
  }

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Unable to sign out:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  const buttonPositionClasses =
    buttonPosition === "fixed"
      ? `fixed left-4 top-4 sm:left-5 sm:top-5 ${
          open ? "translate-x-[260px]" : ""
        }`
      : `relative shrink-0 ${open ? "translate-x-[260px]" : ""}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        className={`${buttonPositionClasses} z-[70] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/95 text-xl text-white shadow-xl shadow-black/20 backdrop-blur-xl transition duration-200 hover:border-cyan-300/40 hover:text-cyan-300 active:scale-95`}
      >
        <span className="transition-transform duration-200">
          {open ? "×" : "☰"}
        </span>
      </button>

      {open && (
        <button
          type="button"
          onClick={closeMenu}
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-[60] bg-slate-950/65 backdrop-blur-[3px]"
        />
      )}

      <aside
        aria-label="Customer navigation"
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-[65] flex w-[280px] max-w-[85vw] flex-col border-r border-white/[0.08] bg-[#080D18] text-white shadow-2xl shadow-black/40 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative overflow-hidden border-b border-white/[0.08] px-5 pb-6 pt-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />

          <Link
            href="/dashboard"
            onClick={closeMenu}
            tabIndex={open ? 0 : -1}
            className="relative flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 to-blue-500/10 text-xl font-black text-cyan-200 shadow-lg shadow-cyan-950/20">
              P
            </span>

            <span>
              <span className="block text-lg font-black tracking-tight">
                Proxy<span className="text-cyan-300">Socials</span>
              </span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.19em] text-slate-500">
                Your digital marketplace
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
            Workspace
          </p>

          <div className="space-y-1.5">
            {navigation.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === "/smm" && pathname.startsWith("/smm/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  tabIndex={open ? 0 : -1}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-bold transition duration-200 ${
                    active
                      ? "border border-cyan-300/15 bg-cyan-300/[0.09] text-cyan-200"
                      : "border border-transparent text-slate-400 hover:bg-white/[0.045] hover:text-white"
                  }`}
                >
                  {active && (
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-cyan-300" />
                  )}

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg transition ${
                      active
                        ? "bg-cyan-300/10 text-cyan-200"
                        : "bg-white/[0.035] text-slate-400 group-hover:bg-white/[0.07] group-hover:text-cyan-200"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0 flex-1">{item.label}</span>

                  {item.featured && (
                    <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-1.5 py-1 text-[8px] font-black uppercase tracking-wider text-cyan-200">
                      New
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="my-5 border-t border-white/[0.07]" />

          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
            Community
          </p>

          <div className="space-y-1.5">
            <a
              href="https://proxy-verify.org"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              tabIndex={open ? 0 : -1}
              className="group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/[0.045] hover:text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] text-lg group-hover:text-cyan-200">
                ▣
              </span>
              <span className="min-w-0 flex-1">ProxyVerify</span>
              <span className="text-xs text-slate-600">↗</span>
            </a>

            <a
              href="https://t.me/proxysocials"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              tabIndex={open ? 0 : -1}
              className="group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/[0.045] hover:text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] text-lg group-hover:text-cyan-200">
                ◉
              </span>
              <span className="min-w-0 flex-1">Join Community</span>
              <span className="text-xs text-slate-600">↗</span>
            </a>
          </div>
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          <div className="mb-3 rounded-xl border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.07] to-blue-500/[0.04] p-3">
            <p className="text-xs font-bold text-slate-200">Need a hand?</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              Our support team is here to help.
            </p>
            <Link
              href="/support"
              onClick={closeMenu}
              tabIndex={open ? 0 : -1}
              className="mt-2 inline-flex text-xs font-black text-cyan-300 transition hover:text-cyan-200"
            >
              Contact support →
            </Link>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            tabIndex={open ? 0 : -1}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-red-400/10 bg-red-400/[0.045] px-3.5 py-3 text-sm font-bold text-red-300 transition hover:border-red-400/20 hover:bg-red-400/[0.09] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-400/[0.08] text-lg">
              ↪
            </span>
            {loggingOut ? "Signing out…" : "Log out"}
          </button>

          <p className="mt-4 text-center text-[9px] font-semibold tracking-wide text-slate-700">
            PROXYSOCIALS © {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  );
}
