const { z } = require("zod");

const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must contain at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can contain only letters, numbers, and underscores",
      ),

    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(254, "Email address is too long"),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(72, "Password cannot exceed 72 characters"),
  })
  .strict();

const loginSchema = z
  .object({
    loginId: z
      .string()
      .trim()
      .min(1, "Email or username is required")
      .max(254, "Email or username is too long"),

    password: z
      .string()
      .min(1, "Password is required")
      .max(72, "Password cannot exceed 72 characters"),
  })
  .strict();

const forgotUsernameSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(254, "Email address is too long"),
  })
  .strict();

const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(254, "Email address is too long"),
  })
  .strict();

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(72, "Password cannot exceed 72 characters"),
  })
  .strict();

module.exports = {
  registerSchema,
  loginSchema,
  forgotUsernameSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
