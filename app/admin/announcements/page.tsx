
"use client";

import { useState } from "react";
import Link from "next/link";

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");

  function openConfirmation() {
    setError("");
    setResult(null);

    if (!title.trim()) {
      setError("Please enter an announcement title.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter an announcement message.");
      return;
    }

    setShowConfirm(true);
  }

  async function sendAnnouncement() {
    setLoading(true);
    setError("");
    setResult(null);
    setShowConfirm(false);

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send announcement.");
        return;
      }

      setResult(Number(data.data ?? 0));
      setTitle("");
      setMessage("");
    } catch (err) {
      console.error("ANNOUNCEMENT ERROR:", err);
      setError("Unable to send announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-900">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#071a2f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sm">
                  PS
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300 sm:text-xs">
                  Admin Control Center
                </span>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Announcement Center
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
                Send important updates, promotions and announcements
                directly to every ProxySocials customer.
              </p>
            </div>

            <Link
              href="/admin"
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-slate-200 transition hover:bg-white/10 sm:px-4 sm:text-xs"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
          {/* Announcement Form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-xl">
                📢
              </div>

              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Create Announcement
              </h2>

              <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
                Your announcement will be delivered as an in-app
                notification to all registered users.
              </p>
            </div>

            {/* Title */}
            <div className="mb-5">
              <label
                htmlFor="announcement-title"
                className="mb-2 block text-[11px] font-bold text-slate-700 sm:text-xs"
              >
                Announcement Title
              </label>

              <input
                id="announcement-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New services are now available"
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10 sm:text-sm"
              />

              <div className="mt-1 text-right text-[9px] text-slate-400">
                {title.length}/100
              </div>
            </div>

            {/* Message */}
            <div className="mb-5">
              <label
                htmlFor="announcement-message"
                className="mb-2 block text-[11px] font-bold text-slate-700 sm:text-xs"
              >
                Message
              </label>

              <textarea
                id="announcement-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement here..."
                maxLength={500}
                rows={7}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10 sm:text-sm"
              />

              <div className="mt-1 text-right text-[9px] text-slate-400">
                {message.length}/500
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-xs font-medium text-red-600"
              >
                ❌ {error}
              </div>
            )}

            {/* Success */}
            {result !== null && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3"
              >
                <p className="text-xs font-bold text-emerald-700">
                  ✅ Announcement sent successfully
                </p>

                <p className="mt-1 text-[10px] text-emerald-600">
                  {result.toLocaleString()} user
                  {result === 1 ? "" : "s"} received the announcement.
                </p>
              </div>
            )}

            {/* Send */}
            <button
              type="button"
              onClick={openConfirmation}
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              {loading ? "Sending Announcement..." : "📢 Send Announcement"}
            </button>
          </section>

          {/* Side Preview */}
          <section className="space-y-5">
            {/* Preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Live Preview
                </h2>

                <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                  This is how users will see it.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-base">
                      📢
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-bold text-slate-900">
                          {title.trim() || "Announcement title"}
                        </h3>

                        <span className="shrink-0 text-[8px] text-slate-400">
                          Just now
                        </span>
                      </div>

                      <p className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-4 text-slate-500">
                        {message.trim() ||
                          "Your announcement message will appear here."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
              <h2 className="text-sm font-bold text-sky-900">
                💡 Announcement Tips
              </h2>

              <div className="mt-3 space-y-2">
                <Tip text="Keep the title short and clear." />
                <Tip text="Use announcements for important updates and promotions." />
                <Tip text="Avoid sending too many notifications." />
                <Tip text="Double-check your message before sending." />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-confirm-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-xl">
              📢
            </div>

            <h2
              id="announcement-confirm-title"
              className="mt-4 text-base font-bold text-slate-900 sm:text-lg"
            >
              Send this announcement?
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              This will send the announcement to every registered
              ProxySocials user.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-900">{title}</p>

              <p className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-4 text-slate-500">
                {message}
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={sendAnnouncement}
                disabled={loading}
                className="flex-1 rounded-xl bg-slate-900 px-3 py-3 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[10px] text-sky-600">✓</span>

      <p className="text-[10px] leading-4 text-sky-800 sm:text-xs">
        {text}
      </p>
    </div>
  );
}
