"use client";

export default function TelegramSupportButton() {
  return (
    <a
      href="https://t.me/proxy_socials"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact ProxySocials support on Telegram"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-xl transition hover:bg-sky-700"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M21.5 3.5 2.9 10.7c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.6.1.8.7.8.5 0 .7-.2 1-.4l2.3-2.2 4.8 3.5c.9.5 1.5.3 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.3-1.4ZM8.1 13.3l10.8-6.8c.5-.3 1-.1.6.2l-8.8 8-.3 3.1-1.4-4.5-3.5-1.1c-.8-.2-.8-.6.6-1.1Z" />
      </svg>
    </a>
  );
}