import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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

  // Verify payment with Paystack
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
    verifyData.data.status !== "success"
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

  const metadata = verifyData.data.metadata;
const orderContent = JSON.parse(metadata.orderContent);

console.log("ORDER CONTENT:", orderContent);
const { data: stock, error: stockError } = await supabase
  .from("stock")
  .select("*")
  .eq("service_id", metadata.serviceId)
  .eq("is_used", false)
  .limit(1)
  .single();

if (stockError || !stock) {
  return NextResponse.json(
    {
      status: false,
      message: "This product is currently out of stock.",
    },
    {
      status: 400,
    }
  );
}
  const { error } = await supabase
    .from("order")
    .insert({
     user_id: metadata.userId,
      customer_name: metadata.customerName,
      whatsapp_number: metadata.whatsappNumber,
      email: metadata.email,
      service_id: metadata.serviceId,
      amount: verifyData.data.amount / 100,
      payment_reference: reference,
      payment_status: "paid",
      payment_method: "paystack",
      order_status: "pending",
      note: metadata.note,
      order_content: orderContent,
      delivered_stock: stock.stock_data,
    });

  if (error) {
  console.error("SUPABASE INSERT ERROR:", error);

  return NextResponse.json(
    {
      status: false,
      message: error.message,
      error,
    },
    {
      status: 500,
    }
  );
}
const { error: updateError } = await supabase
  .from("stock")
  .update({
    is_used: true,
  })
  .eq("id", stock.id);

if (updateError) {
  console.error(updateError);
}
  return NextResponse.json({
    status: true,
    message: "Order created successfully.",
  });
}