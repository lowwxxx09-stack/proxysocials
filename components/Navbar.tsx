export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 bg-white shadow">
      <h1 className="text-2xl font-bold text-sky-600">
        ProxySocials
      </h1>

      <div className="flex gap-6 text-gray-700 font-medium">
        <a href="#">Home</a>
        <a href="#">Services</a>
        <a href="#">Referral</a>
        <a href="#">Contact</a>
      </div>

      <button className="bg-sky-600 text-white px-5 py-2 rounded-lg hover:bg-sky-700 transition">
        Login
      </button>
    </nav>
  );
}