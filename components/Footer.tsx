import Link from "next/link";

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-7xl">
        {/* Main footer */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-black tracking-tight transition hover:text-sky-300 sm:text-3xl"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-lg font-black text-white">
                P
              </span>
              <span>
                Proxy<span className="text-sky-400">Socials</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300 sm:text-base">
              Your digital marketplace for social media services, streaming
              subscriptions, social media accounts, and digital products.
            </p>

            <Link
              href="/services"
              className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-sky-400 transition hover:text-sky-300"
            >
              Explore our marketplace
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-base font-extrabold sm:text-lg">
              Explore
            </h3>

            <ul className="mt-4 space-y-3 text-sm text-slate-300 sm:text-base">
              <li>
                <Link
                  href="/services"
                  className="transition hover:text-sky-300"
                >
                  Social Media Services
                </Link>
              </li>

              <li>
                <Link
                  href="/services"
                  className="transition hover:text-sky-300"
                >
                  Streaming Subscriptions
                </Link>
              </li>

              <li>
                <Link
                  href="/services"
                  className="transition hover:text-sky-300"
                >
                  Social Media Accounts
                </Link>
              </li>

              <li>
                <Link
                  href="/services"
                  className="transition hover:text-sky-300"
                >
                  Digital Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base font-extrabold sm:text-lg">
              Contact & Support
            </h3>

            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
              Need help with an order or your account? Reach out through our
              official support channels.
            </p>

            <div className="mt-5 space-y-3">
              <a
                href="https://wa.me/2348161250950"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/40 hover:bg-white/10 hover:text-white sm:text-base"
              >
                <span aria-hidden="true">💬</span>
                <span>WhatsApp Support</span>
                <span className="ml-auto text-sky-400" aria-hidden="true">
                  ↗
                </span>
              </a>

              <a
                href="https://t.me/proxysocials"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/40 hover:bg-white/10 hover:text-white sm:text-base"
              >
                <span aria-hidden="true">✈️</span>
                <span>Telegram Support</span>
                <span className="ml-auto text-sky-400" aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-9 border-t border-white/10 pt-6 sm:mt-12 sm:pt-7">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs leading-5 text-slate-400 sm:text-sm">
              © {new Date().getFullYear()} ProxySocials. All rights reserved.
            </p>

            <Link
              href="/"
              className="text-xs font-semibold text-slate-400 transition hover:text-sky-300 sm:text-sm"
            >
              Built for your digital world.
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}