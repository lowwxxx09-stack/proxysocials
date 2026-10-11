
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
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function saveService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();

    try {
      let imageUrl = "";

      if (image) {
        const safeFileName = image.name
          .replace(/[^a-zA-Z0-9._-]/g, "-")
          .slice(-100);

        const fileName = `${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("service-image")
          .upload(fileName, image);

        if (uploadError) {
          setError(`Image upload failed: ${uploadError.message}`);
          return;
        }

        const { data } = supabase.storage
          .from("service-image")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("services")
        .insert([
          {
            title: title.trim(),
            category: category.trim(),
            description: description.trim(),
            price: parsedPrice,
            "delivery time": deliveryTime.trim(),
            image: imageUrl,
          },
        ]);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setSuccess(true);

      router.push("/admin/services");
      router.refresh();
    } catch (err) {
      console.error("Service creation failed:", err);
      setError("Something went wrong while creating the service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(file: File | null) {
    setImage(file);
    setImagePreview("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImage(null);
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImage(null);
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setImagePreview(URL.createObjectURL(file));
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      {/* Header */}
      <header className="relative overflow-hidden bg-[#071a2f] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Link
            href="/admin/services"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <span aria-hidden="true">←</span>
            Back to Services
          </Link>

          <div className="mt-6 flex items-start gap-3 sm:mt-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-xl">
              ✦
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300 sm:text-xs">
                ProxySocials Admin
              </p>

              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Add New Service
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
                Create a new listing for your marketplace. Add clear details,
                pricing, delivery information, and an image.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Form */}
          <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="text-sm font-bold sm:text-base">
                Service Information
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Fields marked with * are required.
              </p>
            </div>

            <form onSubmit={saveService} className="space-y-5 p-4 sm:p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
                >
                  <span className="font-bold">Unable to save service.</span>{" "}
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
                >
                  Service created successfully.
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="service-title"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Service Title *
                  </label>
                  <input
                    id="service-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Instagram Account"
                    maxLength={150}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="service-category"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Category *
                  </label>
                  <input
                    id="service-category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Instagram"
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="service-price"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Price (₦) *
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-sky-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-500/10">
                    <span className="flex items-center border-r border-slate-200 px-3 text-sm font-semibold text-slate-500">
                      ₦
                    </span>
                    <input
                      id="service-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="min-w-0 w-full bg-transparent px-3 py-3 text-sm outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="service-description"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Description *
                  </label>
                  <textarea
                    id="service-description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what the customer receives and any important details..."
                    maxLength={2000}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {description.length}/2000
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="delivery-time"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Delivery Time *
                  </label>
                  <input
                    id="delivery-time"
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="e.g. Instant delivery or within 24 hours"
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                  <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                    Set a realistic delivery estimate customers can understand.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="service-image"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Service Image
                  </label>

                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-sky-400 sm:p-5">
                    <input
                      id="service-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(e.target.files?.[0] || null)
                      }
                      className="block w-full cursor-pointer text-xs text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-sky-700 hover:file:bg-sky-100"
                    />
                    <p className="mt-2 text-[10px] leading-5 text-slate-500">
                      Optional. PNG, JPG, WebP, or another supported image
                      format. Maximum 5 MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Link
                  href="/admin/services"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-sky-600/15 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-44"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving Service...
                    </>
                  ) : (
                    <>Save Service <span aria-hidden="true">→</span></>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Preview */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <h2 className="text-sm font-bold">Service Preview</h2>
                <p className="mt-1 text-xs text-slate-500">
                  A quick preview of your listing.
                </p>
              </div>

              <div className="p-4">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Selected service preview"
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 text-slate-400">
                      <span className="text-4xl">▧</span>
                      <span className="mt-2 text-[10px] font-medium">
                        Service image preview
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 p-4">
                    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">
                      {category.trim() || "Service category"}
                    </span>

                    <h3 className="break-words text-base font-bold text-slate-900">
                      {title.trim() || "Your service title"}
                    </h3>

                    <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-500">
                      {description.trim() ||
                        "Your service description will appear here."}
                    </p>

                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-medium text-slate-500">
                        Price
                      </p>
                      <p className="mt-1 text-xl font-extrabold text-sky-700">
                        {price !== "" &&
                        Number.isFinite(Number(price)) &&
                        Number(price) >= 0
                          ? `₦${Number(price).toLocaleString("en-NG", {
                              maximumFractionDigits: 2,
                            })}`
                          : "₦0.00"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-slate-500">
                        Estimated delivery
                      </p>
                      <p className="mt-1 break-words text-xs font-semibold text-slate-800">
                        {deliveryTime.trim() || "Delivery time not set"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 p-3">
                  <span className="text-sm">💡</span>
                  <p className="text-[10px] leading-5 text-sky-800">
                    Use a clear title, accurate price, and helpful description
                    so customers understand exactly what they are ordering.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
