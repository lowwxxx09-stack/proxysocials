"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference =
    searchParams.get("reference");

  const [message, setMessage] = useState(
    "Verifying your payment..."
  );

  // --------------------------------------------------
  // Prevent duplicate processing on the same page
  // --------------------------------------------------

  const processingRef = useRef(false);

  useEffect(() => {
    if (!reference) {
      setMessage(
        "No payment reference found."
      );

      return;
    }

    // After this check, TypeScript knows this is a
    // definite string.
    const paymentReference = reference;

    // --------------------------------------------------
    // Prevent duplicate processing
    // --------------------------------------------------

    if (processingRef.current) {
      console.log(
        "PAYMENT CALLBACK ALREADY PROCESSING:",
        paymentReference
      );

      return;
    }

    processingRef.current = true;

    async function processPayment() {
      try {
        // --------------------------------------------------
        // Step 1: Verify payment with Paystack
        // --------------------------------------------------

        const verifyResponse =
          await fetch(
            "/api/paystack/verify?reference=" +
              encodeURIComponent(
                paymentReference
              ),
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const verifyData =
          await verifyResponse.json();

        console.log(
          "VERIFY RESPONSE:",
          verifyData
        );

        console.log(
          "verifyData.status:",
          verifyData.status
        );

        console.log(
          "verifyData.data:",
          verifyData.data
        );

        // --------------------------------------------------
        // Step 2: Make sure verification succeeded
        // --------------------------------------------------

        if (
          !verifyData.status ||
          verifyData.data?.status !==
            "success"
        ) {
          setMessage(
            "Payment verification failed."
          );

          return;
        }

        // --------------------------------------------------
        // Step 3: Get payment type
        // --------------------------------------------------

        const paymentType =
          verifyData.data?.metadata
            ?.payment_type;

        // --------------------------------------------------
        // ORDER PAYMENT
        // --------------------------------------------------

        if (paymentType === "order") {
          const completeResponse =
            await fetch(
              "/api/paystack/complete",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  reference:
                    paymentReference,
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
            "Payment successful! Order created 🎉 Redirecting to your orders..."
          );

          setTimeout(() => {
            router.push(
              "/order-history"
            );

            router.refresh();
          }, 2000);

          return;
        }

        // --------------------------------------------------
        // WALLET PAYMENT
        // --------------------------------------------------

        if (paymentType === "wallet") {
          const metadataUserId =
            verifyData.data?.metadata
              ?.userId;

          if (!metadataUserId) {
            setMessage(
              "Payment user information is missing."
            );

            return;
          }

          const walletResponse =
            await fetch(
              "/api/wallet/credit",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  userId:
                    metadataUserId,
                  reference:
                    paymentReference,
                }),
                cache: "no-store",
              }
            );

          const walletData =
            await walletResponse.json();

          console.log(
            "WALLET CREDIT RESPONSE:",
            walletData
          );

          if (!walletData.status) {
            console.error(
              "Wallet credit error:",
              walletData
            );

            setMessage(
              walletData.message ||
                "Unable to credit wallet."
            );

            return;
          }

          // --------------------------------------------------
          // Duplicate callback
          // --------------------------------------------------

          if (
            walletData.alreadyCredited
          ) {
            setMessage(
              "This payment has already been credited to your wallet."
            );
          } else {
            setMessage(
              "Wallet funded successfully! 🎉"
            );
          }

          setTimeout(() => {
            router.push(
              "/dashboard"
            );

            router.refresh();
          }, 2000);

          return;
        }

        // --------------------------------------------------
        // Unknown payment type
        // --------------------------------------------------

        setMessage(
          "Unable to determine payment type."
        );
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