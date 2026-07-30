"use client";

import { useState } from "react";

export default function TelegramBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="mb-8 rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-sky-700">
            📢 Join the ProxySocials Community
          </h2>

          <p className="mt-2 text-gray-700">
            Get stock updates, giveaways, exclusive discounts and important announcements.
          </p>

          <a
            href="https://t.me/proxysocials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 rounded-xl bg-sky-600 px-6 py-3 text-white font-semibold hover:bg-sky-700 transition"
          >
            Join Telegram →
          </a>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-xl text-gray-500 hover:text-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}