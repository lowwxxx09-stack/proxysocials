"use client";

import { useEffect, useRef, useState } from "react";
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

function formatTime(date: string) {
  const value = new Date(date);
  const now = new Date();

  const diff = now.getTime() - value.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return value.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationBell() {
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

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
      .select(
        "id, type, title, message, is_read, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("NOTIFICATION FETCH ERROR:", error);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error(
        "NOTIFICATION READ ERROR:",
        error
      );
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

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-base shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-sky-500/10 active:scale-95"
      >
        <span className="text-lg">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-sky-500 px-1 text-[9px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <p className="text-sm font-black text-slate-950">
                Notifications
              </p>

              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                Stay updated with your account
              </p>
            </div>

            {unreadCount > 0 && (
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[9px] font-black text-sky-600">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />

                <p className="mt-3 text-xs text-slate-400">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-xl">
                  🔔
                </div>

                <p className="mt-3 text-sm font-black text-slate-900">
                  No notifications yet
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Important updates about your account will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={`flex w-full gap-3 px-4 py-4 text-left transition hover:bg-slate-50 ${
                      !notification.is_read
                        ? "bg-sky-50/40"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${
                        !notification.is_read
                          ? "bg-sky-100"
                          : "bg-slate-100"
                      }`}
                    >
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs ${
                            !notification.is_read
                              ? "font-black text-slate-950"
                              : "font-bold text-slate-700"
                          }`}
                        >
                          {notification.title}
                        </p>

                        {!notification.is_read && (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                        )}
                      </div>

                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        {notification.message}
                      </p>

                      <p className="mt-1.5 text-[9px] font-bold text-slate-400">
                        {formatTime(
                          notification.created_at
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center justify-center rounded-xl text-xs font-black text-sky-600 transition hover:bg-sky-50"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}