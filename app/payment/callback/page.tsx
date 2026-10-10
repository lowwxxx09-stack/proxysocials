"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const transactionId = searchParams.get("transaction_id");
  const txRef = searchParams.get("tx_ref");
  const status = searchParams.get("status");

  const [message, setMessage] = useState(
    "Verifying your payment..."
  );

  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current) return;

    if (!transactionId || !txRef) {
      setMessage(
        "No Flutterwave transaction information found. If you completed payment, contact support with your payment reference."
      );
      return;
    }

    if (status === "cancelled" || status === "failed") {
      setMessage("Payment was cancelled or failed.");
      return;
    }

    const verifiedTransactionId = transactionId;
    const verifiedTxRef = txRef;

    processingRef.current = true;

    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function processPayment() {
      try {
        let endpoint: string;
        let successMessage: string;
        let destination: string;

        // The prefix only selects which server endpoint to call.
        // Each endpoint must independently validate the trusted
        // payment_intents record and Flutterwave transaction.
        if (verifiedTxRef.startsWith("PROXY-ORDER-")) {
          endpoint = "/api/flutterwave/complete";
          successMessage =
            "Payment successful! Your order has been processed. Redirecting...";
          destination = "/order-history";
        } else if (verifiedTxRef.startsWith("PROXY-WALLET-")) {
          endpoint = "/api/wallet/credit";
          successMessage =
            "Wallet funded successfully! Redirecting to your dashboard...";
          destination = "/dashboard";
        } else {
          setMessage(
            "Unrecognized payment reference. Please contact support if your payment was successful."
          );
          return;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            transactionId: verifiedTransactionId,
            txRef: verifiedTxRef,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.status) {
          setMessage(
            result.message ||
              "We couldn't finish processing your payment. Please contact support with your payment reference."
          );
          return;
        }

        if (endpoint === "/api/wallet/credit") {
          setMessage(
            result.alreadyCredited
              ? "This payment has already been credited to your wallet. Redirecting..."
              : successMessage
          );
        } else {
          setMessage(
            result.message === "Payment already processed."
              ? "This order has already been processed. Redirecting..."
              : successMessage
          );
        }

        redirectTimer = setTimeout(() => {
          router.push(destination);
          router.refresh();
        }, 2000);
      } catch (error) {
        console.error("Payment callback processing error:", error);

        setMessage(
          "Something went wrong while processing your payment. Please contact support with your payment reference."
        );
      }
    }

    void processPayment();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [router, status, transactionId, txRef]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-3xl font-bold text-sky-700">
          Payment Status
        </h1>

        <p className="mt-5 text-lg text-slate-700">
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
        <main className="flex min-h-screen items-center justify-center bg-sky-50">
          <p className="text-slate-700">
            Loading payment status...
          </p>
        </main>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}