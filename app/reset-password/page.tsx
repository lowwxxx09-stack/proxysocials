"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
  async function exchangeCode() {
    const code = searchParams.get("code");

    if (!code) return;

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Exchange Error:", error.message);
      setMessage(error.message);
    }
  }

  exchangeCode();
}, [searchParams, supabase]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function updatePassword() {
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully.");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

        <h1 className="text-4xl font-black text-sky-400 mb-6">
          Reset Password
        </h1>

        <input
          type="password"
          placeholder="New Password"
          className="w-full rounded-xl bg-black border border-zinc-700 p-4 text-white mb-5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full rounded-xl bg-black border border-zinc-700 p-4 text-white mb-5"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={updatePassword}
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-700 rounded-xl py-4 font-bold text-white transition"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        {message && (
          <p className="mt-5 text-center text-green-400">
            {message}
          </p>
        )}

      </div>

    </main>
  );
}