"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CustomerMenu from "@/components/CustomerMenu";
export default function ProfilePage() {

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveProfile() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  setSaving(true);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      whatsapp_number: whatsapp,
    })
    .eq("id", user.id);

  setSaving(false);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Profile updated successfully!");
}

  async function loadProfile() {
const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email ?? "");

    const { data } = await supabase
      .from("profiles")
      .select("full_name, whatsapp_number")
      .eq("id", user.id)
      .single();

    if (data) {
  
  setFullName(data.full_name ?? "");
  setWhatsapp(data.whatsapp_number ?? "");
}
  }
  return (
    <main className="min-h-screen bg-sky-50 py-12 px-6">
      <CustomerMenu />
      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl font-black text-black mb-8">
          My Profile
        </h1>

        <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-8">

          {/* Profile Picture */}

          <div className="flex flex-col items-center">

            <div className="w-28 h-28 rounded-full bg-sky-100 flex items-center justify-center text-5xl shadow-md">
              👤
            </div>

            <button
              className="mt-4 text-black font-semibold hover:text-sky-700 hover:underline transition"
            >
              Change Profile Picture
            </button>

          </div>

          {/* Form */}

          <div className="mt-10 grid gap-6">

            <div>
              <label className="block font-bold text-black mb-2">
                Full Name
              </label>

              <input
  type="text"
  value={fullName ?? ""}
  onChange={(e) => setFullName(e.target.value)}
  placeholder="Enter your full name"
  className="w-full border border-gray-300 rounded-2xl p-4 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
/>
            </div>

            <div>
              <label className="block font-bold text-black mb-2">
                Email Address
              </label>

              <input
  type="email"
  value={email ?? ""}
  readOnly
  className="w-full border border-gray-300 rounded-2xl p-4 bg-gray-100 text-black cursor-not-allowed"
/>
            </div>

            <div>
              <label className="block font-bold text-black mb-2">
                WhatsApp Number
              </label>

              <input
  type="text"
  value={whatsapp ?? ""}
  onChange={(e) => setWhatsapp(e.target.value)}
  placeholder="Enter your WhatsApp number"
  className="w-full border border-gray-300 rounded-2xl p-4 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
/>
            </div>

          </div>

          {/* Account Summary */}

          <div className="mt-12 border-t pt-8">

            <h2 className="text-2xl font-black text-black mb-6">
              Account Summary
            </h2>

            <div className="grid grid-cols-3 gap-4">

              <div className="bg-sky-50 rounded-2xl p-5 text-center border border-sky-100">
                <p className="text-sm font-semibold text-black">
                  Total Orders
                </p>

                <p className="mt-2 text-3xl font-black text-sky-700">
                  0
                </p>
              </div>

              <div className="bg-yellow-50 rounded-2xl p-5 text-center border border-yellow-200">
                <p className="text-sm font-semibold text-black">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-black text-yellow-600">
                  0
                </p>
              </div>

              <div className="bg-green-50 rounded-2xl p-5 text-center border border-green-200">
                <p className="text-sm font-semibold text-black">
                  Completed
                </p>

                <p className="mt-2 text-3xl font-black text-green-600">
                  0
                </p>
              </div>

            </div>

          </div>

          {/* Save Button */}

          <button
  onClick={saveProfile}
  disabled={saving}
  className="mt-10 w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold shadow-lg transition"
>
  {saving ? "Saving..." : "Save Changes"}
</button>

        </div>

      </div>
    </main>
  );
}