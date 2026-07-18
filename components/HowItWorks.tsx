export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Choose Your Service",
      description:
        "Browse our available services and select what you need — social media growth, subscriptions, gift cards, airtime, or data.",
    },
    {
      number: "02",
      title: "Place Your Order",
      description:
        "Contact us through WhatsApp or Telegram, provide your details, and complete your payment securely.",
    },
    {
      number: "03",
      title: "Receive Your Order",
      description:
        "Sit back and enjoy fast delivery. We process your request and keep you updated until completion.",
    },
  ];

  return (
    <section className="bg-sky-50 py-20 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-sky-700">
            How It Works
          </h2>

          <p className="mt-4 text-gray-600">
            Getting started with ProxySocials is quick and simple.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition"
            >
              <div className="text-5xl font-extrabold text-sky-600 mb-5">
                {step.number}
              </div>

              <h3 className="text-xl font-bold text-gray-800">
                {step.title}
              </h3>

              <p className="mt-3 text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}