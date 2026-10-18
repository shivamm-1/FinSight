export function calculateProfit(revenue, expenses) {
  return revenue - expenses;
}

export function calculateProfitMargin(profit, revenue) {
  if (revenue === 0) {
    return 0;
  }

  return (profit / revenue) * 100;
}

export function calculateNetCashFlow(cashInflows, cashOutflows) {
  return cashInflows - cashOutflows;
}
