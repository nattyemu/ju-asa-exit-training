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
    .int("Graduation year must be a whole number")
    .min(2000, "Graduation year must be 2000 or later")
    .max(2030, "Graduation year must be 2030 or earlier"),
  role: z
    .enum(["STUDENT", "ADMIN"], {
      errorMap: () => ({ message: "Role must be either STUDENT or ADMIN" }),
    })
    .default("STUDENT"),
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
    .min(2000)
    .max(2030, "Invalid graduation year")
    .optional(),
});
