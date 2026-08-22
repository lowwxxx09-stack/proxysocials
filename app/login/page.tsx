"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 to-white flex items-center justify-center px-6 py-12">

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-glow login-glow-one" />
        <div className="login-glow login-glow-two" />
      </div>

      {/* LOGIN CARD */}
      <div className="login-card relative z-10 bg-white w-full max-w-md p-8 rounded-3xl border border-sky-100 shadow-xl">

        {/* LOGO / ICON */}
        <div className="login-icon mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl shadow-sm">
          🚀
        </div>

        {/* TITLE */}
        <h1 className="login-title mt-6 text-3xl font-extrabold text-sky-700 text-center">
          Welcome Back
        </h1>

        <p className="login-subtitle text-gray-600 text-center mt-3">
          Login to your ProxySocials account
        </p>

        {/* ERROR */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-100 p-3 text-red-700 animate-[fadeIn_0.3s_ease-out]">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >

          {/* EMAIL */}
          <div className="login-field">
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 transition-all duration-300 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:-translate-y-0.5"
            />
          </div>

          {/* PASSWORD */}
          <div className="login-field login-delay-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 transition-all duration-300 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:-translate-y-0.5"
            />
          </div>

          {/* BUTTON */}
          <div className="login-button-wrapper login-delay-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-sky-700 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

        </form>

        {/* SIGNUP */}
        <p className="login-footer text-center text-gray-600 mt-6">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-sky-700 font-bold transition-colors duration-200 hover:text-sky-900"
          >
            Sign Up
          </a>
        </p>

      </div>

    </main>
  );
}