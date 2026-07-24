import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sky-50">

      <header className="bg-white shadow-md px-8 py-5">

        <div className="max-w-6xl mx-auto flex justify-between items-center">

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

      </header>


      <main className="max-w-6xl mx-auto p-8">

        {children}

      </main>

    </div>
  );
}