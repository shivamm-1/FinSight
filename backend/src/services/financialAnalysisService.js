const BusinessProfile = require("../models/BusinessProfile.js");
const FinancialData = require("../models/FinancialData.js");

const {
  calculateFinancialSummary,
  calculateProfitByCategory,
} = require("../calculations/FinancialCalculations.js");

const {
  calculateFinancialTrends,
} = require("../calculations/FinancialTrendCalculations.js");

const {
  calculateCashFlowSummary,
} = require("../calculations/CashFlowCalculations.js");

async function getFinancialAnalysis(userId) {
  const businessProfile = await BusinessProfile.findOne({
    owner: userId,
  });

  if (!businessProfile) {
    const error = new Error(
      "Create a business profile before viewing financial analysis",
    );

    error.statusCode = 404;
    throw error;
  }

  const transactions = await FinancialData.find({
    businessProfile: businessProfile._id,
  }).lean();

  const financialSummary = calculateFinancialSummary(transactions);
  const profitByCategory = calculateProfitByCategory(transactions);
  const financialTrends = calculateFinancialTrends(transactions);
  const cashFlowSummary = calculateCashFlowSummary(transactions);

  return {
    businessProfile: {
      id: businessProfile._id,
      businessName: businessProfile.businessName,
    },
    financialSummary,
    profitByCategory,
    financialTrends,
    cashFlowSummary,
    transactionCount: transactions.length,
  };
}

module.exports = { getFinancialAnalysis };
