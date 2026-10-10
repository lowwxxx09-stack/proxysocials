import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  createServerClient,
} from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseSecret =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const flutterwaveSecret = process.env.FLW_SECRET_KEY;

const MAX_QUANTITY = 99;

export async function POST(request: Request) {
  try {
    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseSecret ||
      !flutterwaveSecret
    ) {
      console.error("Payment environment variables are missing.");

      return NextResponse.json(
        {
          status: false,
          message: "Payment service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    // Authenticate the user through the existing Supabase session.
    const cookieStore = await cookies();

    const supabaseAuth = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Cookie writes may not be available in every server context.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          status: false,
          message: "Please sign in before making a payment.",
        },
        { status: 401 }
      );
    }

    const admin = createSupabaseAdmin(
      supabaseUrl,
      supabaseSecret,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const body = await request.json();

    const {
      email,
      amount,
      customerName,
      whatsappNumber,
      serviceId,
      note,
      userId,
      orderContent,
    } = body;

    // Never trust a user ID supplied by the browser.
    if (userId && userId !== user.id) {
      return NextResponse.json(
        {
          status: false,
          message: "Your account could not be verified.",
        },
        { status: 403 }
      );
    }

    const paymentEmail =
      typeof user.email === "string" ? user.email.trim() : "";

    if (
      !paymentEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentEmail)
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Your account must have a valid email address to make a payment.",
        },
        { status: 400 }
      );
    }

    if (
      typeof email === "string" &&
      email.trim().toLowerCase() !== paymentEmail.toLowerCase()
    ) {
      return NextResponse.json(
        {
          status: false,
          message: "Your payment email does not match your account.",
        },
        { status: 400 }
      );
    }

    const paymentType = serviceId ? "order" : "wallet";

    let numericAmount: number;
    let quantity = 1;
    let servicePrice: number | null = null;
    let verifiedServiceId: string | null = null;

    if (paymentType === "order") {
      if (
        typeof serviceId !== "string" ||
        !serviceId.trim()
      ) {
        return NextResponse.json(
          {
            status: false,
            message: "A valid service is required.",
          },
          { status: 400 }
        );
      }

      quantity = Number(orderContent?.quantity ?? 1);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_QUANTITY
      ) {
        return NextResponse.json(
          {
            status: false,
            message:
              `Quantity must be a whole number between 1 and ${MAX_QUANTITY}.`,
          },
          { status: 400 }
        );
      }

      const { data: service, error: serviceError } = await admin
        .from("services")
        .select("id, price, is_active")
        .eq("id", serviceId)
        .single();

      if (serviceError || !service) {
        return NextResponse.json(
          {
            status: false,
            message: "Service not found.",
          },
          { status: 404 }
        );
      }

      if (service.is_active !== true) {
        return NextResponse.json(
          {
            status: false,
            message: "This service is currently unavailable.",
          },
          { status: 400 }
        );
      }

      servicePrice = Number(service.price);

      if (
        !Number.isFinite(servicePrice) ||
        servicePrice <= 0
      ) {
        return NextResponse.json(
          {
            status: false,
            message: "This service has an invalid price.",
          },
          { status: 400 }
        );
      }

      const {
        count: availableStock,
        error: stockError,
      } = await admin
        .from("stock")
        .select("id", { count: "exact", head: true })
        .eq("service_id", serviceId)
        .eq("is_used", false)
        .eq("status", "available")
        .is("assigned_to", null);

      if (stockError) {
        console.error("Stock check failed:", stockError);

        return NextResponse.json(
          {
            status: false,
            message:
              "Unable to verify available stock. Please try again.",
          },
          { status: 500 }
        );
      }

      if ((availableStock ?? 0) < quantity) {
        return NextResponse.json(
          {
            status: false,
            message:
              `Only ${availableStock ?? 0} account(s) are currently available.`,
          },
          { status: 400 }
        );
      }

      numericAmount =
        Math.round(servicePrice * quantity * 100) / 100;

      verifiedServiceId = service.id;
    } else {
      numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return NextResponse.json(
          {
            status: false,
            message: "Enter a valid wallet funding amount.",
          },
          { status: 400 }
        );
      }

      numericAmount = Math.round(numericAmount * 100) / 100;

      if (numericAmount <= 0) {
        return NextResponse.json(
          {
            status: false,
            message: "Enter a valid wallet funding amount.",
          },
          { status: 400 }
        );
      }
    }

    const txRef =
      `PROXY-${paymentType.toUpperCase()}-${Date.now()}-` +
      crypto.randomBytes(8).toString("hex");

    // Save the expected payment details on the server.
    const { error: intentError } = await admin
      .from("payment_intents")
      .insert({
        tx_ref: txRef,
        user_id: user.id,
        payment_type: paymentType,
        amount: numericAmount,
        currency: "NGN",
        service_id: verifiedServiceId,
        quantity,
        status: "pending",
      });

    if (intentError) {
      console.error("Payment intent creation failed:", intentError);

      return NextResponse.json(
        {
          status: false,
          message:
            "Unable to prepare your payment. Please try again.",
        },
        { status: 500 }
      );
    }

    const meta = {
      payment_type: paymentType,
      customerName:
        typeof customerName === "string" ? customerName : "",
      whatsappNumber:
        typeof whatsappNumber === "string"
          ? whatsappNumber
          : "",
      serviceId: verifiedServiceId || "",
      note: typeof note === "string" ? note : "",
      email: paymentEmail,
      amount: numericAmount,
      userId: user.id,
      orderContent:
        paymentType === "order" ? { quantity } : {},
      ...(servicePrice !== null ? { servicePrice } : {}),
    };

    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!configuredSiteUrl) {
      console.error("NEXT_PUBLIC_SITE_URL is missing.");

      await admin
        .from("payment_intents")
        .update({ status: "failed" })
        .eq("tx_ref", txRef);

      return NextResponse.json(
        {
          status: false,
          message: "Payment service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const siteUrl = configuredSiteUrl.replace(/\/+$/, "");

    const response = await fetch(
      "https://api.flutterwave.com/v3/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${flutterwaveSecret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          tx_ref: txRef,
          amount: numericAmount,
          currency: "NGN",
          redirect_url: `${siteUrl}/payment/callback`,
          payment_options:
            "card, banktransfer, ussd, account, internetbanking, nqr, enaira, opay",
          customer: {
            email: paymentEmail,
            name:
              typeof customerName === "string" &&
              customerName.trim()
                ? customerName.trim()
                : undefined,
            phonenumber:
              typeof whatsappNumber === "string" &&
              whatsappNumber.trim()
                ? whatsappNumber.trim()
                : undefined,
          },
          meta,
          customizations: {
            title: "ProxySocials",
            description:
              paymentType === "wallet"
                ? "Fund your ProxySocials wallet"
                : `Payment for ${quantity} account(s) on ProxySocials`,
          },
        }),
      }
    );

    const data = await response.json();

    if (
      !response.ok ||
      data.status !== "success" ||
      !data.data?.link
    ) {
      console.error("Flutterwave initialization failed:", data);

      await admin
        .from("payment_intents")
        .update({ status: "failed" })
        .eq("tx_ref", txRef);

      return NextResponse.json(
        {
          status: false,
          message:
            data.message ||
            "Unable to initialize Flutterwave payment.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Payment initialized successfully.",
      data: {
        link: data.data.link,
        tx_ref: txRef,
      },
    });
  } catch (error) {
    console.error("Flutterwave Initialize Error:", error);

    return NextResponse.json(
      {
        status: false,
        message: "Unable to initialize payment.",
      },
      { status: 500 }
    );
  }
}