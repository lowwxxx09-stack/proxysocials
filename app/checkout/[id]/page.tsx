"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Service = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  delivery_time: string;
};

type PaymentSettings = {
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions: string;
};

export default function CheckoutPage() {
  const params = useParams();
  const id = params.id as string;

  const [service, setService] = useState<Service | null>(null);

  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings>({
      bank_name: "",
      account_name: "",
      account_number: "",
      instructions: "",
    });

  const [loading, setLoading] = useState(true);
const [receipt, setReceipt] = useState<File | null>(null);

const [note, setNote] = useState("");

const [submitting, setSubmitting] = useState(false);
const [customerName, setCustomerName] = useState("");
const [whatsappNumber, setWhatsappNumber] = useState("");
const [email, setEmail] = useState("");


  useEffect(() => {
    getCheckoutData();
  }, []);

  async function getCheckoutData() {
    const { data: serviceData } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (serviceData) {
      setService(serviceData);
    }

    const {
  data: paymentData,
  error: paymentError,
} = await supabase
  .from("payment_settings")
  .select("*")
  .limit(1)
  .single();

console.log("PAYMENT DATA:", paymentData);
console.log("PAYMENT ERROR:", paymentError);

    if (paymentData) {
      setPaymentSettings(paymentData);
    }

    setLoading(false);
  }
async function submitOrder() {
  if (!receipt) {
    alert("Please upload your payment receipt.");
    return;
  }

  setSubmitting(true);

  try {
    const fileName = Date.now() + "-" + receipt.name;

    const { data, error: uploadError } = await supabase.storage
  .from("payment_receipts")
  .upload(fileName, receipt, {
    upsert: false,
  });

console.log("Upload result:", data, uploadError);
    if (uploadError) {
      throw uploadError;
    }

    const { data: fileData } = supabase.storage
  .from("payment_receipts")
  .getPublicUrl(fileName);
    const receiptUrl = fileData.publicUrl;

    const { error: orderError } = await supabase
  .from("order")
  .insert({
    service_id: service?.id,
    amount: service?.price,
    order_status: "pending_verification",
    receipt_url: receiptUrl,
    note: note,
    customer_name: customerName,
    whatsapp_number: whatsappNumber,
    email: email,
  });

    if (orderError) {
      throw orderError;
    }

    alert("Order submitted successfully!");

  }  catch (error: any) {
  console.log(error);
  alert(error.message || JSON.stringify(error));
}

  setSubmitting(false);
}
  if (loading) {
    return (
      <main className="min-h-screen bg-sky-50 flex items-center justify-center">
        <h1 className="text-xl font-bold text-sky-700">
          Loading checkout...
        </h1>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="min-h-screen bg-sky-50 flex items-center justify-center">
        <h1 className="text-xl font-bold text-red-600">
          Service not found
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-6 py-10">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-extrabold text-sky-700">
          Checkout
        </h1>

        <div className="mt-6">

          <p className="text-sky-600 font-semibold">
            {service.category}
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {service.title}
          </h2>

          <p className="text-gray-600 mt-3">
            {service.description}
          </p>

          <p className="text-3xl font-extrabold text-sky-700 mt-5">
            ₦{service.price}
          </p>

        </div>

        <div className="mt-8 bg-sky-50 border border-sky-200 rounded-xl p-5">

          <h2 className="text-xl font-bold text-sky-700">
            Payment Details
          </h2>

          <div className="mt-4 space-y-3">

            <p>
              <span className="font-bold">Bank:</span>{" "}
              {paymentSettings.bank_name}
            </p>

            <p>
              <span className="font-bold">Account Name:</span>{" "}
              {paymentSettings.account_name}
            </p>

            <p>
              <span className="font-bold">Account Number:</span>{" "}
              {paymentSettings.account_number}
            </p>

            <p className="text-gray-600">
              {paymentSettings.instructions}
            </p>

          </div>

        </div>
        <div className="mt-6">
  <label className="block font-semibold mb-2">
    Full Name
  </label>

  <input
    type="text"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    placeholder="Enter your full name"
    className="w-full border rounded-lg p-3"
  />
</div>

<div className="mt-5">
  <label className="block font-semibold mb-2">
    WhatsApp Number
  </label>

  <input
    type="tel"
    value={whatsappNumber}
    onChange={(e) => setWhatsappNumber(e.target.value)}
    placeholder="e.g. +2348012345678"
    className="w-full border rounded-lg p-3"
  />
</div>

<div className="mt-5">
  <label className="block font-semibold mb-2">
    Email (Optional)
  </label>

  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="example@email.com"
    className="w-full border rounded-lg p-3"
  />
</div>
<div className="mt-6">

  <label className="block font-semibold mb-2">
    Upload Payment Receipt
  </label>

  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e) => {
      if (e.target.files?.[0]) {
        setReceipt(e.target.files[0]);
      }
    }}
    className="w-full border rounded-lg p-3"
  />

</div>

<div className="mt-5">

  <label className="block font-semibold mb-2">
    Order Note (Optional)
  </label>

  <textarea
    value={note}
    onChange={(e) => setNote(e.target.value)}
    placeholder="Any extra information..."
    className="w-full border rounded-lg p-3 h-28"
  />

</div>

<button
  onClick={submitOrder}
  disabled={submitting}
  className="mt-8 w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-bold transition"
>
  {submitting ? "Submitting..." : "I've Made Payment"}
</button>
        <button
          className="mt-8 w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-bold transition"
        >
          Continue to Payment
        </button>

      </div>
    </main>
  );
}