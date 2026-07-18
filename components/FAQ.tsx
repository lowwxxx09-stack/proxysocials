export default function FAQ() {
  const questions = [
    {
      question: "How fast will I receive my order?",
      answer:
        "Most orders are processed quickly after payment confirmation. Delivery time depends on the service requested.",
    },
    {
      question: "What services does ProxySocials offer?",
      answer:
        "We provide social media growth services, streaming subscriptions, gift cards, airtime, and data services.",
    },
    {
      question: "How can I place an order?",
      answer:
        "Choose your service, contact us through WhatsApp or Telegram, provide the required details, and complete your payment.",
    },
    {
      question: "Are transactions secure?",
      answer:
        "Yes. We focus on providing a smooth and reliable experience for all customers.",
    },
    {
      question: "How can I contact support?",
      answer:
        "You can reach our support team through our official WhatsApp and Telegram channels.",
    },
  ];

  return (
    <section className="bg-sky-50 py-20 px-6">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-sky-700">
            Frequently Asked Questions
          </h2>

          <p className="mt-4 text-gray-600">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="space-y-5">
          {questions.map((item) => (
            <div
              key={item.question}
              className="bg-white p-6 rounded-2xl shadow-sm"
            >
              <h3 className="text-lg font-bold text-sky-700">
                {item.question}
              </h3>

              <p className="mt-3 text-gray-600">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}