
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SmmService = {
  id: string;
  provider_service_id: string;
  name: string;
  category: string | null;
  service_type: string | null;
  provider_rate: number;
  retail_rate: number | null;
  pricing_mode: "automatic" | "manual";
  markup_percent: number;
  currency: string;
  min_quantity: number;
  max_quantity: number;
  supports_refill: boolean;
  supports_cancel: boolean;
  is_enabled: boolean;
  provider_available: boolean;
  last_synced_at: string | null;
};

type ApiResponse = {
  services?: SmmService[];
  total?: number;
  error?: string;
  message?: string;
  success?: boolean;
  enabledCount?: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function SmmAdminPage() {
  const [services, setServices] = useState<SmmService[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [enabledFilter, setEnabledFilter] = useState("all");
  const [pricingFilter, setPricingFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [enablingAll, setEnablingAll] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<SmmService | null>(null);
  const [manualPrice, setManualPrice] = useState("");
  const [manualMarkup, setManualMarkup] = useState("50");

  const pageSize = 50;

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        category,
        availability,
        enabled: enabledFilter,
        pricingMode: pricingFilter,
      });

      const response = await fetch(
        `/api/admin/smm/services?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to load SMM services.");
      }

      setServices(data.services ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load SMM services."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, category, availability, enabledFilter, pricingFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => void loadServices(), 250);
    return () => clearTimeout(timeout);
  }, [loadServices]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          services
            .map((service) => service.category?.trim())
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [services]
  );

  const visibleServices = useMemo(
    () =>
      category === "all"
        ? services
        : services.filter((service) => service.category === category),
    [services, category]
  );

  const enabledCount = services.filter((service) => service.is_enabled).length;
  const availableCount = services.filter(
    (service) => service.provider_available
  ).length;

  async function updateService(
    id: string,
    changes: Record<string, string | number | boolean | null>
  ) {
    setSavingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/smm/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...changes }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to save changes.");
      }

      setNotice("Service updated successfully.");
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSavingId(null);
    }
  }

  async function syncCatalogue() {
    if (
      !window.confirm(
        "Refresh the provider catalogue? Existing retail prices and service visibility should be preserved."
      )
    ) {
      return;
    }

    setSyncing(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/smm/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || data.status === false) {
        throw new Error(data.error || data.message || "Catalogue sync failed.");
      }

      setNotice(data.message || "Catalogue sync completed.");
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Catalogue sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function enableAllAvailableServices() {
    const confirmed = window.confirm(
      "Enable ALL services currently marked available by the provider? This will make them visible to customers. Existing prices, markup, and quantity limits will not be changed. Review your prices before continuing."
    );

    if (!confirmed) return;

    setEnablingAll(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/smm/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable_all_available" }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to enable available services.");
      }

      setNotice(
        data.message ||
          `${data.enabledCount ?? 0} available services enabled successfully.`
      );
      setEnabledFilter("all");
      setAvailability("all");
      setCategory("all");
      setSearch("");
      setPage(0);
      await loadServices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to enable services."
      );
    } finally {
      setEnablingAll(false);
    }
  }

  function openEditor(service: SmmService) {
    setEditing(service);
    setManualPrice(
      service.retail_rate === null ? "" : String(service.retail_rate)
    );
    setManualMarkup(String(service.markup_percent ?? 50));
    setNotice("");
    setError("");
  }

  async function savePricing() {
    if (!editing) return;

    const markupValue = Number(manualMarkup);

    if (
      !Number.isFinite(markupValue) ||
      markupValue < 0 ||
      markupValue > 1000
    ) {
      setError("Markup must be between 0 and 1000 percent.");
      return;
    }

    if (editing.pricing_mode === "manual") {
      const priceValue = Number(manualPrice);

      if (
        manualPrice.trim() === "" ||
        !Number.isFinite(priceValue) ||
        priceValue < 0
      ) {
        setError("Enter a valid retail price in NGN.");
        return;
      }

      await updateService(editing.id, {
        pricing_mode: "manual",
        manual_retail_rate: priceValue,
        markup_percent: markupValue,
      });
    } else {
      await updateService(editing.id, {
        pricing_mode: "automatic",
        markup_percent: markupValue,
      });
    }

    setEditing(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-400">
              ProxySocials · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              SMM services<span className="text-cyan-400">.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Manage your social growth catalogue, retail pricing and customer
              visibility from one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/admin/smm-reconciliation"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-3 text-sm font-bold text-violet-200 transition hover:border-violet-300/60 hover:bg-violet-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <span aria-hidden="true">↔</span>
              SMS Reconciliation
            </a>

            <button
              type="button"
              onClick={enableAllAvailableServices}
              disabled={enablingAll || syncing}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enablingAll ? "Enabling services…" : "✓ Enable All Available"}
            </button>

            <button
              type="button"
              onClick={syncCatalogue}
              disabled={syncing || enablingAll}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{syncing ? "Syncing catalogue…" : "↻ Sync catalogue"}</span>
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          >
            {notice}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total catalogue", value: total.toLocaleString() },
            { label: "On this page", value: services.length.toLocaleString() },
            {
              label: "Available on page",
              value: availableCount.toLocaleString(),
            },
            { label: "Enabled on page", value: enabledCount.toLocaleString() },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5"
            >
              <p className="text-xs text-slate-400 sm:text-sm">{item.label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm text-slate-300 lg:col-span-2">
              Search services
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search name, ID or category…"
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Category
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(0);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm outline-none focus:border-cyan-400"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-300">
              Provider status
              <select
                value={availability}
                onChange={(event) => {
                  setAvailability(event.target.value);
                  setPage(0);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm outline-none focus:border-cyan-400"
              >
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>

            <label className="block text-sm text-slate-300">
              Customer visibility
              <select
                value={enabledFilter}
                onChange={(event) => {
                  setEnabledFilter(event.target.value);
                  setPage(0);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm outline-none focus:border-cyan-400"
              >
                <option value="all">All services</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>

            <label className="block text-sm text-slate-300">
              Pricing
              <select
                value={pricingFilter}
                onChange={(event) => {
                  setPricingFilter(event.target.value);
                  setPage(0);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm outline-none focus:border-cyan-400"
              >
                <option value="all">All pricing</option>
                <option value="automatic">Automatic markup</option>
                <option value="manual">Manual pricing</option>
              </select>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="flex flex-col justify-between gap-2 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div>
              <h2 className="font-semibold">Service catalogue</h2>
              <p className="mt-1 text-xs text-slate-400">
                Prices are per 1,000 units, in NGN.
              </p>
            </div>
            <p className="text-xs text-slate-400">
              {total === 0
                ? "No services found"
                : `${(page * pageSize + 1).toLocaleString()}–${Math.min(
                    (page + 1) * pageSize,
                    total
                  ).toLocaleString()} of ${total.toLocaleString()}`}
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Loading services…
            </div>
          ) : visibleServices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium">No services found</p>
              <p className="mt-2 text-sm text-slate-400">
                Try another search or change your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-white/[0.035] text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Service</th>
                      <th className="px-4 py-4">Provider cost</th>
                      <th className="px-4 py-4">Retail price</th>
                      <th className="px-4 py-4">Pricing</th>
                      <th className="px-4 py-4">Availability</th>
                      <th className="px-4 py-4">Visibility</th>
                      <th className="px-5 py-4">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.07]">
                    {visibleServices.map((service) => (
                      <tr key={service.id} className="hover:bg-white/[0.025]">
                        <td className="max-w-sm px-5 py-4">
                          <p className="font-medium text-white">
                            {service.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            ID {service.provider_service_id} ·{" "}
                            {service.category || "Uncategorised"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Qty {service.min_quantity.toLocaleString()}–
                            {service.max_quantity.toLocaleString()}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                          {money(Number(service.provider_rate))}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold">
                          {service.retail_rate === null
                            ? "Not set"
                            : money(Number(service.retail_rate))}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
                            {service.pricing_mode === "automatic"
                              ? `${service.markup_percent}% markup`
                              : "Manual"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill active={service.provider_available}>
                            {service.provider_available
                              ? "Available"
                              : "Unavailable"}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={
                              savingId === service.id ||
                              (!service.provider_available &&
                                !service.is_enabled)
                            }
                            onClick={() =>
                              void updateService(service.id, {
                                is_enabled: !service.is_enabled,
                              })
                            }
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                              service.is_enabled
                                ? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
                                : "bg-white/10 text-slate-300 hover:bg-white/15"
                            }`}
                          >
                            {savingId === service.id
                              ? "Saving…"
                              : service.is_enabled
                                ? "Enabled"
                                : "Disabled"}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => openEditor(service)}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:border-cyan-400/60 hover:text-cyan-300"
                          >
                            Edit pricing
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 md:hidden">
                {visibleServices.map((service) => (
                  <article
                    key={service.id}
                    className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold">
                          {service.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          ID {service.provider_service_id}
                        </p>
                      </div>
                      <StatusPill active={service.provider_available}>
                        {service.provider_available ? "Available" : "Offline"}
                      </StatusPill>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Provider cost</p>
                        <p className="mt-1 text-sm">
                          {money(Number(service.provider_rate))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Retail price</p>
                        <p className="mt-1 text-sm font-semibold">
                          {service.retail_rate === null
                            ? "Not set"
                            : money(Number(service.retail_rate))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Pricing mode</p>
                        <p className="mt-1 text-sm">
                          {service.pricing_mode === "automatic"
                            ? `${service.markup_percent}% markup`
                            : "Manual"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Visibility</p>
                        <p className="mt-1 text-sm">
                          {service.is_enabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        disabled={
                          savingId === service.id ||
                          (!service.provider_available && !service.is_enabled)
                        }
                        onClick={() =>
                          void updateService(service.id, {
                            is_enabled: !service.is_enabled,
                          })
                        }
                        className="min-h-10 flex-1 rounded-lg border border-white/10 px-3 text-xs font-semibold disabled:opacity-50"
                      >
                        {savingId === service.id
                          ? "Saving…"
                          : service.is_enabled
                            ? "Disable service"
                            : "Enable service"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditor(service)}
                        className="min-h-10 flex-1 rounded-lg bg-cyan-400 px-3 text-xs font-bold text-slate-950"
                      >
                        Edit pricing
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4">
            <button
              type="button"
              disabled={page === 0 || loading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="min-h-10 rounded-lg border border-white/10 px-4 text-sm disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="min-h-10 rounded-lg border border-white/10 px-4 text-sm disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </section>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-400">
                  Service pricing
                </p>
                <h2 id="pricing-title" className="mt-2 text-xl font-bold">
                  Edit pricing
                </h2>
                <p className="mt-1 text-sm text-slate-400">{editing.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close pricing editor"
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-400">Provider rate / 1,000</span>
                <strong>{money(Number(editing.provider_rate))}</strong>
              </div>
              <div className="mt-3 flex justify-between gap-3 text-sm">
                <span className="text-slate-400">Current retail rate</span>
                <strong>
                  {editing.retail_rate === null
                    ? "Not set"
                    : money(Number(editing.retail_rate))}
                </strong>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm text-slate-300">
                Pricing mode
                <select
                  value={editing.pricing_mode}
                  onChange={(event) => {
                    const mode = event.target.value as "automatic" | "manual";
                    setEditing({ ...editing, pricing_mode: mode });
                  }}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-white outline-none focus:border-cyan-400"
                >
                  <option value="automatic">Automatic markup</option>
                  <option value="manual">Manual retail price</option>
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Markup percentage
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={manualMarkup}
                  onChange={(event) => setManualMarkup(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-white outline-none focus:border-cyan-400"
                />
              </label>

              {editing.pricing_mode === "manual" && (
                <label className="block text-sm text-slate-300">
                  Retail price per 1,000 (NGN)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualPrice}
                    onChange={(event) => setManualPrice(event.target.value)}
                    placeholder="Enter customer price"
                    className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-white outline-none focus:border-cyan-400"
                  />
                </label>
              )}

              {editing.pricing_mode === "automatic" && (
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
                  <p className="text-xs text-slate-400">
                    Estimated customer price per 1,000
                  </p>
                  <p className="mt-1 text-2xl font-bold text-cyan-300">
                    {money(
                      Number(editing.provider_rate) *
                        (1 + (Number(manualMarkup) || 0) / 100)
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Actual saved price is calculated by the server.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingId !== null}
                onClick={() => void savePricing()}
                className="min-h-11 flex-1 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-slate-950 disabled:opacity-50"
              >
                {savingId ? "Saving…" : "Save pricing"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function StatusPill({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-400/10 text-emerald-300"
          : "bg-red-400/10 text-red-300"
      }`}
    >
      {children}
    </span>
  );
}
