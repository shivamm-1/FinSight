import { useEffect, useMemo, useState } from "react";
import { getFinancialData } from "../services/financialDataService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value) =>
  value === null || !Number.isFinite(value) ? "N/A" : `${value.toFixed(2)}%`;

function getTransactions(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.transactions)) return response.transactions;
  return [];
}

function ProductProfitability() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("profit");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFinancialData() {
      try {
        setLoading(true);
        setError("");

        const response = await getFinancialData();

        if (active) {
          setTransactions(getTransactions(response));
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load financial records. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFinancialData();

    return () => {
      active = false;
    };
  }, []);

  const categoryData = useMemo(() => {
    const categories = new Map();

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);
      const type = transaction.type;

      if (
        !Number.isFinite(amount) ||
        amount < 0 ||
        !["Revenue", "Expense"].includes(type)
      ) {
        return;
      }

      const category =
        String(transaction.category || "").trim() || "Uncategorized";

      if (!categories.has(category)) {
        categories.set(category, {
          category,
          revenue: 0,
          expenses: 0,
          revenueTransactions: 0,
          expenseTransactions: 0,
        });
      }

      const item = categories.get(category);

      if (type === "Revenue") {
        item.revenue += amount;
        item.revenueTransactions += 1;
      } else {
        item.expenses += amount;
        item.expenseTransactions += 1;
      }
    });

    return [...categories.values()].map((item) => {
      const profit = item.revenue - item.expenses;

      return {
        ...item,
        profit,
        margin: item.revenue > 0 ? (profit / item.revenue) * 100 : null,
        totalTransactions: item.revenueTransactions + item.expenseTransactions,
      };
    });
  }, [transactions]);

  const totals = useMemo(
    () =>
      categoryData.reduce(
        (result, item) => ({
          revenue: result.revenue + item.revenue,
          expenses: result.expenses + item.expenses,
          profit: result.profit + item.profit,
          transactionCount: result.transactionCount + item.totalTransactions,
        }),
        {
          revenue: 0,
          expenses: 0,
          profit: 0,
          transactionCount: 0,
        },
      ),
    [categoryData],
  );

  const visibleCategories = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = categoryData.filter((item) =>
      item.category.toLowerCase().includes(search),
    );

    return filtered.sort((a, b) => {
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "expenses") return b.expenses - a.expenses;
      if (sortBy === "margin") {
        return (b.margin ?? -Infinity) - (a.margin ?? -Infinity);
      }
      return b.profit - a.profit;
    });
  }, [categoryData, searchTerm, sortBy]);

  const highestRevenueCategory = useMemo(
    () =>
      categoryData.reduce(
        (best, item) => (!best || item.revenue > best.revenue ? item : best),
        null,
      ),
    [categoryData],
  );

  const highestProfitCategory = useMemo(
    () =>
      categoryData.reduce(
        (best, item) => (!best || item.profit > best.profit ? item : best),
        null,
      ),
    [categoryData],
  );

  const highestExpenseCategory = useMemo(
    () =>
      categoryData.reduce(
        (best, item) => (!best || item.expenses > best.expenses ? item : best),
        null,
      ),
    [categoryData],
  );

  const inputClass =
    "rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const cardClass = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">Loading category profitability...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Business performance
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Product Profitability
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Compare revenue, expenses, and estimated profit across your recorded
            categories to identify areas performing well and areas that may need
            attention.
          </p>
        </header>

        {error && (
          <section
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <p className="font-semibold">Unable to load financial records</p>
            <p className="mt-1 text-sm">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Retry
            </button>
          </section>
        )}

        {!error && transactions.length === 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-900">
              No financial records found
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              Add revenue and expense transactions with categories to compare
              their financial performance.
            </p>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">Total revenue</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.revenue)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">Total expenses</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.expenses)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Estimated profit / loss
            </p>
            <p
              className={`mt-3 text-2xl font-bold ${
                totals.profit >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {formatCurrency(totals.profit)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Categories analyzed
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {categoryData.length}
            </p>
          </div>
        </section>

        {categoryData.length > 0 && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={cardClass}>
                <p className="text-sm font-medium text-gray-500">
                  Highest revenue category
                </p>
                <p className="mt-3 break-words text-lg font-bold text-gray-900">
                  {highestRevenueCategory?.category || "N/A"}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {formatCurrency(highestRevenueCategory?.revenue ?? 0)}
                </p>
              </div>

              <div className={cardClass}>
                <p className="text-sm font-medium text-gray-500">
                  Highest profit category
                </p>
                <p className="mt-3 break-words text-lg font-bold text-gray-900">
                  {highestProfitCategory?.category || "N/A"}
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    (highestProfitCategory?.profit ?? 0) >= 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(highestProfitCategory?.profit ?? 0)}
                </p>
              </div>

              <div className={cardClass}>
                <p className="text-sm font-medium text-gray-500">
                  Highest expense category
                </p>
                <p className="mt-3 break-words text-lg font-bold text-gray-900">
                  {highestExpenseCategory?.category || "N/A"}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {formatCurrency(highestExpenseCategory?.expenses ?? 0)}
                </p>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                Compare categories
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Search by category or sort the results by revenue, expenses,
                profit, or profit margin.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="categorySearch"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Search category
                  </label>
                  <input
                    id="categorySearch"
                    type="search"
                    placeholder="Enter a category..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className={`w-full ${inputClass}`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="sortBy"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Sort by
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className={`w-full ${inputClass}`}
                  >
                    <option value="profit">Highest profit</option>
                    <option value="revenue">Highest revenue</option>
                    <option value="expenses">Highest expenses</option>
                    <option value="margin">Highest profit margin</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-3 pr-4 font-semibold">Category</th>
                      <th className="py-3 pr-4 font-semibold">Revenue</th>
                      <th className="py-3 pr-4 font-semibold">Expenses</th>
                      <th className="py-3 pr-4 font-semibold">Profit / Loss</th>
                      <th className="py-3 pr-4 font-semibold">Margin</th>
                      <th className="py-3 pr-4 font-semibold">Records</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {visibleCategories.map((item) => (
                      <tr key={item.category}>
                        <td className="py-4 pr-4 font-medium text-gray-900">
                          {item.category}
                        </td>
                        <td className="py-4 pr-4">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="py-4 pr-4">
                          {formatCurrency(item.expenses)}
                        </td>
                        <td
                          className={`py-4 pr-4 font-semibold ${
                            item.profit >= 0
                              ? "text-emerald-700"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(item.profit)}
                        </td>
                        <td className="py-4 pr-4">
                          {formatPercent(item.margin)}
                        </td>
                        <td className="py-4 pr-4">{item.totalTransactions}</td>
                      </tr>
                    ))}

                    {visibleCategories.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-gray-500"
                        >
                          No categories match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                Profitability observations
              </h2>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                <li>
                  <strong className="text-gray-900">
                    Revenue performance:
                  </strong>{" "}
                  {highestRevenueCategory
                    ? `${highestRevenueCategory.category} has the highest recorded revenue.`
                    : "No revenue data is available."}
                </li>

                <li>
                  <strong className="text-gray-900">Profit performance:</strong>{" "}
                  {highestProfitCategory
                    ? highestProfitCategory.profit > 0
                      ? `${highestProfitCategory.category} has the highest estimated profit.`
                      : highestProfitCategory.profit < 0
                        ? `${highestProfitCategory.category} has the highest profit figure, but it is still a loss.`
                        : `${highestProfitCategory.category} has the highest profit figure, which is zero.`
                    : "No category data is available."}
                </li>

                <li>
                  <strong className="text-gray-900">
                    Loss-making categories:
                  </strong>{" "}
                  {categoryData.filter((item) => item.profit < 0).length === 0
                    ? "No categories currently show expenses greater than revenue."
                    : `${categoryData.filter((item) => item.profit < 0).length} category/categories have recorded expenses greater than revenue.`}
                </li>
              </ul>
            </section>
          </>
        )}

        <p className="text-xs leading-5 text-gray-500">
          This page groups transactions by category, not by a dedicated product
          ID. A category's estimated profit is its recorded revenue minus all
          recorded expenses assigned to the same category. If shared expenses
          are not allocated to categories, category-level profit may not
          represent actual product profitability. Unpaid transactions are
          included, and no date filter is applied.
        </p>
      </div>
    </main>
  );
}

export default ProductProfitability;
