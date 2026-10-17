const { z } = require("zod");

const businessProfileUpdateSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1, "Business name is required")
      .optional(),

    businessType: z
      .string()
      .trim()
      .min(1, "Business type is required")
      .optional(),

    industry: z.string().trim().min(1, "Industry is required").optional(),

    ownerName: z.string().trim().min(1, "Owner name is required").optional(),

    contactEmail: z.string().trim().email("Invalid email address").optional(),

    contactPhone: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits")
      .optional(),

    address: z.string().trim().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

module.exports = {
  businessProfileUpdateSchema,
};
