export default function Footer() {
  return (
    <footer className="bg-sky-700 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="grid md:grid-cols-3 gap-8">

          <div>
            <h2 className="text-2xl font-extrabold">
              ProxySocials
            </h2>

            <p className="mt-4 text-sky-100">
              Your trusted marketplace for digital services,
              subscriptions, gift cards, airtime, and data.
            </p>
          </div>


          <div>
            <h3 className="text-lg font-bold">
              Services
            </h3>

            <ul className="mt-4 space-y-2 text-sky-100">
              <li>Social Media Growth</li>
              <li>Streaming Subscriptions</li>
              <li>Gift Cards</li>
              <li>Airtime & Data</li>
            </ul>
          </div>


          <div>
            <h3 className="text-lg font-bold">
              Contact
            </h3>

            <p className="mt-4 text-sky-100">
              WhatsApp: +234 816 125 0950
            </p>

            <p className="mt-2 text-sky-100">
              Telegram: @proxysocials
            </p>
          </div>

        </div>


        <div className="mt-10 pt-6 border-t border-sky-500 text-center text-sky-100">
          <p>
            © ProxySocials. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}