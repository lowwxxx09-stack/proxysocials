export default function WhyChooseUs() {
  const reasons = [
    {
      icon: "⚡",
      title: "Fast Delivery",
      description:
        "We process your orders according to the listed delivery times, helping you get your digital services without unnecessary delays.",
    },
    {
      icon: "🔒",
      title: "Secure Transactions",
      description:
        "Your orders are handled through a straightforward process designed to make your marketplace experience reliable.",
    },
    {
      icon: "💰",
      title: "Affordable Pricing",
      description:
        "Explore digital services and products at competitive prices to find options that fit your needs.",
    },
    {
      icon: "🤝",
      title: "Customer Support",
      description:
        "Need assistance with an order or your account? Our support team is available to help.",
    },
  ];

  return (
    <section className="overflow-hidden bg-sky-50 px-3 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
          <span className="inline-flex rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-700 shadow-sm sm:text-sm">
            The ProxySocials Advantage
          </span>

          <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:mt-5 sm:text-4xl md:text-5xl">
            Why Choose{" "}
            <span className="text-sky-700">ProxySocials?</span>
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
            We make discovering and accessing digital services simple,
            convenient, and reliable.
          </p>
        </div>

        {/* Reasons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {reasons.map((reason, index) => (
            <article
              key={reason.title}
              className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl sm:rounded-3xl sm:p-6 lg:p-7"
            >
              {/* Decorative background number */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-1 -top-5 text-7xl font-black text-sky-50 transition-colors group-hover:text-sky-100 sm:text-8xl"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Icon */}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-2xl transition duration-300 group-hover:bg-sky-100 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-3xl">
                <span aria-hidden="true">{reason.icon}</span>
              </div>

              {/* Content */}
              <h3 className="relative mt-4 text-lg font-black leading-snug text-gray-900 sm:mt-5 sm:text-xl">
                {reason.title}
              </h3>

              <p className="relative mt-3 flex-1 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                {reason.description}
              </p>

              {/* Accent */}
              <div
                aria-hidden="true"
                className="mt-5 h-1 w-10 rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-300 group-hover:w-16 sm:mt-6"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}