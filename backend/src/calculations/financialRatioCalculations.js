function calculateFinancialRatios({
  totalRevenue,
  totalExpenses,
  currentAssets,
  currentLiabilities,
  totalAssets,
  totalLiabilities,
  inventory = 0,
}) {
  const values = {
    totalRevenue,
    totalExpenses,
    currentAssets,
    currentLiabilities,
    totalAssets,
    totalLiabilities,
    inventory,
  };

  for (const [field, value] of Object.entries(values)) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a valid non-negative number`);
    }
  }

  if (inventory > currentAssets) {
    throw new Error("Inventory cannot exceed current assets");
  }

  const profit = totalRevenue - totalExpenses;

  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : null;

  const currentRatio =
    currentLiabilities > 0 ? currentAssets / currentLiabilities : null;

  const quickRatio =
    currentLiabilities > 0
      ? (currentAssets - inventory) / currentLiabilities
      : null;

  const debtToAssetRatio =
    totalAssets > 0 ? totalLiabilities / totalAssets : null;

  return {
    profitMargin:
      profitMargin === null ? null : Number(profitMargin.toFixed(2)),

    currentRatio:
      currentRatio === null ? null : Number(currentRatio.toFixed(2)),

    quickRatio: quickRatio === null ? null : Number(quickRatio.toFixed(2)),

    debtToAssetRatio:
      debtToAssetRatio === null ? null : Number(debtToAssetRatio.toFixed(4)),
  };
}

module.exports = {
  calculateFinancialRatios,
};
