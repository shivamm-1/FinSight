function calculateCashFlowSummary(transactions) {
  if (!Array.isArray(transactions)) {
    throw new Error("Transactions must be provided as an array");
  }

  let cashInflows = 0;
  let cashOutflows = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(
        "Every transaction must have a valid non-negative amount",
      );
    }

    if (
      transaction.isPaid !== undefined &&
      typeof transaction.isPaid !== "boolean"
    ) {
      throw new Error("Payment status must be a boolean");
    }

    // Treat older records without payment status as unpaid.
    if (transaction.isPaid !== true) {
      continue;
    }

    if (transaction.type === "Revenue") {
      cashInflows += amount;
    } else if (transaction.type === "Expense") {
      cashOutflows += amount;
    } else {
      throw new Error("Transaction type must be Revenue or Expense");
    }
  }

  return {
    cashInflows: Number(cashInflows.toFixed(2)),
    cashOutflows: Number(cashOutflows.toFixed(2)),
    netCashFlow: Number((cashInflows - cashOutflows).toFixed(2)),
  };
}

module.exports = {
  calculateCashFlowSummary,
};
