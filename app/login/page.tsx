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
    <main className="min-h-screen bg-sky-50 flex items-center justify-center px-6">

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-extrabold text-sky-700 text-center">
          Welcome Back
        </h1>

        <p className="text-gray-600 text-center mt-3">
          Login to your ProxySocials account
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >

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
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-600"
            />
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>


        <p className="text-center text-gray-600 mt-6">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-sky-700 font-bold"
          >
            Sign Up
          </a>
        </p>

      </div>

    </main>
  );
}