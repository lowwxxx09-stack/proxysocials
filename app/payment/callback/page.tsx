"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference = searchParams.get("reference");

  const [message, setMessage] = useState(
    "Verifying your payment..."
  );

  useEffect(() => {
    if (!reference) {
      setMessage("No payment reference found.");
      return;
    }

    async function processPayment() {
      try {
        // Step 1: Verify payment
        const verifyResponse = await fetch(
          "/api/paystack/verify?reference=" + reference
        );

        const verifyData = await verifyResponse.json();

        if (
          !verifyData.status ||
          verifyData.data?.status !== "success"
        ) {
          setMessage("Payment verification failed.");
          return;
        }

        // Step 2: Create order
        const completeResponse = await fetch(
          "/api/paystack/complete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference,
            }),
          }
        );

        const completeData =
          await completeResponse.json();

        if (!completeData.status) {
          console.error(
            "Complete error:",
            completeData
          );

          setMessage(
            completeData.message ||
              "Order creation failed."
          );

          return;
        }

        setMessage(
          "Payment successful! Order created 🎉"
        );

        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);

      } catch (error) {
        console.error(
          "Payment processing error:",
          error
        );

        setMessage(
          "Something went wrong while processing payment."
        );
      }
    }

    processPayment();
  }, [reference, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-lg">
        <h1 className="text-3xl font-bold text-sky-700">
          Payment Status
        </h1>

        <p className="mt-5 text-lg">
          {message}
        </p>
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          Loading...
        </main>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}