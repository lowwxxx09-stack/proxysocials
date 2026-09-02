import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Read request body
    // --------------------------------------------------

    const body = await request.json();

    const userId = body.userId;
    const reference = body.reference;

    // --------------------------------------------------
    // 2. Validate required fields
    // --------------------------------------------------

    if (!userId || !reference) {
      return NextResponse.json(
        {
          status: false,
          message: "User ID and transaction reference are required.",
        },
        { status: 400 }
      );
    }

    console.log("WALLET CREDIT REQUEST:");
    console.log({
      userId,
      reference,
    });

    // --------------------------------------------------
    // 3. Verify transaction directly with Paystack
    // --------------------------------------------------

    const paystackUrl =
      "https://api.paystack.co/transaction/verify/" +
      encodeURIComponent(reference);

    const paystackResponse = await fetch(paystackUrl, {
      method: "GET",
      headers: {
        Authorization:
          "Bearer " + process.env.PAYSTACK_SECRET_KEY,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const paystackData = await paystackResponse.json();

    console.log("PAYSTACK WALLET VERIFICATION:");
    console.log(paystackData);

    // --------------------------------------------------
    // 4. Make sure Paystack verification succeeded
    // --------------------------------------------------

    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json(
        {
          status: false,
          message:
            paystackData.message ||
            "Unable to verify Paystack transaction.",
        },
        { status: 400 }
      );
    }

    const transaction = paystackData.data;

    // --------------------------------------------------
    // 5. Make sure payment itself was successful
    // --------------------------------------------------

    if (!transaction || transaction.status !== "success") {
      return NextResponse.json(
        {
          status: false,
          message: "Paystack payment was not successful.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Get verified amount directly from Paystack
    // --------------------------------------------------

    const verifiedAmount =
      Number(transaction.amount) / 100;

    if (
      !Number.isFinite(verifiedAmount) ||
      verifiedAmount <= 0
    ) {
      return NextResponse.json(
        {
          status: false,
          message: "Invalid payment amount from Paystack.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 7. Verify that payment belongs to this user
    // --------------------------------------------------

    const metadataUserId =
      transaction.metadata &&
      transaction.metadata.userId
        ? transaction.metadata.userId
        : null;

    if (
      metadataUserId &&
      metadataUserId !== userId
    ) {
      console.error("USER ID MISMATCH:");

      console.error({
        suppliedUserId: userId,
        metadataUserId: metadataUserId,
      });

      return NextResponse.json(
        {
          status: false,
          message:
            "Payment does not belong to this user.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 8. Atomically credit wallet
    //
    // IMPORTANT:
    //
    // We no longer:
    //
    //   SELECT transaction
    //   UPDATE wallet
    //   INSERT transaction
    //
    // separately.
    //
    // The PostgreSQL function handles all of this
    // safely and prevents two simultaneous requests
    // from crediting the same Paystack reference.
    // --------------------------------------------------

    const {
      data: creditResult,
      error: creditError,
    } = await supabase.rpc(
      "credit_wallet_from_paystack",
      {
        p_user_id: userId,
        p_reference: reference,
        p_amount: verifiedAmount,
        p_paystack_transaction_id:
          String(transaction.id),
      }
    );

    // --------------------------------------------------
    // 9. Handle database credit error
    // --------------------------------------------------

    if (creditError) {
      console.error(
        "WALLET CREDIT RPC ERROR:",
        creditError
      );

      return NextResponse.json(
        {
          status: false,
          message:
            creditError.message ||
            "Unable to credit wallet.",
        },
        { status: 500 }
      );
    }

    console.log(
      "WALLET CREDIT RESULT:",
      creditResult
    );

    // --------------------------------------------------
    // 10. Make sure the database function succeeded
    // --------------------------------------------------

    if (!creditResult?.success) {
      return NextResponse.json(
        {
          status: false,
          message:
            creditResult?.message ||
            "Unable to credit wallet.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 11. Handle duplicate request
    //
    // If another request already credited this exact
    // Paystack reference, the database function returns
    // already_credited = true.
    //
    // We DO NOT send another Telegram notification.
    // --------------------------------------------------

    if (creditResult.already_credited) {
      console.log(
        "TRANSACTION ALREADY CREDITED:",
        reference
      );

      return NextResponse.json({
        status: true,
        message: "Wallet already credited.",
        alreadyCredited: true,
        amount: Number(creditResult.amount),
        reference,
      });
    }

    // --------------------------------------------------
    // 12. Get new balance returned by database
    // --------------------------------------------------

    const newBalance =
      Number(creditResult.new_balance);

    // --------------------------------------------------
    // 13. Telegram notification
    //
    // Only the request that actually credited the wallet
    // sends this notification.
    // --------------------------------------------------

    try {
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error(
          "PROFILE LOOKUP ERROR:",
          profileError
        );
      }

      const telegramMessage =
        "💰 NEW PROXYSOCIALS DEPOSIT\n\n" +
        "👤 Customer: " +
        (profile?.full_name || "Unknown") +
        "\n" +
        "📱 WhatsApp: " +
        (profile?.phone || "Unknown") +
        "\n\n" +
        "💵 Amount: ₦" +
        Number(
          verifiedAmount
        ).toLocaleString() +
        "\n" +
        "💳 Payment: Paystack\n" +
        "🔖 Reference: " +
        reference +
        "\n" +
        "💰 New Balance: ₦" +
        Number(
          newBalance
        ).toLocaleString() +
        "\n" +
        "📦 Status: ✅ CREDITED";

      console.log(
        "ABOUT TO SEND DEPOSIT TELEGRAM NOTIFICATION"
      );

      await sendTelegramMessage(
        telegramMessage
      );
    } catch (telegramError) {
      console.error(
        "DEPOSIT TELEGRAM ERROR:",
        telegramError
      );
    }

    // --------------------------------------------------
    // 14. Success
    // --------------------------------------------------
    return NextResponse.json({
      status: true,
      message: "Wallet credited successfully.",
      amount: verifiedAmount,
      newBalance,
      reference,
      alreadyCredited: false,
    });
  } catch (error) {
    console.error(
      "WALLET CREDIT SERVER ERROR:",
      error
    );

    return NextResponse.json(
      {
        status: false,
        message:
          "Something went wrong while crediting wallet.",
      },
      { status: 500 }
    );
  }
}