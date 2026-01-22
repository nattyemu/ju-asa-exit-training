import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .email("Please enter a valid email address")
    .min(5, "Email must be at least 5 characters long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password is too long"),
  fullName: z
    .string()
    .min(2, "full name must be at least 2 characters long")
    .max(100, "full name is too long"),
  department: z
    .string()
    .min(2, "Department name must be at least 2 characters long")
    .max(100, "Department name is too long"),
  university: z
    .string()
    .min(2, "University name must be at least 2 characters long")
    .max(100, "University name is too long"),
  year: z
    .number()
    .int()
    .min(
      new Date().getFullYear(),
      `Year must be at least ${new Date().getFullYear()}`
    )
    .max(
      new Date().getFullYear() + 10,
      `Year cannot exceed ${new Date().getFullYear() + 10}`
    )
    .optional(),
  role: z
    .enum(["STUDENT", "ADMIN"], {
      errorMap: () => ({ message: "Role must be either STUDENT or ADMIN" }),
    })
    .default("STUDENT"),
  profileImageUrl: z.string().nullable().optional(),
});

export const loginSchema = z.object({
  email: z
    .email("Please enter a valid email address")
    .min(5, "Email must be at least 5 characters long"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "first name must be at least 2 characters long")
    .optional(),
  lastName: z
    .string()
    .min(2, "last name must be at least 2 characters long")
    .optional(),
  department: z.string().min(2, "Department is required").optional(),
  university: z.string().min(2, "University is required").optional(),
  year: z
    .number()
    .int()
    .min(
      new Date().getFullYear(),
      `Year must be at least ${new Date().getFullYear()}`
    )
    .max(
      new Date().getFullYear() + 10,
      `Year cannot exceed ${new Date().getFullYear() + 10}`
    )
    .optional(),
  profileImageUrl: z.string().nullable().optional(),
});

export const forgetPassowd = z.object({
  email: z.email("Please enter a valid email address"),
});

export const confirmOtpSchema = z.object({
  otp: z.string().min(1, "OTP is required"),
  email: z.email("Please enter a valid email address"),
});

export const newPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
  otp: z.string().min(1, "OTP is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(42, "Password must be less than 42 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(42, "Password must be less than 42 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});