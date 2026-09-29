import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log the exact payload TransactPay sends.
    // DO NOT log secrets or authorization headers.
    console.log(
      "========== TRANSACTPAY WEBHOOK =========="
    );

    console.log(
      "WEBHOOK BODY:",
      JSON.stringify(body, null, 2)
    );

    console.log(
      "WEBHOOK HEADERS:",
      JSON.stringify(
        Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) =>
              key.toLowerCase() !== "authorization" &&
              key.toLowerCase() !== "cookie"
          )
        ),
        null,
        2
      )
    );

    console.log(
      "========== END TRANSACTPAY WEBHOOK =========="
    );

    // Always acknowledge receipt.
    return NextResponse.json(
      {
        received: true,
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
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "TransactPay webhook endpoint is active",
  });
}