
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CustomerMenu from "@/components/CustomerMenu";

type ProfileStats = {
  total: number;
  pending: number;
  completed: number;
};

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [stats, setStats] = useState<ProfileStats>({
    total: 0,
    pending: 0,
    completed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Please log in to view your profile.");
        return;
      }

      setEmail(user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, whatsapp_number")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError("Unable to load your profile. Please try again.");
        return;
      }

      setFullName(profile?.full_name ?? "");
      setWhatsapp(profile?.whatsapp_number ?? "");

      // Load actual orders belonging to the logged-in customer.
      const { data: orders, error: ordersError } = await supabase
        .from("order")
        .select("order_status")
        .eq("user_id", user.id);

      if (ordersError) {
        console.error(
          "Profile order statistics error:",
          ordersError.message
        );
      } else {
        const orderList = orders ?? [];

        setStats({
          total: orderList.length,
          pending: orderList.filter(
            (order) =>
              String(order.order_status ?? "").toLowerCase() === "pending"
          ).length,
          completed: orderList.filter(
            (order) =>
              String(order.order_status ?? "").toLowerCase() === "completed"
          ).length,
        });
      }
    } catch (err) {
      console.error("Profile loading error:", err);
      setError("Something went wrong while loading your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          whatsapp_number: whatsapp.trim(),
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setFullName(fullName.trim());
      setWhatsapp(whatsapp.trim());
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Unable to save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = fullName.trim()
    ? fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "PS";

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <CustomerMenu />

      {/* Profile header */}
      <section className="relative overflow-hidden bg-[#071a2f] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300 sm:text-xs">
            Your Account
          </p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-2 max-w-lg text-xs leading-5 text-slate-300 sm:text-sm">
            Manage your personal information and keep your ProxySocials
            account details up to date.
          </p>

          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-lg font-extrabold text-sky-200 sm:h-16 sm:w-16 sm:text-xl">
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-base font-bold sm:text-lg">
                {fullName.trim() || "Welcome to ProxySocials"}
              </h2>

              <p className="mt-1 break-all text-xs text-slate-300">
                {email || "Your account email"}
              </p>

              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Customer account
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Account summary */}
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-extrabold sm:text-base">
              Account Summary
            </h2>

            <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
              An overview of your orders.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard
              label="Total Orders"
              value={stats.total}
              icon="▤"
              color="blue"
              loading={loading}
            />

            <StatCard
              label="Pending Orders"
              value={stats.pending}
              icon="◷"
              color="amber"
              loading={loading}
            />

            <StatCard
              label="Completed Orders"
              value={stats.completed}
              icon="✓"
              color="emerald"
              loading={loading}
            />
          </div>
        </section>

        {/* Personal information */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
            <h2 className="text-sm font-extrabold sm:text-base">
              Personal Information
            </h2>

            <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
              Update your details so we can serve you better.
            </p>
          </div>

          <form onSubmit={saveProfile} className="space-y-5 p-4 sm:p-6">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700"
              >
                ✓ {success}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="full-name"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setSuccess("");
                  }}
                  placeholder="Enter your full name"
                  maxLength={100}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-3 text-sm text-slate-500 outline-none"
                />

                <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                  Your account email cannot be changed here.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="whatsapp"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  WhatsApp Number
                </label>

                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    setSuccess("");
                  }}
                  placeholder="Enter your WhatsApp number"
                  maxLength={30}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60"
                />

                <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                  Include your country code if applicable.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] leading-5 text-slate-500 sm:max-w-xs">
                Keep your contact information accurate for account-related
                updates.
              </p>

              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-xs font-bold text-white shadow-sm shadow-sky-600/15 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    Save Changes <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <p className="pb-3 text-center text-[10px] leading-5 text-slate-400">
          ProxySocials · Your account, all in one place.
        </p>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: string;
  color: "blue" | "amber" | "emerald";
  loading: boolean;
}) {
  const styles = {
    blue: {
      icon: "bg-sky-50 text-sky-700",
      number: "text-sky-700",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      number: "text-amber-700",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      number: "text-emerald-700",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-600">{label}</p>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${styles[color].icon}`}
        >
          {icon}
        </span>
      </div>

      <p
        className={`mt-4 text-3xl font-extrabold tracking-tight ${styles[color].number}`}
      >
        {loading ? (
          <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          value.toLocaleString()
        )}
      </p>
    </div>
  );
}
