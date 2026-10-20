import { useEffect, useMemo, useState } from "react";
import { getFinancialData } from "../services/FinancialDataService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value) =>
  value === null ? "N/A" : `${value.toFixed(2)}%`;

function calculateScenario(revenue, expenses, revenueChange, expenseChange) {
  const currentProfit = revenue - expenses;
  const projectedRevenue = revenue * (1 + revenueChange / 100);
  const projectedExpenses = expenses * (1 + expenseChange / 100);
  const projectedProfit = projectedRevenue - projectedExpenses;

  return {
    currentRevenue: revenue,
    currentExpenses: expenses,
    currentProfit,
    currentMargin: revenue > 0 ? (currentProfit / revenue) * 100 : null,
    projectedRevenue,
    projectedExpenses,
    projectedProfit,
    projectedMargin:
      projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : null,
    profitDifference: projectedProfit - currentProfit,
  };
}

function getTransactions(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.transactions)) return response.transactions;
  return [];
}

function ScenarioAnalysis() {
  const [transactions, setTransactions] = useState([]);
  const [revenueChange, setRevenueChange] = useState("10");
  const [expenseChange, setExpenseChange] = useState("5");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const totals = useMemo(() => {
    return transactions.reduce(
      (result, transaction) => {
        const amount = Number(transaction.amount);

        if (!Number.isFinite(amount) || amount < 0) return result;

        if (transaction.type === "Revenue") {
          result.revenue += amount;
        } else if (transaction.type === "Expense") {
          result.expenses += amount;
        }

        return result;
      },
      { revenue: 0, expenses: 0 },
    );
  }, [transactions]);

  const scenario = useMemo(() => {
    const revenuePercent = Number(revenueChange);
    const expensePercent = Number(expenseChange);

    if (
      revenueChange.trim() === "" ||
      expenseChange.trim() === "" ||
      !Number.isFinite(revenuePercent) ||
      !Number.isFinite(expensePercent) ||
      revenuePercent < -100 ||
      expensePercent < -100 ||
      revenuePercent > 1000 ||
      expensePercent > 1000
    ) {
      return null;
    }

    return calculateScenario(
      totals.revenue,
      totals.expenses,
      revenuePercent,
      expensePercent,
    );
  }, [totals, revenueChange, expenseChange]);

  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const cardClass = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">Loading your financial records...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Financial planning
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Scenario Analysis
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Explore how changes in revenue and expenses could affect your
            business profitability before making financial decisions.
          </p>
        </header>

        {error && (
          <section
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <p className="font-semibold">Unable to load data</p>
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
              Add revenue and expense records in Financial Data to create a
              scenario based on your business figures.
            </p>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">Current revenue</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.revenue)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Current expenses
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.expenses)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Current profit / loss
            </p>
            <p
              className={`mt-3 text-2xl font-bold ${
                totals.revenue - totals.expenses >= 0
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(totals.revenue - totals.expenses)}
            </p>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-bold text-gray-900">
            Build your scenario
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Enter percentage changes to see the projected financial outcome.
            Negative values represent decreases.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="revenueChange"
                className="font-semibold text-gray-800"
              >
                Revenue change (%)
              </label>

              <input
                id="revenueChange"
                type="number"
                step="0.1"
                min="-100"
                max="1000"
                value={revenueChange}
                onChange={(event) => setRevenueChange(event.target.value)}
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-500">
                Example: 10 means revenue increases by 10%.
              </p>
            </div>

            <div>
              <label
                htmlFor="expenseChange"
                className="font-semibold text-gray-800"
              >
                Expense change (%)
              </label>

              <input
                id="expenseChange"
                type="number"
                step="0.1"
                min="-100"
                max="1000"
                value={expenseChange}
                onChange={(event) => setExpenseChange(event.target.value)}
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-500">
                Example: -5 means expenses decrease by 5%.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setRevenueChange("10");
                setExpenseChange("5");
              }}
              className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              Reset to example
            </button>

            <button
              type="button"
              onClick={() => {
                setRevenueChange("0");
                setExpenseChange("0");
              }}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              No change
            </button>
          </div>

          {!scenario && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              Enter valid percentages between -100% and 1000%.
            </p>
          )}
        </section>

        {scenario && (
          <>
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Projected results
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className={cardClass}>
                  <p className="text-sm text-gray-500">Projected revenue</p>
                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {formatCurrency(scenario.projectedRevenue)}
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm text-gray-500">Projected expenses</p>
                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {formatCurrency(scenario.projectedExpenses)}
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm text-gray-500">
                    Projected profit / loss
                  </p>
                  <p
                    className={`mt-3 text-xl font-bold ${
                      scenario.projectedProfit >= 0
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(scenario.projectedProfit)}
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm text-gray-500">Projected margin</p>
                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {formatPercent(scenario.projectedMargin)}
                  </p>
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                Before vs. after
              </h2>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-3 pr-4 font-semibold">Metric</th>
                      <th className="py-3 pr-4 font-semibold">Current</th>
                      <th className="py-3 pr-4 font-semibold">Projected</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-4 pr-4 font-medium text-gray-700">
                        Revenue
                      </td>
                      <td className="py-4 pr-4">
                        {formatCurrency(scenario.currentRevenue)}
                      </td>
                      <td className="py-4 pr-4">
                        {formatCurrency(scenario.projectedRevenue)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-4 pr-4 font-medium text-gray-700">
                        Expenses
                      </td>
                      <td className="py-4 pr-4">
                        {formatCurrency(scenario.currentExpenses)}
                      </td>
                      <td className="py-4 pr-4">
                        {formatCurrency(scenario.projectedExpenses)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-4 pr-4 font-medium text-gray-700">
                        Profit / loss
                      </td>
                      <td className="py-4 pr-4">
                        {formatCurrency(scenario.currentProfit)}
                      </td>
                      <td className="py-4 pr-4">
                        {formatCurrency(scenario.projectedProfit)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-4 pr-4 font-medium text-gray-700">
                        Profit margin
                      </td>
                      <td className="py-4 pr-4">
                        {formatPercent(scenario.currentMargin)}
                      </td>
                      <td className="py-4 pr-4">
                        {formatPercent(scenario.projectedMargin)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-xl bg-gray-50 p-5">
                <p className="text-sm font-medium text-gray-500">
                  Change in profit
                </p>

                <p
                  className={`mt-2 text-3xl font-bold ${
                    scenario.profitDifference >= 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {scenario.profitDifference > 0 ? "+" : ""}
                  {formatCurrency(scenario.profitDifference)}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  {scenario.profitDifference > 0
                    ? "Your projected profit improves under this scenario."
                    : scenario.profitDifference < 0
                      ? "Your projected profit declines under this scenario."
                      : "Your projected profit remains unchanged."}
                </p>
              </div>
            </section>
          </>
        )}

        <p className="text-xs leading-5 text-gray-500">
          These figures are simulations based on your recorded transactions and
          the percentages entered. They are projections, not guarantees of
          future business performance. This page uses all retrieved revenue and
          expense records, including unpaid records, and does not apply a date
          range.
        </p>
      </div>
    </main>
  );
}

export default ScenarioAnalysis;
