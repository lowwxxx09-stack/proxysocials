export default function HowItWorks() {
  const steps = [
    {
      icon: "🛍️",
      number: "01",
      title: "Choose Your Service",
      description:
        "Browse our marketplace and select the service that best fits your needs.",
    },
    {
      icon: "💳",
      number: "02",
      title: "Pay Securely",
      description:
        "Complete your payment through the available checkout options and follow the payment instructions.",
    },
    {
      icon: "🚀",
      number: "03",
      title: "Receive Your Order",
      description:
        "Track your order and receive it according to the service's listed delivery time.",
    },
  ];

  return (
    <section className="overflow-hidden bg-gradient-to-b from-sky-50 to-white px-3 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-100 px-4 py-2 text-xs font-bold text-sky-700 sm:px-5 sm:text-sm">
            Simple Process
          </span>

          <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:mt-6 sm:text-4xl md:text-5xl">
            How ProxySocials Works
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">
            Getting started is simple. Choose what you need, complete checkout,
            and follow your order until delivery.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:mt-16 lg:grid-cols-3 lg:gap-6">
          {steps.map((step) => (
            <article
              key={step.number}
              className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl sm:rounded-3xl sm:p-7 lg:p-8"
            >
              {/* Decorative number */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-1 -top-5 select-none text-7xl font-black tracking-tighter text-sky-50 sm:-right-2 sm:-top-6 sm:text-8xl"
              >
                {step.number}
              </span>

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-2xl transition duration-300 group-hover:bg-sky-100 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-3xl">
                  <span aria-hidden="true">{step.icon}</span>
                </div>

                <span className="rounded-full border border-sky-100 bg-white px-3 py-1 text-xs font-bold text-sky-700 sm:text-sm">
                  Step {step.number}
                </span>
              </div>

              <h3 className="relative mt-5 text-xl font-black leading-snug text-gray-900 sm:mt-7 sm:text-2xl">
                {step.title}
              </h3>

              <p className="relative mt-3 flex-1 text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
                {step.description}
              </p>

              <div
                aria-hidden="true"
                className="mt-5 h-1 w-12 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all duration-300 group-hover:w-20 sm:mt-6"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}