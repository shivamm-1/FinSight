import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Receipt,
  Search,
} from "lucide-react";

import {
  getFinancialData,
  createFinancialData,
  updateFinancialData,
  deleteFinancialData,
} from "../services/FinancialDataService";

const initialForm = {
  type: "Revenue",
  category: "",
  amount: "",
  date: new Date().toLocaleDateString("en-CA"),
  description: "",
  paymentMethod: "Cash",
  isPaid: false,
  paymentDate: "",
};

const paymentMethods = ["Cash", "Bank", "UPI", "Card", "Other"];

function getDateValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRecords(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  const dateValue = getDateValue(value);
  if (!dateValue) return "—";

  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year}`;
}

function FinancialData() {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const loadTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getFinancialData();
      setTransactions(getRecords(response));
    } catch (error) {
      setTransactions([]);
      toast.error(
        error.response?.data?.message || "Unable to load financial records.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "isPaid" && !checked) {
        updated.paymentDate = "";
      }

      return updated;
    });
  }

  function resetForm() {
    setFormData(initialForm);
    setEditingId(null);
  }

  function handleEdit(transaction) {
    setEditingId(transaction._id);

    setFormData({
      type: transaction.type || "Revenue",
      category: transaction.category || "",
      amount: String(transaction.amount ?? ""),
      date: getDateValue(transaction.date),
      description: transaction.description || "",
      paymentMethod: transaction.paymentMethod || "Cash",
      isPaid: transaction.isPaid === true,
      paymentDate: getDateValue(transaction.paymentDate),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.category.trim()) {
      toast.error("Please enter a category.");
      return;
    }

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    if (!formData.date) {
      toast.error("Please select the transaction date.");
      return;
    }

    if (formData.isPaid && !formData.paymentDate) {
      toast.error("Please select the payment date for a paid transaction.");
      return;
    }

    if (formData.isPaid && formData.paymentDate < formData.date) {
      toast.error("Payment date cannot be earlier than the transaction date.");
      return;
    }

    const payload = {
      type: formData.type,
      category: formData.category.trim(),
      amount,
      date: formData.date,
      description: formData.description.trim(),
      paymentMethod: formData.paymentMethod,
      isPaid: Boolean(formData.isPaid),
      paymentDate: formData.isPaid ? formData.paymentDate : null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateFinancialData(editingId, payload);
        toast.success("Financial record updated successfully.");
      } else {
        await createFinancialData(payload);
        toast.success("Financial record added successfully.");
      }

      resetForm();
      await loadTransactions();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to save the financial record. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(transaction) {
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex w-full items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={18} />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-semibold text-gray-900">
                Delete this transaction?
              </p>

              <p className="text-xs text-gray-500">
                {transaction.category} · ₹
                {Number(transaction.amount).toLocaleString("en-IN")}
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(false);
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(true);
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: "top-center",
          style: {
            maxWidth: "380px",
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            border: "1px solid #fee2e2",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          },
        },
      );
    });

    if (!confirmed) return;

    try {
      await deleteFinancialData(transaction._id);

      if (editingId === transaction._id) {
        resetForm();
      }

      setTransactions((previous) =>
        previous.filter((item) => item._id !== transaction._id),
      );

      toast.success("Financial record deleted successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to delete the financial record.",
      );
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      (transaction.category || "").toLowerCase().includes(search) ||
      (transaction.description || "").toLowerCase().includes(search) ||
      (transaction.paymentMethod || "").toLowerCase().includes(search);

    const matchesType = typeFilter === "All" || transaction.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalRevenue = transactions
    .filter((item) => item.type === "Revenue")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const netTotal = totalRevenue - totalExpenses;

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-8 text-[#222222] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
              Financial management
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Financial Data
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Record and manage your business revenue and expenses in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={loadTransactions}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total revenue"
            amount={formatCurrency(totalRevenue)}
            detail="All recorded revenue"
          />
          <SummaryCard
            label="Total expenses"
            amount={formatCurrency(totalExpenses)}
            detail="All recorded expenses"
          />
          <SummaryCard
            label="Net total"
            amount={formatCurrency(netTotal)}
            detail="Revenue minus expenses"
          />
        </section>

        <section
          id="financial-entry-form"
          className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit transaction" : "Add a transaction"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the details of your business transaction.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                <X size={15} />
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Transaction type">
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </FormField>

              <FormField label="Category">
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Sales, Rent, Salary"
                  maxLength={100}
                  className="form-control"
                  required
                />
              </FormField>

              <FormField label="Amount (₹)">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="form-control"
                  required
                />
              </FormField>

              <FormField label="Transaction date">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </FormField>

              <FormField label="Payment method">
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Payment status">
                <select
                  name="isPaid"
                  value={String(formData.isPaid)}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      isPaid: event.target.value === "true",
                      paymentDate:
                        event.target.value === "true"
                          ? previous.paymentDate
                          : "",
                    }))
                  }
                  className="form-control"
                >
                  <option value="false">Not paid</option>
                  <option value="true">Paid</option>
                </select>
              </FormField>

              {formData.isPaid && (
                <FormField label="Payment date">
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    min={formData.date}
                    className="form-control"
                    required
                  />
                </FormField>
              )}

              <div className="sm:col-span-2 lg:col-span-3">
                <FormField label="Description (optional)">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add a short note about this transaction"
                    rows={3}
                    maxLength={500}
                    className="form-control resize-y"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">
                    {formData.description.length}/500
                  </p>
                </FormField>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#222222] px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add transaction"}
              </button>

              {!editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Clear form
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">Transactions</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredTransactions.length} record
                {filteredTransactions.length === 1 ? "" : "s"} displayed
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search records"
                  aria-label="Search financial records"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 sm:w-52"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filter by transaction type"
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              >
                <option value="All">All types</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-gray-500">
              <RefreshCw size={17} className="animate-spin" />
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-gray-50 p-4">
                <Receipt size={25} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold">
                {transactions.length === 0
                  ? "No transactions yet"
                  : "No matching transactions"}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                {transactions.length === 0
                  ? "Add your first revenue or expense using the form above."
                  : "Try a different search term or transaction type."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            transaction.type === "Revenue"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-800">
                        {transaction.category}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums">
                        {formatCurrency(transaction.amount)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {transaction.paymentMethod || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            transaction.isPaid
                              ? "bg-gray-100 text-gray-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {transaction.isPaid ? "Paid" : "Not paid"}
                        </span>
                      </td>

                      <td className="max-w-48 truncate px-5 py-4 text-gray-500">
                        {transaction.description || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(transaction)}
                            aria-label={`Edit ${transaction.category}`}
                            title="Edit transaction"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(transaction)}
                            aria-label={`Delete ${transaction.category}`}
                            title="Delete transaction"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .form-control {
          display: block;
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          padding: 11px 12px;
          color: #222222;
          font-size: 14px;
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .form-control:focus {
          border-color: #9ca3af;
          box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.12);
        }

        .form-control::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </main>
  );
}

function SummaryCard({ label, amount, detail }) {
  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums">
        {amount}
      </p>
      <p className="mt-2 text-xs text-gray-400">{detail}</p>
    </article>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

export default FinancialData;
