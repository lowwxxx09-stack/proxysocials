
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderOrderStatus = {
  charge?: string | number;
  start_count?: string | number;
  status?: string;
  remains?: string | number;
  currency?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: jsonError("Please sign in.", 401) };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.is_admin !== true) {
    return { error: jsonError("Admin access required.", 403) };
  }

  return { user };
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    let body: { orderId?: unknown };

    try {
      body = await request.json();
    } catch {
      return jsonError("Request body must be valid JSON.", 400);
    }

    const orderId = body.orderId;

    if (
      typeof orderId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        orderId,
      )
    ) {
      return jsonError("A valid SMM order ID is required.", 400);
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("smm_orders")
      .select("id, status, provider_order_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("SMM reconciliation lookup failed:", orderError.message);
      return jsonError("Could not load the SMM order.", 500);
    }

    if (!order) {
      return jsonError("SMM order not found.", 404);
    }

    if (order.status !== "manual_review") {
      return jsonError(
        "Only orders marked for manual review can be checked here.",
        409,
      );
    }

    if (!order.provider_order_id) {
      return NextResponse.json(
        {
          success: false,
          status: "manual_review",
          message:
            "No provider order ID is recorded. The provider outcome must be investigated manually.",
        },
        { status: 200 },
      );
    }

    const apiUrl =
      process.env.SMM_PROVIDER_API_URL ??
      "https://reallysimplesocial.com/api/v2";
    const apiKey = process.env.SMM_PROVIDER_API_KEY;

    let endpoint: URL;

    try {
      endpoint = new URL(apiUrl);
    } catch {
      return jsonError("Provider configuration is invalid.", 500);
    }

    if (
      !apiKey ||
      endpoint.protocol !== "https:" ||
      endpoint.hostname !== "reallysimplesocial.com" ||
      endpoint.username ||
      endpoint.password
    ) {
      return jsonError("Provider configuration is not safe.", 500);
    }

    const form = new URLSearchParams({
      key: apiKey,
      action: "status",
      order: order.provider_order_id,
    });

    let providerResponse: Response;

    try {
      providerResponse = await fetch(endpoint.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: form.toString(),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          status: "manual_review",
          message:
            "The provider could not be reached. No order or wallet changes were made.",
        },
        { status: 502 },
      );
    }

    let result: ProviderOrderStatus;

    try {
      result = (await providerResponse.json()) as ProviderOrderStatus;
    } catch {
      return NextResponse.json(
        {
          success: false,
          status: "manual_review",
          message:
            "The provider returned an unreadable response. No order or wallet changes were made.",
        },
        { status: 502 },
      );
    }

    if (!providerResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          status: "manual_review",
          message:
            "The provider status request failed. No order or wallet changes were made.",
        },
        { status: 502 },
      );
    }

    if (
      typeof result.status !== "string" ||
      !result.status.trim() ||
      result.error
    ) {
      return NextResponse.json(
        {
          success: false,
          status: "manual_review",
          message:
            "The provider did not return a recognizable order status. No order or wallet changes were made.",
        },
        { status: 502 },
      );
    }

    // This endpoint only reports the provider's response.
    // It intentionally does not change order status or wallet balances.
    return NextResponse.json({
      success: true,
      orderId: order.id,
      internalStatus: order.status,
      providerOrderId: order.provider_order_id,
      providerStatus: result.status,
      charge: result.charge ?? null,
      startCount: result.start_count ?? null,
      remains: result.remains ?? null,
      currency: result.currency ?? null,
      checkedAt: new Date().toISOString(),
      message:
        "Provider status retrieved. Review the result before taking any financial action.",
    });
  } catch (error) {
    console.error("SMM reconciliation request failed:", error);

    return jsonError("An unexpected reconciliation error occurred.", 500);
  }
}
