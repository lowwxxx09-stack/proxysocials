
import "server-only";

export type ProviderService = {
  service: string | number;
  name: string;
  category?: string;
  type?: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  refill?: boolean | string | number;
  cancel?: boolean | string | number;
};

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" ||
    value === "true";
}

function asNumber(value: unknown, field: string): number {
  const result = Number(value);

  if (!Number.isFinite(result) || result < 0) {
    throw new Error(`Invalid provider service field: ${field}`);
  }

  return result;
}

export function normalizeProviderService(
  raw: ProviderService
) {
  if (
    raw.service === undefined ||
    raw.service === null ||
    !String(raw.service).trim() ||
    typeof raw.name !== "string" ||
    !raw.name.trim()
  ) {
    throw new Error("Provider returned a service without an ID or name.");
  }

  return {
    provider_service_id: String(raw.service),
    name: raw.name.trim(),
    category:
      typeof raw.category === "string" ? raw.category.trim() : null,
    description: null,
    service_type:
      typeof raw.type === "string" ? raw.type.trim() : null,
    provider_rate: asNumber(raw.rate, "rate"),
    min_quantity: Math.floor(asNumber(raw.min, "min")),
    max_quantity: Math.floor(asNumber(raw.max, "max")),
    supports_refill: asBoolean(raw.refill),
    supports_cancel: asBoolean(raw.cancel),
  };
}

export async function fetchProviderServices(): Promise<
  ProviderService[]
> {
  const apiUrl = process.env.SMM_PROVIDER_API_URL;
  const apiKey = process.env.SMM_PROVIDER_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "Missing SMM_PROVIDER_API_URL or SMM_PROVIDER_API_KEY."
    );
  }

  const endpoint = new URL(apiUrl);

  if (endpoint.protocol !== "https:") {
    throw new Error("The SMM provider endpoint must use HTTPS.");
  }

  const body = new URLSearchParams({
    key: apiKey,
    action: "services",
  });

  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
  const errorBody = (await response.text()).slice(0, 500);

  console.error("ReallySimpleSocial API error:", {
    status: response.status,
    body: errorBody,
  });

  throw new Error(
    `Provider service request failed with HTTP ${response.status}.`
  );
}

  const data: unknown = await response.json();

  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    !data.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        "service" in item &&
        "name" in item &&
        "rate" in item &&
        "min" in item &&
        "max" in item
    )
  ) {
    throw new Error(
      "Provider returned an empty or invalid service catalogue. " +
      "No services were changed."
    );
  }

  return data as ProviderService[];
}
