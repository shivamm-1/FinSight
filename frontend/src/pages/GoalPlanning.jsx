import { useEffect, useMemo, useState } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getFinancialData } from "../services/financialDataService";

function getTransactions(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.transactions)) return response.transactions;
  if (Array.isArray(response?.data?.transactions)) {
    return response.data.transactions;
  }
  return [];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "Not available";

  const [year, month, day] = dateString.split("-");

  return `${day}-${month}-${year}`;
}

function getDateOnly(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
      );

      if (
        date.getFullYear() === Number(match[1]) &&
        date.getMonth() === Number(match[2]) - 1 &&
        date.getDate() === Number(match[3])
      ) {
        return date;
      }

      return null;
    }
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function getFinancialYearStartYear(date) {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

function getPeriodRange(
  periodType,
  selectedMonth,
  selectedQuarter,
  selectedFY,
) {
  let start;
  let end;

  if (periodType === "monthly") {
    const [year, month] = selectedMonth.split("-").map(Number);

    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0);
  } else if (periodType === "quarterly") {
    const fyStart = Number(selectedFY);
    const quarter = Number(selectedQuarter);
    const quarterStartMonths = [3, 6, 9, 0];
    const month = quarterStartMonths[quarter - 1];
    const year = quarter === 4 ? fyStart + 1 : fyStart;

    start = new Date(year, month, 1);
    end = new Date(year, month + 3, 0);
  } else {
    const fyStart = Number(selectedFY);

    start = new Date(fyStart, 3, 1);
    end = new Date(fyStart + 1, 3, 0);
  }

  return {
    start,
    end,
    startString: localDateString(start),
    endString: localDateString(end),
  };
}

function getMonthLabel(value) {
  if (!value) return "";

  const [year, month] = value.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getPeriodLabel(
  periodType,
  selectedMonth,
  selectedQuarter,
  selectedFY,
) {
  if (periodType === "monthly") {
    return getMonthLabel(selectedMonth);
  }

  if (periodType === "quarterly") {
    const labels = {
      1: "April – June",
      2: "July – September",
      3: "October – December",
      4: "January – March",
    };

    const quarter = Number(selectedQuarter);
    const startYear = Number(selectedFY);
    const year = quarter === 4 ? startYear + 1 : startYear;

    return `Q${quarter}: ${labels[quarter]} ${year}`;
  }

  return `FY ${selectedFY}–${String(Number(selectedFY) + 1).slice(-2)}`;
}

function getInitialMonth() {
  return localDateString(new Date()).slice(0, 7);
}

function getInitialFinancialYear() {
  return String(getFinancialYearStartYear(new Date()));
}

export default function GoalPlanning() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [periodType, setPeriodType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth);
  const [selectedQuarter, setSelectedQuarter] = useState("1");
  const [selectedFY, setSelectedFY] = useState(getInitialFinancialYear);

  const [goalType, setGoalType] = useState("profit");
  const [goalTitle, setGoalTitle] = useState("Increase business profit");
  const [targetAmount, setTargetAmount] = useState("100000");

  async function loadFinancialData() {
    try {
      setLoading(true);
      setError("");

      const response = await getFinancialData();
      setTransactions(getTransactions(response));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load financial data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinancialData();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set([
      getFinancialYearStartYear(new Date()),
      Number(selectedFY),
    ]);

    transactions.forEach((transaction) => {
      const date = getDateOnly(transaction.date);

      if (date) {
        years.add(getFinancialYearStartYear(date));
      }
    });

    return [...years].filter(Number.isFinite).sort((a, b) => b - a);
  }, [transactions, selectedFY]);

  const periodRange = useMemo(
    () =>
      getPeriodRange(periodType, selectedMonth, selectedQuarter, selectedFY),
    [periodType, selectedMonth, selectedQuarter, selectedFY],
  );

  const periodLabel = useMemo(
    () =>
      getPeriodLabel(periodType, selectedMonth, selectedQuarter, selectedFY),
    [periodType, selectedMonth, selectedQuarter, selectedFY],
  );

  // The deadline automatically becomes the last date of the selected period.
  const deadline = periodRange.endString;

  const financialSummary = useMemo(() => {
    let revenue = 0;
    let expenses = 0;
    let transactionCount = 0;

    transactions.forEach((transaction) => {
      const date = getDateOnly(transaction.date);

      if (!date || date < periodRange.start || date > periodRange.end) {
        return;
      }

      const amount = Number(transaction.amount);

      if (!Number.isFinite(amount)) return;

      if (transaction.type === "Revenue") {
        revenue += amount;
        transactionCount += 1;
      } else if (transaction.type === "Expense") {
        expenses += amount;
        transactionCount += 1;
      }
    });

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      transactionCount,
    };
  }, [transactions, periodRange]);

  const goal = useMemo(() => {
    const target = Number(targetAmount);
    const validTarget = Number.isFinite(target) && target > 0;

    const today = getDateOnly(new Date());
    const targetDate = getDateOnly(deadline);

    let currentAmount = 0;
    let remainingAmount = 0;
    let progress = 0;

    if (goalType === "revenue") {
      currentAmount = financialSummary.revenue;
    } else if (goalType === "profit") {
      currentAmount = financialSummary.profit;
    } else {
      currentAmount = financialSummary.expenses;
    }

    if (validTarget) {
      if (goalType === "expenseReduction") {
        remainingAmount = Math.max(0, currentAmount - target);

        progress =
          currentAmount <= target
            ? 100
            : currentAmount > 0
              ? Math.max(0, Math.min(100, (target / currentAmount) * 100))
              : 100;
      } else {
        remainingAmount = Math.max(0, target - currentAmount);
        progress = Math.max(0, Math.min(100, (currentAmount / target) * 100));
      }
    }

    const periodEnd = periodRange.end;
    const effectiveEnd =
      targetDate && targetDate < periodEnd ? targetDate : periodEnd;

    let monthsRemaining = 0;

    if (today && effectiveEnd && effectiveEnd >= today) {
      monthsRemaining = Math.max(
        1,
        (effectiveEnd.getFullYear() - today.getFullYear()) * 12 +
          effectiveEnd.getMonth() -
          today.getMonth() +
          1,
      );
    }

    const monthlyRequirement =
      validTarget && monthsRemaining > 0
        ? remainingAmount / monthsRemaining
        : 0;

    let status = "In progress";

    if (!validTarget) {
      status = "Check goal details";
    } else if (progress >= 100) {
      status = "Goal achieved";
    } else if (today > periodEnd) {
      status = "Period ended";
    }

    return {
      target,
      validTarget,
      currentAmount,
      remainingAmount,
      progress,
      monthsRemaining,
      monthlyRequirement,
      status,
      targetDate,
    };
  }, [goalType, targetAmount, deadline, financialSummary, periodRange]);

  function handleGoalTypeChange(value) {
    setGoalType(value);

    if (value === "revenue") {
      setGoalTitle("Increase business revenue");
    } else if (value === "profit") {
      setGoalTitle("Increase business profit");
    } else {
      setGoalTitle("Reduce business expenses");
    }
  }

  const inputClass =
    "mt-2.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const cardClass =
    "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:p-9";

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 px-6 py-10 text-sm text-gray-600">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span>Loading goal planning...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-6 sm:m-6 sm:p-8">
        <div className="flex items-center gap-3 text-sm font-semibold text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Unable to load goal planning
        </div>

        <p className="mt-3 text-sm text-red-600">{error}</p>

        <button
          type="button"
          onClick={loadFinancialData}
          className="mt-6 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <header className="flex items-center gap-4">
        <div className="shrink-0 rounded-xl bg-blue-100 p-3.5">
          <Target className="h-6 w-6 text-blue-700" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Goal Planning
          </h1>
          <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
            Set financial targets and monitor your business performance by
            period.
          </p>
        </div>
      </header>

      {/* Period Selection */}
      <section className={cardClass}>
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              Select Goal Period
            </h2>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              The deadline will automatically match the selected period.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setPeriodType("monthly")}
            className={`rounded-xl border p-4 text-left transition ${
              periodType === "monthly"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">Monthly Goal</p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Track results for one month.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPeriodType("quarterly")}
            className={`rounded-xl border p-4 text-left transition ${
              periodType === "quarterly"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">
              Quarterly Goal
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Track one three-month financial quarter.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPeriodType("financialYear")}
            className={`rounded-xl border p-4 text-left transition ${
              periodType === "financialYear"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">
              Financial Year Goal
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Track the April–March financial year.
            </p>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {periodType === "monthly" && (
            <div>
              <label
                htmlFor="selectedMonth"
                className="text-sm font-medium text-gray-700"
              >
                Select Month
              </label>
              <input
                id="selectedMonth"
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {periodType === "quarterly" && (
            <>
              <div>
                <label
                  htmlFor="selectedQuarter"
                  className="text-sm font-medium text-gray-700"
                >
                  Select Quarter
                </label>
                <select
                  id="selectedQuarter"
                  value={selectedQuarter}
                  onChange={(event) => setSelectedQuarter(event.target.value)}
                  className={inputClass}
                >
                  <option value="1">Q1 — April to June</option>
                  <option value="2">Q2 — July to September</option>
                  <option value="3">Q3 — October to December</option>
                  <option value="4">Q4 — January to March</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="quarterFY"
                  className="text-sm font-medium text-gray-700"
                >
                  Financial Year
                </label>
                <select
                  id="quarterFY"
                  value={selectedFY}
                  onChange={(event) => setSelectedFY(event.target.value)}
                  className={inputClass}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={String(year)}>
                      FY {year}–{String(year + 1).slice(-2)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {periodType === "financialYear" && (
            <div>
              <label
                htmlFor="selectedFY"
                className="text-sm font-medium text-gray-700"
              >
                Select Financial Year
              </label>
              <select
                id="selectedFY"
                value={selectedFY}
                onChange={(event) => setSelectedFY(event.target.value)}
                className={inputClass}
              >
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>
                    FY {year}–{String(year + 1).slice(-2)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl bg-blue-50 p-4 sm:p-5">
          <p className="text-xs font-medium text-blue-800 sm:text-sm">
            Selected period
          </p>
          <p className="mt-2 text-base font-semibold text-blue-900">
            {periodLabel}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            {formatDate(periodRange.startString)} to{" "}
            {formatDate(periodRange.endString)}
          </p>
        </div>
      </section>

      {/* Financial Summary */}
      <section>
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
            Financial Summary
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Results for {periodLabel}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <div className={cardClass}>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Revenue
            </div>
            <p className="mt-4 break-words text-xl font-bold text-gray-900">
              {formatCurrency(financialSummary.revenue)}
            </p>
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Expenses
            </div>
            <p className="mt-4 break-words text-xl font-bold text-gray-900">
              {formatCurrency(financialSummary.expenses)}
            </p>
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              Profit / Loss
            </div>
            <p
              className={`mt-4 break-words text-xl font-bold ${
                financialSummary.profit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(financialSummary.profit)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Transactions included: {financialSummary.transactionCount}
        </p>
      </section>

      {/* Goal Configuration and Progress */}
      <section className="grid grid-cols-1 items-start gap-7 lg:grid-cols-2 lg:gap-8">
        <div className={cardClass}>
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
            Configure Your Goal
          </h2>
          <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
            Set a financial target for {periodLabel}.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="goalType"
                className="text-sm font-medium text-gray-700"
              >
                Goal Type
              </label>
              <select
                id="goalType"
                value={goalType}
                onChange={(event) => handleGoalTypeChange(event.target.value)}
                className={inputClass}
              >
                <option value="revenue">Increase Revenue</option>
                <option value="profit">Increase Profit</option>
                <option value="expenseReduction">Reduce Expenses</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="goalTitle"
                className="text-sm font-medium text-gray-700"
              >
                Goal Name
              </label>
              <input
                id="goalTitle"
                type="text"
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Enter your goal name"
                className={inputClass}
                maxLength={100}
              />
            </div>

            <div>
              <label
                htmlFor="targetAmount"
                className="text-sm font-medium text-gray-700"
              >
                {goalType === "expenseReduction"
                  ? "Desired Expense Limit (₹)"
                  : "Target Amount (₹)"}
              </label>
              <input
                id="targetAmount"
                type="number"
                min="1"
                step="0.01"
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder="Enter target amount"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="text-sm font-medium text-gray-700"
              >
                Automatically Selected Deadline
              </label>
              <input
                id="deadline"
                type="text"
                value={formatDate(deadline)}
                readOnly
                className={`${inputClass} cursor-not-allowed bg-gray-100 text-gray-700`}
              />
              <p className="mt-2 text-xs leading-5 text-gray-500">
                This deadline is automatically set to the last day of the
                selected month, quarter, or financial year.
              </p>
            </div>
          </div>
        </div>

        {/* Goal Progress */}
        <div className={cardClass}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                Goal Progress
              </h2>
              <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
                Progress for {periodLabel}
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-blue-100 p-3">
              <Target className="h-5 w-5 text-blue-700" />
            </div>
          </div>

          <h3 className="mt-8 break-words text-lg font-bold text-gray-900">
            {goalTitle || "Untitled Goal"}
          </h3>

          <div className="mt-8 flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 sm:text-sm">
                {goalType === "expenseReduction"
                  ? "Recorded Expenses"
                  : goalType === "revenue"
                    ? "Recorded Revenue"
                    : "Recorded Profit / Loss"}
              </p>
              <p className="mt-2 break-words text-lg font-bold text-gray-900">
                {formatCurrency(goal.currentAmount)}
              </p>
            </div>

            <div className="min-w-0 text-right">
              <p className="text-xs text-gray-500 sm:text-sm">
                {goalType === "expenseReduction" ? "Expense Limit" : "Target"}
              </p>
              <p className="mt-2 break-words text-base font-semibold text-gray-700">
                {formatCurrency(goal.target)}
              </p>
            </div>
          </div>

          <div className="mt-7 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goal.progress >= 100 ? "bg-green-500" : "bg-blue-600"
              }`}
              style={{
                width: `${goal.validTarget ? goal.progress : 0}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500">Period goal progress</span>
            <span className="font-semibold text-gray-900">
              {goal.validTarget ? `${goal.progress.toFixed(1)}%` : "—"}
            </span>
          </div>

          <div className="mt-8 rounded-xl bg-gray-50 p-5 sm:p-6">
            <div className="flex items-center gap-3 text-xs text-gray-600 sm:text-sm">
              <CalendarDays className="h-5 w-5 shrink-0 text-gray-500" />
              <span>Deadline: {formatDate(deadline)}</span>
            </div>

            <div className="mt-5 flex items-start gap-3">
              {goal.status === "Goal achieved" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              )}

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {goal.status}
                </p>
                <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
                  {goal.status === "Goal achieved"
                    ? "Your selected target has been reached for this period."
                    : goal.status === "Period ended"
                      ? "This period has ended. Select another period to review its results."
                      : goal.status === "Check goal details"
                        ? "Enter a valid target amount greater than zero."
                        : goalType === "expenseReduction"
                          ? "Keep expenses at or below your selected expense limit for this period."
                          : "Continue improving your financial performance to reach this period's target."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-5">
              <p className="text-xs leading-5 text-gray-500 sm:text-sm">
                {goalType === "expenseReduction"
                  ? "Expenses Above Limit"
                  : "Amount Remaining"}
              </p>
              <p className="mt-3 break-words text-base font-bold text-gray-900">
                {formatCurrency(goal.remainingAmount)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Information Notice */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">
              Important Information
            </h3>
            <p className="mt-3 text-xs leading-6 text-amber-800 sm:text-sm">
              Financial totals include all recorded Revenue and Expense
              transactions dated within the selected period, including unpaid
              entries. The deadline automatically matches the last day of the
              selected period. The financial year runs from April through March.
              Quarterly periods follow Q1 April–June, Q2 July–September, Q3
              October–December, and Q4 January–March. Goal settings are
              currently held in page state and are not saved to the database.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
