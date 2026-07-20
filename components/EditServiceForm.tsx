"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditServiceForm({
  service,
}: {
  service: any;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(service.title);
  const [category, setCategory] = useState(service.category);
  const [description, setDescription] = useState(service.description);
  const [price, setPrice] = useState(service.price);
  const [deliveryTime, setDeliveryTime] = useState(
    service["delivery time"]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpdate(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();

    console.log("CURRENT USER:", userData.user);

    const { data, error } = await supabase
      .from("services")
      .update({
        title,
        category,
        description,
        price,
        "delivery time": deliveryTime,
      })
      .eq("id", service.id)
      .select();

    console.log("UPDATE RESULT:", data);
    console.log("UPDATE ERROR:", error);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (!data || data.length === 0) {
      setError("No service was updated.");
      return;
    }

    alert("Service updated successfully!");

    router.refresh();
  }

  return (
    <form
      onSubmit={handleUpdate}
      className="space-y-5 mt-8"
    >

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block font-semibold mb-2">
          Title
        </label>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-xl p-3"
          required
        />
      </div>


      <div>
        <label className="block font-semibold mb-2">
          Category
        </label>

        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded-xl p-3"
          required
        />
      </div>


      <div>
        <label className="block font-semibold mb-2">
          Description
        </label>

        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-xl p-3"
          required
        />
      </div>


      <div>
        <label className="block font-semibold mb-2">
          Price
        </label>

        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border rounded-xl p-3"
          required
        />
      </div>


      <div>
        <label className="block font-semibold mb-2">
          Delivery Time
        </label>

        <input
          type="text"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          className="w-full border rounded-xl p-3"
          required
        />
      </div>


      <button
        type="submit"
        disabled={loading}
        className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>

    </form>
  );
}