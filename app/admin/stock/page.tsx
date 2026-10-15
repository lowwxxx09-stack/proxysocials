
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Service = {
  id: string;
  title: string;
  category?: string | null;
};

type ParsedItem = {
  line: number;
  raw: string;
  fields: string[];
  username: string;
  password: string;
  twofa: string;
  email: string;
  recovery_email: string;
};

type ParseResult = {
  items: ParsedItem[];
  invalidLines: number[];
  delimiter: string;
  fieldCount: number;
  ambiguous: boolean;
};

const DELIMITERS = ["||", "\t", "|", ",", ";", ":"];

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === ",") {
    const fields: string[] = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        fields.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }

    fields.push(field.trim());
    return fields;
  }

  return line.split(delimiter).map((field) => field.trim());
}

function removeTrailingEmptyFields(fields: string[]): string[] {
  const result = [...fields];

  while (result.length > 0 && result[result.length - 1] === "") {
    result.pop();
  }

  return result;
}

function detectFormat(lines: string[]) {
  const candidates = DELIMITERS.map((delimiter) => {
    const rows = lines.map((line) =>
      removeTrailingEmptyFields(splitLine(line, delimiter))
    );

    const counts = rows.map((row) => row.length);
    const fieldCount = counts[0] ?? 0;
    const consistent = counts.every((count) => count === fieldCount);
    const valid = fieldCount >= 2 && counts.every((count) => count >= 2);

    return {
      delimiter,
      rows,
      fieldCount,
      consistent,
      valid,
      score:
        (valid ? 1000 : 0) +
        (consistent ? 500 : 0) +
        (fieldCount >= 2 ? fieldCount * 10 : 0) +
        delimiter.length,
    };
  }).filter((candidate) => candidate.valid);

  candidates.sort((a, b) => b.score - a.score);

  if (!candidates.length) return null;

  const best = candidates[0];

  // Flag a tie only when equally scored candidates disagree on
  // how many fields a record contains.
  const tiedCandidate = candidates.find(
    (candidate, index) =>
      index > 0 &&
      candidate.score === best.score &&
      candidate.fieldCount !== best.fieldCount
  );

  return {
    ...best,
    ambiguous: !best.consistent || Boolean(tiedCandidate),
  };
}

function parseStockInput(input: string): ParseResult {
  const lines = input
    .split(/\r?\n/)
    .map((raw, index) => ({
      raw: raw.trim(),
      line: index + 1,
    }))
    .filter((entry) => entry.raw.length > 0);

  if (!lines.length) {
    return {
      items: [],
      invalidLines: [],
      delimiter: "",
      fieldCount: 0,
      ambiguous: false,
    };
  }

  const detected = detectFormat(lines.map((entry) => entry.raw));

  if (!detected) {
    return {
      items: [],
      invalidLines: lines.map((entry) => entry.line),
      delimiter: "",
      fieldCount: 0,
      ambiguous: true,
    };
  }

  const items: ParsedItem[] = [];
  const invalidLines: number[] = [];

  lines.forEach(({ raw, line }, index) => {
    const fields = detected.rows[index];

    if (
      fields.length < 2 ||
      fields.some((field) => field.length === 0)
    ) {
      invalidLines.push(line);
      return;
    }

    const username = fields[0];
    const password = fields[1];

    // Preserve every original field, including fields beyond
    // the standard stock columns.
    let twofa = "";
    let email = "";
    let recovery_email = "";

    if (fields.length === 3) {
      email = fields[2];
    } else if (fields.length >= 4) {
      twofa = fields[2];
      email = fields[3] ?? "";
      recovery_email = fields[4] ?? "";
    }

    items.push({
      line,
      raw,
      fields: [...fields],
      username,
      password,
      twofa,
      email,
      recovery_email,
    });
  });

  return {
    items,
    invalidLines,
    delimiter: detected.delimiter,
    fieldCount: detected.fieldCount,
    ambiguous: detected.ambiguous,
  };
}

function delimiterLabel(delimiter: string) {
  if (delimiter === "\t") return "Tab";
  if (delimiter === "||") return "Double pipe (||)";
  if (delimiter === "|") return "Single pipe (|)";
  if (delimiter === ",") return "Comma (,)";
  if (delimiter === ";") return "Semicolon (;)";
  if (delimiter === ":") return "Colon (:)";
  return "Unknown";
}

export default function AdminStockPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [stockData, setStockData] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const parsed = useMemo(() => parseStockInput(stockData), [stockData]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        { data: servicesData, error: servicesError },
        { data: stockRows, error: stockError },
      ] = await Promise.all([
        supabase.from("services").select("*").order("title"),
        supabase.from("stock").select("*").order("created_at", {
          ascending: false,
        }),
      ]);

      if (servicesError) {
        console.error("Error loading services:", servicesError.message);
        alert("Unable to load services. Please refresh and try again.");
      } else {
        const nextServices = (servicesData ?? []) as Service[];

        setServices(nextServices);
        setSelectedService((current) =>
          current
            ? nextServices.find((service) => service.id === current.id) ?? null
            : null
        );
      }

      if (stockError) {
        console.error("Error loading stock:", stockError.message);
        alert("Unable to load inventory. Please refresh and try again.");
      } else {
        setStock(stockRows ?? []);
      }
    } catch (error) {
      console.error("Inventory loading failed:", error);
      alert("Something went wrong while loading inventory.");
    } finally {
      setLoading(false);
    }
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

    if (!parsed.items.length) {
      alert("No valid stock records detected. Check the pasted data.");
      return;
    }

    if (parsed.ambiguous) {
      alert(
        "The format is ambiguous or inconsistent. Use one separator and the same number of fields on every line."
      );
      return;
    }

    if (parsed.invalidLines.length > 0) {
      alert(
        `Please correct these lines before uploading: ${parsed.invalidLines.join(", ")}`
      );
      return;
    }

    const confirmed = window.confirm(
      `Upload ${parsed.items.length} stock item(s) to "${selectedService.title}"?`
    );

    if (!confirmed) return;

    const rows = parsed.items.map((item) => ({
      service_id: selectedService.id,
      username: item.username,
      password: item.password,
      twofa: item.twofa || null,
      email: item.email || null,
      recovery_email: item.recovery_email || null,
      stock_data: {
        raw: item.raw,
        delimiter: parsed.delimiter,
        fields: item.fields,
        extra_fields: item.fields.slice(4),
      },
      is_used: false,
      status: "available",
    }));

    setSaving(true);

    try {
      const batchSize = 100;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from("stock").insert(batch);

        if (error) {
          console.error("Stock upload failed:", error.message);
          alert(`Upload failed: ${error.message}`);
          await loadData();
          return;
        }
      }

      setStockData("");
      await loadData();

      alert(
        `${rows.length} stock item${rows.length === 1 ? "" : "s"} uploaded successfully.`
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
    (item) =>
      item.is_used === false &&
      item.status === "available" &&
      item.assigned_to == null
  ).length;

  const usedStock = stock.filter(
    (item) => item.is_used === true || item.status === "sold"
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
        item.is_used === false &&
        item.status === "available" &&
        item.assigned_to == null
    ).length;
  }

  function getUsedCount(serviceId: string) {
    return stock.filter(
      (item) =>
        item.service_id === serviceId &&
        (item.is_used === true || item.status === "sold")
    ).length;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
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
                Paste supplier stock in common formats, preview the detected
                records, and manage inventory across your services.
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
              description: "Ready for delivery",
              symbol: "02",
              color: "bg-emerald-700",
            },
            {
              label: "Used",
              value: usedStock,
              description: "Marked as sold or used",
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

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a service, paste stock, and review the preview before
              importing.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Select service
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {services.length} service{services.length === 1 ? "" : "s"}{" "}
                  available
                </p>
              </div>

              <div className="border-b border-slate-100 p-3">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
                    const isSelected = selectedService?.id === service.id;

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

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold text-slate-900">Paste stock</h3>
                <p className="mt-1 text-xs text-slate-500">
                  One stock item per line. Common separators are detected
                  automatically.
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
                      onChange={(event) => setStockData(event.target.value)}
                      rows={10}
                      spellCheck={false}
                      className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:text-sm"
                      placeholder={`user1||password1||email1@example.com
user2||password2||email2@example.com
user3||password3||email3@example.com`}
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>
                        {
                          stockData
                            .split(/\r?\n/)
                            .filter((line) => line.trim()).length
                        }{" "}
                        non-empty lines
                      </span>

                      {parsed.delimiter && (
                        <span>
                          Detected: {delimiterLabel(parsed.delimiter)}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Import preview
                        </h4>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          {parsed.items.length} detected
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {parsed.fieldCount
                          ? `${parsed.fieldCount} fields detected per record.`
                          : "Paste records to detect their format."}
                      </p>

                      {parsed.ambiguous && stockData.trim() && (
                        <p className="mt-3 rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                          The format is ambiguous or inconsistent. Use one
                          separator and the same number of fields on every
                          line.
                        </p>
                      )}

                      {parsed.invalidLines.length > 0 && (
                        <p className="mt-3 rounded-md bg-red-50 p-3 text-xs leading-5 text-red-700">
                          Invalid lines: {parsed.invalidLines.join(", ")}
                        </p>
                      )}

                      {parsed.items.length > 0 && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-2 py-2">Line</th>
                                <th className="px-2 py-2">Username</th>
                                <th className="px-2 py-2">Password</th>
                                <th className="px-2 py-2">Email</th>
                                <th className="px-2 py-2">Extra fields</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsed.items.slice(0, 5).map((item) => (
                                <tr
                                  key={item.line}
                                  className="border-b border-slate-100"
                                >
                                  <td className="px-2 py-2">{item.line}</td>
                                  <td className="max-w-40 truncate px-2 py-2">
                                    {item.username}
                                  </td>
                                  <td className="px-2 py-2">Detected</td>
                                  <td className="max-w-40 truncate px-2 py-2">
                                    {item.email || "—"}
                                  </td>
                                  <td className="px-2 py-2">
                                    {item.fields.length > 4
                                      ? item.fields.slice(4).join(", ")
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {parsed.items.length > 5 && (
                            <p className="mt-2 text-xs text-slate-500">
                              Showing the first 5 of {parsed.items.length}{" "}
                              records.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={saveStock}
                      disabled={
                        saving ||
                        loading ||
                        !stockData.trim() ||
                        !parsed.items.length ||
                        parsed.invalidLines.length > 0 ||
                        parsed.ambiguous
                      }
                      className="mt-5 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Uploading accounts..." : "Upload stock"}
                    </button>

                    <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                      Review the detected records before uploading.
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
                      Select a service from the panel on the left to start
                      adding its inventory.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

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
              <p className="font-medium text-slate-800">No services found</p>
              <p className="mt-1 text-sm text-slate-500">
                Add services before uploading stock.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const available = getAvailableCount(service.id);
                const used = getUsedCount(service.id);
                const isSelected = selectedService?.id === service.id;

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
                        <p className="text-xs text-slate-500">Available</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {available.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Used</p>
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
