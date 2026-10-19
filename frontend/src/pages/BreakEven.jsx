import { useEffect, useMemo, useState } from "react";
import { getFinancialData } from "../services/financialDataService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

function getTransactions(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.transactions)) return response.transactions;
  return [];
}

function BreakEven() {
  const [transactions, setTransactions] = useState([]);
  const [fixedCosts, setFixedCosts] = useState("10000");
  const [sellingPrice, setSellingPrice] = useState("500");
  const [variableCost, setVariableCost] = useState("300");
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

  const recordedTotals = useMemo(
    () =>
      transactions.reduce(
        (totals, transaction) => {
          const amount = Number(transaction.amount);

          if (!Number.isFinite(amount) || amount < 0) return totals;

          if (transaction.type === "Revenue") totals.revenue += amount;
          if (transaction.type === "Expense") totals.expenses += amount;

          return totals;
        },
        { revenue: 0, expenses: 0 },
      ),
    [transactions],
  );

  const fixedCostValue = Number(fixedCosts);
  const sellingPriceValue = Number(sellingPrice);
  const variableCostValue = Number(variableCost);

  const validInputs =
    fixedCosts.trim() !== "" &&
    sellingPrice.trim() !== "" &&
    variableCost.trim() !== "" &&
    Number.isFinite(fixedCostValue) &&
    Number.isFinite(sellingPriceValue) &&
    Number.isFinite(variableCostValue) &&
    fixedCostValue >= 0 &&
    sellingPriceValue > 0 &&
    variableCostValue >= 0 &&
    variableCostValue < sellingPriceValue;

  const result = useMemo(() => {
    if (!validInputs) return null;

    const contribution = sellingPriceValue - variableCostValue;
    const breakEvenUnits = Math.ceil(fixedCostValue / contribution);
    const breakEvenRevenue = breakEvenUnits * sellingPriceValue;
    const contributionMargin = (contribution / sellingPriceValue) * 100;

    return {
      contribution,
      breakEvenUnits,
      breakEvenRevenue,
      contributionMargin,
      fixedCosts: fixedCostValue,
      sellingPrice: sellingPriceValue,
      variableCost: variableCostValue,
    };
  }, [validInputs, fixedCostValue, sellingPriceValue, variableCostValue]);

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
            Break-Even Analysis
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Calculate how many units your business must sell to cover its fixed
            and variable costs without making a profit or loss.
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Recorded revenue
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(recordedTotals.revenue)}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-500">
              Recorded expenses
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(recordedTotals.expenses)}
            </p>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-bold text-gray-900">
            Enter your business costs
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Enter values for the same product or service and the same analysis
            period. The example values can be changed to match your business.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label
                htmlFor="fixedCosts"
                className="font-semibold text-gray-800"
              >
                Total fixed costs (₹)
              </label>

              <input
                id="fixedCosts"
                type="number"
                min="0"
                step="0.01"
                value={fixedCosts}
                onChange={(event) => setFixedCosts(event.target.value)}
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-500">
                Costs that generally do not change with the number of units
                sold, such as rent.
              </p>
            </div>

            <div>
              <label
                htmlFor="sellingPrice"
                className="font-semibold text-gray-800"
              >
                Selling price per unit (₹)
              </label>

              <input
                id="sellingPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={sellingPrice}
                onChange={(event) => setSellingPrice(event.target.value)}
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-500">
                The amount received for selling one unit.
              </p>
            </div>

            <div>
              <label
                htmlFor="variableCost"
                className="font-semibold text-gray-800"
              >
                Variable cost per unit (₹)
              </label>

              <input
                id="variableCost"
                type="number"
                min="0"
                step="0.01"
                value={variableCost}
                onChange={(event) => setVariableCost(event.target.value)}
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-500">
                Cost of producing or providing one unit, such as materials.
              </p>
            </div>
          </div>

          {!validInputs && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              Enter valid values. Fixed costs and variable costs cannot be
              negative, the selling price must be positive, and the variable
              cost must be lower than the selling price.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setFixedCosts("10000");
                setSellingPrice("500");
                setVariableCost("300");
              }}
              className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              Reset example
            </button>

            <button
              type="button"
              onClick={() => {
                setFixedCosts("0");
                setSellingPrice("500");
                setVariableCost("300");
              }}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Test zero fixed costs
            </button>
          </div>
        </section>

        {result && (
          <>
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Your break-even results
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className={cardClass}>
                  <p className="text-sm font-medium text-gray-500">
                    Break-even units
                  </p>
                  <p className="mt-3 text-2xl font-bold text-blue-700">
                    {result.breakEvenUnits.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Minimum whole units to cover costs.
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm font-medium text-gray-500">
                    Break-even revenue
                  </p>
                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {formatCurrency(result.breakEvenRevenue)}
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm font-medium text-gray-500">
                    Contribution per unit
                  </p>
                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {formatCurrency(result.contribution)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Selling price minus variable cost.
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm font-medium text-gray-500">
                    Contribution margin
                  </p>
                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {result.contributionMargin.toFixed(2)}%
                  </p>
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                Calculation breakdown
              </h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">
                    Step 1: Calculate contribution per unit
                  </p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {formatCurrency(result.sellingPrice)} −{" "}
                    {formatCurrency(result.variableCost)} ={" "}
                    {formatCurrency(result.contribution)}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">
                    Step 2: Calculate break-even quantity
                  </p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {formatCurrency(result.fixedCosts)} ÷{" "}
                    {formatCurrency(result.contribution)} ={" "}
                    {result.breakEvenUnits.toLocaleString("en-IN")} units
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    The result is rounded up to the next whole unit so the
                    calculated sales cover fixed costs.
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-500">
                    Step 3: Calculate break-even revenue
                  </p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {result.breakEvenUnits.toLocaleString("en-IN")} ×{" "}
                    {formatCurrency(result.sellingPrice)} ={" "}
                    {formatCurrency(result.breakEvenRevenue)}
                  </p>
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="text-xl font-bold text-gray-900">
                What does this mean?
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                Based on the values entered, your business needs to sell{" "}
                <strong className="text-gray-900">
                  {result.breakEvenUnits.toLocaleString("en-IN")} units
                </strong>{" "}
                and generate approximately{" "}
                <strong className="text-gray-900">
                  {formatCurrency(result.breakEvenRevenue)}
                </strong>{" "}
                in sales to cover the specified fixed and variable costs. Sales
                above this level may generate profit, while sales below it may
                result in a loss, assuming the entered costs and selling price
                remain applicable.
              </p>
            </section>
          </>
        )}

        <p className="text-xs leading-5 text-gray-500">
          This is a planning estimate, not an accounting statement. The recorded
          revenue and expense totals are shown for reference only; they are not
          automatically used to determine fixed costs, variable cost per unit,
          or selling price. The calculation assumes a constant selling price and
          variable cost per unit.
        </p>
      </div>
    </main>
  );
}

export default BreakEven;
