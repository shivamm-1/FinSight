import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getBusinessProfile,
  createBusinessProfile,
  updateBusinessProfile,
} from "../services/BusinessProfileService";

function BusinessProfile() {
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    industry: "",
    ownerName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });

  const [profileId, setProfileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await getBusinessProfile();
        const profile = response.profile ?? response.data ?? response;

        if (profile && profile.businessName) {
          setFormData((previous) => ({
            ...previous,
            ...profile,
          }));
          setProfileId(profile._id ?? profile.id ?? null);
        }
      } catch (err) {
        const status = err.response?.status;

        if (status !== 404) {
          const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load your business profile.";

          setError(message);
          toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

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
    setSaving(true);

    const profileData = {
      businessName: formData.businessName.trim(),
      businessType: formData.businessType,
      industry: formData.industry.trim(),
      ownerName: formData.ownerName.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      address: formData.address.trim(),
    };

    try {
      let response;

      if (profileId) {
        response = await updateBusinessProfile(profileId, profileData);
      } else {
        response = await createBusinessProfile(profileData);
      }

      const savedProfile = response.profile ?? response.data ?? response;

      setProfileId(savedProfile._id ?? savedProfile.id ?? profileId);

      toast.success(
        profileId
          ? "Business profile updated successfully!"
          : "Business profile created successfully!",
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to save your business profile. Please try again.";

      setError(message);
      toast.error(message, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

  const labelClass = "block text-xs font-medium text-gray-600";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafaf9] px-5 py-10 text-gray-900 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-gray-500">Loading business profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] px-5 py-10 text-gray-900 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">
            Business settings
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Business profile
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Manage your business information in one place.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-8">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <section>
              <h2 className="text-sm font-semibold">Business details</h2>

              <p className="mt-1 text-xs text-gray-500">
                Basic information about your business.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="businessName">
                    Business name
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter business name"
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
                    value={formData.industry}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. Retail, Services"
                    maxLength={100}
                    required
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            <section>
              <h2 className="text-sm font-semibold">Owner and contact</h2>

              <p className="mt-1 text-xs text-gray-500">
                Contact information associated with your business.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="ownerName">
                    Owner's full name
                  </label>
                  <input
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter full name"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="contactEmail">
                    Contact email
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
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
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="address">
                    Business address
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

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving
                  ? "Saving..."
                  : profileId
                    ? "Save changes"
                    : "Save business profile"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default BusinessProfile;
