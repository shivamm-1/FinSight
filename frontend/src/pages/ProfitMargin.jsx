import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  IndianRupee,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getFinancialData } from "../services/FinancialDataService";

const MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

const QUARTERS = [
  { label: "Q1 (Apr - Jun)", months: [3, 4, 5] },
  { label: "Q2 (Jul - Sep)", months: [6, 7, 8] },
  { label: "Q3 (Oct - Dec)", months: [9, 10, 11] },
  { label: "Q4 (Jan - Mar)", months: [0, 1, 2] },
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getRecordDate = (record) => {
  const date = new Date(record.date);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getFinancialYear = (date) =>
  date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;

const getFinancialYearLabel = (year) => `${year}-${String(year + 1).slice(-2)}`;

const getAvailableFinancialYears = (records) => {
  const years = records
    .map(getRecordDate)
    .filter(Boolean)
    .map(getFinancialYear);

  years.push(getFinancialYear(new Date()));

  return [...new Set(years)].sort((a, b) => b - a);
};

const isInFinancialYear = (date, year) =>
  date >= new Date(year, 3, 1) && date < new Date(year + 1, 3, 1);

function StatCard({ title, value, subtitle, icon: Icon, positive }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </h3>
          <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
          <Icon size={20} />
        </div>
      </div>

      {positive !== undefined && (
        <div
          className={`mt-4 flex items-center gap-1 text-sm font-medium ${
            positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {positive ? "Positive margin" : "Negative margin"}
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-800 outline-none focus:border-gray-400"
      >
        {children}
      </select>
    </label>
  );
}

function ProfitMargin() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("year");
  const [selectedYear, setSelectedYear] = useState(
    String(getFinancialYear(new Date())),
  );
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth()),
  );
  const [selectedQuarter, setSelectedQuarter] = useState(
    String(Math.floor(((new Date().getMonth() + 9) % 12) / 3)),
  );

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await getFinancialData();
        const data = Array.isArray(response)
          ? response
          : (response?.data ?? response?.transactions ?? []);

        setRecords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
        toast.error(
          "Unable to load financial data. Please log in again if your session has expired.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const availableYears = useMemo(
    () => getAvailableFinancialYears(records),
    [records],
  );

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const date = getRecordDate(record);

      if (!date || !isInFinancialYear(date, Number(selectedYear))) {
        return false;
      }

      if (period === "month") {
        return date.getMonth() === Number(selectedMonth);
      }

      if (period === "quarter") {
        return QUARTERS[Number(selectedQuarter)]?.months.includes(
          (date.getMonth() + 9) % 12,
        );
      }

      return true;
    });
  }, [records, period, selectedYear, selectedMonth, selectedQuarter]);

  const summary = useMemo(() => {
    const revenueRecords = filteredRecords.filter(
      (record) => record.type === "Revenue",
    );
    const expenseRecords = filteredRecords.filter(
      (record) => record.type === "Expense",
    );

    const revenue = revenueRecords.reduce(
      (total, record) => total + Number(record.amount || 0),
      0,
    );
    const expenses = expenseRecords.reduce(
      (total, record) => total + Number(record.amount || 0),
      0,
    );
    const netProfit = revenue - expenses;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      expenses,
      netProfit,
      margin,
      revenueCount: revenueRecords.length,
      expenseCount: expenseRecords.length,
      transactionCount: filteredRecords.length,
    };
  }, [filteredRecords]);

  const monthlyData = useMemo(() => {
    const labels =
      period === "month"
        ? Array.from({ length: 31 }, (_, index) => String(index + 1))
        : period === "quarter"
          ? (QUARTERS[Number(selectedQuarter)]?.months.map(
              (monthIndex) => MONTHS[monthIndex],
            ) ?? [])
          : MONTHS;

    const revenue = labels.map((label) =>
      filteredRecords
        .filter((record) => {
          const date = getRecordDate(record);
          if (!date || record.type !== "Revenue") return false;

          return period === "month"
            ? String(date.getDate()) === label
            : MONTHS[(date.getMonth() + 9) % 12] === label;
        })
        .reduce((total, record) => total + Number(record.amount || 0), 0),
    );

    const expenses = labels.map((label) =>
      filteredRecords
        .filter((record) => {
          const date = getRecordDate(record);
          if (!date || record.type !== "Expense") return false;

          return period === "month"
            ? String(date.getDate()) === label
            : MONTHS[(date.getMonth() + 9) % 12] === label;
        })
        .reduce((total, record) => total + Number(record.amount || 0), 0),
    );

    const margins = revenue.map((amount, index) =>
      amount > 0 ? ((amount - expenses[index]) / amount) * 100 : 0,
    );

    return { labels, revenue, expenses, margins };
  }, [filteredRecords, period, selectedQuarter]);

  const marginChartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: "Profit margin",
        data: monthlyData.margins,
        borderColor: "rgb(5, 150, 105)",
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const comparisonChartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: "Revenue",
        data: monthlyData.revenue,
        backgroundColor: "rgba(16, 185, 129, 0.65)",
        borderRadius: 5,
      },
      {
        label: "Expenses",
        data: monthlyData.expenses,
        backgroundColor: "rgba(248, 113, 113, 0.65)",
        borderRadius: 5,
      },
    ],
  };

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const isMargin = context.dataset.label === "Profit margin";
            return isMargin
              ? `Profit margin: ${Number(context.parsed.y).toFixed(2)}%`
              : `${context.dataset.label}: ${formatMoney(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value,
        },
        grid: { color: "rgba(156, 163, 175, 0.15)" },
      },
      x: { grid: { display: false } },
    },
  };

  const expenseCategories = useMemo(() => {
    const totals = {};

    filteredRecords
      .filter((record) => record.type === "Expense")
      .forEach((record) => {
        const category = record.category || "Uncategorized";
        totals[category] = (totals[category] || 0) + Number(record.amount || 0);
      });

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          summary.expenses > 0 ? (amount / summary.expenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredRecords, summary.expenses]);

  const periodDescription =
    period === "month"
      ? `${MONTHS[(Number(selectedMonth) + 9) % 12]} ${selectedYear}`
      : period === "quarter"
        ? `${QUARTERS[Number(selectedQuarter)]?.label}, FY ${getFinancialYearLabel(Number(selectedYear))}`
        : `FY ${getFinancialYearLabel(Number(selectedYear))}`;

  const isPositiveMargin = summary.margin >= 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Financial reports
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              Profit Margin Analysis
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Measure how effectively your business converts revenue into
              profit.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            <CalendarDays size={17} />
            {periodDescription}
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-900">Report filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label="Report period"
              value={period}
              onChange={setPeriod}
            >
              <option value="year">Financial year</option>
              <option value="month">Specific month</option>
              <option value="quarter">Quarter-wise</option>
            </SelectField>

            <SelectField
              label="Financial year"
              value={selectedYear}
              onChange={setSelectedYear}
            >
              {availableYears.map((year) => (
                <option key={year} value={String(year)}>
                  FY {getFinancialYearLabel(year)}
                </option>
              ))}
            </SelectField>

            {period === "month" && (
              <SelectField
                label="Month"
                value={selectedMonth}
                onChange={setSelectedMonth}
              >
                {MONTHS.map((month, index) => {
                  const calendarMonth = (index + 3) % 12;
                  return (
                    <option key={month} value={String(calendarMonth)}>
                      {month}
                    </option>
                  );
                })}
              </SelectField>
            )}

            {period === "quarter" && (
              <SelectField
                label="Quarter"
                value={selectedQuarter}
                onChange={setSelectedQuarter}
              >
                {QUARTERS.map((quarter, index) => (
                  <option key={quarter.label} value={String(index)}>
                    {quarter.label}
                  </option>
                ))}
              </SelectField>
            )}
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            Loading profit margin data...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Profit Margin"
                value={`${summary.margin.toFixed(2)}%`}
                subtitle="Net profit as a percentage of revenue"
                icon={Percent}
                positive={isPositiveMargin}
              />

              <StatCard
                title="Net Profit / Loss"
                value={`${summary.netProfit < 0 ? "−" : ""}${formatMoney(Math.abs(summary.netProfit))}`}
                subtitle="Revenue minus expenses"
                icon={Wallet}
              />

              <StatCard
                title="Total Revenue"
                value={formatMoney(summary.revenue)}
                subtitle={`${summary.revenueCount} revenue transactions`}
                icon={TrendingUp}
              />

              <StatCard
                title="Total Expenses"
                value={formatMoney(summary.expenses)}
                subtitle={`${summary.expenseCount} expense transactions`}
                icon={IndianRupee}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-semibold text-gray-900">
                  Profit margin trend
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Margin for each month or day in the selected period.
                </p>
                <div className="mt-5 h-80">
                  <Line data={marginChartData} options={baseChartOptions} />
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-semibold text-gray-900">
                  Revenue vs expenses
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Compare income and spending over the selected period.
                </p>
                <div className="mt-5 h-80">
                  <Bar data={comparisonChartData} options={baseChartOptions} />
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-2">
                <h2 className="font-semibold text-gray-900">
                  Expense category breakdown
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  See which categories account for the most spending.
                </p>

                {expenseCategories.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    No expense records found for this period.
                  </p>
                ) : (
                  <div className="mt-5 space-y-5">
                    {expenseCategories.map((item) => (
                      <div key={item.category}>
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span className="font-medium text-gray-700">
                            {item.category}
                          </span>
                          <span className="text-gray-600">
                            {formatMoney(item.amount)} ·{" "}
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-rose-400"
                            style={{
                              width: `${Math.min(100, item.percentage)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-semibold text-gray-900">
                  Margin interpretation
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  What your current result means.
                </p>

                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Selected period</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {periodDescription}
                  </p>

                  <p className="mt-5 text-sm text-gray-500">Current margin</p>
                  <p
                    className={`mt-1 text-3xl font-semibold ${
                      isPositiveMargin ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {summary.margin.toFixed(2)}%
                  </p>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {summary.revenue === 0
                      ? "No revenue was recorded in this period, so a meaningful profit margin cannot be calculated."
                      : summary.netProfit > 0
                        ? `Your business retains approximately ${summary.margin.toFixed(2)} rupees of net profit for every ₹100 of revenue, based on the recorded transactions.`
                        : summary.netProfit < 0
                          ? "Your recorded expenses exceed revenue for this period. Review costs and revenue to understand the loss."
                          : "Your recorded revenue and expenses are equal, resulting in a zero net profit margin."}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                  <span className="text-gray-500">Transactions analyzed</span>
                  <span className="font-semibold text-gray-900">
                    {summary.transactionCount}
                  </span>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfitMargin;
