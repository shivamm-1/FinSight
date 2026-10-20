import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  IndianRupee,
  Receipt,
  TrendingDown,
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
  { label: "Quarter 1 (Apr–Jun)", months: [0, 1, 2] },
  { label: "Quarter 2 (Jul–Sep)", months: [3, 4, 5] },
  { label: "Quarter 3 (Oct–Dec)", months: [6, 7, 8] },
  { label: "Quarter 4 (Jan–Mar)", months: [9, 10, 11] },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function getFinancialYear(date) {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

function getFinancialYearLabel(startYear) {
  return `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
}

function parseRecordDate(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
      );

      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthRange(monthIndex, financialYear) {
  const calendarMonth = (monthIndex + 3) % 12;
  const year = financialYear + (calendarMonth < 3 ? 1 : 0);

  return {
    start: new Date(year, calendarMonth, 1),
    end: new Date(year, calendarMonth + 1, 1),
  };
}

function getFinancialYearRange(financialYear) {
  return {
    start: new Date(financialYear, 3, 1),
    end: new Date(financialYear + 1, 3, 1),
  };
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{title}</p>
          <p className="mt-2 break-words text-lg font-semibold tracking-tight text-gray-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className="shrink-0 rounded-lg bg-gray-100 p-2 text-gray-700">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function SelectField({ value, onChange, label, children }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="max-w-full bg-transparent text-xs text-gray-800 outline-none"
      >
        {children}
      </select>
    </label>
  );
}

export default function ExpenseAnalysis() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState("financialYear");
  const [selectedFY, setSelectedFY] = useState(() =>
    getFinancialYear(new Date()),
  );

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return (new Date().getMonth() + 9) % 12;
  });

  const [selectedQuarter, setSelectedQuarter] = useState("1");

  const currentFY = getFinancialYear(new Date());

  useEffect(() => {
    let active = true;

    async function loadExpenses() {
      try {
        const response = await getFinancialData();

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.data)
              ? response.data.data
              : [];

        if (active) {
          setRecords(data.filter((item) => item.type === "Expense"));
        }
      } catch (error) {
        if (active) {
          toast.error(
            error?.response?.data?.message || "Unable to load expense data.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadExpenses();

    return () => {
      active = false;
    };
  }, []);

  const financialYears = useMemo(() => {
    const years = new Set([currentFY]);

    records.forEach((record) => {
      const date = parseRecordDate(record.date);

      if (date) {
        years.add(getFinancialYear(date));
      }
    });

    return [...years].sort((a, b) => b - a);
  }, [records, currentFY]);

  const filteredExpenses = useMemo(() => {
    let range;

    if (period === "financialYear") {
      range = getFinancialYearRange(selectedFY);
    } else if (period === "month") {
      range = getMonthRange(selectedMonth, selectedFY);
    } else {
      const quarter = QUARTERS[Number(selectedQuarter) - 1];

      range = {
        start: getMonthRange(quarter.months[0], selectedFY).start,
        end: getMonthRange(quarter.months[2], selectedFY).end,
      };
    }

    return records.filter((record) => {
      const date = parseRecordDate(record.date);

      return date && date >= range.start && date < range.end;
    });
  }, [records, period, selectedFY, selectedMonth, selectedQuarter]);

  const totalExpenses = filteredExpenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  const paidExpenses = filteredExpenses
    .filter((item) => item.isPaid)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const unpaidExpenses = totalExpenses - paidExpenses;

  const averageExpense = filteredExpenses.length
    ? totalExpenses / filteredExpenses.length
    : 0;

  const categoryData = useMemo(() => {
    const totals = {};

    filteredExpenses.forEach((item) => {
      const category = item.category || "Uncategorized";

      totals[category] = (totals[category] || 0) + (Number(item.amount) || 0);
    });

    const total = filteredExpenses.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const chart = useMemo(() => {
    if (period === "month") {
      const range = getMonthRange(selectedMonth, selectedFY);

      const daysInMonth = new Date(
        range.start.getFullYear(),
        range.start.getMonth() + 1,
        0,
      ).getDate();

      const labels = Array.from({ length: daysInMonth }, (_, index) =>
        String(index + 1),
      );

      return {
        labels,
        values: labels.map((_, index) => {
          const day = index + 1;

          return filteredExpenses
            .filter((record) => {
              const date = parseRecordDate(record.date);

              return (
                date &&
                date.getFullYear() === range.start.getFullYear() &&
                date.getMonth() === range.start.getMonth() &&
                date.getDate() === day
              );
            })
            .reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
        }),
        description: "Daily expenses for the selected month",
      };
    }

    const monthIndexes =
      period === "quarter"
        ? QUARTERS[Number(selectedQuarter) - 1].months
        : MONTHS.map((_, index) => index);

    return {
      labels: monthIndexes.map((index) => MONTHS[index]),

      values: monthIndexes.map((monthIndex) => {
        const range = getMonthRange(monthIndex, selectedFY);

        return filteredExpenses
          .filter((record) => {
            const date = parseRecordDate(record.date);

            return date && date >= range.start && date < range.end;
          })
          .reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
      }),

      description:
        period === "quarter"
          ? "Monthly expenses for the selected quarter"
          : "Monthly expenses for the selected financial year",
    };
  }, [period, filteredExpenses, selectedFY, selectedMonth, selectedQuarter]);

  const chartData = {
    labels: chart.labels,
    datasets: [
      {
        label: "Expenses",
        data: chart.values,
        borderRadius: 5,
        backgroundColor: "#64748b",
        hoverBackgroundColor: "#334155",
        maxBarThickness: 32,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${money(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#6b7280",
          font: { size: 10 },
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#6b7280",
          font: { size: 10 },
          callback: (value) => {
            if (value >= 100000) {
              return `₹${(value / 100000).toFixed(1)}L`;
            }

            if (value >= 1000) {
              return `₹${(value / 1000).toFixed(0)}k`;
            }

            return `₹${value}`;
          },
        },
      },
    },
  };

  let periodLabel = getFinancialYearLabel(selectedFY);

  if (period === "month") {
    const range = getMonthRange(selectedMonth, selectedFY);

    periodLabel = `${MONTHS[selectedMonth]} ${range.start.getFullYear()}`;
  } else if (period === "quarter") {
    periodLabel = `${
      QUARTERS[Number(selectedQuarter) - 1].label
    }, ${getFinancialYearLabel(selectedFY)}`;
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-64 max-w-7xl items-center justify-center px-4 text-xs text-gray-500 sm:px-6 lg:px-8">
        Loading expense analysis…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Financial reports
          </p>

          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-gray-900">
            Expense Analysis
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            Analyse business expenses, payment status, and spending patterns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <CalendarDays size={15} className="text-gray-500" />

            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              aria-label="Select analysis period"
              className="bg-transparent text-xs text-gray-800 outline-none"
            >
              <option value="financialYear">Financial year</option>
              <option value="month">Specific month</option>
              <option value="quarter">Quarter-wise</option>
            </select>
          </label>

          <SelectField
            label="Select financial year"
            value={selectedFY}
            onChange={(event) => setSelectedFY(Number(event.target.value))}
          >
            {financialYears.map((year) => (
              <option key={year} value={year}>
                {getFinancialYearLabel(year)}
              </option>
            ))}
          </SelectField>

          {period === "month" && (
            <SelectField
              label="Select month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </SelectField>
          )}

          {period === "quarter" && (
            <SelectField
              label="Select quarter"
              value={selectedQuarter}
              onChange={(event) => setSelectedQuarter(event.target.value)}
            >
              {QUARTERS.map((quarter, index) => (
                <option key={quarter.label} value={String(index + 1)}>
                  {quarter.label}
                </option>
              ))}
            </SelectField>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Showing:{" "}
        <span className="font-medium text-gray-800">{periodLabel}</span>
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total expenses"
          value={money(totalExpenses)}
          subtitle={`${filteredExpenses.length} transactions`}
          icon={TrendingDown}
        />

        <StatCard
          title="Paid expenses"
          value={money(paidExpenses)}
          subtitle="Marked as paid"
          icon={Wallet}
        />

        <StatCard
          title="Unpaid expenses"
          value={money(unpaidExpenses)}
          subtitle="Not yet marked as paid"
          icon={ArrowDownRight}
        />

        <StatCard
          title="Average transaction"
          value={money(averageExpense)}
          subtitle="Average expense per record"
          icon={IndianRupee}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-4 xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Expense trend
            </h2>

            <p className="mt-1 text-xs text-gray-500">{chart.description}</p>
          </div>

          <div className="h-64">
            {chart.values.some((value) => value > 0) ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-gray-500">
                No expense data for this period.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Expenses by category
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Breakdown for the selected period
          </p>

          {categoryData.length ? (
            <div className="mt-4 space-y-4">
              {categoryData.map((item) => (
                <div key={item.category}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-gray-700">
                      {item.category}
                    </span>

                    <span className="shrink-0 font-medium text-gray-900">
                      {money(item.amount)}
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-slate-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <p className="mt-1 text-[10px] text-gray-500">
                    {item.percentage.toFixed(1)}% of expenses
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-xs text-gray-500">
              No category data for this period.
            </p>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col justify-between gap-2 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Expense transactions
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {filteredExpenses.length} records for {periodLabel}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ArrowUpRight size={14} />
            Sorted by date, newest first
          </div>
        </div>

        {filteredExpenses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Payment method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {[...filteredExpenses]
                  .sort(
                    (a, b) =>
                      (parseRecordDate(b.date)?.getTime() || 0) -
                      (parseRecordDate(a.date)?.getTime() || 0),
                  )
                  .map((record) => {
                    const date = parseRecordDate(record.date);

                    return (
                      <tr
                        key={record._id || record.id}
                        className="hover:bg-gray-50/70"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                          {date ? date.toLocaleDateString("en-IN") : "—"}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {record.category || "Uncategorized"}
                          </p>

                          {record.description && (
                            <p className="mt-1 max-w-xs truncate text-[10px] text-gray-500">
                              {record.description}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {record.paymentMethod || "—"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                              record.isPaid
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {record.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                          {money(record.amount)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Receipt size={18} />
            </div>

            <p className="mt-3 text-sm font-medium text-gray-900">
              No expense records found
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Try another financial period or add expense transactions.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
