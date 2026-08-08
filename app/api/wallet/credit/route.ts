import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    



    const body = await request.json();

    const {
      userId,
      reference,
      amount,
    } = body;

   if (!userId || !reference || !amount) {
      return NextResponse.json(
        {
          status: false,
          message: "Missing required fields.",
        },
        { status: 400 }
      );
    }

    // Check if already credited
    const { data: existingTransaction } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("reference", reference)
      .single();

    if (existingTransaction) {
      return NextResponse.json({
        status: true,
        message: "Wallet already credited.",
      });
    }

    // Get current balance
    const { data: wallet, error: walletError } =
  await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  

if (walletError) {
  return NextResponse.json(
    {
      status: false,
      message: walletError.message || "Wallet not found.",
    },
    { status: 500 }
  );
}

const newBalance =
  Number(wallet?.balance || 0) +
  Number(amount);

// Update wallet balance
const { error: updateError } =
  await supabase
    .from("wallets")
    .update({
      balance: newBalance,
    })
    .eq("user_id", userId);

if (updateError) {
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

    if (updateError) {
      return NextResponse.json(
        {
          status: false,
          message: "Unable to update wallet.",
        },
        { status: 500 }
      );
    }

    // Save transaction
    const { error: transactionError } = await supabase
  .from("wallet_transactions")
  .insert({
    user_id: userId,
    reference,
    amount,
    type: "fund_wallet",
    status: "success",
  });

if (transactionError) {
  console.error(
    "WALLET TRANSACTION INSERT ERROR:",
    transactionError
  );

  return NextResponse.json(
    {
      status: false,
      message: "Wallet was credited, but transaction record failed.",
    },
    { status: 500 }
  );
}

    return NextResponse.json({
      status: true,
      message: "Wallet credited successfully.",
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}