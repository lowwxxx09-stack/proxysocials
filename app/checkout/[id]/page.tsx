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
     return (
  <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-5 py-12">

    <div className="max-w-3xl mx-auto">

      {/* Header */}

      <div className="text-center mb-10">

        <h1 className="text-4xl md:text-5xl font-black text-sky-700">
          Secure Checkout
        </h1>

        <p className="mt-3 text-gray-600 text-lg">
          Complete your order and grow your digital presence.
        </p>

      </div>


      {/* Service Summary */}

      <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-8 mb-8">

        <span className="inline-block bg-sky-100 text-sky-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          {service!.category}
        </span>


        <h2 className="mt-5 text-3xl font-black text-gray-900">
          {service!.title}
        </h2>


        <p className="mt-4 text-gray-600 leading-7">
          {service!.description}
        </p>


        <div className="flex flex-col sm:flex-row justify-between gap-6 mt-8">


          <div>

            <p className="text-sm text-gray-500">
              Delivery Time
            </p>

            <p className="mt-1 font-bold text-gray-900">
              {service!.delivery_time}
            </p>

          </div>



          <div className="sm:text-right">

            <p className="text-sm text-gray-500">
              Total Price
            </p>

            <p className="mt-1 text-4xl font-black text-sky-700">
              ₦{Number(service!.price).toLocaleString()}
            </p>

          </div>


        </div>


      </div>



      {/* Secure Payment */}

<div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-8 mb-8">

  <h2 className="text-2xl font-black text-sky-700">
    Secure Payment
  </h2>

  <p className="mt-3 text-gray-600 leading-7">
    Your payment will be processed securely through Paystack.
    After successful payment, your order will be created automatically.
  </p>

  <div className="mt-5 bg-sky-50 rounded-2xl p-5">

    <p className="font-bold text-gray-800">
      ✓ Secure checkout
    </p>

    <p className="font-bold text-gray-800 mt-2">
      ✓ Automatic order confirmation
    </p>

    <p className="font-bold text-gray-800 mt-2">
      ✓ Fast service processing
    </p>

  </div>

</div>


      
      {/* Customer Information */}

      <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-8 mb-8">

        <h2 className="text-2xl font-black text-sky-700 mb-8">
          Customer Information
        </h2>


        <div className="space-y-6">


          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-2xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>



          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">
              WhatsApp Number
            </label>

            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+234..."
              className="w-full rounded-2xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>



          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email (Optional)
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-2xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>


        </div>


      </div>



      {/* Order Details */}


      <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-8 mb-8">


        <h2 className="text-2xl font-black text-sky-700 mb-8">
          Order Details
        </h2>



        <div className="space-y-6">


          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">
              Quantity
            </label>

            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 1000 Followers"
              className="w-full rounded-2xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>



          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">
              Account / Link
            </label>

            <input
              type="text"
              value={accountLink}
              onChange={(e) => setAccountLink(e.target.value)}
              placeholder="Paste your account or post link"
              className="w-full rounded-2xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>



          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">
              Extra Details
            </label>

            <textarea
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              placeholder="Any additional instructions..."
              className="w-full rounded-2xl border border-gray-300 p-4 h-32 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>

          <div>

            <label className="block text-sm font-bold text-gray-700 mb-2">
              Order Note (Optional)
            </label>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any extra information you'd like us to know..."
              className="w-full rounded-2xl border border-gray-300 p-4 h-28 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>


        </div>


      </div>



      {/* Payment Button */}


      <div className="bg-white rounded-3xl border border-sky-100 shadow-xl p-8">


        <button
          onClick={submitOrder}
          disabled={submitting}
          className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white text-lg font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        >

          {submitting
            ? "Redirecting to Paystack..."
            : "Proceed to Paystack"}

        </button>


        <p className="text-center text-gray-500 text-sm mt-5">
          🔒 Your payment is securely processed by Paystack.
        </p>


      </div>


    </div>


  </main>
);
}