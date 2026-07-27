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
        "Complete your payment safely through our secure Paystack checkout in just a few clicks.",
    },
    {
      icon: "🚀",
      number: "03",
      title: "Receive Your Order",
      description:
        "Our team begins processing immediately and delivers your order as quickly as possible.",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-sky-50 to-white py-24 px-6">

      <div className="max-w-7xl mx-auto">

        <div className="text-center">

          <span className="inline-block bg-sky-100 text-sky-700 px-5 py-2 rounded-full font-bold text-sm">
            Simple Process
          </span>

          <h2 className="mt-6 text-4xl md:text-5xl font-black text-gray-900">
            How ProxySocials Works
          </h2>

          <p className="mt-5 text-lg text-gray-600 max-w-3xl mx-auto leading-8">
            Ordering from ProxySocials takes only a few minutes.
            Our streamlined process ensures speed, security and reliability.
          </p>

        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">

          {steps.map((step) => (

            <div
              key={step.number}
              className="relative bg-white border border-sky-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8"
            >

              <div className="flex justify-between items-center">

                <div className="text-5xl">
                  {step.icon}
                </div>

                <span className="text-5xl font-black text-sky-100">
                  {step.number}
                </span>

              </div>

              <h3 className="mt-8 text-2xl font-black text-gray-900">
                {step.title}
              </h3>

              <p className="mt-4 text-gray-600 leading-8">
                {step.description}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}