const { z } = require("zod");

const validDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);

const financialDataUpdateSchema = z
  .object({
    date: z
      .string()
      .trim()
      .refine(validDate, "Date must be a valid date in YYYY-MM-DD format")
      .optional(),

    type: z
      .enum(["Revenue", "Expense"], {
        message: "Type must be Revenue or Expense",
      })
      .optional(),

    category: z
      .string()
      .trim()
      .min(1, "Category is required")
      .max(100, "Category cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    amount: z
      .number({
        message: "Amount must be a number",
      })
      .finite("Amount must be a finite number")
      .positive("Amount must be greater than zero")
      .optional(),

    paymentMethod: z
      .enum(["Cash", "Bank", "UPI", "Card", "Other"], {
        message: "Invalid payment method",
      })
      .optional(),

    isPaid: z.boolean().optional(),

    paymentDate: z
      .string()
      .trim()
      .refine(
        validDate,
        "Payment date must be a valid date in YYYY-MM-DD format",
      )
      .nullable()
      .optional(),
  })
  .superRefine((data, context) => {
    if (Object.keys(data).length === 0) {
      context.addIssue({
        code: "custom",
        path: [],
        message: "At least one field must be provided for update",
      });
    }
    if (data.paymentDate && data.date && data.paymentDate < data.date) {
      context.addIssue({
        code: "custom",
        path: ["paymentDate"],
        message: "Payment date cannot be earlier than the transaction date",
      });
    }

    if (data.isPaid === false && data.paymentDate) {
      context.addIssue({
        code: "custom",
        path: ["paymentDate"],
        message: "An unpaid transaction cannot have a payment date",
      });
    }
  });

module.exports = {
  financialDataUpdateSchema,
};
