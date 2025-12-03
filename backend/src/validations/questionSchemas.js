import { z } from "zod";

// Create a base question schema WITHOUT examId for reuse
const baseQuestionSchema = z.object({
  questionText: z
    .string()
    .min(5, "Question text must be at least 5 characters")
    .max(2000, "Question text cannot exceed 2000 characters"),
  optionA: z
    .string()
    .min(1, "Option A is required")
    .max(500, "Option A cannot exceed 500 characters"),
  optionB: z
    .string()
    .min(1, "Option B is required")
    .max(500, "Option B cannot exceed 500 characters"),
  optionC: z
    .string()
    .min(1, "Option C is required")
    .max(500, "Option C cannot exceed 500 characters"),
  optionD: z
    .string()
    .min(1, "Option D is required")
    .max(500, "Option D cannot exceed 500 characters"),
  correctAnswer: z.enum(["A", "B", "C", "D"], {
    errorMap: () => ({ message: "Correct answer must be A, B, C, or D" }),
  }),
  subject: z
    .string()
    .min(2, "Subject must be at least 2 characters")
    .max(255, "Subject cannot exceed 255 characters"),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"], {
      errorMap: () => ({ message: "Difficulty must be EASY, MEDIUM, or HARD" }),
    })
    .default("MEDIUM"),
  explanation: z
    .string()
    .max(2000, "Explanation cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
});

// Single question schema (WITH examId) - for POST /api/questions
export const createQuestionSchema = baseQuestionSchema.extend({
  examId: z
    .number({
      required_error: "Exam ID is required",
      invalid_type_error: "Exam ID must be a number",
    })
    .int()
    .positive("Exam ID must be a positive number"),
});

// Update question schema (WITH examId) - for PUT /api/questions/:id
export const updateQuestionSchema = baseQuestionSchema.partial().extend({
  examId: z
    .number({
      required_error: "Exam ID is required",
      invalid_type_error: "Exam ID must be a number",
    })
    .int()
    .positive("Exam ID must be a positive number"),
});

// Bulk import schema - uses baseQuestionSchema (WITHOUT examId)
export const bulkQuestionsSchema = z.object({
  examId: z
    .number({
      required_error: "Exam ID is required",
      invalid_type_error: "Exam ID must be a number",
    })
    .int()
    .positive("Exam ID must be a positive number"),
  questions: z
    .array(baseQuestionSchema)
    .min(1, "At least one question is required")
    .max(100, "Cannot import more than 100 questions at once"),
});

// Add formatZodError function (keep as is)
export const formatZodError = (error) => {
  if (error.issues && error.issues.length > 0) {
    const fieldMessages = error.issues.map((issue) => {
      const field = issue.path[issue.path.length - 1];
      if (field) {
        const fieldName =
          field === "questionText"
            ? "Question text"
            : field === "optionA"
            ? "Option A"
            : field === "optionB"
            ? "Option B"
            : field === "optionC"
            ? "Option C"
            : field === "optionD"
            ? "Option D"
            : field === "correctAnswer"
            ? "Correct answer"
            : field === "subject"
            ? "Subject"
            : field === "difficulty"
            ? "Difficulty"
            : field === "explanation"
            ? "Explanation"
            : field === "examId"
            ? "Exam ID"
            : field.charAt(0).toUpperCase() + field.slice(1);
        return `${fieldName}: ${issue.message}`;
      }
      return issue.message;
    });

    return fieldMessages.join(". ");
  }
  return "Please check your input and try again";
};
