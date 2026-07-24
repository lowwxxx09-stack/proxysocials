"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminStockPage() {
  const [services, setServices] = useState<any[]>([]);
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [licenseKey, setLicenseKey] = useState("");
const [downloadLink, setDownloadLink] = useState("");
const [stockData, setStockData] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  useEffect(() => {
  async function loadServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("title");

  console.log("SERVICES:", data);

  if (error) {
    console.log("ERROR:", error.message);
  } else {
    setServices(data || []);
  }
}

  loadServices();
}, []);
async function saveStock() {
  const response = await fetch("/api/admin/stock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
  service_id: selectedService.id,
  stock_data: JSON.parse(stockData),
}),
  });

  const data = await response.json();

  if (!data.status) {
    alert(data.message);
    return;
  }

  alert("Stock saved successfully!");

  setStockData("");
}
   return (
    <main className="min-h-screen bg-sky-50 p-8">
      <h1 className="text-4xl font-bold text-sky-700 mb-8">
        Stock Manager
      </h1>

      <div className="bg-white rounded-xl shadow-md p-6">

  <label className="block font-semibold mb-2">
    Select Service
  </label>

  <div className="space-y-2 mt-4">
  {services.map((service) => (
    <button
  key={service.id}
  onClick={() => setSelectedService(service)}
  className={`w-full rounded-lg p-3 text-left border ${
    selectedService?.id === service.id
      ? "bg-sky-600 text-white"
      : "bg-white"
  }`}
>
  {service.title}
</button>
  ))}
</div>

{selectedService && (
  <div className="mt-8 border-t pt-6">

    <h2 className="text-2xl font-bold mb-4">
      Upload Stock
    </h2>

    <div className="mb-4">
  <label className="block font-semibold mb-2">
    Stock Data (JSON)
  </label>

  <textarea
    value={stockData}
    onChange={(e) => setStockData(e.target.value)}
    rows={10}
    className="w-full border rounded-lg p-3"
    placeholder={`{
  "username": "facebook@gmail.com",
  "password": "Proxy123",
  "mail": "recovery@gmail.com",
  "mail_password": "MailPass",
  "2fa": "ABC123"
}`}
  />
</div>
<button
  onClick={saveStock}
  className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg"
>
  Save Stock
</button>
  </div>
)}
</div>
    </main>
  );
}