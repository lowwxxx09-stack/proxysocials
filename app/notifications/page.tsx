"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function getNotificationIcon(type: string) {
  switch (type) {
    case "wallet_funded":
      return "💳";
    case "order_completed":
      return "✅";
    case "order_rejected":
      return "❌";
    case "referral_reward":
      return "🎁";
    case "announcement":
      return "📢";
    default:
      return "🔔";
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("NOTIFICATIONS FETCH ERROR:", error);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: true }
          : notification
      )
    );
  }

  async function markAllAsRead() {
    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("MARK ALL READ ERROR:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-sky-600"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Stay updated with your ProxySocials account.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-600"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
              <p className="text-sm text-slate-500">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔔
              </div>

              <h2 className="text-base font-bold text-slate-900">
                No notifications yet
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                We&apos;ll let you know when something important happens.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() =>
                    !notification.is_read && markAsRead(notification.id)
                  }
                  className={`flex w-full gap-4 p-5 text-left transition hover:bg-slate-50 ${
                    !notification.is_read ? "bg-sky-50/40" : "bg-white"
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2
                        className={`text-sm ${
                          notification.is_read
                            ? "font-semibold text-slate-800"
                            : "font-bold text-slate-900"
                        }`}
                      >
                        {notification.title}
                      </h2>

                      {!notification.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}