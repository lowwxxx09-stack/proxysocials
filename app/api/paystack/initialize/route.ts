import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      email,
      amount,
      customerName,
      whatsappNumber,
      serviceId,
      note,
      userId,
      orderContent,
    } = body;

    if (!email || !amount) {
      return NextResponse.json(
        {
          status: false,
          message: "Email and amount are required.",
        },
        { status: 400 }
      );
    }
console.log("METADATA BEING SENT:");
console.log({
  customerName,
  whatsappNumber,
  serviceId,
  note,
  email,
  amount,
  userId,
  orderContent,
});
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer " + process.env.PAYSTACK_SECRET_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          currency: "NGN",
        callback_url:
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/payment/callback"
    : "https://proxysocials.com/payment/callback",


          metadata: {
            customerName,
            whatsappNumber,
            serviceId,
            note,
            email,
            amount,
            userId,
            orderContent: JSON.stringify(orderContent),
          },
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Paystack Initialize Error:", error);

    return NextResponse.json(
      {
        status: false,
        message: "Unable to initialize payment.",
      },
      { status: 500 }
    );
  }
}