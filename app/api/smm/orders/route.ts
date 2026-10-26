
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReservationResult = {
  success?: boolean;
  duplicate?: boolean;
  order_id?: string;
  status?: string;
  charge?: number | string;
  error?: string;
  message?: string;
};

type ProviderResponse = {
  order?: string | number;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

type ProviderOrderStatus = {
  charge?: string | number;
  start_count?: string | number;
  status?: string;
  remains?: string | number;
  currency?: string;
  error?: string;
};

type ProviderMultiStatusResponse = Record<
  string,
  ProviderOrderStatus
>;

type LocalOrder = {
  id: string;
  service_id: string;
  target_url: string;
  quantity: number;
  retail_charge: number;
  status: string;
  created_at: string;
  provider_order_id: string | null;
  refund_amount: number | null;
};

function jsonError(
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json(
    { success: false, error: message, ...extra },
    { status },
  );
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function validTargetUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.includes(".") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function safeProviderError(value: unknown): string {
  if (typeof value !== "string") {
    return "The provider did not confirm the order.";
  }

  return value.slice(0, 500);
}

async function markManualReview(
  orderId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("smm_orders")
    .update({
      status: "manual_review",
      last_error: reason.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "submitting");

  if (error) {
    console.error("Could not mark SMM order for manual review:", {
      orderId,
      error: error.message,
    });
  }
}

/**
 * Translate provider statuses into the local status vocabulary.
 * Unknown statuses are deliberately ignored.
 */
function mapProviderStatus(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[ _-]+/g, " ");

  switch (normalized) {
    case "pending":
    case "awaiting":
      return "pending";

    case "in progress":
    case "processing":
    case "running":
      return "processing";

    case "completed":
    case "complete":
    case "success":
      return "completed";

    case "partial":
      return "partial";

    case "canceled":
    case "cancelled":
      return "cancelled";

    case "failed":
    case "error":
      return "failed";

    default:
      return null;
  }
}

function getSafeProviderUrl(): URL | null {
  const providerUrl =
    process.env.SMM_PROVIDER_API_URL ??
    "https://reallysimplesocial.com/api/v2";

  try {
    const parsed = new URL(providerUrl);

    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "reallysimplesocial.com" ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isTerminalStatus(status: string): boolean {
  return [
    "completed",
    "cancelled",
    "canceled",
    "failed",
    "refunded",
  ].includes(status.toLowerCase());
}

/**
 * Fetch status updates from RealSocialSimple in batches of up to 100.
 *
 * This function does not refund orders. Provider status changes only update
 * the order status field; refund processing must remain a separate,
 * idempotent operation.
 */
async function syncProviderStatuses(
  orders: Array<{
    id: string;
    provider_order_id: string | null;
    status: string;
  }>,
  userId: string,
): Promise<void> {
  const providerKey = process.env.SMM_PROVIDER_API_KEY;
  const providerUrl = getSafeProviderUrl();

  if (!providerKey || !providerUrl) {
    return;
  }

  const eligibleOrders = orders.filter((order) => {
    const providerId = order.provider_order_id?.trim();
    const status = String(order.status ?? "").toLowerCase();

    return (
      Boolean(providerId) &&
      !isTerminalStatus(status) &&
      status !== "manual_review" &&
      status !== "submitting"
    );
  });

  for (let index = 0; index < eligibleOrders.length; index += 100) {
    const batch = eligibleOrders.slice(index, index + 100);

    const providerIds = batch.map((order) =>
      String(order.provider_order_id).trim(),
    );

    const form = new URLSearchParams({
      key: providerKey,
      action: "status",
      orders: providerIds.join(","),
    });

    let response: Response;

    try {
      response = await fetch(providerUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: form.toString(),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
    } catch (error) {
      console.error("SMM provider status request failed:", error);
      continue;
    }

    if (!response.ok) {
      console.error(
        "SMM provider status request returned HTTP",
        response.status,
      );
      continue;
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      console.error("SMM provider status response was not valid JSON.");
      continue;
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      console.error(
        "SMM provider status response had an unexpected shape.",
      );
      continue;
    }

    const statusResults = payload as ProviderMultiStatusResponse;

    for (const order of batch) {
      const providerId = String(order.provider_order_id).trim();
      const result = statusResults[providerId];

      // A missing result or individual provider error must not change
      // the existing order status.
      if (
        !result ||
        typeof result !== "object" ||
        typeof result.error === "string"
      ) {
        continue;
      }

      const mappedStatus = mapProviderStatus(result.status);

      if (!mappedStatus || mappedStatus === order.status) {
        continue;
      }

      if (isTerminalStatus(order.status)) {
        continue;
      }

      // Match the local order ID, authenticated user, and provider ID.
      // This prevents updates to unrelated orders.
      const { data: updatedRows, error: updateError } =
        await supabaseAdmin
          .from("smm_orders")
          .update({
            status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
          .eq("user_id", userId)
          .eq("provider_order_id", providerId)
          .select("id");

      if (updateError) {
        console.error("Could not sync SMM provider status:", {
          orderId: order.id,
          providerOrderId: providerId,
          error: updateError.message,
        });
      } else if (updatedRows && updatedRows.length > 0) {
        order.status = mappedStatus;
      }
    }
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError(
        "Please sign in to view your orders.",
        401,
      );
    }

    const { data: orders, error: ordersError } =
      await supabaseAdmin
        .from("smm_orders")
        .select(
          "id, service_id, target_url, quantity, retail_charge, status, created_at, provider_order_id, refund_amount",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

    if (ordersError) {
      console.error(
        "SMM order history query failed:",
        ordersError.message,
      );

      return jsonError("Could not load your orders.", 500);
    }

    // Refresh provider statuses before returning the history.
    // If the provider is unavailable, the previous saved statuses remain.
    await syncProviderStatuses(
      (orders ?? []).map((order) => ({
        id: String(order.id),
        provider_order_id:
          order.provider_order_id == null
            ? null
            : String(order.provider_order_id),
        status: String(order.status ?? ""),
      })),
      user.id,
    );

    // Re-read from Supabase so the response includes any updates.
    const {
      data: refreshedOrders,
      error: refreshedOrdersError,
    } = await supabaseAdmin
      .from("smm_orders")
      .select(
        "id, service_id, target_url, quantity, retail_charge, status, created_at, provider_order_id, refund_amount",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (refreshedOrdersError) {
      console.error(
        "SMM order history refresh failed:",
        refreshedOrdersError.message,
      );

      return jsonError("Could not refresh your orders.", 500);
    }

    const serviceIds = [
      ...new Set(
        (refreshedOrders ?? []).map((order) => order.service_id),
      ),
    ];

    let serviceNames: Record<string, string> = {};

    if (serviceIds.length > 0) {
      const {
        data: services,
        error: servicesError,
      } = await supabaseAdmin
        .from("smm_services")
        .select("id, name")
        .in("id", serviceIds);

      if (servicesError) {
        console.error(
          "SMM service names query failed:",
          servicesError.message,
        );
      } else {
        serviceNames = Object.fromEntries(
          (services ?? []).map((service) => [
            service.id,
            service.name,
          ]),
        );
      }
    }

    return NextResponse.json({
      success: true,
      orders: (refreshedOrders ?? []).map((order) => ({
        ...order,
        service_name:
          serviceNames[order.service_id] ??
          "Social media service",
      })),
    });
  } catch (error) {
    console.error("SMM order history failed:", error);

    return jsonError(
      "An unexpected error occurred.",
      500,
    );
  }
}

export async function POST(request: Request) {
  let orderId: string | null = null;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError(
        "Please sign in before placing an order.",
        401,
      );
    }

    let body: {
      serviceId?: unknown;
      idempotencyKey?: unknown;
      targetUrl?: unknown;
      quantity?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return jsonError(
        "The request body must be valid JSON.",
        400,
      );
    }

    const serviceId = body.serviceId;
    const idempotencyKey = body.idempotencyKey;
    const targetUrl = body.targetUrl;
    const quantity = body.quantity;

    if (
      !isUuid(serviceId) ||
      !isUuid(idempotencyKey) ||
      !validTargetUrl(targetUrl) ||
      typeof quantity !== "number" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return jsonError(
        "Please check the service, URL, and quantity.",
        400,
      );
    }

    const providerUrl =
      process.env.SMM_PROVIDER_API_URL ??
      "https://reallysimplesocial.com/api/v2";

    const providerKey = process.env.SMM_PROVIDER_API_KEY;

    let parsedProviderUrl: URL;

    try {
      parsedProviderUrl = new URL(providerUrl);
    } catch {
      return jsonError(
        "The SMM provider configuration is invalid.",
        500,
      );
    }

    if (
      !providerKey ||
      parsedProviderUrl.protocol !== "https:" ||
      parsedProviderUrl.hostname !== "reallysimplesocial.com" ||
      parsedProviderUrl.username ||
      parsedProviderUrl.password
    ) {
      return jsonError(
        "The SMM provider is not configured safely.",
        500,
      );
    }

    const {
      data: service,
      error: serviceError,
    } = await supabaseAdmin
      .from("smm_services")
      .select(
        "id, provider_service_id, is_enabled, provider_available, min_quantity, max_quantity",
      )
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError) {
      console.error(
        "SMM service lookup failed:",
        serviceError.message,
      );

      return jsonError(
        "Could not verify the selected service.",
        500,
      );
    }

    if (
      !service ||
      !service.is_enabled ||
      !service.provider_available ||
      service.provider_service_id == null
    ) {
      return jsonError(
        "This service is currently unavailable. Please choose another service.",
        409,
      );
    }

    if (
      quantity < Number(service.min_quantity) ||
      quantity > Number(service.max_quantity)
    ) {
      return jsonError(
        "The quantity is outside this service's limits.",
        400,
      );
    }

    // Must use the customer's JWT because the SQL function uses auth.uid().
    const {
      data: reservationData,
      error: reservationError,
    } = await supabase.rpc("reserve_smm_wallet_order", {
      p_service_id: serviceId,
      p_idempotency_key: idempotencyKey,
      p_target_url: targetUrl,
      p_quantity: quantity,
    });

    if (reservationError) {
      console.error("SMM wallet reservation failed:", {
        code: reservationError.code,
        message: reservationError.message,
      });

      const message = reservationError.message.toLowerCase();

      if (message.includes("insufficient wallet balance")) {
        return jsonError(
          "Your wallet balance is insufficient.",
          400,
        );
      }

      if (
        message.includes("service unavailable") ||
        message.includes("quantity outside")
      ) {
        return jsonError(
          "The service is unavailable or the quantity is invalid.",
          409,
        );
      }

      if (
        message.includes("idempotency key reused") ||
        message.includes("invalid order details")
      ) {
        return jsonError(
          "The order request is invalid. Please refresh and try again.",
          400,
        );
      }

      return jsonError(
        "We could not reserve your order. No provider request was sent.",
        500,
      );
    }

    const reservation = (
      Array.isArray(reservationData)
        ? reservationData[0]
        : reservationData
    ) as ReservationResult | null;

    if (
      !reservation ||
      reservation.success !== true ||
      !isUuid(reservation.order_id)
    ) {
      console.error(
        "Unexpected SMM reservation response:",
        reservationData,
      );

      return jsonError(
        "The reservation result could not be verified. Please check your recent orders.",
        500,
      );
    }

    orderId = reservation.order_id;

    // Never submit a previously recorded request to the provider again.
    if (
      reservation.duplicate === true ||
      reservation.status !== "submitting"
    ) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        orderId,
        status: reservation.status,
        charge: reservation.charge,
        message:
          "This order request was already recorded. Check your recent orders for its current status.",
      });
    }

    const providerForm = new URLSearchParams({
      key: providerKey,
      action: "add",
      service: String(service.provider_service_id),
      link: targetUrl,
      quantity: String(quantity),
    });

    let providerHttpResponse: Response;

    try {
      providerHttpResponse = await fetch(
        parsedProviderUrl.toString(),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: providerForm.toString(),
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        },
      );
    } catch (error) {
      const reason =
        error instanceof Error
          ? `Provider request outcome uncertain: ${error.message}`
          : "Provider request outcome uncertain.";

      await markManualReview(orderId, reason);

      return NextResponse.json(
        {
          success: false,
          orderId,
          status: "manual_review",
          message:
            "We could not confirm the provider's response. Your reserved funds have not been refunded automatically. Please check your order status before trying again.",
        },
        { status: 202 },
      );
    }

    let providerResponse: ProviderResponse;

    try {
      providerResponse = JSON.parse(
        await providerHttpResponse.text(),
      ) as ProviderResponse;
    } catch {
      await markManualReview(
        orderId,
        `Provider returned an unreadable response (HTTP ${providerHttpResponse.status}).`,
      );

      return NextResponse.json(
        {
          success: false,
          orderId,
          status: "manual_review",
          message:
            "The provider response could not be verified. Your reserved funds have not been refunded automatically.",
        },
        { status: 202 },
      );
    }

    if (
      providerHttpResponse.ok &&
      (typeof providerResponse.order === "string" ||
        typeof providerResponse.order === "number") &&
      String(providerResponse.order).trim().length > 0
    ) {
      const providerOrderId = String(
        providerResponse.order,
      );

      const { error: finalizeError } =
        await supabaseAdmin.rpc(
          "finalize_smm_wallet_order",
          {
            p_order_id: orderId,
            p_provider_order_id: providerOrderId,
          },
        );

      if (finalizeError) {
        console.error("SMM order finalization failed:", {
          orderId,
          providerOrderId,
          message: finalizeError.message,
        });

        await markManualReview(
          orderId,
          `Provider accepted order ${providerOrderId}, but database finalization failed.`,
        );

        return NextResponse.json(
          {
            success: false,
            orderId,
            status: "manual_review",
            message:
              "The provider accepted the order, but we could not finish recording it. Please do not submit it again; support will review it.",
          },
          { status: 202 },
        );
      }

      return NextResponse.json({
        success: true,
        orderId,
        status: "pending",
        charge: reservation.charge,
        message:
          "Your order has been submitted successfully.",
      });
    }

    // Do not assume a provider error proves rejection.
    // Keep reserved funds untouched until the outcome is verified.
    const providerReason = safeProviderError(
      providerResponse.error ?? providerResponse.message,
    );

    await markManualReview(
      orderId,
      `Provider did not return a confirmed order ID (HTTP ${providerHttpResponse.status}): ${providerReason}`,
    );

    return NextResponse.json(
      {
        success: false,
        orderId,
        status: "manual_review",
        message:
          "The provider did not confirm this order. Your funds remain reserved while we verify the outcome. Please do not submit the same order again.",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("SMM order submission failed:", error);

    if (orderId) {
      await markManualReview(
        orderId,
        "Unexpected error while processing the provider order. Outcome requires review.",
      );
    }

    return jsonError(
      orderId
        ? "The order outcome is uncertain. Please check your recent orders before trying again."
        : "An unexpected error occurred. No provider request was confirmed.",
      orderId ? 202 : 500,
      orderId
        ? { orderId, status: "manual_review" }
        : {},
    );
  }
}
