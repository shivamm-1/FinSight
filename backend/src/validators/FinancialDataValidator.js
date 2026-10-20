const { z } = require("zod");

const validDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);

const financialDataSchema = z
  .object({
    date: z
      .string()
      .trim()
      .refine(validDate, "Date must be a valid date in YYYY-MM-DD format"),

    type: z.enum(["Revenue", "Expense"], {
      message: "Type must be Revenue or Expense",
    }),

    category: z
      .string()
      .trim()
      .min(1, "Category is required")
      .max(100, "Category cannot exceed 100 characters"),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .default(""),

    amount: z
      .number({
        message: "Amount must be a number",
      })
      .finite("Amount must be a finite number")
      .positive("Amount must be greater than zero"),

    paymentMethod: z.enum(["Cash", "Bank", "UPI", "Card", "Other"], {
      message: "Invalid payment method",
    }),

    isPaid: z.boolean().optional().default(false),

    paymentDate: z
      .string()
      .trim()
      .refine(
        validDate,
        "Payment date must be a valid date in YYYY-MM-DD format",
      )
      .nullable()
      .optional()
      .default(null),
  })
  .superRefine((data, context) => {
    if (data.paymentDate && data.isPaid === false) {
      context.addIssue({
        code: "custom",
        path: ["paymentDate"],
        message: "Payment date requires the transaction to be marked as paid",
      });
    }

    if (data.isPaid === true && !data.paymentDate) {
      context.addIssue({
        code: "custom",
        path: ["paymentDate"],
        message: "Payment date is required for paid transactions",
      });
    }

    if (data.paymentDate && data.date && data.paymentDate < data.date) {
      context.addIssue({
        code: "custom",
        path: ["paymentDate"],
        message: "Payment date cannot be earlier than the transaction date",
      });
    }
  });

module.exports = {
  financialDataSchema,
};
