"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

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

    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: fullName,
          phone,
          referral_code: `PROXY${Math.floor(
            Math.random() * 100000
          )}`,
          wallet_balance: 0,
        });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);

    alert("Account created successfully!");

    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-sky-50 flex items-center justify-center px-6">

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-extrabold text-sky-700 text-center">
          Create Account
        </h1>

        <p className="text-gray-600 text-center mt-3">
          Join ProxySocials today
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSignup}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-600"
            />
          </div>


          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-600"
            />
          </div>


          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Phone Number
            </label>

            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-600"
            />
          </div>


          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-600"
            />
          </div>


          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-600"
            />
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>


        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-sky-700 font-bold">
            Login
          </a>
        </p>

      </div>

    </main>
  );
}