export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="text-2xl font-extrabold text-sky-700">
          ProxySocials
        </a>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#services"
            className="text-gray-700 hover:text-sky-700 transition"
          >
            Services
          </a>

          <a
            href="#how-it-works"
            className="text-gray-700 hover:text-sky-700 transition"
          >
            How It Works
          </a>

          <a
            href="#faq"
            className="text-gray-700 hover:text-sky-700 transition"
          >
            FAQ
          </a>
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">

          <a
            href="https://wa.me/2348161250950"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-green-600 transition"
          >
            WhatsApp
          </a>

          <a
            href="/login"
            className="border-2 border-sky-600 text-sky-700 px-5 py-2 rounded-xl font-semibold hover:bg-sky-600 hover:text-white transition"
          >
            Login
          </a>

          <a
            href="/signup"
            className="bg-sky-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Sign Up
          </a>

        </div>

      </div>
    </nav>
  );
}