import Link from "next/link";

const services = [
  {
    icon: "📈",
    title: "Social Media Growth",
    description:
      "Instagram, TikTok, Facebook, YouTube, Twitter (X), Telegram and more.",
  },
  {
    icon: "🎬",
    title: "Streaming Subscriptions",
    description:
      "Netflix, Spotify, Apple Music, YouTube Premium and other premium subscriptions.",
  },
  {
    icon: "🎁",
    title: "Gift Cards",
    description:
      "Buy and sell popular gift cards safely at competitive rates.",
  },
  {
    icon: "📱",
    title: "Airtime & Data",
    description:
      "Fast airtime and data top-ups across all major Nigerian networks.",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="bg-white py-20 px-6"
    >
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900">
            Our Services
          </h2>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Everything you need to grow online, stay connected and enjoy premium
            digital services in one place.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white border border-sky-100 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 p-7"
            >
              <div className="text-5xl">
                {service.icon}
              </div>

              <h3 className="mt-5 text-2xl font-black text-gray-900">
                {service.title}
              </h3>

              <p className="mt-4 text-gray-600 leading-7">
                {service.description}
              </p>

              <Link
                href="/services"
                className="mt-6 inline-block text-sky-700 font-bold hover:underline"
              >
                Explore →
              </Link>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}