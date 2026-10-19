import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  ChartColumnIncreasing,
  FileSpreadsheet,
  IndianRupee,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import toast from "react-hot-toast";

import { getFinancialData } from "../services/financialDataService";
import { getBusinessProfile } from "../services/businessProfileService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_DATE = new Date();
const CURRENT_MONTH = CURRENT_DATE.getMonth();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();

const getFinancialYear = (date) =>
  date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;

const getFinancialYearLabel = (year) =>
  `FY ${year}-${String(year + 1).slice(-2)}`;

const parseRecordDate = (value) => {
  if (!value) return null;

  const match = String(value)
    .slice(0, 10)
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRecordsFromResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.transactions)) {
    return response.data.transactions;
  }
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.transactions)) return response.transactions;
  return [];
};

const getProfileFromResponse = (response) => {
  const result = response?.data ?? response;

  if (result?.businessProfile) return result.businessProfile;
  if (result?.profile) return result.profile;
  if (result?.data?.businessProfile) return result.data.businessProfile;

  return result;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatShortDate = (value) => {
  const date = parseRecordDate(value);
  if (!date) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAmount = (record) => Number(record?.amount) || 0;

const getRecordType = (record) =>
  String(record?.type || "")
    .toLowerCase()
    .trim();

const isRevenue = (record) => getRecordType(record) === "revenue";
const isExpense = (record) => getRecordType(record) === "expense";

const isRecordPaid = (record) =>
  record?.isPaid === true || record?.isPaid === "true";

const getCategory = (record) => record?.category || "Uncategorized";

const getFinancialYearRange = (startYear) => ({
  start: new Date(startYear, 3, 1),
  end: new Date(startYear + 1, 2, 31, 23, 59, 59, 999),
});

const getQuarterRange = (financialYear, quarter) => {
  const startMonth = 3 + (Number(quarter) - 1) * 3;
  const startYear =
    startMonth >= 12 ? Number(financialYear) + 1 : Number(financialYear);

  return {
    start: new Date(startYear, startMonth % 12, 1),
    end: new Date(startYear, (startMonth % 12) + 3, 0, 23, 59, 59, 999),
  };
};

const getMonthRange = (year, month) => ({
  start: new Date(year, month, 1),
  end: new Date(year, month + 1, 0, 23, 59, 59, 999),
});

const getMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (key) => {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
};

const getMonthKeysBetween = (start, end) => {
  const keys = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= last) {
    keys.push(getMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
};

const getRangeLabel = (periodType, periodLabel, range) => {
  if (periodType === "month") return periodLabel;

  return `${range.start.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} – ${range.end.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
};

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "blue" }) {
  const tones = {
    green: {
      icon: "bg-emerald-50 text-emerald-700",
      value: "text-emerald-700",
    },
    red: {
      icon: "bg-rose-50 text-rose-700",
      value: "text-rose-700",
    },
    blue: {
      icon: "bg-blue-50 text-blue-700",
      value: "text-slate-900",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      value: "text-amber-700",
    },
    purple: {
      icon: "bg-violet-50 text-violet-700",
      value: "text-violet-700",
    },
  };

  const colors = tones[tone] || tones.blue;

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p
            className={`mt-2 break-words text-xl font-semibold tracking-tight sm:text-2xl ${colors.value}`}
          >
            {value}
          </p>
        </div>
        <div className={`shrink-0 rounded-lg p-2.5 ${colors.icon}`}>
          <Icon size={19} strokeWidth={1.8} />
        </div>
      </div>

      {subtitle && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</p>
      )}
    </article>
  );
}

function SectionHeading({ title, description, action, to }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        )}
      </div>

      {action && to && (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-blue-700 transition hover:text-blue-900"
        >
          {action}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function EmptyState({ title, description, action, to }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center px-4 py-8 text-center">
      <div className="rounded-xl bg-slate-100 p-3 text-slate-500">
        <FileSpreadsheet size={23} />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && to && (
        <Link
          to={to}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {action}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

const currencyTooltip = (context) =>
  `${context.dataset.label || context.label}: ${formatCurrency(context.raw)}`;

const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 7,
        boxHeight: 7,
        padding: 18,
        color: "#64748b",
        font: { size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label: currencyTooltip,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: "#94a3b8",
        font: { size: 10 },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12,
      },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: "#f1f5f9" },
      ticks: {
        color: "#94a3b8",
        font: { size: 10 },
        callback: (value) => {
          const amount = Number(value);
          if (Math.abs(amount) >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
          }
          if (Math.abs(amount) >= 1000) {
            return `₹${(amount / 1000).toFixed(0)}k`;
          }
          return `₹${amount}`;
        },
      },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        padding: 14,
        color: "#64748b",
        font: { size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.label}: ${formatCurrency(context.raw)}`,
      },
    },
  },
};

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#9333ea",
  "#dc2626",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#64748b",
];

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [periodType, setPeriodType] = useState("financialYear");
  const [selectedFY, setSelectedFY] = useState(
    String(getFinancialYear(CURRENT_DATE)),
  );
  const [selectedMonth, setSelectedMonth] = useState(String(CURRENT_MONTH));
  const [selectedQuarter, setSelectedQuarter] = useState(
    String(Math.floor(((CURRENT_MONTH + 9) % 12) / 3) + 1),
  );

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setLoadError("");

    try {
      const [financialResponse, profileResponse] = await Promise.all([
        getFinancialData(),
        getBusinessProfile(),
      ]);

      setRecords(getRecordsFromResponse(financialResponse));
      setBusinessProfile(getProfileFromResponse(profileResponse) || null);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      const message =
        error?.response?.data?.message ||
        "Unable to load dashboard data. Please try again.";

      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const financialYears = useMemo(() => {
    const years = new Set([getFinancialYear(CURRENT_DATE), Number(selectedFY)]);

    records.forEach((record) => {
      const date = parseRecordDate(record.date);
      if (date) years.add(getFinancialYear(date));
    });

    return [...years].filter(Number.isFinite).sort((a, b) => b - a);
  }, [records, selectedFY]);

  const periodRange = useMemo(() => {
    if (periodType === "month") {
      return getMonthRange(CURRENT_YEAR, Number(selectedMonth));
    }

    if (periodType === "quarter") {
      return getQuarterRange(Number(selectedFY), Number(selectedQuarter));
    }

    return getFinancialYearRange(Number(selectedFY));
  }, [periodType, selectedFY, selectedMonth, selectedQuarter]);

  const periodLabel = useMemo(() => {
    if (periodType === "month") {
      return `${MONTHS[Number(selectedMonth)]} ${CURRENT_YEAR}`;
    }

    if (periodType === "quarter") {
      const labels = {
        1: "April – June",
        2: "July – September",
        3: "October – December",
        4: "January – March",
      };

      return `Q${selectedQuarter} · ${labels[selectedQuarter]} · ${getFinancialYearLabel(Number(selectedFY))}`;
    }

    return getFinancialYearLabel(Number(selectedFY));
  }, [periodType, selectedFY, selectedMonth, selectedQuarter]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const date = parseRecordDate(record.date);
        return date && date >= periodRange.start && date <= periodRange.end;
      }),
    [records, periodRange],
  );

  const revenueRecords = useMemo(
    () => filteredRecords.filter(isRevenue),
    [filteredRecords],
  );

  const expenseRecords = useMemo(
    () => filteredRecords.filter(isExpense),
    [filteredRecords],
  );

  const totalRevenue = useMemo(
    () => revenueRecords.reduce((sum, record) => sum + getAmount(record), 0),
    [revenueRecords],
  );

  const totalExpenses = useMemo(
    () => expenseRecords.reduce((sum, record) => sum + getAmount(record), 0),
    [expenseRecords],
  );

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const receivedRevenue = useMemo(
    () =>
      revenueRecords
        .filter(isRecordPaid)
        .reduce((sum, record) => sum + getAmount(record), 0),
    [revenueRecords],
  );

  const paidExpenses = useMemo(
    () =>
      expenseRecords
        .filter(isRecordPaid)
        .reduce((sum, record) => sum + getAmount(record), 0),
    [expenseRecords],
  );

  const outstandingRevenue = Math.max(0, totalRevenue - receivedRevenue);
  const unpaidExpenses = Math.max(0, totalExpenses - paidExpenses);

  const recentTransactions = useMemo(
    () =>
      [...filteredRecords]
        .sort(
          (a, b) =>
            (parseRecordDate(b.date)?.getTime() || 0) -
            (parseRecordDate(a.date)?.getTime() || 0),
        )
        .slice(0, 6),
    [filteredRecords],
  );

  const monthlyInsights = useMemo(() => {
    const monthlyData = {};

    getMonthKeysBetween(periodRange.start, periodRange.end).forEach((key) => {
      monthlyData[key] = { revenue: 0, expenses: 0 };
    });

    filteredRecords.forEach((record) => {
      const date = parseRecordDate(record.date);
      if (!date) return;

      const key = getMonthKey(date);

      if (!monthlyData[key]) {
        monthlyData[key] = { revenue: 0, expenses: 0 };
      }

      if (isRevenue(record)) {
        monthlyData[key].revenue += getAmount(record);
      } else if (isExpense(record)) {
        monthlyData[key].expenses += getAmount(record);
      }
    });

    const monthKeys = Object.keys(monthlyData).sort();

    return {
      labels: monthKeys.map(getMonthLabel),
      revenue: monthKeys.map((key) => monthlyData[key].revenue),
      expenses: monthKeys.map((key) => monthlyData[key].expenses),
      profit: monthKeys.map(
        (key) => monthlyData[key].revenue - monthlyData[key].expenses,
      ),
    };
  }, [filteredRecords, periodRange]);

  const categoryInsights = useMemo(() => {
    const revenueCategories = {};
    const expenseCategories = {};

    revenueRecords.forEach((record) => {
      const category = getCategory(record);
      revenueCategories[category] =
        (revenueCategories[category] || 0) + getAmount(record);
    });

    expenseRecords.forEach((record) => {
      const category = getCategory(record);
      expenseCategories[category] =
        (expenseCategories[category] || 0) + getAmount(record);
    });

    const revenueEntries = Object.entries(revenueCategories).sort(
      (a, b) => b[1] - a[1],
    );

    const expenseEntries = Object.entries(expenseCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { revenueEntries, expenseEntries };
  }, [revenueRecords, expenseRecords]);

  const comparisonChartData = useMemo(() => {
    const daysInMonth = new Date(
      CURRENT_YEAR,
      Number(selectedMonth) + 1,
      0,
    ).getDate();

    const dailyLabels = Array.from({ length: daysInMonth }, (_, index) =>
      String(index + 1),
    );

    const dailyTotal = (sourceRecords, day) =>
      sourceRecords
        .filter((record) => {
          const date = parseRecordDate(record.date);
          return date?.getDate() === day;
        })
        .reduce((sum, record) => sum + getAmount(record), 0);

    return {
      labels: periodType === "month" ? dailyLabels : monthlyInsights.labels,
      datasets: [
        {
          label: "Revenue",
          data:
            periodType === "month"
              ? dailyLabels.map((label) =>
                  dailyTotal(revenueRecords, Number(label)),
                )
              : monthlyInsights.revenue,
          backgroundColor: "rgba(37, 99, 235, 0.8)",
          borderColor: "#2563eb",
          borderRadius: 4,
          maxBarThickness: 24,
        },
        {
          label: "Expenses",
          data:
            periodType === "month"
              ? dailyLabels.map((label) =>
                  dailyTotal(expenseRecords, Number(label)),
                )
              : monthlyInsights.expenses,
          backgroundColor: "rgba(148, 163, 184, 0.85)",
          borderColor: "#94a3b8",
          borderRadius: 4,
          maxBarThickness: 24,
        },
      ],
    };
  }, [
    periodType,
    selectedMonth,
    monthlyInsights,
    revenueRecords,
    expenseRecords,
  ]);

  const trendChartData = useMemo(
    () => ({
      labels: monthlyInsights.labels,
      datasets: [
        {
          label: "Revenue",
          data: monthlyInsights.revenue,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.08)",
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: true,
        },
        {
          label: "Expenses",
          data: monthlyInsights.expenses,
          borderColor: "#dc2626",
          backgroundColor: "rgba(220, 38, 38, 0.06)",
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
        },
      ],
    }),
    [monthlyInsights],
  );

  const profitChartData = useMemo(() => {
    const dailyLabels =
      periodType === "month" ? comparisonChartData.labels : null;

    const dailyProfit = (day) => {
      const dayRevenue = revenueRecords
        .filter((record) => parseRecordDate(record.date)?.getDate() === day)
        .reduce((sum, record) => sum + getAmount(record), 0);

      const dayExpenses = expenseRecords
        .filter((record) => parseRecordDate(record.date)?.getDate() === day)
        .reduce((sum, record) => sum + getAmount(record), 0);

      return dayRevenue - dayExpenses;
    };

    const profits =
      periodType === "month"
        ? dailyLabels.map((label) => dailyProfit(Number(label)))
        : monthlyInsights.profit;

    return {
      labels: periodType === "month" ? dailyLabels : monthlyInsights.labels,
      datasets: [
        {
          label: "Profit / Loss",
          data: profits,
          backgroundColor: profits.map((amount) =>
            amount >= 0 ? "rgba(22, 163, 74, 0.8)" : "rgba(220, 38, 38, 0.8)",
          ),
          borderRadius: 4,
          maxBarThickness: 30,
        },
      ],
    };
  }, [
    periodType,
    comparisonChartData.labels,
    monthlyInsights,
    revenueRecords,
    expenseRecords,
  ]);

  const revenueCategoryChart = useMemo(
    () => ({
      labels: categoryInsights.revenueEntries.map(([category]) => category),
      datasets: [
        {
          data: categoryInsights.revenueEntries.map(([, amount]) => amount),
          backgroundColor: CHART_COLORS,
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    }),
    [categoryInsights],
  );

  const expenseCategoryChart = useMemo(
    () => ({
      labels: categoryInsights.expenseEntries.map(([category]) => category),
      datasets: [
        {
          data: categoryInsights.expenseEntries.map(([, amount]) => amount),
          backgroundColor: CHART_COLORS,
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    }),
    [categoryInsights],
  );

  const paymentPercentage =
    totalRevenue > 0
      ? Math.min(100, (receivedRevenue / totalRevenue) * 100)
      : 0;

  const trendOptions = useMemo(
    () => ({
      ...commonChartOptions,
      scales: {
        ...commonChartOptions.scales,
        y: { ...commonChartOptions.scales.y, beginAtZero: true },
      },
    }),
    [],
  );

  const profitOptions = useMemo(
    () => ({
      ...commonChartOptions,
      scales: {
        ...commonChartOptions.scales,
        y: { ...commonChartOptions.scales.y, beginAtZero: false },
      },
    }),
    [],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
      {/* Header: title left, action buttons right */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-700">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your business finances, at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/financial-data"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <IndianRupee size={17} />
            Add transaction
          </Link>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* Period filters: separate card below the header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={17} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">
            Filter dashboard
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label="Period"
            value={periodType}
            onChange={setPeriodType}
            options={[
              { value: "financialYear", label: "Financial year" },
              { value: "month", label: "Specific month" },
              { value: "quarter", label: "Quarter-wise" },
            ]}
          />

          {periodType !== "month" && (
            <SelectField
              label="Financial year"
              value={selectedFY}
              onChange={setSelectedFY}
              options={financialYears.map((year) => ({
                value: String(year),
                label: getFinancialYearLabel(year),
              }))}
            />
          )}

          {periodType === "month" && (
            <SelectField
              label="Month"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={MONTHS.map((month, index) => ({
                value: String(index),
                label: month,
              }))}
            />
          )}

          {periodType === "quarter" && (
            <SelectField
              label="Quarter"
              value={selectedQuarter}
              onChange={setSelectedQuarter}
              options={[
                { value: "1", label: "Q1 · Apr–Jun" },
                { value: "2", label: "Q2 · Jul–Sep" },
                { value: "3", label: "Q3 · Oct–Dec" },
                { value: "4", label: "Q4 · Jan–Mar" },
              ]}
            />
          )}

          <div className="flex flex-col justify-end">
            <p className="text-xs font-medium text-slate-500">
              Selected period
            </p>
            <p className="mt-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">
              {periodLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Financial summary */}
      <section>
        <SectionHeading
          title="Financial summary"
          description="Your key financial figures for the selected period."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total revenue"
            value={formatCurrency(totalRevenue)}
            subtitle={`${revenueRecords.length} revenue transactions`}
            icon={ArrowUpRight}
            tone="green"
          />
          <StatCard
            title="Total expenses"
            value={formatCurrency(totalExpenses)}
            subtitle={`${expenseRecords.length} expense transactions`}
            icon={ArrowDownRight}
            tone="red"
          />
          <StatCard
            title="Net profit / loss"
            value={formatCurrency(netProfit)}
            subtitle={
              netProfit >= 0
                ? "Revenue is higher than expenses"
                : "Expenses are higher than revenue"
            }
            icon={Wallet}
            tone={netProfit >= 0 ? "blue" : "red"}
          />
          <StatCard
            title="Profit margin"
            value={`${profitMargin.toFixed(2)}%`}
            subtitle="Net profit as a percentage of revenue"
            icon={ChartColumnIncreasing}
            tone={profitMargin >= 0 ? "purple" : "red"}
          />
        </div>
      </section>

      {/* Error message */}
      {loadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm leading-6 text-rose-800">{loadError}</p>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="self-start text-sm font-semibold text-rose-800 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Recent transactions */}
      <Panel>
        <SectionHeading
          title="Recent transactions"
          description={`Latest records in ${periodLabel}.`}
          action="View all transactions"
          to="/financial-data"
        />

        {recentTransactions.length === 0 ? (
          <EmptyState
            title="No transactions for this period"
            description="Add a revenue or expense transaction, or choose a different reporting period."
            action="Add transaction"
            to="/financial-data"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[610px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
                  <th className="rounded-l-lg px-3 py-3 font-medium">
                    Transaction
                  </th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="rounded-r-lg px-3 py-3 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((record, index) => {
                  const revenue = isRevenue(record);
                  const paid = isRecordPaid(record);

                  return (
                    <tr
                      key={
                        record._id ||
                        record.id ||
                        `${record.date}-${record.type}-${record.amount}-${index}`
                      }
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="max-w-56 px-3 py-3.5">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {getCategory(record)}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {record.description || "No description"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-500">
                        {formatShortDate(record.date)}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${revenue ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                        >
                          {revenue ? "Revenue" : "Expense"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {paid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3.5 text-right text-sm font-semibold ${revenue ? "text-emerald-700" : "text-slate-800"}`}
                      >
                        {revenue ? "+" : "−"}
                        {formatCurrency(getAmount(record))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Financial performance */}
      <section>
        <SectionHeading
          title="Financial performance"
          description="Compare income and expenses and review payment collection."
          action="Revenue analysis"
          to="/revenue-analysis"
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel className="xl:col-span-2">
            <SectionHeading
              title="Revenue vs. expenses"
              description={`Recorded activity for ${periodLabel}.`}
            />
            <div className="h-72">
              {filteredRecords.length > 0 ? (
                <Bar
                  data={comparisonChartData}
                  options={{
                    ...commonChartOptions,
                    scales: {
                      ...commonChartOptions.scales,
                      x: {
                        ...commonChartOptions.scales.x,
                        ticks: {
                          ...commonChartOptions.scales.x.ticks,
                          maxTicksLimit: periodType === "month" ? 10 : 12,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <EmptyState
                  title="No chart data"
                  description="Transactions will appear here after you record them."
                />
              )}
            </div>
          </Panel>

          <Panel>
            <SectionHeading
              title="Payment overview"
              description="Track received revenue and unpaid amounts."
            />
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">
                    Revenue received
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">
                    {formatCurrency(receivedRevenue)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${paymentPercentage}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {Math.round(paymentPercentage)}% of recorded revenue marked as
                  received
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">
                    Outstanding revenue
                  </span>
                  <span className="text-sm font-semibold text-amber-700">
                    {formatCurrency(outstandingRevenue)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Revenue not marked as received.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">
                    Unpaid expenses
                  </span>
                  <span className="text-sm font-semibold text-rose-700">
                    {formatCurrency(unpaidExpenses)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Expenses not marked as paid.
                </p>
              </div>

              <Link
                to="/financial-data"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Manage transactions
                <ArrowRight size={15} />
              </Link>
            </div>
          </Panel>
        </div>
      </section>

      {/* Trends and profitability */}
      <section>
        <SectionHeading
          title="Trends and profitability"
          description={
            periodType === "month"
              ? "Daily profit and loss for your selected month."
              : "Monthly revenue, expenses, and profit across the selected period."
          }
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel>
            <SectionHeading
              title="Revenue and expense trends"
              description="See how revenue and expenses move over time."
            />
            <div className="h-72">
              {monthlyInsights.labels.length > 0 &&
              filteredRecords.length > 0 ? (
                <Line data={trendChartData} options={trendOptions} />
              ) : (
                <EmptyState
                  title="No trend data"
                  description="Dated transactions are needed to show financial trends."
                />
              )}
            </div>
          </Panel>

          <Panel>
            <SectionHeading
              title="Profit / loss"
              description={
                periodType === "month"
                  ? "Daily profit or loss within this month."
                  : "Profit or loss by month within this period."
              }
            />
            <div className="h-72">
              {filteredRecords.length > 0 ? (
                <Bar data={profitChartData} options={profitOptions} />
              ) : (
                <EmptyState
                  title="No profit/loss data"
                  description="Add transactions to see the profit/loss breakdown."
                />
              )}
            </div>
          </Panel>
        </div>
      </section>

      {/* Category breakdown */}
      <section>
        <SectionHeading
          title="Category breakdown"
          description="Understand which categories contribute to revenue and expenses."
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel>
            <SectionHeading
              title="Revenue by category"
              description="Distribution of recorded revenue."
              action="Revenue analysis"
              to="/revenue-analysis"
            />

            {categoryInsights.revenueEntries.length > 0 ? (
              <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2">
                <div className="mx-auto h-60 w-full max-w-xs">
                  <Doughnut
                    data={revenueCategoryChart}
                    options={doughnutOptions}
                  />
                </div>
                <div className="space-y-3">
                  {categoryInsights.revenueEntries.map(
                    ([category, amount], index) => (
                      <div
                        key={category}
                        className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span
                            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="break-words text-sm text-slate-600">
                            {category}
                          </span>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No revenue categories"
                description="Record revenue transactions with categories to see the breakdown."
              />
            )}
          </Panel>

          <Panel>
            <SectionHeading
              title="Expenses by category"
              description="Your five largest recorded expense categories."
              action="Expense analysis"
              to="/expense-analysis"
            />

            {categoryInsights.expenseEntries.length > 0 ? (
              <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2">
                <div className="mx-auto h-60 w-full max-w-xs">
                  <Doughnut
                    data={expenseCategoryChart}
                    options={doughnutOptions}
                  />
                </div>
                <div className="space-y-3">
                  {categoryInsights.expenseEntries.map(
                    ([category, amount], index) => (
                      <div
                        key={category}
                        className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span
                            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="break-words text-sm text-slate-600">
                            {category}
                          </span>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No expense categories"
                description="Record expense transactions with categories to see the breakdown."
              />
            )}
          </Panel>
        </div>
      </section>

      {/* Business profile and financial shortcuts */}
      <section>
        <SectionHeading
          title="Business and tools"
          description="Your business information and commonly used financial tools."
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
                <BriefcaseBusiness size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Business profile
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Your business information
                </p>
              </div>
            </div>

            {businessProfile?.businessName ? (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Business name</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                    {businessProfile.businessName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Business type</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {businessProfile.businessType || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Industry</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {businessProfile.industry || "Not specified"}
                  </p>
                </div>
                <Link
                  to="/business-profile"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Edit business profile
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <EmptyState
                title="Complete your profile"
                description="Add your business details to keep your account up to date."
                action="Set up profile"
                to="/business-profile"
              />
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-2">
            {[
              {
                title: "Financial data",
                description: "Add and manage transactions.",
                to: "/financial-data",
                icon: FileSpreadsheet,
              },
              {
                title: "Revenue analysis",
                description: "Review revenue and collections.",
                to: "/revenue-analysis",
                icon: ArrowUpRight,
              },
              {
                title: "Expense analysis",
                description: "Review spending by category.",
                to: "/expense-analysis",
                icon: ArrowDownRight,
              },
              {
                title: "Cash flow",
                description: "Review money moving in and out.",
                to: "/cash-flow",
                icon: Banknote,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="shrink-0 rounded-lg bg-slate-100 p-2.5 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-700">
                    <Icon size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-4">
        <p className="text-xs leading-5 text-slate-400">
          All figures are based on the financial transactions recorded in
          FinSight for the selected reporting period.
        </p>
      </footer>
    </main>
  );
}
