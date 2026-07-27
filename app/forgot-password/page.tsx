"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function resetPassword() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        window.location.origin + "/reset-password",
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Password reset email sent. Please check your inbox."
      );
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-sky-400 mb-6">
          Forgot Password
        </h1>

        <p className="text-gray-400 mb-8">
          Enter your email address and we'll send you a password reset link.
        </p>

        <input
          type="email"
          placeholder="Email address"
          className="w-full rounded-xl bg-black border border-zinc-700 p-4 text-white mb-5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={resetPassword}
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-700 rounded-xl py-4 font-bold text-white transition"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && (
          <p className="mt-5 text-center text-sm text-green-400">
            {message}
          </p>
        )}

        <div className="mt-8 text-center">

          <Link
            href="/login"
            className="text-sky-400 font-bold"
          >
            Back to Login
          </Link>

        </div>

      </div>

    </main>
  );
}