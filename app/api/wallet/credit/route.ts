import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const flutterwaveSecret = process.env.FLW_SECRET_KEY;

const supabase =
  supabaseUrl && supabaseSecret
    ? createClient(supabaseUrl, supabaseSecret, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase || !flutterwaveSecret) {
      console.error("Wallet credit environment variables are missing.");

      return NextResponse.json(
        {
          status: false,
          message: "Wallet funding is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const transactionId = String(body.transactionId || "").trim();
    const txRef = String(body.txRef || "").trim();

    // The browser-supplied userId is deliberately not trusted.
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

    // Look up the trusted payment record created during initialization.
    const { data: intent, error: intentError } = await supabase
      .from("payment_intents")
      .select(
        "tx_ref, user_id, payment_type, amount, currency, status, flutterwave_transaction_id"
      )
      .eq("tx_ref", txRef)
      .maybeSingle();

    if (intentError) {
      console.error("Payment intent lookup failed:", intentError);

      return NextResponse.json(
        {
          status: false,
          message: "Unable to verify the payment record.",
        },
        { status: 500 }
      );
    }

    if (!intent) {
      return NextResponse.json(
        {
          status: false,
          message: "No matching payment record was found.",
        },
        { status: 404 }
      );
    }

    if (intent.payment_type !== "wallet") {
      return NextResponse.json(
        {
          status: false,
          message:
            "This transaction is not a wallet-funding payment.",
        },
        { status: 400 }
      );
    }

    if (intent.currency !== "NGN") {
      return NextResponse.json(
        {
          status: false,
          message: "The payment currency does not match.",
        },
        { status: 400 }
      );
    }

    // Verify the transaction directly with Flutterwave.
    const verifyResponse = await fetch(
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

    const verifyData = await verifyResponse.json();

    if (
      !verifyResponse.ok ||
      verifyData.status !== "success"
    ) {
      console.error(
        "Flutterwave verification failed:",
        verifyData.message
      );

      return NextResponse.json(
        {
          status: false,
          message:
            verifyData.message ||
            "Unable to verify Flutterwave transaction.",
        },
        { status: 400 }
      );
    }

    const transaction = verifyData.data;

    if (
      !transaction ||
      transaction.status !== "successful" ||
      String(transaction.tx_ref) !== txRef ||
      transaction.currency !== intent.currency ||
      String(transaction.id) !== transactionId
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            "The verified transaction does not match this payment.",
        },
        { status: 400 }
      );
    }

    const verifiedAmount = Number(transaction.amount);
    const expectedAmount = Number(intent.amount);

    if (
      !Number.isFinite(verifiedAmount) ||
      !Number.isFinite(expectedAmount) ||
      verifiedAmount <= 0 ||
      roundMoney(verifiedAmount) !== roundMoney(expectedAmount)
    ) {
      console.error("Payment amount mismatch:", {
        txRef,
        verifiedAmount,
        expectedAmount,
      });

      return NextResponse.json(
        {
          status: false,
          message:
            "The verified payment amount does not match the expected amount.",
        },
        { status: 400 }
      );
    }

    // If this intent has already been associated with a Flutterwave
    // transaction, reject attempts to associate another transaction.
    if (
      intent.flutterwave_transaction_id &&
      String(intent.flutterwave_transaction_id) !== transactionId
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            "This payment reference is already associated with another transaction.",
        },
        { status: 409 }
      );
    }

    // Do not credit a failed intent. Pending intents and already-paid
    // intents are handled through the atomic RPC's idempotency check.
    if (intent.status === "failed") {
      return NextResponse.json(
        {
          status: false,
          message: "This payment attempt has been marked as failed.",
        },
        { status: 409 }
      );
    }

    // Atomically credit the user recorded in the trusted payment intent.
    const { data: creditResult, error: creditError } =
      await supabase.rpc("credit_wallet_from_payment", {
        p_user_id: intent.user_id,
        p_reference: txRef,
        p_amount: expectedAmount,
        p_payment_transaction_id: transactionId,
      });

    if (creditError) {
      console.error("WALLET CREDIT RPC ERROR:", creditError);

      return NextResponse.json(
        {
          status: false,
          message: "Unable to credit your wallet at this time.",
        },
        { status: 500 }
      );
    }

    if (!creditResult?.success) {
      console.error("WALLET CREDIT REJECTED:", creditResult);

      return NextResponse.json(
        {
          status: false,
          message:
            creditResult?.message || "Unable to credit wallet.",
        },
        { status: 409 }
      );
    }

    // Record the successful payment against the trusted intent.
    const { error: updateIntentError } = await supabase
      .from("payment_intents")
      .update({
        status: "paid",
        flutterwave_transaction_id: transactionId,
        paid_at: new Date().toISOString(),
      })
      .eq("tx_ref", txRef)
      .eq("user_id", intent.user_id);

    if (updateIntentError) {
      // The wallet RPC is idempotent, so retrying this request can
      // safely repair the payment intent status without another credit.
      console.error(
        "PAYMENT INTENT UPDATE ERROR:",
        updateIntentError
      );
    }

    if (creditResult.already_credited) {
      return NextResponse.json({
        status: true,
        message: "Wallet already credited.",
        alreadyCredited: true,
        amount: Number(creditResult.amount),
        reference: txRef,
      });
    }

    const newBalance = Number(creditResult.new_balance);

    // Notifications must never undo a successful wallet credit.
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", intent.user_id)
        .single();

      const telegramMessage =
        "💰 NEW PROXYSOCIALS DEPOSIT\n\n" +
        "👤 Customer: " +
        (profile?.full_name || "Unknown") +
        "\n" +
        "📱 WhatsApp: " +
        (profile?.phone || "Unknown") +
        "\n\n" +
        "💵 Amount: ₦" +
        expectedAmount.toLocaleString() +
        "\n" +
        "💳 Payment: Flutterwave\n" +
        "🔖 Reference: " +
        txRef +
        "\n" +
        "💰 New Balance: ₦" +
        newBalance.toLocaleString() +
        "\n" +
        "📦 Status: ✅ CREDITED";

      await sendTelegramMessage(telegramMessage);
    } catch (telegramError) {
      console.error("DEPOSIT TELEGRAM ERROR:", telegramError);
    }

    return NextResponse.json({
      status: true,
      message: "Wallet credited successfully.",
      amount: expectedAmount,
      newBalance,
      reference: txRef,
      alreadyCredited: false,
    });
  } catch (error) {
    console.error("WALLET CREDIT SERVER ERROR:", error);

    return NextResponse.json(
      {
        status: false,
        message: "Something went wrong while crediting wallet.",
      },
      { status: 500 }
    );
  }
}