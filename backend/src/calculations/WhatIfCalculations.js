function calculateWhatIfScenario({
  currentRevenue,
  currentExpenses,
  revenueChangePercent = 0,
  expenseChangePercent = 0,
}) {
  const values = {
    currentRevenue,
    currentExpenses,
    revenueChangePercent,
    expenseChangePercent,
  };

  for (const [field, value] of Object.entries(values)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`${field} must be a valid number`);
    }
  }

  if (currentRevenue < 0 || currentExpenses < 0) {
    throw new Error("Current revenue and expenses cannot be negative");
  }

  if (revenueChangePercent < -100) {
    throw new Error("Revenue change cannot be less than -100%");
  }

  if (expenseChangePercent < -100) {
    throw new Error("Expense change cannot be less than -100%");
  }

  const currentProfit = currentRevenue - currentExpenses;

  const projectedRevenue = currentRevenue * (1 + revenueChangePercent / 100);

  const projectedExpenses = currentExpenses * (1 + expenseChangePercent / 100);

  const projectedProfit = projectedRevenue - projectedExpenses;

  const projectedProfitMargin =
    projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : null;

  return {
    current: {
      revenue: Number(currentRevenue.toFixed(2)),
      expenses: Number(currentExpenses.toFixed(2)),
      profit: Number(currentProfit.toFixed(2)),
    },

    scenario: {
      revenueChangePercent,
      expenseChangePercent,
      projectedRevenue: Number(projectedRevenue.toFixed(2)),
      projectedExpenses: Number(projectedExpenses.toFixed(2)),
      projectedProfit: Number(projectedProfit.toFixed(2)),
      projectedProfitMargin:
        projectedProfitMargin === null
          ? null
          : Number(projectedProfitMargin.toFixed(2)),
    },

    profitDifference: Number((projectedProfit - currentProfit).toFixed(2)),
  };
}

module.exports = {
  calculateWhatIfScenario,
};
