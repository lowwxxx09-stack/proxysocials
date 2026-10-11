"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Back to login
        </Link>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-2xl">
          🔐
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          Forgot your password?
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          No worries. Enter the email address associated with your ProxySocials
          account and we&apos;ll send you a password reset link.
        </p>

        {success ? (
          <div
            className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5"
            role="status"
          >
            <div className="font-semibold text-emerald-300">
              Check your email
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              If an account exists for that email address, a password reset
              link will be sent. Check your inbox and spam folder.
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setError("");
              }}
              className="mt-4 text-sm font-semibold text-blue-300 hover:text-blue-200"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-sm text-slate-400">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-300 transition hover:text-blue-200"
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}