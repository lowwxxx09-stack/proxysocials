import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TransactPayWebhook = {
  statusCode?: string;
  status?: string;
  paymentReference?: string;
  totalAmountCharged?: number;
  currencyName?: string;
  statusId?: number;
  sessionId?: string;
  accountReference?: string;
  narration?: string;
  fee?: number;
  sourceAccountName?: string;
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "TransactPay webhook endpoint is active",
  });
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as TransactPayWebhook;

    console.log(
      "========== TRANSACTPAY WEBHOOK =========="
    );

    console.log(
      "WEBHOOK BODY:",
      JSON.stringify(body, null, 2)
    );

    // --------------------------------------------------
    // 1. Basic payment validation
    // --------------------------------------------------

    if (body.status !== "Success" || body.statusId !== 5) {
      console.log(
        "TRANSACTPAY WEBHOOK: Payment is not successful."
      );

      return NextResponse.json(
        { received: true, credited: false },
        { status: 200 }
      );
    }

    if (body.statusCode !== "00") {
      console.log(
        "TRANSACTPAY WEBHOOK: Invalid status code:",
        body.statusCode
      );

      return NextResponse.json(
        { received: true, credited: false },
        { status: 200 }
      );
    }

    if (body.currencyName !== "NGN") {
      console.log(
        "TRANSACTPAY WEBHOOK: Unsupported currency:",
        body.currencyName
      );

      return NextResponse.json(
        { received: true, credited: false },
        { status: 200 }
      );
    }

    if (
      !body.paymentReference ||
      !body.accountReference ||
      !body.sessionId ||
      typeof body.totalAmountCharged !== "number" ||
      body.totalAmountCharged <= 0
    ) {
      console.error(
        "TRANSACTPAY WEBHOOK: Missing required payment fields."
      );

      return NextResponse.json(
        {
          received: false,
          credited: false,
          error: "Missing required payment fields",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Create Supabase service-role client
    // --------------------------------------------------

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "TRANSACTPAY WEBHOOK: Supabase environment variables missing."
      );

      return NextResponse.json(
        {
          received: false,
          credited: false,
          error: "Server configuration error",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // --------------------------------------------------
    // 3. Find the ProxySocials user using accountReference
    // --------------------------------------------------

    const { data: virtualAccount, error: accountError } =
      await supabase
        .from("virtual_accounts")
        .select(
          "id, user_id, account_number, account_reference, status"
        )
        .eq(
          "account_reference",
          body.accountReference
        )
        .maybeSingle();

    if (accountError) {
      console.error(
        "TRANSACTPAY WEBHOOK: Error finding virtual account:",
        accountError
      );

      return NextResponse.json(
        {
          received: false,
          credited: false,
          error: "Database lookup failed",
        },
        { status: 500 }
      );
    }

    if (!virtualAccount) {
      console.error(
        "TRANSACTPAY WEBHOOK: No matching virtual account found:",
        body.accountReference
      );

      return NextResponse.json(
        {
          received: false,
          credited: false,
          error: "Virtual account not found",
        },
        { status: 404 }
      );
    }

    console.log(
      "TRANSACTPAY WEBHOOK: Matched user:",
      virtualAccount.user_id
    );

    // --------------------------------------------------
    // 4. Use paymentReference as the idempotency reference
    // --------------------------------------------------

    const walletReference =
      `TRANSACTPAY-${body.paymentReference}`;

    // --------------------------------------------------
    // 5. Credit the ProxySocials wallet
    // --------------------------------------------------

    const { data: creditResult, error: creditError } =
      await supabase.rpc(
        "credit_wallet_from_payment",
        {
          p_user_id: virtualAccount.user_id,
          p_reference: walletReference,
          p_amount: body.totalAmountCharged,
          p_payment_transaction_id:
            body.paymentReference,
        }
      );

    if (creditError) {
      console.error(
        "TRANSACTPAY WEBHOOK: Wallet credit failed:",
        creditError
      );

      return NextResponse.json(
        {
          received: false,
          credited: false,
          error: "Wallet credit failed",
        },
        { status: 500 }
      );
    }

    console.log(
      "TRANSACTPAY WEBHOOK: Wallet credit result:",
      JSON.stringify(creditResult, null, 2)
    );

    // --------------------------------------------------
    // 6. Finished
    // --------------------------------------------------

    console.log(
      `TRANSACTPAY WEBHOOK: ₦${body.totalAmountCharged} processed for user ${virtualAccount.user_id}`
    );

    console.log(
      "========== END TRANSACTPAY WEBHOOK =========="
    );

    return NextResponse.json(
      {
        received: true,
        credited: true,
        amount: body.totalAmountCharged,
        paymentReference: body.paymentReference,
        accountReference: body.accountReference,
        result: creditResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "TRANSACTPAY WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        received: false,
        credited: false,
      },
      { status: 400 }
    );
  }
}