"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

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
const [userId, setUserId] = useState("");
const [note, setNote] = useState("");




const [submitting, setSubmitting] = useState(false);
const [customerName, setCustomerName] = useState("");
const [whatsappNumber, setWhatsappNumber] = useState("");
const [email, setEmail] = useState("");
const [quantity, setQuantity] = useState("");
const [accountLink, setAccountLink] = useState("");
const [customDetails, setCustomDetails] = useState("");

  useEffect(() => {
    getCheckoutData();
  }, []);

  async function getCheckoutData() {
    
    const supabase = createClient();
    
    const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  window.location.href = "/login";
  return;
}

setUserId(user.id);
const { data: profile } = await supabase
  .from("profiles")
  .select("full_name, phone")
  .eq("id", user.id)
  .single();

if (profile) {
  setCustomerName(profile.full_name);
  setWhatsappNumber(profile.phone);
}

setEmail(user.email ?? "");    
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
  setSubmitting(true);

  try {
    const response = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: (service?.price ?? 0) * 100,
        customerName,
        whatsappNumber,
        serviceId: service?.id,
        note,
        userId,

        orderContent: {
          quantity,
          accountLink,
          customDetails,
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message);
    }

    window.location.href = data.data.authorization_url;
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Unable to initialize payment.");
  } finally {
    setSubmitting(false);
  }
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

  
  

</div>
<div className="mt-5">
  <label className="block font-semibold mb-2">
    Quantity
  </label>

  <input
    type="text"
    value={quantity}
    onChange={(e) => setQuantity(e.target.value)}
    placeholder="e.g. 1000 Followers"
    className="w-full border rounded-lg p-3"
  />
</div>

<div className="mt-5">
  <label className="block font-semibold mb-2">
    Account / Link
  </label>

  <input
    type="text"
    value={accountLink}
    onChange={(e) => setAccountLink(e.target.value)}
    placeholder="Paste your account or post link"
    className="w-full border rounded-lg p-3"
  />
</div>

<div className="mt-5">
  <label className="block font-semibold mb-2">
    Extra Details
  </label>

  <textarea
    value={customDetails}
    onChange={(e) => setCustomDetails(e.target.value)}
    placeholder="Any additional instructions..."
    className="w-full border rounded-lg p-3 h-28"
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
  {submitting ? "Redirecting to Paystack..." : "Pay Now"}
</button>
        

      </div>
    </main>
  );
}