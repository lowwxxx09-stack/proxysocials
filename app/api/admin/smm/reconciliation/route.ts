
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status },
  );
}

export async function GET() {
  try {
    // Verify the signed-in user's session.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError("Please sign in.", 401);
    }

    // Only administrators can view customer order details.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("SMM reconciliation admin check failed:", profileError.message);
      return jsonError("Unable to verify admin access.", 500);
    }

    if (profile?.is_admin !== true) {
      return jsonError("Admin access required.", 403);
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("smm_orders")
      .select(
        "id, user_id, service_id, target_url, quantity, retail_charge, provider_cost, provider_order_id, status, last_error, refund_amount, created_at, updated_at",
      )
      .eq("status", "manual_review")
      .order("created_at", { ascending: false })
      .limit(200);

    if (ordersError) {
      console.error("SMM reconciliation order query failed:", ordersError.message);
      return jsonError("Unable to load SMM orders.", 500);
    }

    const orderList = orders ?? [];

    const serviceIds = [
      ...new Set(orderList.map((order) => order.service_id)),
    ];

    const userIds = [
      ...new Set(orderList.map((order) => order.user_id)),
    ];

    const serviceNames: Record<string, string> = {};
    const customerEmails: Record<string, string> = {};

    if (serviceIds.length > 0) {
      const { data: services, error: servicesError } = await supabaseAdmin
        .from("smm_services")
        .select("id, name")
        .in("id", serviceIds);

      if (servicesError) {
        console.error(
          "SMM reconciliation service lookup failed:",
          servicesError.message,
        );
        return jsonError("Unable to load SMM service details.", 500);
      }

      for (const service of services ?? []) {
        serviceNames[service.id] = service.name;
      }
    }

    // Fetch only the customer accounts referenced by these orders.
    // Supabase Auth admin listing is paginated, so do not assume the
    // first page contains every customer.
    for (const userId of userIds) {
      const { data: account, error: accountError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (accountError) {
        console.error("Could not resolve SMM customer account:", {
          userId,
          message: accountError.message,
        });
        customerEmails[userId] = "Email unavailable";
      } else {
        customerEmails[userId] =
          account.user.email ?? "Email unavailable";
      }
    }

    return NextResponse.json(
      {
        success: true,
        orders: orderList.map((order) => ({
          ...order,
          service_name: serviceNames[order.service_id] ?? "SMM service",
          customer_email:
            customerEmails[order.user_id] ?? "Email unavailable",
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("SMM reconciliation endpoint failed:", error);
    return jsonError("An unexpected error occurred.", 500);
  }
}
