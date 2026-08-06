import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const stockRows = body.stockRows;

    if (!stockRows || !Array.isArray(stockRows)) {
      return NextResponse.json(
        {
          status: false,
          message: "No stock data received.",
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabase
      .from("stock")
      .insert(stockRows);

      console.log("STOCK ROWS:", stockRows);

      // Automatically update available_stock
const serviceIds = [...new Set(stockRows.map((row) => row.service_id))];

for (const serviceId of serviceIds) {
  const { count } = await supabase
    .from("stock")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId)
    .eq("status", "available");

  await supabase
    .from("services")
    .update({
      available_stock: count || 0,
    })
    .eq("id", serviceId);
}

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          status: false,
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Stock uploaded successfully.",
      }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        status: false,
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}