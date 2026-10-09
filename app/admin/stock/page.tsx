"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminStockPage() {
  const [services, setServices] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [stockData, setStockData] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    const [
      { data: servicesData, error: servicesError },
      { data: stockRows, error: stockError },
    ] = await Promise.all([
      supabase.from("services").select("*").order("title"),
      supabase
        .from("stock")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (servicesError) {
      console.error("Error loading services:", servicesError.message);
    } else {
      const nextServices = servicesData ?? [];
      setServices(nextServices);

      setSelectedService((current: any) => {
        if (!current) return null;
        return nextServices.find((s) => s.id === current.id) ?? null;
      });
    }

    if (stockError) {
      console.error("Error loading stock:", stockError.message);
    } else {
      setStock(stockRows ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function saveStock() {
    if (saving) return;

    if (!selectedService) {
      alert("Please select a service.");
      return;
    }

    const rows = stockData
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean);

    if (rows.length === 0) {
      alert("Please enter at least one account.");
      return;
    }

    const stockRows = rows.map((row) => {
      const [
        username,
        password,
        twofa,
        email,
        recovery_email,
      ] = row.split(",");

      return {
        service_id: selectedService.id,
        username: username?.trim(),
        password: password?.trim(),
        twofa: twofa?.trim(),
        email: email?.trim(),
        recovery_email: recovery_email?.trim(),
        is_used: false,
        status: "available",
      };
    });

    const invalidRow = stockRows.find(
      (row) => !row.username || !row.password
    );

    if (invalidRow) {
      alert(
        "Every row must contain at least a username and password. Please check your data."
      );
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("stock")
        .insert(stockRows);

      if (error) {
        alert(error.message);
        return;
      }

      setStockData("");
      await loadData();

      alert(
        `${stockRows.length} account${stockRows.length === 1 ? "" : "s"} uploaded successfully.`
      );
    } catch (error) {
      console.error("Stock upload failed:", error);
      alert("Something went wrong while uploading stock.");
    } finally {
      setSaving(false);
    }
  }

  const totalStock = stock.length;

  const availableStock = stock.filter(
    (item) => item.is_used === false
  ).length;

  const usedStock = stock.filter(
    (item) => item.is_used === true
  ).length;

  const filteredServices = services.filter((service) =>
    `${service.title ?? ""} ${service.category ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function getAvailableCount(serviceId: string) {
    return stock.filter(
      (item) =>
        item.service_id === serviceId &&
        item.is_used === false
    ).length;
  }

  function getUsedCount(serviceId: string) {
    return stock.filter(
      (item) =>
        item.service_id === serviceId &&
        item.is_used === true
    ).length;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 border-b border-slate-200 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Management / Inventory
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Stock Manager
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Upload account inventory, monitor availability, and
                manage stock across your services.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <span aria-hidden="true">↻</span>
              {loading ? "Refreshing..." : "Refresh inventory"}
            </button>
          </div>
        </header>

        {/* Summary cards */}
        <section
          aria-label="Inventory summary"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: "Total Accounts",
              value: totalStock,
              description: "All inventory records",
              symbol: "01",
              color: "bg-slate-800",
            },
            {
              label: "Available",
              value: availableStock,
              description: "Not marked as used",
              symbol: "02",
              color: "bg-emerald-700",
            },
            {
              label: "Used",
              value: usedStock,
              description: "Marked as used",
              symbol: "03",
              color: "bg-slate-500",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  {metric.label}
                </p>

                <span
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold text-white ${metric.color}`}
                >
                  {metric.symbol}
                </span>
              </div>

              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                {loading ? "—" : metric.value.toLocaleString()}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {metric.description}
              </p>

              <div
                className={`absolute bottom-0 left-0 h-0.5 w-full ${metric.color} opacity-70`}
              />
            </div>
          ))}
        </section>

        {/* Upload and service selection */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a service and upload its account details.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-5">
            {/* Service selection */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Select service
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {services.length} service
                  {services.length === 1 ? "" : "s"} available
                </p>
              </div>

              <div className="border-b border-slate-100 p-3">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="max-h-[420px] space-y-1 overflow-y-auto p-3">
                {loading ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-400">
                    Loading services...
                  </p>
                ) : filteredServices.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">
                    No matching services found.
                  </p>
                ) : (
                  filteredServices.map((service) => {
                    const isSelected =
                      selectedService?.id === service.id;

                    return (
                      <button
                        type="button"
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-slate-400 bg-slate-100"
                            : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {service.title}
                          </span>
                          <span className="mt-1 block truncate text-xs text-slate-500">
                            {service.category || "Uncategorised"}
                          </span>
                        </span>

                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
                            getAvailableCount(service.id) > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {getAvailableCount(service.id)} available
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bulk upload */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Bulk upload
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Add multiple accounts in one operation.
                </p>
              </div>

              <div className="p-5">
                {selectedService ? (
                  <>
                    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Selected service
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedService.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {getAvailableCount(selectedService.id)} accounts
                        currently available
                      </p>
                    </div>

                    <label
                      htmlFor="stock-data"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Account data
                    </label>

                    <textarea
                      id="stock-data"
                      value={stockData}
                      onChange={(e) => setStockData(e.target.value)}
                      rows={10}
                      spellCheck={false}
                      className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:text-sm"
                      placeholder={`username,password,2fa,email,recovery_email
john123,password123,ABC123,john@gmail.com,recovery@gmail.com
mary456,password456,XYZ987,mary@gmail.com,recovery2@gmail.com`}
                    />

                    <div className="mt-3 flex flex-col gap-1 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        {stockData.split("\n").filter((row) => row.trim()).length}{" "}
                        non-empty rows
                      </span>
                      <span>One account per line · Comma-separated</span>
                    </div>

                    <button
                      type="button"
                      onClick={saveStock}
                      disabled={saving || loading || !stockData.trim()}
                      className="mt-5 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Uploading accounts..." : "Upload stock"}
                    </button>

                    <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                      Check your data before uploading. Account details
                      will be saved to the selected service.
                    </p>
                  </>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-4 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xl text-slate-500">
                      +
                    </div>

                    <h4 className="mt-4 font-semibold text-slate-800">
                      Choose a service first
                    </h4>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                      Select a service from the panel on the left to
                      start uploading its inventory.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Current inventory */}
        <section>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Current inventory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Stock availability grouped by service.
              </p>
            </div>

            <p className="text-xs text-slate-400">
              {services.length} services tracked
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Loading inventory...
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="font-medium text-slate-800">
                No services found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add services before uploading stock.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const available = getAvailableCount(service.id);
                const used = getUsedCount(service.id);
                const isSelected =
                  selectedService?.id === service.id;

                return (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                      isSelected
                        ? "border-slate-400 ring-1 ring-slate-200"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-900">
                          {service.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {service.category || "Uncategorised"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          available > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {available > 0 ? "In stock" : "Out of stock"}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Available
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {available.toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Used
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-700">
                          {used.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-slate-500">
                        Total: {available + used}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {isSelected ? "Selected" : "Select service →"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          ProxySocials · Inventory Management
        </p>
      </div>
    </main>
  );
}