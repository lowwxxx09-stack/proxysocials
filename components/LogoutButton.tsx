"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold"
    >
      Logout
    </button>
  );
}