import Link from "next/link";

const services = [
  {
    icon: "📈",
    title: "Social Media Growth",
    description:
      "Discover social media services for Instagram, TikTok, Facebook, YouTube, X, Telegram and more.",
  },
  {
    icon: "🎬",
    title: "Streaming Subscriptions",
    description:
      "Explore streaming, music and other premium digital subscriptions.",
  },
  {
    icon: "👤",
    title: "Social Media Accounts",
    description:
      "Browse available social media accounts and choose from the options listed in our marketplace.",
  },
  {
    icon: "💻",
    title: "Digital Products",
    description:
      "Discover digital products for creators, streamers and online businesses.",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="bg-white px-3 py-12 sm:px-6 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12 lg:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 sm:text-sm">
            Explore the marketplace
          </p>

          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Our Services
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
            Discover social media services, subscriptions and digital products
            in one convenient marketplace.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {services.map((service) => (
            <article
              key={service.title}
              className="group flex min-w-0 flex-col rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl sm:rounded-3xl sm:p-6 lg:p-7"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-2xl transition duration-300 group-hover:bg-sky-100 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-3xl"
                aria-hidden="true"
              >
                {service.icon}
              </div>

              <h3 className="mt-4 text-xl font-black leading-snug text-gray-900 sm:mt-5 sm:text-xl lg:text-2xl">
                {service.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
                {service.description}
              </p>

              <Link
                href="/services"
                className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 text-sm font-bold text-sky-700 transition-colors hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4 sm:mt-6 sm:text-base"
              >
                Explore Services
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>

        {/* View all services */}
        <div className="mt-8 text-center sm:mt-10">
          <Link
            href="/services"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto sm:px-8 sm:text-base"
          >
            View All Services
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}