"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function DeleteServiceButton({
  id,
}: {
  id: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();

    console.log("CURRENT USER:", userData.user);

    const { data, error } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .select();

    console.log("DELETE RESULT:", data);
    console.log("DELETE ERROR:", error);

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("No service was deleted.");
      return;
    }

    alert("Service deleted successfully!");

    router.refresh();
  }

  return (
    <button
  onClick={handleDelete}
  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded-lg"
>
  Delete
</button>
  );
}