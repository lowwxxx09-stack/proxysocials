import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function amountsMatch(
  actual: unknown,
  expected: unknown
): boolean {
  const actualAmount = Number(actual);
  const expectedAmount = Number(expected);

  return (
    Number.isFinite(actualAmount) &&
    Number.isFinite(expectedAmount) &&
    Math.round(actualAmount * 100) ===
      Math.round(expectedAmount * 100)
  );
}

export async function GET(request: NextRequest) {
  const transactionId =
    request.nextUrl.searchParams.get("transaction_id");

  const txRef = request.nextUrl.searchParams.get("tx_ref");

  if (!transactionId || !txRef) {
    return NextResponse.json(
      {
        status: false,
        message:
          "Transaction ID and transaction reference are required.",
      },
      { status: 400 }
    );
  }

  const flutterwaveSecret = process.env.FLW_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!flutterwaveSecret || !supabaseUrl || !serviceRoleKey) {
    console.error(
      "Flutterwave verification configuration is incomplete."
    );

    return NextResponse.json(
      {
        status: false,
        message: "Payment verification is temporarily unavailable.",
      },
      { status: 500 }
    );
  }

  try {
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Retrieve the expected payment details from our trusted database.
    const { data: intent, error: intentError } =
      await supabaseAdmin
        .from("payment_intents")
        .select(
          "tx_ref, payment_type, amount, currency, status, flutterwave_transaction_id"
        )
        .eq("tx_ref", txRef)
        .maybeSingle();

    if (intentError) {
      console.error(
        "Payment intent lookup failed:",
        intentError.message
      );

      return NextResponse.json(
        {
          status: false,
          message: "Unable to retrieve payment details.",
        },
        { status: 500 }
      );
    }

    if (!intent) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment reference was not found.",
        },
        { status: 404 }
      );
    }

    if (intent.currency !== "NGN") {
      return NextResponse.json(
        {
          status: false,
          message: "Unsupported payment currency.",
        },
        { status: 400 }
      );
    }

    if (intent.status === "failed") {
      return NextResponse.json(
        {
          status: false,
          message: "This payment has been marked as failed.",
        },
        { status: 400 }
      );
    }

    if (
      intent.flutterwave_transaction_id &&
      String(intent.flutterwave_transaction_id) !==
        transactionId
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            "This payment reference is associated with another transaction.",
        },
        { status: 400 }
      );
    }

    // Verify the transaction directly with Flutterwave.
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(
        transactionId
      )}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${flutterwaveSecret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      return NextResponse.json(
        {
          status: false,
          message:
            data.message ||
            "Unable to verify Flutterwave transaction.",
        },
        { status: 400 }
      );
    }

    const transaction = data.data;

    if (
      transaction?.status !== "successful" ||
      String(transaction?.id) !== transactionId ||
      transaction?.tx_ref !== intent.tx_ref ||
      transaction?.currency !== intent.currency
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            "The Flutterwave transaction does not match the expected payment.",
        },
        { status: 400 }
      );
    }

    if (!amountsMatch(transaction?.amount, intent.amount)) {
      return NextResponse.json(
        {
          status: false,
          message:
            "The verified transaction amount does not match the expected amount.",
        },
        { status: 400 }
      );
    }

    // Return the payment type from our database, not transaction metadata.
    return NextResponse.json({
      status: true,
      paymentType: intent.payment_type,
      data: {
        id: String(transaction.id),
        tx_ref: transaction.tx_ref,
        status: transaction.status,
        currency: transaction.currency,
        amount: transaction.amount,
      },
    });
  } catch (error) {
    console.error("Flutterwave verification error:", error);

    return NextResponse.json(
      {
        status: false,
        message: "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}