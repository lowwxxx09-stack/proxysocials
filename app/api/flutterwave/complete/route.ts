import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";

const MAX_QUANTITY = 99;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  const flutterwaveSecret = process.env.FLW_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey || !flutterwaveSecret) {
    console.error(
      "Payment completion environment variables are missing."
    );

    return NextResponse.json(
      {
        status: false,
        message: "Payment verification is temporarily unavailable.",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const body = await request.json();

    const transactionId = String(body.transactionId || "").trim();
    const txRef = String(body.txRef || "").trim();

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

    // Load the trusted payment record created during initialization.
    const { data: intent, error: intentError } = await supabase
      .from("payment_intents")
      .select(
        "tx_ref, user_id, payment_type, amount, currency, service_id, quantity, status, flutterwave_transaction_id"
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

    if (intent.payment_type !== "order") {
      return NextResponse.json(
        {
          status: false,
          message: "This transaction is not an account order.",
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

    if (intent.status === "failed") {
      return NextResponse.json(
        {
          status: false,
          message: "This payment attempt has been marked as failed.",
        },
        { status: 409 }
      );
    }

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

    const serviceId = String(intent.service_id || "");
    const userId = String(intent.user_id || "");
    const quantity = Number(intent.quantity);
    const expectedAmount = Number(intent.amount);

    if (
      !serviceId ||
      !userId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY ||
      !Number.isFinite(expectedAmount) ||
      expectedAmount <= 0
    ) {
      console.error("Invalid trusted payment intent:", { txRef });

      return NextResponse.json(
        {
          status: false,
          message: "The stored order information is invalid.",
        },
        { status: 500 }
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
    const transaction = verifyData?.data;

    if (
      !verifyResponse.ok ||
      verifyData?.status !== "success" ||
      transaction?.status !== "successful" ||
      String(transaction?.tx_ref) !== txRef ||
      String(transaction?.id) !== transactionId ||
      transaction?.currency !== intent.currency
    ) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    const paidAmount = Number(transaction.amount);

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount <= 0 ||
      roundMoney(paidAmount) !== roundMoney(expectedAmount)
    ) {
      console.error("Order payment amount mismatch:", {
        txRef,
        expectedAmount,
        paidAmount,
      });

      return NextResponse.json(
        {
          status: false,
          message:
            "The verified payment amount does not match the order total.",
        },
        { status: 400 }
      );
    }

    // Metadata is used only for optional contact details.
    // The trusted intent determines user, service, quantity and amount.
    const metadata =
      transaction.meta &&
      typeof transaction.meta === "object"
        ? transaction.meta
        : {};

    const customerName =
      typeof metadata.customerName === "string"
        ? metadata.customerName
        : "";

    const whatsappNumber =
      typeof metadata.whatsappNumber === "string"
        ? metadata.whatsappNumber
        : "";

    const email =
      typeof metadata.email === "string"
        ? metadata.email
        : "";

    const note =
      typeof metadata.note === "string"
        ? metadata.note
        : "";

    const orderContent = { quantity };

    // The database function locks stock and creates the order atomically.
    const { data: completion, error: completionError } =
      await supabase.rpc("complete_flutterwave_order", {
        p_user_id: userId,
        p_service_id: serviceId,
        p_quantity: quantity,
        p_amount: paidAmount,
        p_tx_ref: txRef,
        p_customer_name: customerName,
        p_whatsapp_number: whatsappNumber,
        p_email: email,
        p_note: note,
        p_order_content: orderContent,
      });

    if (completionError) {
      console.error("Atomic order completion failed:", {
        message: completionError.message,
        txRef,
      });

      return NextResponse.json(
        {
          status: false,
          message:
            "Payment was received, but order processing could not be completed. Please contact support with your transaction reference.",
          txRef,
        },
        { status: 409 }
      );
    }

    if (!completion?.success || !completion?.order_id) {
      console.error("Unexpected order completion response:", {
        completion,
        txRef,
      });

      return NextResponse.json(
        {
          status: false,
          message:
            "Payment was received, but order processing needs review. Please contact support with your transaction reference.",
          txRef,
        },
        { status: 500 }
      );
    }

    const orderId = completion.order_id;
    const isDuplicate = completion.duplicate === true;

    // Mark the trusted payment intent as paid after order creation.
    // If this update fails, the RPC's duplicate protection makes retries safe.
    const { error: intentUpdateError } = await supabase
      .from("payment_intents")
      .update({
        status: "paid",
        flutterwave_transaction_id: transactionId,
        paid_at: new Date().toISOString(),
      })
      .eq("tx_ref", txRef)
      .eq("user_id", userId);

    if (intentUpdateError) {
      console.error("Payment intent status update failed:", {
        message: intentUpdateError.message,
        txRef,
      });
    }

    // Do not repeat referral rewards or notifications for duplicate callbacks.
    if (isDuplicate) {
      return NextResponse.json({
        status: true,
        message: "Payment already processed.",
        orderId,
      });
    }

    const deliveredStock = completion.delivered_stock ?? [];

    // Reward the referrer only after a newly completed purchase.
    try {
      const { data: referralReward, error: referralError } =
        await supabase.rpc("complete_referral_on_first_purchase", {
          p_referred_user_id: userId,
        });

      if (referralError) {
        console.error("REFERRAL REWARD ERROR:", referralError);
      } else if (referralReward?.rewarded) {
        console.log(
          `Referral reward paid: ₦${referralReward.reward} to the referrer of ${userId}`
        );
      }
    } catch (referralError) {
      console.error("REFERRAL REWARD EXCEPTION:", referralError);
    }

    // Send the notification after the order has been committed.
    try {
      const { data: service } = await supabase
        .from("services")
        .select("title")
        .eq("id", serviceId)
        .maybeSingle();

      const message =
        "🛒 NEW PROXYSOCIALS ORDER\n\n" +
        "👤 Customer: " +
        (customerName || "Unknown") +
        "\n" +
        "📱 WhatsApp: " +
        (whatsappNumber || "Unknown") +
        "\n\n" +
        "🛍 Service: " +
        (service?.title || "Unknown") +
        "\n" +
        "🔢 Quantity: " +
        quantity +
        "\n" +
        "💰 Amount: ₦" +
        paidAmount.toLocaleString("en-NG") +
        "\n" +
        "💳 Payment: Flutterwave\n" +
        "📦 Status: ✅ COMPLETED\n\n" +
        "🔗 Order ID: " +
        orderId +
        "\n" +
        "🔖 Reference: " +
        txRef;

      await sendTelegramMessage(message);
    } catch (telegramError) {
      console.error("Telegram notification error:", telegramError);
    }

    return NextResponse.json({
      status: true,
      message: "Payment successful and stock delivered.",
      orderId,
      deliveredStock,
    });
  } catch (error) {
    console.error("FLUTTERWAVE COMPLETE ROUTE ERROR:", error);

    return NextResponse.json(
      {
        status: false,
        message: "Something went wrong while processing payment.",
      },
      { status: 500 }
    );
  }
}