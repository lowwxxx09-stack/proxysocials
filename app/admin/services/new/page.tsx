"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function NewServicePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function saveService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    let imageUrl = "";

    if (image) {
      const fileName =
        Date.now().toString() + "-" + image.name;

      const { error: uploadError } = await supabase.storage
        .from("service-image")
        .upload(fileName, image);

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("service-image")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("services")
      .insert([
        {
          title,
          category,
          description,
          price,
          "delivery time": deliveryTime,
          image: imageUrl,
        },
      ]);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    alert("Service created successfully!");

    router.push("/admin/services");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-sky-50 p-8">

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-3xl font-extrabold text-sky-700">
          Add New Service
        </h1>

        <p className="text-gray-600 mt-2">
          Create a new ProxySocials service.
        </p>

        <div className="mt-5">
          <Link
            href="/admin/services"
            className="text-sky-600 font-semibold hover:underline"
          >
            ← Back to Services
          </Link>
        </div>

        {error && (
          <div className="mt-5 bg-red-100 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        <form
          onSubmit={saveService}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="block font-semibold mb-2">
              Service Title
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
              rows={4}
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


          <div>
            <label className="block font-semibold mb-2">
              Service Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
            />
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-bold"
          >
            {loading ? "Saving..." : "Save Service"}
          </button>


        </form>

      </div>

    </main>
  );
}