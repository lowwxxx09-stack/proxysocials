import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();

    const transactionId = String(body.transactionId || "");
    const txRef = String(body.txRef || "");

    if (!transactionId || !txRef) {
      return NextResponse.json(
        {
          status: false,
          message: "Transaction ID and transaction reference are required.",
        },
        { status: 400 }
      );
    }

    // Verify again on the server immediately before delivering value.
    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(
        transactionId
      )}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const verifyData = await verifyResponse.json();
    const transaction = verifyData.data;

    if (
      !verifyResponse.ok ||
      verifyData.status !== "success" ||
      transaction?.status !== "successful" ||
      transaction?.tx_ref !== txRef ||
      transaction?.currency !== "NGN"
    ) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    const meta = transaction.meta || {};
    const metadata = meta;

    if (!metadata) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment metadata is missing.",
        },
        { status: 400 }
      );
    }

    let orderContent: any = metadata.orderContent || {};

    if (typeof orderContent === "string") {
      try {
        orderContent = JSON.parse(orderContent);
      } catch {
        return NextResponse.json(
          {
            status: false,
            message: "Order content could not be parsed.",
          },
          { status: 400 }
        );
      }
    }

    const quantity = Math.max(1, Number(orderContent?.quantity || 1));

    // Prevent the same Flutterwave transaction from creating
    // multiple orders.
    const { data: existingOrder, error: existingOrderError } =
      await supabase
        .from("order")
        .select("id")
        .eq("payment_reference", txRef)
        .maybeSingle();

    if (existingOrderError) {
      return NextResponse.json(
        {
          status: false,
          message: existingOrderError.message,
        },
        { status: 500 }
      );
    }

    if (existingOrder) {
      return NextResponse.json({
        status: true,
        message: "Payment already processed.",
        orderId: existingOrder.id,
      });
    }

    if (!metadata.serviceId || !metadata.userId) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment service or user information is missing.",
        },
        { status: 400 }
      );
    }

    // Get available stock.
    const { data: stockList, error: stockError } = await supabase
      .from("stock")
      .select("*")
      .eq("service_id", metadata.serviceId)
      .eq("is_used", false)
      .eq("status", "available")
      .is("assigned_to", null)
      .order("created_at", { ascending: true })
      .limit(quantity);

    if (stockError) {
      return NextResponse.json(
        {
          status: false,
          message: stockError.message,
        },
        { status: 500 }
      );
    }

    if (!stockList || stockList.length < quantity) {
      return NextResponse.json(
        {
          status: false,
          message: "Not enough stock available for this service.",
        },
        { status: 400 }
      );
    }

    // Prepare stock that will be delivered to the customer.
    const deliveredStock = stockList.map((stock) => ({
      id: stock.id,
      title: stock.title,
      username: stock.username,
      password: stock.password,
      license_key: stock.license_key,
      download_link: stock.download_link,
      email: stock.email,
      recovery_email: stock.recovery_email,
      twofa: stock.twofa,
      stock_data: stock.stock_data,
    }));

    const stockIds = stockList.map((stock) => stock.id);

    // Mark stock as sold.
    const { error: updateError } = await supabase
      .from("stock")
      .update({
        is_used: true,
        assigned_to: metadata.userId,
        assigned_at: new Date().toISOString(),
        status: "sold",
      })
      .in("id", stockIds);

    if (updateError) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Payment was successful, but stock could not be assigned.",
        },
        { status: 500 }
      );
    }

    const amount = Number(transaction.amount);

    // Create the completed order.
    const { data: createdOrder, error: orderError } = await supabase
      .from("order")
      .insert({
        user_id: metadata.userId,
        customer_name: metadata.customerName || "",
        whatsapp_number: metadata.whatsappNumber || "",
        email: metadata.email || "",
        service_id: metadata.serviceId,
        quantity,
        amount,
        payment_reference: txRef,
        payment_status: "paid",
        payment_method: "flutterwave",
        order_status: "completed",
        note: metadata.note || "",
        order_content: orderContent || {},
        delivered_stock: deliveredStock,
      })
      .select("id")
      .single();

    if (orderError) {
      return NextResponse.json(
        {
          status: false,
          message: orderError.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // REFERRAL REWARD
    //
    // The referral reward is NOT given when the customer signs up.
    // It is given only after their first successful/completed order.
    //
    // The database function also protects against duplicate rewards.
    // ============================================================

    try {
      const { data: referralReward, error: referralError } =
        await supabase.rpc("complete_referral_on_first_purchase", {
          p_referred_user_id: metadata.userId,
        });

      if (referralError) {
        console.error("REFERRAL REWARD ERROR:", referralError);
      } else if (referralReward?.rewarded) {
        console.log(
          `Referral reward paid: ₦${referralReward.reward} to the referrer of ${metadata.userId}`
        );
      }
    } catch (referralError) {
      // Referral failure should never prevent the customer's
      // successfully paid order from being completed.
      console.error("REFERRAL REWARD EXCEPTION:", referralError);
    }

    // Send Telegram notification.
    try {
      const { data: serviceData } = await supabase
        .from("services")
        .select("title, category")
        .eq("id", metadata.serviceId)
        .single();

      const telegramMessage =
        "🛒 NEW PROXYSOCIALS ORDER\n\n" +
        "👤 Customer: " +
        (metadata.customerName || "Unknown") +
        "\n" +
        "📱 WhatsApp: " +
        (metadata.whatsappNumber || "Unknown") +
        "\n\n" +
        "🛍 Service: " +
        (serviceData?.title || "Unknown") +
        "\n" +
        "🔢 Quantity: " +
        (orderContent?.quantity || "1") +
        "\n" +
        "💰 Amount: ₦" +
        Number(amount).toLocaleString() +
        "\n" +
        "💳 Payment: Flutterwave\n" +
        "📦 Status: ✅ COMPLETED\n\n" +
        "🔗 Reference: " +
        txRef;

      await sendTelegramMessage(telegramMessage);
    } catch (telegramError) {
      console.error("Telegram notification error:", telegramError);
    }

    return NextResponse.json({
      status: true,
      message: "Payment successful and stock delivered.",
      orderId: createdOrder?.id,
      deliveredStock,
    });
  } catch (error) {
    console.error("FLUTTERWAVE COMPLETE ROUTE ERROR:", error);

    return NextResponse.json(
      {
        status: false,
        message: "Something went wrong while processing payment.",
      },
      { status: 500 }
    );
  }
}