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

    const {
      userId,
      serviceId,
      amount,
      customerName,
      whatsappNumber,
      email,
      note,
      orderContent,
    } = body;
    const quantity = Math.max(
  1,
  Number(orderContent?.quantity || 1)
);

    if (
      !userId ||
      !serviceId ||
      !amount ||
      !customerName ||
      !whatsappNumber ||
      !email
    ) {
      return NextResponse.json(
        {
          status: false,
          message: "Missing required fields.",
        },
        { status: 400 }
      );
    }

    // Get the service from the database.
    // We do NOT trust the price sent by the browser.
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, price")
      .eq("id", serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        {
          status: false,
          message: "Service not found.",
        },
        { status: 404 }
      );
    }

    const servicePrice = Number(service.price);

    if (!Number.isFinite(servicePrice) || servicePrice <= 0) {
      return NextResponse.json(
        {
          status: false,
          message: "Invalid service price.",
        },
        { status: 400 }
      );
    }

    // Pay using the secure Supabase database function.
    const { data, error } = await supabase.rpc(
      "pay_with_wallet",
      {
        p_user_id: userId,
        p_service_id: serviceId,
        p_amount: servicePrice * quantity,
        p_customer_name: customerName,
        p_whatsapp_number: whatsappNumber,
        p_email: email,
        p_note: note || "",
        p_order_content: orderContent || {},
      }
    );

    if (error) {
      console.error("WALLET PAYMENT ERROR:", error);

      return NextResponse.json(
        {
          status: false,
          message: error.message || "Unable to pay with wallet.",
        },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        {
          status: false,
          message: data?.message || "Wallet payment failed.",
        },
        { status: 400 }
      );
    }

try {
  const { data: serviceData } = await supabase
    .from("services")
    .select("title, category")
    .eq("id", serviceId)
    .single();

  const telegramMessage =
  "🛒 NEW PROXYSOCIALS ORDER\n\n" +
  "👤 Customer: " + customerName + "\n" +
  "📱 WhatsApp: " + whatsappNumber + "\n\n" +
  "🛍️ Service: " + (serviceData?.title || "Unknown") + "\n" +
  "🔢 Quantity: " + (orderContent?.quantity || "Not provided") + "\n" +
  "💰 Amount: ₦" + Number(servicePrice * quantity).toLocaleString() + "\n" +
  "💳 Payment: Wallet\n" +
  "📦 Status: ✅ COMPLETED\n\n" +
  "🔗 Order ID: " + data.order_id;

  console.log("ABOUT TO SEND WALLET TELEGRAM NOTIFICATION");

  await sendTelegramMessage(telegramMessage);
} catch (telegramError) {
  console.error("WALLET TELEGRAM ERROR:", telegramError);
}

    return NextResponse.json({
      status: true,
      message: "Payment successful.",
      orderId: data.order_id,
      newBalance: data.new_balance,
    });
  } catch (error) {
    console.error("WALLET PAYMENT SERVER ERROR:", error);

    return NextResponse.json(
      {
        status: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}