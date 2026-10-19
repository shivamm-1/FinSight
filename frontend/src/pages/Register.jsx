import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerAccount, loginAccount } from "../services/authService";
import { createBusinessProfile } from "../services/businessProfileService";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    businessName: "",
    businessType: "",
    industry: "",
    ownerName: "",
    contactPhone: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const email = formData.email.trim();

    try {
      // Step 1: Create the user account.
      await registerAccount({
        username: formData.username.trim(),
        email,
        password: formData.password,
      });

      // Step 2: Log in to obtain the authentication token.
      const loginResponse = await loginAccount({
        loginId: email,
        password: formData.password,
      });

      if (!loginResponse.token) {
        throw new Error("No authentication token was returned.");
      }

      localStorage.setItem("finsight_token", loginResponse.token);

      // Step 3: Create the business profile using the same email.
      try {
        await createBusinessProfile({
          businessName: formData.businessName.trim(),
          businessType: formData.businessType,
          industry: formData.industry.trim(),
          ownerName: formData.ownerName.trim(),
          contactEmail: email,
          contactPhone: formData.contactPhone.trim(),
          address: formData.address.trim(),
        });
      } catch (profileError) {
        localStorage.removeItem("finsight_token");

        throw new Error(
          profileError.response?.data?.message ||
            profileError.response?.data?.error ||
            "Your account was created, but your business profile could not be saved. Please sign in and try again.",
        );
      }

      // Step 4: Show success notification and redirect.
      toast.success("Account created successfully!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to complete registration. Please try again.";

      setError(message);
      toast.error(message, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

  const labelClass = "block text-xs font-medium text-gray-600";

  return (
    <main className="min-h-screen bg-[#fafaf9] px-4 py-10 text-gray-900 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-xs text-white">
            F
          </span>
          FinSight
        </Link>

        <section className="mt-8 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:mt-10 sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">
              Get started
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Set up your account and business profile to start understanding
              your finances.
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

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Account details */}
            <section>
              <h2 className="text-sm font-semibold">Account details</h2>
              <p className="mt-1 text-xs text-gray-500">
                These details will be used to sign in.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="username">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. business_owner"
                    minLength={3}
                    maxLength={30}
                    pattern="[A-Za-z0-9_]+"
                    title="Use 3–30 letters, numbers, or underscores."
                    autoComplete="username"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="email">
                    Login email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="At least 8 characters"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Business details */}
            <section>
              <h2 className="text-sm font-semibold">Business details</h2>
              <p className="mt-1 text-xs text-gray-500">
                Tell us a little about the business you want to track.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="businessName">
                    Business name
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your business name"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="businessType">
                    Business type
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Sole Proprietorship">
                      Sole Proprietorship
                    </option>
                    <option value="Partnership">Partnership</option>
                    <option value="LLP">LLP</option>
                    <option value="Private Limited Company">
                      Private Limited Company
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="industry">
                    Industry
                  </label>
                  <input
                    id="industry"
                    name="industry"
                    type="text"
                    value={formData.industry}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. Retail, Services"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="ownerName">
                    Owner's full name
                  </label>
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter full name"
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="contactPhone">
                    Contact phone
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    title="Enter exactly 10 digits."
                    autoComplete="tel-national"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="address">
                    Business address{" "}
                    <span className="font-normal text-gray-400">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`${inputClass} min-h-20 resize-y`}
                    placeholder="Enter business address"
                    maxLength={300}
                    rows={2}
                  />
                </div>
              </div>
            </section>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating your account..." : "Create account"}
            </button>

            <p className="text-center text-xs leading-5 text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-gray-900 underline underline-offset-4 hover:text-blue-600"
              >
                Sign in
              </Link>
            </p>
          </form>
        </section>

        <p className="mt-5 text-center text-xs text-gray-400">
          Financial clarity, made simple.
        </p>
      </div>
    </main>
  );
}

export default Register;
