import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sky-50">

      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">

          <div className="flex justify-between items-center">

            {/* Logo */}
            <Link
              href="/admin"
              className="text-xl md:text-2xl font-extrabold text-sky-700"
            >
              <span className="md:hidden">Admin</span>
              <span className="hidden md:inline">
                ProxySocials Admin
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">

              <Link
                href="/admin"
                className="font-semibold text-gray-700 hover:text-sky-600"
              >
                Dashboard
              </Link>

              <Link
                href="/admin/orders"
                className="font-semibold text-gray-700 hover:text-sky-600"
              >
                Orders
              </Link>

              <Link
                href="/admin/stock"
                className="bg-sky-100 text-sky-800 px-5 py-2 rounded-xl text-lg font-black tracking-wide hover:bg-sky-200 transition"
              >
                Stock
              </Link>

              <Link
                href="/admin/services"
                className="font-semibold text-gray-700 hover:text-sky-600"
              >
                Services
              </Link>

            </nav>

            {/* Single Logout Button */}
            <LogoutButton />

          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex justify-center gap-4 mt-4 text-sm font-semibold">

            <Link
              href="/admin"
              className="hover:text-sky-600"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/orders"
              className="hover:text-sky-600"
            >
              Orders
            </Link>

            <Link
              href="/admin/stock"
              className="hover:text-sky-600"
            >
              Stock
            </Link>

            <Link
              href="/admin/services"
              className="hover:text-sky-600"
            >
              Services
            </Link>

          </nav>

        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {children}
      </main>

    </div>
  );
}