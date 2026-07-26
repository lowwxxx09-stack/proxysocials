"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminStockPage() {
  const [services, setServices] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);

  const [stockData, setStockData] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: servicesData, error: servicesError } =
      await supabase
        .from("services")
        .select("*")
        .order("title");

    if (servicesError) {
      console.log(servicesError.message);
    } else {
      setServices(servicesData || []);
    }

    const { data: stockRows, error: stockError } =
      await supabase
        .from("stock")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (stockError) {
      console.log(stockError.message);
    } else {
      setStock(stockRows || []);
    }
  }

  async function saveStock() {
    if (!selectedService) {
      alert("Please select a service.");
      return;
    }

    const rows = stockData
      .split("\n")
      .filter((row) => row.trim() !== "");

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
      };
    });

    const { error } = await supabase
      .from("stock")
      .insert(stockRows);

    if (error) {
      alert(error.message);
      return;
    }

    alert(stockRows.length + " accounts uploaded successfully.");

    setStockData("");

    loadData();
  }
  return (
    <main className="min-h-screen bg-sky-50 p-8">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-sky-700 mb-2">
          Stock Manager
        </h1>

        <p className="text-gray-600 mb-8">
          Upload and manage service inventory.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* LEFT SIDE */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-2xl font-bold mb-4">
              Select Service
            </h2>

            <div className="space-y-2">

              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`w-full text-left rounded-lg border p-3 ${
                    selectedService?.id === service.id
                      ? "bg-sky-600 text-white"
                      : "bg-white hover:bg-sky-50"
                  }`}
                >
                  {service.title}
                </button>
              ))}

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-2xl font-bold mb-4">
              Bulk Upload
            </h2>

            {selectedService ? (
              <>
                <p className="mb-4 text-sky-700 font-semibold">
                  {selectedService.title}
                </p>

                <textarea
                  value={stockData}
                  onChange={(e) =>
                    setStockData(e.target.value)
                  }
                  rows={12}
                  className="w-full border rounded-lg p-3"
                  placeholder={`username,password,2fa,email,recovery email

john123,password123,ABC123,john@gmail.com,recovery@gmail.com
mary456,password456,XYZ987,mary@gmail.com,recovery2@gmail.com`}
                />

                <button
                  onClick={saveStock}
                  className="mt-4 w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-3 font-semibold"
                >
                  Save Stock
                </button>
              </>
            ) : (
              <p className="text-gray-500">
                Select a service first.
              </p>
            )}

          </div>

        </div>

        {/* STOCK SUMMARY */}

        <div className="mt-10">

          <h2 className="text-3xl font-bold mb-6">
            Current Inventory
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {services.map((service) => {
              const availableStock =
                stock.filter(
                  (item) =>
                    item.service_id === service.id &&
                    item.is_used === false
                ).length;

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl shadow-md p-6"
                >
                  <h3 className="text-xl font-bold">
                    {service.title}
                  </h3>

                  <p className="text-sky-600 font-semibold">
                    {service.category}
                  </p>

                  <p className="mt-6 text-gray-500">
                    Available Stock
                  </p>

                  <h2 className="text-5xl font-extrabold text-sky-700">
                    {availableStock}
                  </h2>
                </div>
              );
            })}

          </div>

        </div>

      </div>
    </main>
  );
}