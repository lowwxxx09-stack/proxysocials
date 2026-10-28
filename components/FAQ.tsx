"use client";

import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const questions = [
    {
      question: "How fast will I receive my order?",
      answer:
        "Orders are processed after payment confirmation. Delivery time depends on the service you purchase and its listed delivery timeframe.",
    },
    {
      question: "What services does ProxySocials offer?",
      answer:
        "ProxySocials offers social media services, social media accounts, streaming subscriptions, and other digital products through its online marketplace.",
    },
    {
      question: "How can I place an order?",
      answer:
        "Browse the marketplace, select the service or product you need, follow the instructions on the listing, and complete checkout using the available payment options.",
    },
    {
      question: "Are transactions secure?",
      answer:
        "ProxySocials aims to provide a reliable purchasing experience. Always review the order details and payment instructions before completing a transaction.",
    },
    {
      question: "How can I contact support?",
      answer:
        "You can contact the ProxySocials support team through the official WhatsApp and Telegram channels provided on our platform.",
    },
    {
      question: "Can I track my order?",
      answer:
        "Check your account and order details for available status updates. If you need help with an order, contact our support team.",
    },
  ];

  return (
    <section
      id="faq"
      className="scroll-mt-24 overflow-hidden bg-sky-50 px-3 py-12 sm:px-6 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-4xl">
        {/* Section heading */}
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
          <span className="inline-flex rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-sky-700 shadow-sm sm:text-sm">
            Need Help?
          </span>

          <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:mt-5 sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
            Find answers to common questions about ordering, payments, and
            using ProxySocials.
          </p>
        </div>

        {/* FAQ accordion */}
        <div className="space-y-3 sm:space-y-4">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;

            return (
              <article
                key={item.question}
                className={`overflow-hidden rounded-xl border bg-white transition duration-300 sm:rounded-2xl ${
                  isOpen
                    ? "border-sky-200 shadow-md shadow-sky-900/5"
                    : "border-sky-100 shadow-sm hover:border-sky-200 hover:shadow-md"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left sm:min-h-20 sm:px-6 sm:py-5"
                >
                  <span className="text-sm font-bold leading-6 text-gray-900 sm:text-base md:text-lg">
                    {item.question}
                  </span>

                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl font-medium transition duration-300 sm:h-9 sm:w-9 ${
                      isOpen
                        ? "rotate-180 bg-sky-500 text-white"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div id={answerId} className="px-4 pb-5 sm:px-6 sm:pb-6">
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Support prompt */}
        <div className="mt-8 rounded-2xl border border-sky-100 bg-white p-5 text-center sm:mt-10 sm:p-7">
          <h3 className="text-lg font-black text-gray-900 sm:text-xl">
            Still have questions?
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
            Visit our official support channels for help with your account or
            order.
          </p>
        </div>
      </div>
    </section>
  );
}