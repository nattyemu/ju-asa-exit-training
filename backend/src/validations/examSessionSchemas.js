import { z } from "zod";

// Start exam session schema
export const startExamSessionSchema = z.object({
  examId: z
    .number({
      required_error: "Exam ID is required",
      invalid_type_error: "Exam ID must be a number",
    })
    .int()
    .positive("Exam ID must be a positive number"),
});

// Save answer schema
export const saveAnswerSchema = z.object({
  questionId: z
    .number({
      required_error: "Question ID is required",
      invalid_type_error: "Question ID must be a number",
    })
    .int()
    .positive("Question ID must be a positive number"),
  chosenAnswer: z.enum(["A", "B", "C", "D"], {
    errorMap: () => ({ message: "Chosen answer must be A, B, C, or D" }),
  }),
  isAutosave: z.boolean().default(false),
});

// Save multiple answers schema
export const saveMultipleAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z
          .number({
            required_error: "Question ID is required",
            invalid_type_error: "Question ID must be a number",
          })
          .int()
          .positive("Question ID must be a positive number"),
        chosenAnswer: z.enum(["A", "B", "C", "D"], {
          errorMap: () => ({ message: "Chosen answer must be A, B, C, or D" }),
        }),
      })
    )
    .min(1, "At least one answer is required")
    .max(100, "Cannot save more than 100 answers at once"),
  isAutoSubmit: z.boolean().default(false).optional(),
});

// Submit exam schema (for future use)
export const submitExamSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z
          .number({
            required_error: "Question ID is required",
            invalid_type_error: "Question ID must be a number",
          })
          .int()
          .positive("Question ID must be a positive number"),
        chosenAnswer: z.enum(["A", "B", "C", "D"], {
          errorMap: () => ({ message: "Chosen answer must be A, B, C, or D" }),
        }),
      })
    )
    .optional(),
});

// Format Zod error function - MATCHING YOUR STYLE
export const formatZodError = (error) => {
  if (error.issues && error.issues.length > 0) {
    const fields = new Set();

    error.issues.forEach((issue) => {
      const field = issue.path[issue.path.length - 1];
      if (field) {
        const fieldName =
          field === "examId"
            ? "Exam ID"
            : field === "questionId"
            ? "Question ID"
            : field === "chosenAnswer"
            ? "Chosen answer"
            : field === "isAutosave"
            ? "Auto-save flag"
            : field === "answers"
            ? "Answers"
            : field.charAt(0).toUpperCase() + field.slice(1);
        fields.add(fieldName);
      }
    });

    const fieldList = Array.from(fields).join(", ");
    return `Please check ${fieldList} inputs`;
  }
  return "Please check your input and try again";
};
