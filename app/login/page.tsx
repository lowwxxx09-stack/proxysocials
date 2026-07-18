export default function Login() {
  return (
    <main className="min-h-screen bg-sky-50 flex items-center justify-center px-6">

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-extrabold text-sky-700 text-center">
          Welcome Back
        </h1>

        <p className="text-gray-600 text-center mt-3">
          Login to your ProxySocials account
        </p>


        <form className="mt-8 space-y-5">

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-600"
            />
          </div>


          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-600"
            />
          </div>


          <button
            type="submit"
            className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition"
          >
            Login
          </button>

        </form>


        <p className="text-center text-gray-600 mt-6">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-sky-700 font-bold"
          >
            Sign Up
          </a>
        </p>


      </div>

    </main>
  );
}