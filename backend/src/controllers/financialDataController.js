const mongoose = require("mongoose");
const FinancialData = require("../models/financialData.js");
const BusinessProfile = require("../models/businessProfile.js");

// Get all financial transactions for the logged-in user's business
async function getFinancialData(req, res) {
  try {
    const businessProfile = await BusinessProfile.findOne({
      owner: req.user._id,
    });

    if (!businessProfile) {
      return res.status(404).json({
        message: "Create a business profile before adding financial data",
      });
    }

    const transactions = await FinancialData.find({
      businessProfile: businessProfile._id,
    }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      message: "Financial data retrieved successfully",
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Get financial data error:", error);

    return res.status(500).json({
      message: "Unable to retrieve financial data",
    });
  }
}

// Create a new financial transaction
async function createFinancialData(req, res) {
  try {
    const businessProfile = await BusinessProfile.findOne({
      owner: req.user._id,
    });

    if (!businessProfile) {
      return res.status(404).json({
        message: "Create a business profile before adding financial data",
      });
    }

    const transaction = await FinancialData.create({
      ...req.body,
      businessProfile: businessProfile._id,
    });

    return res.status(201).json({
      message: "Financial transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      console.error("Financial data validation details:", error);

      return res.status(400).json({
        message: "Financial transaction validation failed",
        errors: Object.values(error.errors).map((item) => ({
          field: item.path,
          message: item.message,
          value: item.value,
        })),
      });
    }

    if (error.name === "CastError") {
      console.error("Financial data cast error:", error);

      return res.status(400).json({
        message: "Invalid value provided for a financial transaction",
        errors: [
          {
            field: error.path,
            message: error.message,
            value: error.value,
          },
        ],
      });
    }

    console.error("Create financial data error:", error);

    return res.status(500).json({
      message: "Unable to create financial transaction",
    });
  }
}

// Update an existing financial transaction
async function updateFinancialData(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid financial transaction ID",
      });
    }

    const businessProfile = await BusinessProfile.findOne({
      owner: req.user._id,
    });

    if (!businessProfile) {
      return res.status(404).json({
        message: "Business profile not found for this account",
      });
    }

    const transaction = await FinancialData.findOne({
      _id: id,
      businessProfile: businessProfile._id,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Financial transaction not found for this account",
      });
    }

    const finalIsPaid =
      req.body.isPaid !== undefined ? req.body.isPaid : transaction.isPaid;

    const finalPaymentDate =
      req.body.paymentDate !== undefined
        ? req.body.paymentDate
        : transaction.paymentDate;

    const finalDate =
      req.body.date !== undefined ? req.body.date : transaction.date;

    if (finalPaymentDate && !finalIsPaid) {
      return res.status(400).json({
        message: "Payment date requires the transaction to be marked as paid",
      });
    }

    if (finalIsPaid && !finalPaymentDate) {
      return res.status(400).json({
        message: "A payment date is required for paid transactions",
      });
    }

    if (finalPaymentDate && new Date(finalPaymentDate) < new Date(finalDate)) {
      return res.status(400).json({
        message: "Payment date cannot be earlier than transaction date",
      });
    }

    Object.assign(transaction, req.body);
    await transaction.save();

    return res.status(200).json({
      message: "Financial transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      console.error("Update financial data validation details:", error);

      return res.status(400).json({
        message: "Financial transaction validation failed",
        errors: Object.values(error.errors).map((item) => ({
          field: item.path,
          message: item.message,
          value: item.value,
        })),
      });
    }

    console.error("Update financial data error:", error);

    return res.status(500).json({
      message: "Unable to update financial transaction",
    });
  }
}

// Delete an existing financial transaction
async function deleteFinancialData(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid financial transaction ID",
      });
    }

    const businessProfile = await BusinessProfile.findOne({
      owner: req.user._id,
    });

    if (!businessProfile) {
      return res.status(404).json({
        message: "Business profile not found for this account",
      });
    }

    const transaction = await FinancialData.findOneAndDelete({
      _id: id,
      businessProfile: businessProfile._id,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Financial transaction not found for this account",
      });
    }

    return res.status(200).json({
      message: "Financial transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete financial data error:", error);

    return res.status(500).json({
      message: "Unable to delete financial transaction",
    });
  }
}

module.exports = {
  getFinancialData,
  createFinancialData,
  updateFinancialData,
  deleteFinancialData,
};
