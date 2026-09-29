import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import forge from "node-forge";
import { DOMParser } from "xmldom";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function encryptWithTransactPayKey(
  plaintext: string,
  encodedKey: string
): string {
  try {
    const xml = Buffer.from(encodedKey, "base64").toString("utf8");

    const cleanedXml = xml.replace("4096!", "");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(
      cleanedXml,
      "text/xml"
    );

    const modulusNode =
      xmlDoc.getElementsByTagName("Modulus")[0];

    const exponentNode =
      xmlDoc.getElementsByTagName("Exponent")[0];

    if (!modulusNode || !exponentNode) {
      throw new Error(
        "Unable to read RSA modulus/exponent from TransactPay encryption key."
      );
    }

    const modulus = modulusNode.textContent || "";
    const exponent = exponentNode.textContent || "";

    const modulusBytes = forge.util.decode64(modulus);
    const exponentBytes = forge.util.decode64(exponent);

    const modulusBigInt = new forge.jsbn.BigInteger(
      forge.util.createBuffer(modulusBytes).toHex(),
      16
    );

    const exponentBigInt = new forge.jsbn.BigInteger(
      forge.util.createBuffer(exponentBytes).toHex(),
      16
    );

    const publicKey = forge.pki.setRsaPublicKey(
      modulusBigInt,
      exponentBigInt
    );

    const encrypted = publicKey.encrypt(
      forge.util.encodeUtf8(plaintext),
      "RSAES-PKCS1-V1_5"
    );

    return forge.util.encode64(encrypted);
  } catch (error) {
    console.error(
      "TRANSACTPAY RSA ENCRYPTION ERROR:",
      error
    );

    throw new Error(
      "Unable to encrypt TransactPay request."
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    /*
     * Get the Supabase access token from the browser.
     */
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          status: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace(
      "Bearer ",
      ""
    ).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          status: false,
          message: "Authentication token is missing.",
        },
        { status: 401 }
      );
    }

    /*
     * Verify the token with Supabase.
     */
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error(
        "TRANSACTPAY AUTH ERROR:",
        userError
      );

      return NextResponse.json(
        {
          status: false,
          message: "Your session is invalid or expired.",
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    /*
     * Check whether this user already has
     * a dedicated TransactPay account.
     */
    const { data: existingAccount, error: existingError } =
      await supabase
        .from("virtual_accounts")
        .select(
          "id, user_id, account_number, account_name, bank_name, bank_code, alias, account_reference, status"
        )
        .eq("user_id", userId)
        .maybeSingle();

    if (existingError) {
      console.error(
        "VIRTUAL ACCOUNT LOOKUP ERROR:",
        existingError
      );

      return NextResponse.json(
        {
          status: false,
          message:
            "Unable to check existing virtual account.",
        },
        { status: 500 }
      );
    }

    /*
     * If the customer already has an account,
     * return it instead of generating another one.
     */
    if (existingAccount) {
      return NextResponse.json({
        status: true,
        message: "Virtual account already exists.",
        data: existingAccount,
        existing: true,
      });
    }

    const publicKey =
      process.env.TRANSACTPAY_PUBLIC_KEY;

    const encryptionKey =
      process.env.TRANSACTPAY_ENCRYPTION_KEY;

    if (!publicKey || !encryptionKey) {
      console.error(
        "Missing TransactPay environment variables."
      );

      return NextResponse.json(
        {
          status: false,
          message:
            "TransactPay configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    /*
     * Generate unique alias and reference.
     */
    const uniquePart = crypto
      .randomBytes(6)
      .toString("hex");

    const alias = `ProxySocials-${userId.slice(
      0,
      8
    )}-${uniquePart}`;

    const reference = `PS-VA-${userId.slice(
      0,
      8
    )}-${Date.now()}`;

    const payload = {
      Alias: alias,
      Narration: "ProxySocials Wallet",
      Reference: reference,
    };

    const encryptedPayload =
      encryptWithTransactPayKey(
        JSON.stringify(payload),
        encryptionKey
      );

    /*
     * Generate the dedicated virtual account.
     */
    const transactPayResponse = await fetch(
      "https://payment-api-service.transactpay.ai/payment/virtual-account/generate",
      {
        method: "POST",
        headers: {
          "api-key": publicKey,
          encryption: "RSA",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: encryptedPayload,
        }),
        cache: "no-store",
      }
    );

    const transactPayData =
      await transactPayResponse.json();

    console.log(
      "TRANSACTPAY VA RESPONSE:",
      transactPayData
    );

    if (
      !transactPayResponse.ok ||
      !transactPayData?.status
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            transactPayData?.message ||
            "TransactPay could not generate the virtual account.",
        },
        {
          status:
            transactPayResponse.status || 400,
        }
      );
    }

    const accountNumber = String(
      transactPayData.accountNumber || ""
    );

    const accountName =
      transactPayData.accountName
        ? String(transactPayData.accountName)
        : null;

    const bankName =
      transactPayData.bank
        ? String(transactPayData.bank)
        : null;

    const bankCode =
      transactPayData.bankCode
        ? String(transactPayData.bankCode)
        : null;

    if (!accountNumber) {
      return NextResponse.json(
        {
          status: false,
          message:
            "TransactPay returned a successful response without an account number.",
        },
        { status: 500 }
      );
    }

    /*
     * Save the account against the authenticated user.
     */
    const { data: savedAccount, error: saveError } =
      await supabase
        .from("virtual_accounts")
        .insert({
          user_id: userId,
          account_number: accountNumber,
          account_name: accountName,
          bank_name: bankName,
          bank_code: bankCode,
          alias,
          account_reference: reference,
          status: "active",
        })
        .select(
          "id, user_id, account_number, account_name, bank_name, bank_code, alias, account_reference, status"
        )
        .single();

    if (saveError) {
      console.error(
        "SAVE VIRTUAL ACCOUNT ERROR:",
        saveError
      );

      return NextResponse.json(
        {
          status: false,
          message:
            "Virtual account was generated but could not be saved.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: true,
      message:
        "Dedicated virtual account generated successfully.",
      data: savedAccount,
      existing: false,
    });
  } catch (error) {
    console.error(
      "TRANSACTPAY VIRTUAL ACCOUNT ERROR:",
      error
    );

    return NextResponse.json(
      {
        status: false,
        message:
          "Something went wrong while generating the virtual account.",
      },
      { status: 500 }
    );
  }
}