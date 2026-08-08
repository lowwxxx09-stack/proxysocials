import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      {
        status: false,
        message: "No payment reference provided.",
      },
      { status: 400 }
    );
  }

  try {
    console.log(
  "PAYSTACK SECRET KEY LOADED:",
  process.env.PAYSTACK_SECRET_KEY
    ? "YES"
    : "NO"
);
    const response = await fetch(
      "https://api.paystack.co/transaction/verify/" + reference,
      {
        headers: {
          Authorization:
            "Bearer " + process.env.PAYSTACK_SECRET_KEY,
        },
      }
    );

    const data = await response.json();

return NextResponse.json(data, {
  status: response.status,
});
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        status: false,
        message: "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}