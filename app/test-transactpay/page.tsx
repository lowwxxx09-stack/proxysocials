"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TestTransactPayPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function generateAccount() {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.access_token) {
        throw new Error("You are not logged in.");
      }

      const response = await fetch(
        "/api/transactpay/virtual-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(
          data.message ||
            "Unable to generate TransactPay virtual account."
        );
      }

      setResult(data);
    } catch (err: any) {
      console.error(
        "TRANSACTPAY TEST ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while testing TransactPay."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-2xl font-black text-slate-900">
            TransactPay Test
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Test your ProxySocials dedicated virtual
            account connection.
          </p>

          <button
            type="button"
            onClick={generateAccount}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Checking account..."
              : "Test Virtual Account"}
          </button>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-700">
                Error
              </p>

              <p className="mt-1 whitespace-pre-wrap text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {result && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-black text-emerald-700">
                Success 🎉
              </p>

              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-white p-4 text-xs text-slate-700">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}