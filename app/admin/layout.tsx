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

          {/* Desktop */}
          <div className="hidden md:flex justify-between items-center">

            <Link
              href="/admin"
              className="text-2xl font-extrabold text-sky-700"
            >
              ProxySocials Admin
            </Link>

            <nav className="flex items-center gap-6">

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
                href="/admin/services"
                className="font-semibold text-gray-700 hover:text-sky-600"
              >
                Services
              </Link>

              <LogoutButton />

            </nav>

          </div>

          {/* Mobile */}
          <div className="md:hidden">

            <div className="flex justify-between items-center">

              <Link
                href="/admin"
                className="text-xl font-extrabold text-sky-700"
              >
                Admin
              </Link>

              <LogoutButton />

            </div>

            <nav className="flex justify-center gap-4 mt-4 text-sm font-semibold">

              <Link href="/admin">Dashboard</Link>

              <Link href="/admin/orders">Orders</Link>

              <Link href="/admin/services">Services</Link>

            </nav>

          </div>

        </div>

      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {children}
      </main>

    </div>
  );
}