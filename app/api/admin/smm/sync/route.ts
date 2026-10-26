
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  fetchProviderServices,
  normalizeProviderService,
} from "@/lib/smm/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER_NAME = "ReallySimpleSocial";
const PROVIDER_URL = "https://reallysimplesocial.com/api/v2";
const BATCH_SIZE = 100;

type ExistingService = {
  id: string;
  provider_service_id: string;
  provider_rate: number | string;
  retail_rate: number | string | null;
  pricing_mode: "automatic" | "manual" | null;
  markup_percent: number | string | null;
  is_enabled: boolean;
};

function automaticRetailRate(
  providerRate: number,
  markupPercent: number
): number {
  return Number(
    (providerRate * (1 + markupPercent / 100)).toFixed(4)
  );
}

export async function POST() {
  let syncRunId: string | null = null;
  let providerId: string | null = null;

  try {
    // 1. Authenticate the current user.
    const authClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Verify administrator access.
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error("SMM admin lookup failed:", profileError.message);

      return NextResponse.json(
        { status: false, message: "Could not verify admin access." },
        { status: 500 }
      );
    }

    if (profile?.is_admin !== true) {
      return NextResponse.json(
        { status: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    // 3. Fetch and validate the complete provider catalogue first.
    const rawServices = await fetchProviderServices();
    const services = rawServices.map(normalizeProviderService);

    if (services.length === 0) {
      throw new Error("Provider returned no services.");
    }

    const seenIds = new Set<string>();

    for (const service of services) {
      if (seenIds.has(service.provider_service_id)) {
        throw new Error(
          `Duplicate provider service ID received: ${service.provider_service_id}`
        );
      }

      seenIds.add(service.provider_service_id);

      const rate = Number(service.provider_rate);

      if (!Number.isFinite(rate) || rate < 0) {
        throw new Error(
          `Invalid provider rate for service ${service.provider_service_id}.`
        );
      }
    }

    // 4. Find or create the provider record.
    const { data: existingProvider, error: providerLookupError } =
      await supabaseAdmin
        .from("smm_providers")
        .select("id")
        .eq("name", PROVIDER_NAME)
        .maybeSingle();

    if (providerLookupError) {
      throw new Error(
        `Provider lookup failed: ${providerLookupError.message}`
      );
    }

    if (existingProvider) {
      providerId = existingProvider.id;

      const { error } = await supabaseAdmin
        .from("smm_providers")
        .update({
          api_base_url: PROVIDER_URL,
          updated_at: new Date().toISOString(),
        })
        .eq("id", providerId);

      if (error) {
        throw new Error(`Provider update failed: ${error.message}`);
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from("smm_providers")
        .insert({
          name: PROVIDER_NAME,
          api_base_url: PROVIDER_URL,
          is_active: true,
        })
        .select("id")
        .single();

      if (error || !data) {
        throw new Error(
          `Provider creation failed: ${error?.message ?? "No provider returned"}`
        );
      }

      providerId = data.id;
    }

    // 5. Create a sync history record.
    const { data: run, error: runError } = await supabaseAdmin
      .from("smm_sync_runs")
      .insert({
        provider_id: providerId,
        status: "running",
        services_received: services.length,
      })
      .select("id")
      .single();

    if (runError || !run) {
      throw new Error(
        `Sync log creation failed: ${runError?.message ?? "No sync log returned"}`
      );
    }

    syncRunId = run.id;

    const now = new Date().toISOString();

    // 6. Fetch existing settings in batches of service IDs.
    // These settings must survive provider catalogue refreshes.
    const existingByProviderId = new Map<string, ExistingService>();

    for (let offset = 0; offset < services.length; offset += BATCH_SIZE) {
      const batch = services.slice(offset, offset + BATCH_SIZE);
      const batchIds = batch.map((service) => service.provider_service_id);

      const { data, error } = await supabaseAdmin
        .from("smm_services")
        .select(
          "id,provider_service_id,provider_rate,retail_rate,pricing_mode,markup_percent,is_enabled"
        )
        .eq("provider_id", providerId)
        .in("provider_service_id", batchIds);

      if (error) {
        throw new Error(
          `Existing service lookup failed: ${error.message}`
        );
      }

      for (const row of (data ?? []) as ExistingService[]) {
        existingByProviderId.set(row.provider_service_id, row);
      }
    }

    let added = 0;
    let updated = 0;
    let automaticPricesUpdated = 0;
    let manualPricesPreserved = 0;

    // 7. Build upserts while explicitly preserving existing settings.
    const rowsToSave = services.map((service) => {
      const existing = existingByProviderId.get(
        service.provider_service_id
      );

      const providerRate = Number(service.provider_rate);

      if (!existing) {
        added++;

        const defaultMarkup = 50;

        return {
          ...service,
          provider_id: providerId,
          provider_rate: providerRate,
          retail_rate: automaticRetailRate(providerRate, defaultMarkup),
          pricing_mode: "automatic" as const,
          markup_percent: defaultMarkup,
          currency: "NGN",
          is_enabled: false,
          provider_available: true,
          last_synced_at: now,
          created_at: now,
          updated_at: now,
        };
      }

      updated++;

      const pricingMode =
        existing.pricing_mode === "manual" ? "manual" : "automatic";

      const savedMarkup = Number(existing.markup_percent ?? 50);
      const markup =
        Number.isFinite(savedMarkup) && savedMarkup >= 0 && savedMarkup <= 1000
          ? savedMarkup
          : 50;

      let retailRate: number;

      if (pricingMode === "manual") {
        // Never replace a manually configured retail price.
        // If a legacy manual service has no retail price, leave it unset.
        retailRate =
          existing.retail_rate === null
            ? null as unknown as number
            : Number(existing.retail_rate);

        manualPricesPreserved++;
      } else {
        // Automatic prices track the newest provider rate and saved markup.
        retailRate = automaticRetailRate(providerRate, markup);
        automaticPricesUpdated++;
      }

      return {
        ...service,
        provider_id: providerId,
        provider_rate: providerRate,
        retail_rate: retailRate,
        pricing_mode: pricingMode,
        markup_percent: markup,
        currency: "NGN",
        is_enabled: existing.is_enabled,
        provider_available: true,
        last_synced_at: now,
        updated_at: now,
      };
    });

    // 8. Save in batches to reduce database round trips.
    for (
      let offset = 0;
      offset < rowsToSave.length;
      offset += BATCH_SIZE
    ) {
      const batch = rowsToSave.slice(offset, offset + BATCH_SIZE);

      const { error } = await supabaseAdmin
        .from("smm_services")
        .upsert(batch, {
          onConflict: "provider_id,provider_service_id",
          ignoreDuplicates: false,
        });

      if (error) {
        throw new Error(`Saving service batch failed: ${error.message}`);
      }
    }

    // 9. Mark provider services missing from the new catalogue unavailable.
    // Never delete their records or change their visibility setting here.
    const { data: existingProviderServices, error: existingServicesError } =
      await supabaseAdmin
        .from("smm_services")
        .select("id,provider_service_id")
        .eq("provider_id", providerId);

    if (existingServicesError) {
      throw new Error(
        `Could not check missing services: ${existingServicesError.message}`
      );
    }

    const missingIds = (existingProviderServices ?? [])
      .filter((item) => !seenIds.has(item.provider_service_id))
      .map((item) => item.id);

    for (let offset = 0; offset < missingIds.length; offset += BATCH_SIZE) {
      const batch = missingIds.slice(offset, offset + BATCH_SIZE);

      const { error } = await supabaseAdmin
        .from("smm_services")
        .update({
          provider_available: false,
          updated_at: now,
        })
        .eq("provider_id", providerId)
        .in("id", batch);

      if (error) {
        throw new Error(
          `Could not mark missing services unavailable: ${error.message}`
        );
      }
    }

    // 10. Record successful sync statistics.
    const { error: finishError } = await supabaseAdmin
      .from("smm_sync_runs")
      .update({
        status: "success",
        services_added: added,
        services_updated: updated,
        services_unavailable: missingIds.length,
        finished_at: new Date().toISOString(),
      })
      .eq("id", syncRunId);

    if (finishError) {
      throw new Error(`Could not finish sync log: ${finishError.message}`);
    }

    return NextResponse.json({
      status: true,
      message: "SMM catalogue synced successfully.",
      result: {
        received: services.length,
        added,
        updated,
        markedUnavailable: missingIds.length,
        automaticPricesUpdated,
        manualPricesPreserved,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("SMM catalogue sync failed:", message);

    if (syncRunId) {
      const { error: logError } = await supabaseAdmin
        .from("smm_sync_runs")
        .update({
          status: "failed",
          error_message: message.slice(0, 1000),
          finished_at: new Date().toISOString(),
        })
        .eq("id", syncRunId);

      if (logError) {
        console.error("Could not update SMM sync log:", logError.message);
      }
    }

    return NextResponse.json(
      {
        status: false,
        message: "SMM catalogue sync failed. Check server logs.",
      },
      { status: 500 }
    );
  }
}
