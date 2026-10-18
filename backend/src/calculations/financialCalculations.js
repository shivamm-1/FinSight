function calculateFinancialSummary(transactions) {
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Transaction amounts must be valid non-negative numbers");
    }

    if (transaction.type === "Revenue") {
      totalRevenue += amount;
    } else if (transaction.type === "Expense") {
      totalExpenses += amount;
    } else {
      throw new Error("Transaction type must be Revenue or Expense");
    }
  }

  const profit = totalRevenue - totalExpenses;

  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    profitMargin: Number(profitMargin.toFixed(2)),
  };
}

function calculateCashFlow(cashInflows, cashOutflows) {
  if (
    !Number.isFinite(cashInflows) ||
    !Number.isFinite(cashOutflows) ||
    cashInflows < 0 ||
    cashOutflows < 0
  ) {
    throw new Error(
      "Cash inflows and outflows must be valid non-negative numbers",
    );
  }

  return {
    cashInflows: Number(cashInflows.toFixed(2)),
    cashOutflows: Number(cashOutflows.toFixed(2)),
    netCashFlow: Number((cashInflows - cashOutflows).toFixed(2)),
  };
}

function calculateProfitByCategory(transactions) {
  const categories = {};

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Transaction amounts must be valid non-negative numbers");
    }

    const category = transaction.category?.trim();

    if (!category) {
      throw new Error("Every transaction must have a category");
    }

    if (!categories[category]) {
      categories[category] = {
        revenue: 0,
        expenses: 0,
        profit: 0,
      };
    }

    if (transaction.type === "Revenue") {
      categories[category].revenue += amount;
    } else if (transaction.type === "Expense") {
      categories[category].expenses += amount;
    } else {
      throw new Error("Transaction type must be Revenue or Expense");
    }
  }

  for (const category of Object.values(categories)) {
    category.profit = Number((category.revenue - category.expenses).toFixed(2));
    category.revenue = Number(category.revenue.toFixed(2));
    category.expenses = Number(category.expenses.toFixed(2));
  }

  return categories;
}

module.exports = {
  calculateFinancialSummary,
  calculateCashFlow,
  calculateProfitByCategory,
};
