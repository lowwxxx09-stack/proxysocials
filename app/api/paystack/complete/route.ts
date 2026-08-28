import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  console.log(
    "SUPABASE URL LOADED:",
    !!process.env.NEXT_PUBLIC_SUPABASE_URL
  );

  console.log(
    "SUPABASE SERVICE ROLE KEY LOADED:",
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();

    const reference = body.reference;

    if (!reference) {
      return NextResponse.json(
        {
          status: false,
          message: "Reference is required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 1. Verify payment with Paystack
    // --------------------------------------------------

    const verifyResponse = await fetch(
      "https://api.paystack.co/transaction/verify/" + reference,
      {
        headers: {
          Authorization:
            "Bearer " + process.env.PAYSTACK_SECRET_KEY,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (
      !verifyData.status ||
      verifyData.data?.status !== "success"
    ) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 2. Get metadata
    // --------------------------------------------------

    const metadata = verifyData.data.metadata;

    console.log("PAYSTACK METADATA:");
    console.log(metadata);

    if (!metadata) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment metadata is missing.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 3. Parse order content
    // --------------------------------------------------

    let orderContent: any;

    try {
      if (typeof metadata.orderContent === "string") {
        orderContent = JSON.parse(metadata.orderContent);
      } else {
        orderContent = metadata.orderContent || {};
      }
    } catch (error) {
      console.error("JSON PARSE FAILED:", error);

      return NextResponse.json(
        {
          status: false,
          message: "JSON parse failed.",
        },
        {
          status: 500,
        }
      );
    }

    console.log("ORDER CONTENT:", orderContent);

    // --------------------------------------------------
    // 4. Get quantity
    // --------------------------------------------------

    const quantity = Math.max(
      1,
      Number(orderContent?.quantity || 1)
    );

    console.log("ORDER QUANTITY:", quantity);

    // --------------------------------------------------
    // 5. Prevent duplicate payment processing
    // --------------------------------------------------

    const {
      data: existingOrder,
      error: existingOrderError,
    } = await supabase
      .from("order")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (existingOrderError) {
      console.error(
        "EXISTING ORDER CHECK ERROR:",
        existingOrderError
      );

      return NextResponse.json(
        {
          status: false,
          message: existingOrderError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (existingOrder) {
      return NextResponse.json({
        status: true,
        message: "Payment already processed.",
        orderId: existingOrder.id,
      });
    }

    // --------------------------------------------------
    // 6. Make sure service ID exists
    // --------------------------------------------------

    if (!metadata.serviceId) {
      return NextResponse.json(
        {
          status: false,
          message: "Service ID is missing.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("SERVICE ID:", metadata.serviceId);

    // --------------------------------------------------
    // 7. Get available stock
    //
    // We use the same stock conditions as wallet payment.
    // --------------------------------------------------

    console.log("REACHED STOCK QUERY");

    const {
      data: stockList,
      error: stockError,
    } = await supabase
      .from("stock")
      .select("*")
      .eq("service_id", metadata.serviceId)
      .eq("is_used", false)
      .eq("status", "available")
      .is("assigned_to", null)
      .order("created_at", { ascending: true })
      .limit(quantity);

    console.log("STOCK:", stockList);
    console.log("STOCK ERROR:", stockError);

    if (stockError) {
      console.error(
        "STOCK QUERY ERROR:",
        stockError
      );

      return NextResponse.json(
        {
          status: false,
          message: stockError.message,
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // 8. Make sure enough stock exists
    // --------------------------------------------------

    if (!stockList || stockList.length < quantity) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Not enough stock available for this service.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "SELECTED STOCK COUNT:",
      stockList.length
    );

    // --------------------------------------------------
    // 9. Build delivered_stock
    //
    // IMPORTANT:
    // This matches the wallet function exactly.
    // --------------------------------------------------

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

    console.log(
      "DELIVERED STOCK:",
      deliveredStock
    );

    // --------------------------------------------------
    // 10. Mark stock as used/sold
    //
    // This is the same update used by wallet payment.
    //
    // The database trigger should automatically
    // recalculate services.available_stock.
    // --------------------------------------------------

    const stockIds = stockList.map(
      (stock) => stock.id
    );

    const {
      error: updateError,
    } = await supabase
      .from("stock")
      .update({
        is_used: true,
        assigned_to: metadata.userId,
        assigned_at: new Date().toISOString(),
        status: "sold",
      })
      .in("id", stockIds);

    if (updateError) {
      console.error(
        "STOCK UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          status: false,
          message:
            "Payment was successful, but stock could not be assigned.",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "STOCK MARKED AS SOLD:",
      stockIds
    );

    // --------------------------------------------------
    // 11. Create the order
    // --------------------------------------------------

    const amount = verifyData.data.amount / 100;

    const {
      data: createdOrder,
      error: orderError,
    } = await supabase
      .from("order")
      .insert({
        user_id: metadata.userId,
        customer_name: metadata.customerName,
        whatsapp_number: metadata.whatsappNumber,
        email: metadata.email,
        service_id: metadata.serviceId,
        quantity: quantity,
        amount: amount,
        payment_reference: reference,
        payment_status: "paid",
        payment_method: "paystack",
        order_status: "completed",
        note: metadata.note || "",
        order_content: orderContent || {},
        delivered_stock: deliveredStock,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error(
        "SUPABASE INSERT ERROR:",
        orderError
      );

      return NextResponse.json(
        {
          status: false,
          message: orderError.message,
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "ORDER CREATED:",
      createdOrder?.id
    );

    // --------------------------------------------------
    // 12. Get service information for Telegram
    // --------------------------------------------------

    try {
      const {
        data: serviceData,
      } = await supabase
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
        "💳 Payment: Paystack\n" +
        "📦 Status: ✅ COMPLETED\n\n" +
        "🔗 Order ID: " +
        reference;

      await sendTelegramMessage(
        telegramMessage
      );
    } catch (telegramError) {
      console.error(
        "Telegram notification error:",
        telegramError
      );
    }

    // --------------------------------------------------
    // 13. Return success
    // --------------------------------------------------

    return NextResponse.json({
      status: true,
      message:
        "Payment successful and stock delivered.",
      orderId: createdOrder?.id,
      deliveredStock: deliveredStock,
    });
  } catch (error) {
    console.error(
      "PAYSTACK COMPLETE ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        status: false,
        message:
          "Something went wrong while processing payment.",
      },
      {
        status: 500,
      }
    );
  }
}