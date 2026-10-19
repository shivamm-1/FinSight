import { useEffect, useMemo, useState } from "react";
import { getFinancialData } from "../services/financialDataService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const formatRatio = (value) =>
  value === null ? "N/A" : `${value.toFixed(2)} : 1`;

function getTransactions(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.transactions)) return response.transactions;
  return [];
}

function RatioAnalysis() {
  const [transactions, setTransactions] = useState([]);
  const [currentAssets, setCurrentAssets] = useState("50000");
  const [inventory, setInventory] = useState("10000");
  const [currentLiabilities, setCurrentLiabilities] = useState("25000");
  const [totalAssets, setTotalAssets] = useState("150000");
  const [totalDebt, setTotalDebt] = useState("60000");
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

  const totals = useMemo(
    () =>
      transactions.reduce(
        (result, transaction) => {
          const amount = Number(transaction.amount);

          if (!Number.isFinite(amount) || amount < 0) return result;

          if (transaction.type === "Revenue") result.revenue += amount;
          if (transaction.type === "Expense") result.expenses += amount;

          return result;
        },
        { revenue: 0, expenses: 0 },
      ),
    [transactions],
  );

  const inputs = [
    currentAssets,
    inventory,
    currentLiabilities,
    totalAssets,
    totalDebt,
  ];

  const numbers = inputs.map((value) =>
    value.trim() === "" ? NaN : Number(value),
  );

  const [
    currentAssetsValue,
    inventoryValue,
    currentLiabilitiesValue,
    totalAssetsValue,
    totalDebtValue,
  ] = numbers;

  const validInputs =
    numbers.every((value) => Number.isFinite(value) && value >= 0) &&
    inventoryValue <= currentAssetsValue &&
    totalDebtValue <= totalAssetsValue;

  const ratios = useMemo(() => {
    if (!validInputs) return null;

    return {
      currentRatio:
        currentLiabilitiesValue > 0
          ? currentAssetsValue / currentLiabilitiesValue
          : null,

      quickRatio:
        currentLiabilitiesValue > 0
          ? (currentAssetsValue - inventoryValue) / currentLiabilitiesValue
          : null,

      debtToAssets:
        totalAssetsValue > 0 ? (totalDebtValue / totalAssetsValue) * 100 : null,

      workingCapital: currentAssetsValue - currentLiabilitiesValue,
    };
  }, [
    validInputs,
    currentAssetsValue,
    inventoryValue,
    currentLiabilitiesValue,
    totalAssetsValue,
    totalDebtValue,
  ]);

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
            Financial analysis
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Financial Ratio Analysis
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Understand your business liquidity, working capital, and debt level
            using financial ratios.
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Recorded revenue
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.revenue)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Recorded expenses
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(totals.expenses)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Recorded profit / loss
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
            Balance-sheet inputs
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Enter values from the same reporting date. These balance-sheet
            values are entered manually because transaction records alone do not
            provide all the information needed for these ratios.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                htmlFor="currentAssets"
                className="font-semibold text-gray-800"
              >
                Current assets (₹)
              </label>
              <input
                id="currentAssets"
                type="number"
                min="0"
                step="0.01"
                value={currentAssets}
                onChange={(event) => setCurrentAssets(event.target.value)}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-gray-500">
                Cash, bank balance, receivables, and other short-term assets.
              </p>
            </div>

            <div>
              <label
                htmlFor="inventory"
                className="font-semibold text-gray-800"
              >
                Inventory (₹)
              </label>
              <input
                id="inventory"
                type="number"
                min="0"
                step="0.01"
                value={inventory}
                onChange={(event) => setInventory(event.target.value)}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-gray-500">
                Stock held for sale or production.
              </p>
            </div>

            <div>
              <label
                htmlFor="currentLiabilities"
                className="font-semibold text-gray-800"
              >
                Current liabilities (₹)
              </label>
              <input
                id="currentLiabilities"
                type="number"
                min="0"
                step="0.01"
                value={currentLiabilities}
                onChange={(event) => setCurrentLiabilities(event.target.value)}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-gray-500">
                Obligations payable within the short term.
              </p>
            </div>

            <div>
              <label
                htmlFor="totalAssets"
                className="font-semibold text-gray-800"
              >
                Total assets (₹)
              </label>
              <input
                id="totalAssets"
                type="number"
                min="0"
                step="0.01"
                value={totalAssets}
                onChange={(event) => setTotalAssets(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="totalDebt"
                className="font-semibold text-gray-800"
              >
                Total debt / liabilities (₹)
              </label>
              <input
                id="totalDebt"
                type="number"
                min="0"
                step="0.01"
                value={totalDebt}
                onChange={(event) => setTotalDebt(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {!validInputs && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              Enter valid non-negative values. Inventory cannot exceed current
              assets, and total debt cannot exceed total assets.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setCurrentAssets("50000");
                setInventory("10000");
                setCurrentLiabilities("25000");
                setTotalAssets("150000");
                setTotalDebt("60000");
              }}
              className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              Reset example
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentAssets("0");
                setInventory("0");
                setCurrentLiabilities("0");
                setTotalAssets("0");
                setTotalDebt("0");
              }}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Test zero values
            </button>
          </div>
        </section>

        {ratios && (
          <>
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Calculated ratios
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className={cardClass}>
                  <p className="text-sm font-medium text-gray-500">
                    Current ratio
                  </p>
                  <p className="mt-3 text-2xl font-bold text-blue-700">
                    {formatRatio(ratios.currentRatio)}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Measures the ability to cover short-term liabilities using
                    current assets.
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm font-medium text-gray-500">
                    Quick ratio
                  </p>
                  <p className="mt-3 text-2xl font-bold text-blue-700">
                    {formatRatio(ratios.quickRatio)}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Measures short-term coverage after excluding inventory.
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm font-medium text-gray-500">
                    Debt-to-assets ratio
                  </p>
                  <p className="mt-3 text-2xl font-bold text-blue-700">
                    {ratios.debtToAssets === null
                      ? "N/A"
                      : `${ratios.debtToAssets.toFixed(2)}%`}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Shows the percentage of total assets represented by debt.
                  </p>
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                Working capital
              </h2>

              <p
                className={`mt-3 text-3xl font-bold ${
                  ratios.workingCapital >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(ratios.workingCapital)}
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Working capital is current assets minus current liabilities. A
                positive amount means current assets exceed current liabilities;
                a negative amount means current liabilities exceed current
                assets.
              </p>
            </section>
          </>
        )}

        <p className="text-xs leading-5 text-gray-500">
          These ratios are based on the values entered and the retrieved
          financial transactions. A ratio is not, by itself, a complete measure
          of business health. Compare results with your past performance,
          industry norms, and the accuracy of your accounts. A ratio is shown as
          N/A when its denominator is zero.
        </p>
      </div>
    </main>
  );
}

export default RatioAnalysis;
