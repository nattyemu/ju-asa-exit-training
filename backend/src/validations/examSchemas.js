import { z } from "zod";

export const createExamSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(255, "Title cannot exceed 255 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .optional()
      .or(z.literal("")),
    availableFrom: z
      .string()
      .min(1, "Available from date is required")
      .refine(
        (date) => {
          try {
            const d = new Date(date);
            return !isNaN(d.getTime());
          } catch {
            return false;
          }
        },
        {
          message:
            "Invalid date format. Use ISO format like: 2024-06-01T00:00:00.000Z",
        }
      )
      .refine(
        (date) => {
          const d = new Date(date);
          const now = new Date();
          return d > now;
        },
        {
          message: "Available from date must be in the future",
        }
      ),
    availableUntil: z
      .string()
      .min(1, "Available until date is required")
      .refine(
        (date) => {
          try {
            const d = new Date(date);
            return !isNaN(d.getTime());
          } catch {
            return false;
          }
        },
        {
          message:
            "Invalid date format. Use ISO format like: 2024-06-30T23:59:59.000Z",
        }
      ),
    duration: z
      .number()
      .int("Duration must be an integer")
      .min(1, "Duration must be at least 1 minute")
      .max(480, "Duration cannot exceed 480 minutes (8 hours)"),
    totalQuestions: z
      .number()
      .int("Total questions must be an integer")
      .min(1, "Exam must have at least 1 question")
      .max(500, "Exam cannot have more than 500 questions"),
    passingScore: z
      .number()
      .min(0, "Passing score cannot be negative")
      .max(100, "Passing score cannot exceed 100%")
      .default(50),
    isActive: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const from = new Date(data.availableFrom);
      const until = new Date(data.availableUntil);
      return until > from;
    },
    {
      message: "Available until date must be after available from date",
      path: ["availableUntil"],
    }
  );

export const updateExamSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(255, "Title cannot exceed 255 characters")
      .optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .optional()
      .or(z.literal("")),
    availableFrom: z
      .string()
      .refine(
        (date) => {
          try {
            const d = new Date(date);
            return !isNaN(d.getTime());
          } catch {
            return false;
          }
        },
        {
          message:
            "Invalid date format. Use ISO format like: 2024-06-01T00:00:00.000Z",
        }
      )
      .optional(),
    availableUntil: z
      .string()
      .refine(
        (date) => {
          try {
            const d = new Date(date);
            return !isNaN(d.getTime());
          } catch {
            return false;
          }
        },
        {
          message:
            "Invalid date format. Use ISO format like: 2024-06-30T23:59:59.000Z",
        }
      )
      .optional(),
    duration: z
      .number()
      .int("Duration must be an integer")
      .min(1, "Duration must be at least 1 minute")
      .max(480, "Duration cannot exceed 480 minutes (8 hours)")
      .optional(),
    totalQuestions: z
      .number()
      .int("Total questions must be an integer")
      .min(1, "Exam must have at least 1 question")
      .max(500, "Exam cannot have more than 500 questions")
      .optional(),
    passingScore: z
      .number()
      .min(0, "Passing score cannot be negative")
      .max(100, "Passing score cannot exceed 100%")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.availableFrom && data.availableUntil) {
        const from = new Date(data.availableFrom);
        const until = new Date(data.availableUntil);
        return until > from;
      }
      return true;
    },
    {
      message: "Available until date must be after available from date",
      path: ["availableUntil"],
    }
  );

export const examStatusSchema = z.object({
  isActive: z.boolean(),
});

export const formatZodError = (error) => {
  if (error.issues && error.issues.length > 0) {
    const fieldMessages = error.issues.map((issue) => {
      const field = issue.path[issue.path.length - 1];
      if (field) {
        const fieldName =
          field === "availableFrom"
            ? "Available from date"
            : field === "availableUntil"
            ? "Available until date"
            : field === "totalQuestions"
            ? "Total questions"
            : field === "passingScore"
            ? "Passing score"
            : field.charAt(0).toUpperCase() + field.slice(1);
        return `${fieldName}: ${issue.message}`;
      }
      return issue.message;
    });

    return fieldMessages.join(". ");
  }
  return "Please check your input and try again";
};
