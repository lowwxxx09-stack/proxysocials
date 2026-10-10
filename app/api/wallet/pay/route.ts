import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const MAX_QUANTITY = 99;

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      console.error("Wallet payment Supabase credentials are missing.");

      return NextResponse.json(
        {
          status: false,
          message: "Payment service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      userId,
      serviceId,
      customerName,
      whatsappNumber,
      email,
      note,
      orderContent,
    } = body;

    if (
      typeof userId !== "string" ||
      !userId.trim() ||
      typeof serviceId !== "string" ||
      !serviceId.trim()
    ) {
      return NextResponse.json(
        {
          status: false,
          message: "A valid user and service are required.",
        },
        { status: 400 }
      );
    }

    const quantity = Number(orderContent?.quantity ?? 1);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return NextResponse.json(
        {
          status: false,
          message: `Quantity must be a whole number between 1 and ${MAX_QUANTITY}.`,
        },
        { status: 400 }
      );
    }

    // Always calculate the price from the database.
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, price, title, category")
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

    const totalAmount =
      Math.round(servicePrice * quantity * 100) / 100;

    const safeCustomerName =
      typeof customerName === "string" ? customerName.trim() : "";

    const safeWhatsappNumber =
      typeof whatsappNumber === "string" ? whatsappNumber.trim() : "";

    const safeEmail =
      typeof email === "string" ? email.trim() : "";

    const safeNote = typeof note === "string" ? note : "";

    const safeOrderContent = {
      ...(orderContent &&
      typeof orderContent === "object" &&
      !Array.isArray(orderContent)
        ? orderContent
        : {}),
      quantity,
    };

    // The database function handles wallet locking, balance checks,
    // stock allocation, wallet deduction, and order creation.
    const { data, error } = await supabase.rpc("pay_with_wallet", {
      p_user_id: userId,
      p_service_id: serviceId,
      p_amount: totalAmount,
      p_customer_name: safeCustomerName,
      p_whatsapp_number: safeWhatsappNumber,
      p_email: safeEmail,
      p_note: safeNote,
      p_order_content: safeOrderContent,
    });

    if (error) {
      console.error("WALLET PAYMENT ERROR:", error);

      return NextResponse.json(
        {
          status: false,
          message: "Unable to complete wallet payment. Please try again.",
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

    // Notifications must not undo a successful order.
    try {
      const telegramMessage =
        "🛒 NEW PROXYSOCIALS ORDER\n\n" +
        "👤 Customer: " + (safeCustomerName || "Not provided") + "\n" +
        "📱 WhatsApp: " + (safeWhatsappNumber || "Not provided") + "\n\n" +
        "🛍️ Service: " + (service.title || "Unknown") + "\n" +
        "🔢 Quantity: " + quantity + "\n" +
        "💰 Amount: ₦" + totalAmount.toLocaleString("en-NG") + "\n" +
        "💳 Payment: Wallet\n" +
        "📦 Status: ✅ COMPLETED\n\n" +
        "🔗 Order ID: " + data.order_id;

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