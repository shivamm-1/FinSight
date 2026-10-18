const mongoose = require("mongoose");

const financialDataSchema = new mongoose.Schema(
  {
    businessProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessProfile",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    type: {
      type: String,
      enum: ["Revenue", "Expense"],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than zero"],
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank", "UPI", "Card", "Other"],
      required: true,
    },

    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },

    paymentDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return value === null || this.isPaid === true;
        },
        message: "Payment date can only be set for paid transactions",
      },
    },
  },
  {
    timestamps: true,
  },
);

financialDataSchema.index({
  businessProfile: 1,
  date: -1,
});

financialDataSchema.index({
  businessProfile: 1,
  type: 1,
  date: -1,
});

financialDataSchema.index({
  businessProfile: 1,
  isPaid: 1,
  paymentDate: -1,
});

module.exports = mongoose.model("FinancialData", financialDataSchema);
