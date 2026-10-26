
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_COLUMNS = [
  "id",
  "provider_service_id",
  "name",
  "category",
  "service_type",
  "provider_rate",
  "retail_rate",
  "pricing_mode",
  "markup_percent",
  "currency",
  "min_quantity",
  "max_quantity",
  "supports_refill",
  "supports_cancel",
  "is_enabled",
  "provider_available",
  "last_synced_at",
].join(",");

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Please sign in to continue." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("SMM admin authorization lookup failed:", error.message);
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Unable to verify administrator access." },
        { status: 500 }
      ),
    };
  }

  if (profile?.is_admin !== true) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true as const };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const params = request.nextUrl.searchParams;
    const page = Math.max(
      0,
      Number.parseInt(params.get("page") || "0", 10) || 0
    );
    const requestedLimit = Number.parseInt(params.get("limit") || "50", 10);
    const limit = Math.min(
      100,
      Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 50)
    );

    const search = (params.get("search") || "").trim().slice(0, 120);
    const category = params.get("category") || "all";
    const availability = params.get("availability") || "all";
    const enabled = params.get("enabled") || "all";
    const pricingMode = params.get("pricingMode") || "all";

    let query = supabaseAdmin
      .from("smm_services")
      .select(SERVICE_COLUMNS, { count: "exact" });

    if (search) {
      const safeSearch = search.replace(/[,%()]/g, " ").trim();
      if (safeSearch) {
        query = query.or(
          `name.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%,provider_service_id.ilike.%${safeSearch}%`
        );
      }
    }

    if (category !== "all") query = query.eq("category", category);

    if (availability === "available") {
      query = query.eq("provider_available", true);
    } else if (availability === "unavailable") {
      query = query.eq("provider_available", false);
    }

    if (enabled === "enabled") {
      query = query.eq("is_enabled", true);
    } else if (enabled === "disabled") {
      query = query.eq("is_enabled", false);
    }

    if (pricingMode === "automatic" || pricingMode === "manual") {
      query = query.eq("pricing_mode", pricingMode);
    }

    const { data, error, count } = await query
      .order("name", { ascending: true })
      .range(page * limit, page * limit + limit - 1);

    if (error) {
      console.error("SMM service listing failed:", error.message);
      return NextResponse.json(
        { error: "Unable to load SMM services." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      services: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("SMM GET route failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while loading services." },
      { status: 500 }
    );
  }
}

/**
 * Bulk-enable all services currently available from the provider.
 * Only changes is_enabled; prices and quantity limits are untouched.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (body.action !== "enable_all_available") {
      return NextResponse.json(
        { error: "Unsupported bulk action." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("smm_services")
      .update({ is_enabled: true })
      .eq("provider_available", true)
      .eq("is_enabled", false)
      .select("id");

    if (error) {
      console.error("Bulk-enable SMM services failed:", error.message);
      return NextResponse.json(
        { error: "Unable to enable available SMM services." },
        { status: 500 }
      );
    }

    const enabledCount = data?.length ?? 0;

    return NextResponse.json({
      success: true,
      enabledCount,
      message: `${enabledCount} available services enabled successfully.`,
    });
  } catch (error) {
    console.error("SMM bulk-enable route failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while enabling services." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        { error: "A service ID is required." },
        { status: 400 }
      );
    }

    const allowedFields = [
      "is_enabled",
      "pricing_mode",
      "markup_percent",
      "manual_retail_rate",
    ];

    const suppliedFields = allowedFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(body, field)
    );

    if (suppliedFields.length === 0) {
      return NextResponse.json(
        { error: "No supported changes were provided." },
        { status: 400 }
      );
    }

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("smm_services")
      .select(
        "id,provider_rate,retail_rate,pricing_mode,markup_percent,is_enabled,provider_available"
      )
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error("SMM service lookup failed:", lookupError.message);
      return NextResponse.json(
        { error: "Unable to load the selected service." },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Service not found." },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(body, "is_enabled")) {
      if (typeof body.is_enabled !== "boolean") {
        return NextResponse.json(
          { error: "is_enabled must be true or false." },
          { status: 400 }
        );
      }

      if (body.is_enabled && !existing.provider_available) {
        return NextResponse.json(
          {
            error:
              "This service is unavailable from the provider and cannot be enabled.",
          },
          { status: 409 }
        );
      }

      updates.is_enabled = body.is_enabled;
    }

    const nextMode = Object.prototype.hasOwnProperty.call(
      body,
      "pricing_mode"
    )
      ? body.pricing_mode
      : existing.pricing_mode;

    if (nextMode !== "automatic" && nextMode !== "manual") {
      return NextResponse.json(
        { error: "Pricing mode must be automatic or manual." },
        { status: 400 }
      );
    }

    const markupProvided = Object.prototype.hasOwnProperty.call(
      body,
      "markup_percent"
    );

    const markup = markupProvided
      ? Number(body.markup_percent)
      : Number(existing.markup_percent ?? 50);

    if (!Number.isFinite(markup) || markup < 0 || markup > 1000) {
      return NextResponse.json(
        { error: "Markup must be between 0 and 1000 percent." },
        { status: 400 }
      );
    }

    const pricingChange =
      Object.prototype.hasOwnProperty.call(body, "pricing_mode") ||
      markupProvided ||
      Object.prototype.hasOwnProperty.call(body, "manual_retail_rate");

    if (pricingChange) {
      const providerRate = Number(existing.provider_rate);

      if (!Number.isFinite(providerRate) || providerRate < 0) {
        return NextResponse.json(
          { error: "The provider rate is invalid for this service." },
          { status: 422 }
        );
      }

      updates.pricing_mode = nextMode;
      updates.markup_percent = markup;

      if (nextMode === "automatic") {
        updates.retail_rate = Number(
          (providerRate * (1 + markup / 100)).toFixed(4)
        );
      } else {
        const manualPriceProvided = Object.prototype.hasOwnProperty.call(
          body,
          "manual_retail_rate"
        );

        if (manualPriceProvided) {
          const manualPrice = Number(body.manual_retail_rate);

          if (
            body.manual_retail_rate === "" ||
            body.manual_retail_rate === null ||
            !Number.isFinite(manualPrice) ||
            manualPrice < 0
          ) {
            return NextResponse.json(
              { error: "Enter a valid manual retail price in NGN." },
              { status: 400 }
            );
          }

          updates.retail_rate = Number(manualPrice.toFixed(4));
        } else if (nextMode !== existing.pricing_mode) {
          return NextResponse.json(
            {
              error:
                "Enter a manual retail price when switching to manual pricing.",
            },
            { status: 400 }
          );
        }
      }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("smm_services")
      .update(updates)
      .eq("id", id)
      .select(SERVICE_COLUMNS)
      .single();

    if (updateError) {
      console.error("SMM service update failed:", updateError.message);
      return NextResponse.json(
        { error: "Unable to save the service changes." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "SMM service updated successfully.",
      service: updated,
    });
  } catch (error) {
    console.error("SMM PATCH route failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving the service." },
      { status: 500 }
    );
  }
}
