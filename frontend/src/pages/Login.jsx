import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginAccount } from "../services/AuthService";

function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginAccount({
        loginId: loginId.trim(),
        password,
      });

      if (!response.token) {
        throw new Error(
          "Login succeeded, but no authentication token was returned.",
        );
      }

      localStorage.setItem("finsight_token", response.token);

      toast.success("Signed in successfully!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to sign in. Please check your credentials.";

      setError(message);
      toast.error(message, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-4 py-10 text-gray-900">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-xs text-white">
            F
          </span>
          FinSight
        </Link>

        <section className="mt-8 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">
              Welcome back
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Sign in to FinSight
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Access your business finances and insights.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="loginId"
                className="block text-xs font-medium text-gray-600"
              >
                Email or username
              </label>

              <input
                id="loginId"
                name="loginId"
                type="text"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                className={inputClass}
                placeholder="Enter email or username"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-600"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-gray-500">
            New to FinSight?{" "}
            <Link
              to="/register"
              className="font-medium text-gray-900 underline underline-offset-4 hover:text-blue-600"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default Login;
