import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
  service_id,
  stock_data,
} = body;

    const { error } = await supabase
  .from("stock")
  .insert({
    service_id,
    stock_data,
    is_used: false,
  });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          status: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Stock saved successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        status: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}