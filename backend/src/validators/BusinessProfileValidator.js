const { z } = require("zod");

const businessProfileSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),

  businessType: z.string().trim().min(1, "Business type is required"),

  industry: z.string().trim().min(1, "Industry is required"),

  ownerName: z.string().trim().min(1, "Owner name is required"),

  contactEmail: z.string().trim().email("Invalid email address"),

  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits"),

  address: z.string().trim().optional(),
});

module.exports = {
  businessProfileSchema,
};
