import { z } from "zod";

// Exam ID validation
export const examIdSchema = z.object({
  examId: z.string().refine(
    (val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    },
    {
      message: "Exam ID must be a positive number",
    }
  ),
});

// Query parameters for analytics
export const analyticsQuerySchema = z.object({
  bins: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 50, {
      message: "Bins must be between 1 and 50",
    }),
});

// Student ID validation
export const studentIdSchema = z.object({
  studentId: z.string().refine(
    (val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    },
    {
      message: "Student ID must be a positive number",
    }
  ),
});

// Format Zod error function
export const formatZodError = (error) => {
  if (error.issues && error.issues.length > 0) {
    const fields = new Set();

    error.issues.forEach((issue) => {
      const field = issue.path[issue.path.length - 1];
      if (field) {
        fields.add(field);
      }
    });

    const fieldList = Array.from(fields).join(", ");
    return `Invalid ${fieldList}`;
  }
  return "Invalid input parameters";
};
