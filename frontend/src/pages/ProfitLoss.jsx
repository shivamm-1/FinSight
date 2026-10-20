import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  IndianRupee,
  TrendingDown,
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

const getFinancialYear = (date) => {
  const year = date.getFullYear();
  return date.getMonth() >= 3 ? year : year - 1;
};

const getFinancialYearLabel = (year) => `${year}-${String(year + 1).slice(-2)}`;

const getAvailableFinancialYears = (records) => {
  const years = records
    .map(getRecordDate)
    .filter(Boolean)
    .map(getFinancialYear);

  const currentYear = getFinancialYear(new Date());
  years.push(currentYear);

  return [...new Set(years)].sort((a, b) => b - a);
};

const isInFinancialYear = (date, year) =>
  date >= new Date(year, 3, 1, 0, 0, 0, 0) &&
  date < new Date(year + 1, 3, 1, 0, 0, 0, 0);

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
          {positive ? "Profit" : "Loss"}
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
        className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-800 outline-none transition focus:border-gray-400"
      >
        {children}
      </select>
    </label>
  );
}

function ProfitLoss() {
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
        toast.error("Unable to load financial data.");
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
        const quarter = QUARTERS[Number(selectedQuarter)];

        return quarter && quarter.months.includes((date.getMonth() + 9) % 12);
      }

      return true;
    });
  }, [records, period, selectedYear, selectedMonth, selectedQuarter]);

  const financialSummary = useMemo(() => {
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
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      expenses,
      netProfit,
      profitMargin,
      revenueCount: revenueRecords.length,
      expenseCount: expenseRecords.length,
      transactionCount: filteredRecords.length,
    };
  }, [filteredRecords]);

  const chartData = useMemo(() => {
    const labels =
      period === "month"
        ? Array.from({ length: 31 }, (_, index) => String(index + 1))
        : period === "quarter"
          ? (QUARTERS[Number(selectedQuarter)]?.months.map(
              (monthIndex) => MONTHS[monthIndex],
            ) ?? [])
          : MONTHS;

    const revenueData = labels.map((label) =>
      filteredRecords
        .filter((record) => {
          const date = getRecordDate(record);
          if (!date || record.type !== "Revenue") return false;

          if (period === "month") {
            return String(date.getDate()) === label;
          }

          return MONTHS[(date.getMonth() + 9) % 12] === label;
        })
        .reduce((total, record) => total + Number(record.amount || 0), 0),
    );

    const expenseData = labels.map((label) =>
      filteredRecords
        .filter((record) => {
          const date = getRecordDate(record);
          if (!date || record.type !== "Expense") return false;

          if (period === "month") {
            return String(date.getDate()) === label;
          }

          return MONTHS[(date.getMonth() + 9) % 12] === label;
        })
        .reduce((total, record) => total + Number(record.amount || 0), 0),
    );

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: revenueData,
          backgroundColor: "rgba(16, 185, 129, 0.65)",
          borderColor: "rgb(5, 150, 105)",
          borderWidth: 1,
          borderRadius: 5,
        },
        {
          label: "Expenses",
          data: expenseData,
          backgroundColor: "rgba(248, 113, 113, 0.65)",
          borderColor: "rgb(220, 38, 38)",
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    };
  }, [filteredRecords, period, selectedQuarter]);

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
            `${context.dataset.label}: ${formatMoney(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) =>
            new Intl.NumberFormat("en-IN", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(value),
        },
        grid: {
          color: "rgba(156, 163, 175, 0.15)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const netIsProfit = financialSummary.netProfit >= 0;

  const periodDescription =
    period === "month"
      ? `${MONTHS[(Number(selectedMonth) + 9) % 12]} ${selectedYear}`
      : period === "quarter"
        ? `${QUARTERS[Number(selectedQuarter)]?.label}, FY ${getFinancialYearLabel(Number(selectedYear))}`
        : `FY ${getFinancialYearLabel(Number(selectedYear))}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Financial reports
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              Profit & Loss Analysis
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Understand your business revenue, expenses, and overall
              profitability.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            <CalendarDays size={17} />
            {periodDescription}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
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
                {MONTHS.map((month) => {
                  const calendarMonth = (MONTHS.indexOf(month) + 3) % 12;

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
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            Loading profit and loss data...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Revenue"
                value={formatMoney(financialSummary.revenue)}
                subtitle={`${financialSummary.revenueCount} revenue transactions`}
                icon={TrendingUp}
              />

              <StatCard
                title="Total Expenses"
                value={formatMoney(financialSummary.expenses)}
                subtitle={`${financialSummary.expenseCount} expense transactions`}
                icon={TrendingDown}
              />

              <StatCard
                title={netIsProfit ? "Net Profit" : "Net Loss"}
                value={formatMoney(Math.abs(financialSummary.netProfit))}
                subtitle="Revenue minus expenses"
                icon={Wallet}
                positive={netIsProfit}
              />

              <StatCard
                title="Profit Margin"
                value={`${financialSummary.profitMargin.toFixed(2)}%`}
                subtitle="Net profit as a percentage of revenue"
                icon={IndianRupee}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-2">
                <div className="mb-5">
                  <h2 className="font-semibold text-gray-900">
                    Revenue vs Expenses
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Compare income and spending for {periodDescription}.
                  </p>
                </div>

                <div className="h-80">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="font-semibold text-gray-900">
                  Profitability summary
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Financial performance for the selected period.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">Revenue</span>
                      <span className="font-medium text-gray-900">
                        {formatMoney(financialSummary.revenue)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full w-full rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="text-gray-500">Expenses</span>
                      <span className="font-medium text-gray-900">
                        {formatMoney(financialSummary.expenses)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-rose-400"
                        style={{
                          width: `${
                            financialSummary.revenue > 0
                              ? Math.min(
                                  100,
                                  (financialSummary.expenses /
                                    financialSummary.revenue) *
                                    100,
                                )
                              : financialSummary.expenses > 0
                                ? 100
                                : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500">
                      {netIsProfit ? "Net profit" : "Net loss"}
                    </p>
                    <p
                      className={`mt-1 text-2xl font-semibold ${
                        netIsProfit ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {netIsProfit ? "+" : "-"}
                      {formatMoney(Math.abs(financialSummary.netProfit))}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Total transactions</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {financialSummary.transactionCount}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 p-5">
                <h2 className="font-semibold text-gray-900">
                  Profit & Loss transactions
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Transactions included in this report.
                </p>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <IndianRupee size={22} />
                  </div>
                  <p className="mt-4 font-medium text-gray-900">
                    No financial records found
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Add revenue or expense transactions for this period to see
                    your report.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium">Description</th>
                        <th className="px-5 py-3 font-medium">Category</th>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 text-right font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {[...filteredRecords]
                        .sort(
                          (a, b) =>
                            getRecordDate(b)?.getTime() -
                            getRecordDate(a)?.getTime(),
                        )
                        .map((record, index) => (
                          <tr
                            key={record._id || record.id || index}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                              {getRecordDate(record)?.toLocaleDateString(
                                "en-IN",
                              )}
                            </td>
                            <td className="max-w-xs truncate px-5 py-4 font-medium text-gray-900">
                              {record.description || "—"}
                            </td>
                            <td className="px-5 py-4 text-gray-600">
                              {record.category || "Uncategorized"}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  record.type === "Revenue"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {record.type}
                              </span>
                            </td>
                            <td
                              className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                                record.type === "Revenue"
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }`}
                            >
                              {record.type === "Expense" ? "−" : "+"}
                              {formatMoney(Number(record.amount || 0))}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfitLoss;
