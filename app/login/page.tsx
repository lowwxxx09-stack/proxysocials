
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

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      // Restore the original destination, including admin login redirects.
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirectTo");

      const safeRedirect =
        redirectTo &&
        redirectTo.startsWith("/") &&
        !redirectTo.startsWith("//") &&
        !redirectTo.startsWith("/login")
          ? redirectTo
          : "/dashboard";

      router.replace(safeRedirect);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50 to-white px-4 py-10 sm:px-6 sm:py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-glow login-glow-one" />
        <div className="login-glow login-glow-two" />
      </div>

      {/* Login card */}
      <div className="login-card relative z-10 w-full max-w-md rounded-3xl border border-sky-100 bg-white p-5 shadow-xl sm:p-8">
        {/* Logo */}
        <div className="login-icon mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl shadow-sm">
          🚀
        </div>

        {/* Title */}
        <h1 className="login-title mt-6 text-center text-3xl font-extrabold text-sky-700">
          Welcome Back
        </h1>

        <p className="login-subtitle mt-3 text-center text-sm text-gray-600">
          Login to your ProxySocials account
        </p>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-4 animate-[fadeIn_0.3s_ease-out] rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {/* Email */}
          <div className="login-field">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all duration-300 focus:-translate-y-0.5 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Password */}
          <div className="login-field login-delay-1">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all duration-300 focus:-translate-y-0.5 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />

            {/* Forgot Password */}
            <div className="mt-3 text-right">
              <a
                href="/forgot-password"
                className="text-sm font-semibold text-sky-700 transition-colors hover:text-sky-900 hover:underline"
              >
                Forgot Password?
              </a>
            </div>
          </div>

          {/* Login button */}
          <div className="login-button-wrapper login-delay-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 py-3 font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        {/* Signup */}
        <p className="login-footer mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="font-bold text-sky-700 transition-colors duration-200 hover:text-sky-900 hover:underline"
          >
            Sign Up
          </a>
        </p>
      </div>
    </main>
  );
}
