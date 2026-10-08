"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: "▣",
    },
    {
      href: "/admin/stock",
      label: "Stock",
      icon: "◈",
    },
    {
      href: "/admin/services",
      label: "Services",
      icon: "✦",
    },
    {
      href: "/admin/announcements",
      label: "Announcements",
      icon: "📢",
    },
  ];

  return (
    <div className="min-h-screen bg-sky-50">

      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">

          {/* Desktop / Main Header */}
          <div className="flex min-h-[68px] items-center justify-between gap-3">

            {/* Logo */}
            <Link
              href="/admin"
              className="shrink-0 text-lg font-extrabold tracking-tight text-sky-700 transition hover:text-sky-800 sm:text-xl lg:text-2xl"
            >
              <span className="sm:hidden">
                ProxySocials
              </span>

              <span className="hidden sm:inline">
                ProxySocials Admin
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex">

              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition duration-200 lg:px-4 lg:text-sm ${
                      active
                        ? "bg-sky-100 text-sky-800 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-sky-700"
                    }`}
                  >
                    <span
                      className={`text-sm transition ${
                        active
                          ? "text-sky-700"
                          : "text-slate-400 group-hover:text-sky-600"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {item.label}
                  </Link>
                );
              })}

            </nav>

            {/* Logout */}
            <div className="shrink-0">
              <LogoutButton />
            </div>

          </div>

          {/* Mobile Navigation */}
          <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 py-2 md:hidden">

            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition sm:px-3 sm:text-xs ${
                    active
                      ? "bg-sky-100 text-sky-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-sky-700"
                  }`}
                >
                  <span className="text-[11px]">
                    {item.icon}
                  </span>

                  {item.label}
                </Link>
              );
            })}

          </nav>

        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-7xl p-3 sm:p-5 lg:p-8">
        {children}
      </main>

    </div>
  );
}