const {
  getFinancialAnalysis,
} = require("../services/financialAnalysisService.js");

async function getFinancialAnalysisController(req, res) {
  try {
    const analysis = await getFinancialAnalysis(req.user.id);

    return res.status(200).json({
      message: "Financial analysis retrieved successfully",
      data: analysis,
    });
  } catch (error) {
    console.error("Financial analysis error:", error.message);

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      message:
        statusCode === 404
          ? error.message
          : "Unable to retrieve financial analysis",
    });
  }
}

module.exports = {
  getFinancialAnalysisController,
};
