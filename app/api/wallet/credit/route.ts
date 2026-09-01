import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = body.userId;
    const reference = body.reference;

    // --------------------------------------------------
    // 1. Validate required fields
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
      userId: userId,
      reference: reference,
    });

    // --------------------------------------------------
    // 2. Verify transaction directly with Paystack
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
    // 3. Make sure payment was successful
    // --------------------------------------------------

    if (!transaction || transaction.status !== "success") {
      return NextResponse.json(
        {
          status: false,
          message:
            "Paystack payment was not successful.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Get the verified amount from Paystack
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
    // 5. Check that the payment belongs to this user
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
    // 6. Check if transaction was already credited
    // --------------------------------------------------

    const {
      data: existingTransaction,
      error: existingTransactionError,
    } = await supabase
      .from("wallet_transactions")
      .select(
        "id, user_id, amount, reference, status"
      )
      .eq("reference", reference)
      .maybeSingle();

    if (existingTransactionError) {
      console.error(
        "TRANSACTION CHECK ERROR:",
        existingTransactionError
      );

      return NextResponse.json(
        {
          status: false,
          message:
            "Unable to check transaction history.",
        },
        { status: 500 }
      );
    }

    if (existingTransaction) {
      console.log(
        "TRANSACTION ALREADY CREDITED:",
        existingTransaction
      );

      return NextResponse.json({
        status: true,
        message: "Wallet already credited.",
        alreadyCredited: true,
        amount: Number(existingTransaction.amount),
      });
    }

    // --------------------------------------------------
    // 7. Get wallet
    // --------------------------------------------------

    const {
      data: wallet,
      error: walletError,
    } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      console.error(
        "WALLET LOOKUP ERROR:",
        walletError
      );

      return NextResponse.json(
        {
          status: false,
          message:
            walletError?.message ||
            "Wallet not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 8. Calculate new balance
    // --------------------------------------------------

    const currentBalance =
      Number(wallet.balance || 0);

    const newBalance =
      currentBalance + verifiedAmount;

    console.log("WALLET BALANCE CALCULATION:");
    console.log({
      currentBalance: currentBalance,
      paymentAmount: verifiedAmount,
      newBalance: newBalance,
    });

    // --------------------------------------------------
    // 9. Update wallet
    // --------------------------------------------------

    const { error: updateError } =
      await supabase
        .from("wallets")
        .update({
          balance: newBalance,
        })
        .eq("id", wallet.id);

    if (updateError) {
      console.error(
        "WALLET UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          status: false,
          message:
            updateError.message ||
            "Unable to update wallet.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 10. Save wallet transaction
    // --------------------------------------------------

    const {
      error: transactionError,
    } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        reference: reference,
        amount: verifiedAmount,
        type: "fund_wallet",
        status: "success",
        description:
          "Wallet funded via Paystack. Paystack transaction ID: " +
          transaction.id,
      });

    if (transactionError) {
      console.error(
        "WALLET TRANSACTION INSERT ERROR:",
        transactionError
      );

      return NextResponse.json(
        {
          status: false,
          message:
            "Wallet was credited, but transaction record failed.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 11. Telegram notification
    // --------------------------------------------------

    try {
      const {
        data: profile,
      } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", userId)
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
    // 12. Success
    // --------------------------------------------------

    return NextResponse.json({
      status: true,
      message: "Wallet credited successfully.",
      amount: verifiedAmount,
      newBalance: newBalance,
      reference: reference,
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