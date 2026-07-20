"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log(error.message);
    }

    setProfile(data);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-sky-50 flex items-center justify-center">
        <p className="text-sky-700 font-bold text-xl">
          Loading Dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white p-8 rounded-2xl shadow-sm flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-extrabold text-sky-700">
              Welcome, {profile?.full_name || "User"} 👋
            </h1>

            <p className="mt-3 text-gray-600">
              Phone: {profile?.phone}
            </p>

            <p className="mt-2 text-gray-600">
              Manage your orders, account, and referral rewards from your dashboard.
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-600 transition"
          >
            Logout
          </button>

        </div>


        {/* Profile Information */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              Referral Code
            </h2>

            <p className="mt-3 text-gray-600 font-bold">
              {profile?.referral_code}
            </p>
          </div>


          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              Wallet Balance
            </h2>

            <p className="mt-3 text-gray-600 font-bold">
              ₦{profile?.wallet_balance}
            </p>
          </div>


          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-sky-700">
              Account Settings
            </h2>

            <p className="mt-3 text-gray-600">
              Manage your profile information.
            </p>
          </div>

        </div>


        {/* Orders */}
        <div className="bg-white mt-8 p-8 rounded-2xl shadow-sm">

          <h2 className="text-2xl font-extrabold text-sky-700">
            My Orders
          </h2>

          <p className="mt-3 text-gray-600">
            Your orders will appear here.
          </p>

        </div>


        {/* Quick Action */}
        <div className="bg-sky-600 text-white mt-8 p-8 rounded-2xl">

          <h2 className="text-2xl font-extrabold">
            Ready to grow?
          </h2>

          <p className="mt-3">
            Share your referral code and start earning rewards.
          </p>

          <button className="mt-5 bg-white text-sky-700 px-6 py-3 rounded-xl font-bold">
            Share Referral Code
          </button>

        </div>


      </div>

    </main>
  );
}