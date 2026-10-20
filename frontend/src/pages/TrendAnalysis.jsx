import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getFinancialData } from "../services/FinancialDataService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value) =>
  value === null || !Number.isFinite(value) ? "N/A" : `${value.toFixed(2)}%`;

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getFinancialYearStart = (date = new Date()) =>
  date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;

const getCurrentQuarter = (date = new Date()) => {
  const month = date.getMonth();
  if (month >= 3 && month <= 5) return "Q1";
  if (month >= 6 && month <= 8) return "Q2";
  if (month >= 9 && month <= 11) return "Q3";
  return "Q4";
};

function getTransactions(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.transactions)) return response.transactions;
  return [];
}

function getMonthKey(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function getQuarterForMonth(monthKey) {
  const [, monthString] = monthKey.split("-");
  const month = Number(monthString);

  if (month >= 4 && month <= 6) return "Q1";
  if (month >= 7 && month <= 9) return "Q2";
  if (month >= 10 && month <= 12) return "Q3";
  return "Q4";
}

function getFinancialYearForMonth(monthKey) {
  const [yearString, monthString] = monthKey.split("-");
  const year = Number(yearString);
  const month = Number(monthString);

  return month >= 4 ? year : year - 1;
}

function getFinancialYearLabel(startYear) {
  return `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
}

function TrendAnalysis() {
  const currentDate = new Date();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [periodType, setPeriodType] = useState("financialYear");
  const [financialYear, setFinancialYear] = useState(
    String(getFinancialYearStart(currentDate)),
  );
  const [quarter, setQuarter] = useState(getCurrentQuarter(currentDate));
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

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

  const monthlyData = useMemo(() => {
    const monthMap = new Map();

    transactions.forEach((transaction) => {
      const monthKey = getMonthKey(transaction.date);
      const amount = Number(transaction.amount);

      if (
        !monthKey ||
        !Number.isFinite(amount) ||
        amount < 0 ||
        !["Revenue", "Expense"].includes(transaction.type)
      ) {
        return;
      }

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          revenue: 0,
          expenses: 0,
          records: 0,
        });
      }

      const month = monthMap.get(monthKey);

      if (transaction.type === "Revenue") {
        month.revenue += amount;
      } else {
        month.expenses += amount;
      }

      month.records += 1;
    });

    return [...monthMap.values()]
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((month, index, months) => {
        const previous = months[index - 1];
        const profit = month.revenue - month.expenses;

        const previousProfit = previous
          ? previous.revenue - previous.expenses
          : null;

        const revenueChange =
          previous && previous.revenue !== 0
            ? ((month.revenue - previous.revenue) / previous.revenue) * 100
            : null;

        const expenseChange =
          previous && previous.expenses !== 0
            ? ((month.expenses - previous.expenses) / previous.expenses) * 100
            : null;

        const profitChange =
          previousProfit !== null && previousProfit !== 0
            ? ((profit - previousProfit) / Math.abs(previousProfit)) * 100
            : null;

        return {
          ...month,
          profit,
          revenueChange,
          expenseChange,
          profitChange,
        };
      });
  }, [transactions]);

  const availableFinancialYears = useMemo(() => {
    const years = new Set(
      monthlyData.map((month) => getFinancialYearForMonth(month.monthKey)),
    );

    years.add(getFinancialYearStart(currentDate));

    return [...years].sort((a, b) => b - a);
  }, [monthlyData]);

  const availableMonths = useMemo(() => {
    const months = new Set(monthlyData.map((month) => month.monthKey));
    months.add(getCurrentMonthKey());

    return [...months].sort((a, b) => b.localeCompare(a));
  }, [monthlyData]);

  const visibleMonths = useMemo(() => {
    if (periodType === "month") {
      return monthlyData.filter((month) => month.monthKey === selectedMonth);
    }

    if (periodType === "quarter") {
      const selectedFY = Number(financialYear);

      return monthlyData.filter(
        (month) =>
          getFinancialYearForMonth(month.monthKey) === selectedFY &&
          getQuarterForMonth(month.monthKey) === quarter,
      );
    }

    const selectedFY = Number(financialYear);

    return monthlyData.filter(
      (month) => getFinancialYearForMonth(month.monthKey) === selectedFY,
    );
  }, [monthlyData, periodType, financialYear, quarter, selectedMonth]);

  const totals = useMemo(
    () =>
      visibleMonths.reduce(
        (result, month) => ({
          revenue: result.revenue + month.revenue,
          expenses: result.expenses + month.expenses,
          profit: result.profit + month.profit,
        }),
        { revenue: 0, expenses: 0, profit: 0 },
      ),
    [visibleMonths],
  );

  const chartData = {
    labels: visibleMonths.map((month) => formatMonth(month.monthKey)),
    datasets: [
      {
        label: "Revenue",
        data: visibleMonths.map((month) => month.revenue),
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: "Expenses",
        data: visibleMonths.map((month) => month.expenses),
        borderColor: "#dc2626",
        backgroundColor: "#dc2626",
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: "Profit / Loss",
        data: visibleMonths.map((month) => month.profit),
        borderColor: "#059669",
        backgroundColor: "#059669",
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `₹${Number(value).toLocaleString("en-IN")}`,
        },
      },
    },
  };

  const selectedPeriodLabel =
    periodType === "month"
      ? formatMonth(selectedMonth)
      : periodType === "quarter"
        ? `${quarter} — ${getFinancialYearLabel(Number(financialYear))}`
        : getFinancialYearLabel(Number(financialYear));

  const cardClass = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-500">Loading financial trends...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Financial performance
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Trend Analysis
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Analyze your business revenue, expenses, and profit or loss over a
            financial year, quarter, or specific month.
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

        <section className={cardClass}>
          <h2 className="text-xl font-bold text-gray-900">
            Select reporting period
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Choose the period you want to analyze. The figures, chart, and table
            will update accordingly.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="periodType"
                className="font-semibold text-gray-800"
              >
                Period type
              </label>

              <select
                id="periodType"
                value={periodType}
                onChange={(event) => setPeriodType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="financialYear">Financial Year</option>
                <option value="quarter">Quarter</option>
                <option value="month">Specific Month</option>
              </select>
            </div>

            {periodType !== "month" && (
              <div>
                <label
                  htmlFor="financialYear"
                  className="font-semibold text-gray-800"
                >
                  Financial year
                </label>

                <select
                  id="financialYear"
                  value={financialYear}
                  onChange={(event) => setFinancialYear(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {availableFinancialYears.map((year) => (
                    <option key={year} value={year}>
                      {getFinancialYearLabel(year)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodType === "quarter" && (
              <div>
                <label
                  htmlFor="quarter"
                  className="font-semibold text-gray-800"
                >
                  Quarter
                </label>

                <select
                  id="quarter"
                  value={quarter}
                  onChange={(event) => setQuarter(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Q1">Q1 (April–June)</option>
                  <option value="Q2">Q2 (July–September)</option>
                  <option value="Q3">Q3 (October–December)</option>
                  <option value="Q4">Q4 (January–March)</option>
                </select>
              </div>
            )}

            {periodType === "month" && (
              <div>
                <label
                  htmlFor="selectedMonth"
                  className="font-semibold text-gray-800"
                >
                  Specific month
                </label>

                <select
                  id="selectedMonth"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {availableMonths.map((monthKey) => (
                    <option key={monthKey} value={monthKey}>
                      {formatMonth(monthKey)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">Selected period</p>
            <p className="mt-1 font-bold text-blue-950">
              {selectedPeriodLabel}
            </p>
          </div>
        </section>

        {!error && transactions.length === 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-900">
              No financial records found
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              Add revenue and expense records to view your trends.
            </p>
          </section>
        )}

        {transactions.length > 0 && visibleMonths.length === 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-900">
              No records for this period
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              No valid dated revenue or expense transactions were found for{" "}
              {selectedPeriodLabel}. Choose another period or add financial
              records for the selected dates.
            </p>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">Revenue</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.revenue)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">Expenses</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.expenses)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">Profit / Loss</p>
            <p
              className={`mt-3 text-2xl font-bold ${
                totals.profit >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {formatCurrency(totals.profit)}
            </p>
          </div>
        </section>

        {visibleMonths.length > 0 && (
          <>
            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                Performance trend
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Monthly revenue, expenses, and profit/loss for{" "}
                {selectedPeriodLabel}.
              </p>

              <div className="mt-6 h-80">
                <Line data={chartData} options={chartOptions} />
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                Period breakdown
              </h2>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-3 pr-4 font-semibold">Month</th>
                      <th className="py-3 pr-4 font-semibold">Revenue</th>
                      <th className="py-3 pr-4 font-semibold">Expenses</th>
                      <th className="py-3 pr-4 font-semibold">Profit / Loss</th>
                      <th className="py-3 pr-4 font-semibold">
                        Revenue change
                      </th>
                      <th className="py-3 pr-4 font-semibold">
                        Expense change
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {visibleMonths.map((month) => (
                      <tr key={month.monthKey}>
                        <td className="py-4 pr-4 font-medium text-gray-900">
                          {formatMonth(month.monthKey)}
                        </td>
                        <td className="py-4 pr-4">
                          {formatCurrency(month.revenue)}
                        </td>
                        <td className="py-4 pr-4">
                          {formatCurrency(month.expenses)}
                        </td>
                        <td
                          className={`py-4 pr-4 font-semibold ${
                            month.profit >= 0
                              ? "text-emerald-700"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(month.profit)}
                        </td>
                        <td className="py-4 pr-4">
                          {formatPercent(month.revenueChange)}
                        </td>
                        <td className="py-4 pr-4">
                          {formatPercent(month.expenseChange)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                      <td className="py-4 pr-4">Total</td>
                      <td className="py-4 pr-4">
                        {formatCurrency(totals.revenue)}
                      </td>
                      <td className="py-4 pr-4">
                        {formatCurrency(totals.expenses)}
                      </td>
                      <td className="py-4 pr-4">
                        {formatCurrency(totals.profit)}
                      </td>
                      <td className="py-4 pr-4">—</td>
                      <td className="py-4 pr-4">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                Performance observations
              </h2>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                <li>
                  <strong className="text-gray-900">Revenue:</strong>{" "}
                  {visibleMonths.length >= 2
                    ? visibleMonths.at(-1).revenue >
                      visibleMonths.at(-2).revenue
                      ? "Revenue increased in the latest month compared with the previous month in this period."
                      : visibleMonths.at(-1).revenue <
                          visibleMonths.at(-2).revenue
                        ? "Revenue decreased in the latest month compared with the previous month in this period."
                        : "Revenue was unchanged in the latest month compared with the previous month in this period."
                    : "At least two months with records are needed to compare monthly revenue."}
                </li>

                <li>
                  <strong className="text-gray-900">Expenses:</strong>{" "}
                  {visibleMonths.length >= 2
                    ? visibleMonths.at(-1).expenses >
                      visibleMonths.at(-2).expenses
                      ? "Expenses increased in the latest month compared with the previous month in this period."
                      : visibleMonths.at(-1).expenses <
                          visibleMonths.at(-2).expenses
                        ? "Expenses decreased in the latest month compared with the previous month in this period."
                        : "Expenses were unchanged in the latest month compared with the previous month in this period."
                    : "At least two months with records are needed to compare monthly expenses."}
                </li>

                <li>
                  <strong className="text-gray-900">
                    Latest month with records:
                  </strong>{" "}
                  {visibleMonths.at(-1).profit >= 0
                    ? "Revenue exceeded expenses."
                    : "Expenses exceeded revenue."}
                </li>
              </ul>
            </section>
          </>
        )}

        <p className="text-xs leading-5 text-gray-500">
          This analysis includes all retrieved revenue and expense records with
          valid transaction dates, including unpaid records. Months without
          transactions are not shown in the chart or table. Percentage changes
          compare consecutive months with records and are N/A when a
          previous-month baseline is unavailable or zero. These figures describe
          recorded transactions and are not forecasts.
        </p>
      </div>
    </main>
  );
}

export default TrendAnalysis;
