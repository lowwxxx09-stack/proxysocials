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

    const paymentType = serviceId ? "order" : "wallet";

    const metadata = {
      payment_type: paymentType,
      customerName: customerName || "",
      whatsappNumber: whatsappNumber || "",
      serviceId: serviceId || "",
      note: note || "",
      email,
      amount,
      userId: userId || "",
      orderContent: JSON.stringify(orderContent || {}),
    };

    console.log("=================================");
    console.log("PAYSTACK INITIALIZATION");
    console.log("=================================");
    console.log("PAYMENT TYPE:", paymentType);
    console.log("EMAIL:", email);
    console.log("AMOUNT:", amount);
    console.log("CUSTOMER:", customerName);
    console.log("WHATSAPP:", whatsappNumber);
    console.log("SERVICE ID:", serviceId);
    console.log("USER ID:", userId);
    console.log("ORDER CONTENT:", orderContent);
    console.log("METADATA BEING SENT:", metadata);
    console.log("=================================");

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

          metadata,
        }),
      }
    );

    const data = await response.json();

    console.log("PAYSTACK INITIALIZE RESPONSE:", data);

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