import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const allowedPages = new Set([
  "/",
  "/services",
  "/login",
  "/signup",
  "/register",
  "/dashboard",
  "/profile",
  "/order-history",
]);

export async function POST(request: Request) {
  try {
    if (!supabase) {
      console.error("Visit tracking is missing Supabase server credentials.");

      return NextResponse.json(
        { error: "Visit tracking is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.visitorId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.visitorId
      ) ||
      typeof body.pagePath !== "string" ||
      body.pagePath.length > 500 ||
      !body.pagePath.startsWith("/") ||
      body.pagePath.startsWith("//") ||
      body.pagePath.includes("?") ||
      body.pagePath.includes("#")
    ) {
      return NextResponse.json(
        { error: "Invalid visit data." },
        { status: 400 }
      );
    }

    const pagePath = body.pagePath;

    if (
      pagePath.startsWith("/admin") ||
      pagePath.startsWith("/api") ||
      pagePath.startsWith("/auth") ||
      pagePath.startsWith("/_next")
    ) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("site_visits").insert({
      visitor_id: body.visitorId,
      page_path: pagePath,
    });

    if (error) {
      console.error("Failed to record site visit:", error.message);

      return NextResponse.json(
        { error: "Unable to record visit." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}