export default function WhyChooseUs() {
  const reasons = [
    {
      icon: "⚡",
      title: "Fast Delivery",
      description:
        "We process your orders quickly so you can enjoy your digital services without unnecessary delays.",
    },
    {
      icon: "🔒",
      title: "Secure Transactions",
      description:
        "Your orders are handled through a simple and reliable process.",
    },
    {
      icon: "💰",
      title: "Affordable Pricing",
      description:
        "Get quality digital services at competitive prices.",
    },
    {
      icon: "🤝",
      title: "Customer Support",
      description:
        "We are available to assist you whenever you need help.",
    },
  ];

  return (
    <section className="bg-sky-50 py-20 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-sky-700">
            Why Choose ProxySocials?
          </h2>

          <p className="mt-4 text-gray-600">
            We make digital services simple, fast, and reliable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">
                {reason.icon}
              </div>

              <h3 className="text-xl font-bold text-sky-700">
                {reason.title}
              </h3>

              <p className="mt-3 text-gray-600">
                {reason.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}