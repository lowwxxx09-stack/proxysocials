export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteServiceButton from "@/components/DeleteServiceButton";

export default async function AdminServicesPage() {
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading services:", error.message);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Unable to load services
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Please refresh the page and try again.
          </p>
        </div>
      </main>
    );
  }

  const serviceList = services ?? [];
  const activeServices = serviceList.filter(
    (service: any) => service.is_active
  ).length;
  const inactiveServices = serviceList.length - activeServices;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <header className="mb-8 border-b border-slate-200 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Management / Services
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Manage Services
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create, update, and manage the products available on
                ProxySocials.
              </p>
            </div>

            <Link
              href="/admin/services/new"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              <span className="text-lg leading-none">+</span>
              Add New Service
            </Link>
          </div>

          <Link
            href="/admin"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>
        </header>

        {/* Summary */}
        <section
          aria-label="Service summary"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Services
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {serviceList.length.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              All listed services
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <p className="text-sm font-medium text-slate-500">
                Active
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {activeServices.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Currently enabled
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <p className="text-sm font-medium text-slate-500">
                Inactive
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {inactiveServices.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Currently disabled
            </p>
          </div>
        </section>

        {/* Service list */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                All Services
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review service details and manage individual listings.
              </p>
            </div>

            <span className="mt-2 w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:mt-0">
              {serviceList.length}{" "}
              {serviceList.length === 1 ? "service" : "services"}
            </span>
          </div>

          {serviceList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xl text-slate-500">
                +
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No services yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Add your first service to start building your
                marketplace inventory.
              </p>

              <Link
                href="/admin/services/new"
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add your first service
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {serviceList.map((service: any) => (
                <article
                  key={service.id}
                  className="p-4 transition hover:bg-slate-50/70 sm:p-5 lg:px-6"
                >
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Image and service information */}
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title || "Service image"}
                          className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-cover sm:h-20 sm:w-20"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xl font-semibold text-slate-400 sm:h-20 sm:w-20">
                          {(service.title || "S")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-base font-semibold text-slate-900 sm:text-lg">
                          {service.title}
                        </h3>

                        <p className="mt-1 break-words text-sm text-slate-500">
                          {service.category || "Uncategorised"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              service.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                service.is_active
                                  ? "bg-emerald-600"
                                  : "bg-slate-400"
                              }`}
                            />
                            {service.is_active ? "Active" : "Inactive"}
                          </span>

                          <span className="text-xs text-slate-400">
                            ID: {String(service.id).slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price and actions */}
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:min-w-44 sm:items-end sm:border-0 sm:pt-0">
                      <div className="sm:text-right">
                        <p className="text-xs font-medium text-slate-400">
                          Selling price
                        </p>
                        <p className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900">
                          ₦
                          {Number(service.price || 0).toLocaleString(
                            "en-NG"
                          )}
                        </p>
                      </div>

                      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                        <Link
                          href={`/admin/services/${service.id}/edit`}
                          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 sm:flex-none"
                        >
                          Edit
                        </Link>

                        <div className="flex min-h-10 flex-1 items-center justify-center sm:flex-none">
                          <DeleteServiceButton id={service.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          ProxySocials · Service Management
        </p>
      </div>
    </main>
  );
}