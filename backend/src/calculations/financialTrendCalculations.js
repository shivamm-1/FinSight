function calculateFinancialTrends(transactions) {
  if (!Array.isArray(transactions)) {
    throw new Error("Transactions must be provided as an array");
  }

  const monthlyData = {};

  for (const transaction of transactions) {
    const date = new Date(transaction.date);
    const amount = Number(transaction.amount);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Every transaction must have a valid date");
    }

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(
        "Every transaction must have a valid non-negative amount",
      );
    }

    if (transaction.type !== "Revenue" && transaction.type !== "Expense") {
      throw new Error("Transaction type must be Revenue or Expense");
    }

    const month = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
    ].join("-");

    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        revenue: 0,
        expenses: 0,
        profit: 0,
      };
    }

    if (transaction.type === "Revenue") {
      monthlyData[month].revenue += amount;
    } else {
      monthlyData[month].expenses += amount;
    }
  }

  return Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      month: item.month,
      revenue: Number(item.revenue.toFixed(2)),
      expenses: Number(item.expenses.toFixed(2)),
      profit: Number((item.revenue - item.expenses).toFixed(2)),
    }));
}

module.exports = {
  calculateFinancialTrends,
};
