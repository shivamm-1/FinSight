function calculateBreakEven({
  fixedCosts,
  variableCostPerUnit,
  sellingPricePerUnit,
}) {
  const values = {
    fixedCosts,
    variableCostPerUnit,
    sellingPricePerUnit,
  };

  for (const [field, value] of Object.entries(values)) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a valid non-negative number`);
    }
  }

  if (sellingPricePerUnit <= variableCostPerUnit) {
    throw new Error(
      "Selling price per unit must be greater than variable cost per unit",
    );
  }

  const contributionPerUnit = sellingPricePerUnit - variableCostPerUnit;

  const breakEvenUnits = Math.ceil(fixedCosts / contributionPerUnit);

  const breakEvenSales = breakEvenUnits * sellingPricePerUnit;

  return {
    contributionPerUnit: Number(contributionPerUnit.toFixed(2)),
    breakEvenUnits,
    breakEvenSales: Number(breakEvenSales.toFixed(2)),
  };
}

module.exports = {
  calculateBreakEven,
};
