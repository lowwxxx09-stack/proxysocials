"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    /*
     * CREATE AUTH ACCOUNT
     */
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setError("Account could not be created. Please try again.");
      setLoading(false);
      return;
    }

    /*
     * CREATE PROFILE
     *
     * Referral codes are generated automatically
     * by the database trigger.
     */
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: fullName,
        phone,
        wallet_balance: 0,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    /*
     * PROCESS REFERRAL
     *
     * If the new customer entered a referral code,
     * the database will:
     *
     * - Find the referrer
     * - Prevent self-referrals
     * - Prevent duplicate rewards
     * - Credit the referrer ₦1,500
     * - Create the referral record
     * - Create the wallet transaction
     */
    if (referralCode.trim()) {
      const { error: referralError } = await supabase.rpc(
        "claim_referral",
        {
          p_referral_code: referralCode.trim(),
        }
      );

      /*
       * Referral failure should NOT stop account creation.
       * The customer can still use their new account.
       */
      if (referralError) {
        console.log(
          "Referral claim failed:",
          referralError.message
        );
      }
    }

    setLoading(false);

    alert("Account created successfully!");

    router.push("/login");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 to-white flex items-center justify-center px-6 py-12">

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-glow login-glow-one" />
        <div className="login-glow login-glow-two" />
      </div>

      {/* SIGNUP CARD */}
      <div className="login-card relative z-10 bg-white w-full max-w-md p-8 rounded-3xl border border-sky-100 shadow-xl">

        {/* ICON */}
        <div className="login-icon mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl shadow-sm">
          🚀
        </div>

        {/* TITLE */}
        <h1 className="login-title mt-6 text-3xl font-extrabold text-sky-700 text-center">
          Create Account
        </h1>

        <p className="login-subtitle text-gray-600 text-center mt-3">
          Join ProxySocials today
        </p>

        {/* ERROR */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-100 p-3 text-red-700 animate-[fadeIn_0.3s_ease-out]">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSignup}
          className="mt-8 space-y-5"
        >

          {/* FULL NAME */}
          <div className="login-field">
            <label className="block text-gray-700 font-semibold mb-2">
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black transition-all duration-300 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:-translate-y-0.5"
            />
          </div>

          {/* EMAIL */}
          <div className="login-field login-delay-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black transition-all duration-300 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:-translate-y-0.5"
            />
          </div>

          {/* PHONE */}
          <div className="login-field login-delay-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Phone Number
            </label>

            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black transition-all duration-300 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:-translate-y-0.5"
            />
          </div>

          {/* REFERRAL CODE */}
          <div className="login-field">
            <label className="block text-gray-700 font-semibold mb-2">
              Referral Code{" "}
              <span className="text-gray-400 font-normal">
                (Optional)
              </span>
            </label>

            <input
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) =>
                setReferralCode(e.target.value.toUpperCase())
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black uppercase transition-all duration-300 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:-translate-y-0.5"
            />

            <p className="text-xs text-gray-500 mt-2">
              Have a ProxySocials referral code? Enter it here.
            </p>
          </div>

          {/* PASSWORD */}
          <div className="login-field login-delay-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black transition-all duration-300 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:-translate-y-0.5"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="login-field login-delay-2">
            <label className="block text-gray-700 font-semibold mb-2">
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black transition-all duration-300 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:-translate-y-0.5"
            />
          </div>

          {/* BUTTON */}
          <div className="login-button-wrapper login-delay-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-sky-700 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </div>

        </form>

        {/* LOGIN LINK */}
        <p className="login-footer text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-sky-700 font-bold transition-colors duration-200 hover:text-sky-900"
          >
            Login
          </a>
        </p>

      </div>

    </main>
  );
}