import { z } from "zod";

// Manual submission schema
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
  isAutoSubmit: z.boolean().default(false),
});

// Result query schema
export const resultQuerySchema = z.object({
  examId: z
    .string()
    .refine(
      (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0;
      },
      {
        message: "Exam ID must be a positive number",
      }
    )
    .optional(),
});

// Format Zod error function
export const formatZodError = (error) => {
  if (error.issues && error.issues.length > 0) {
    const fields = new Set();

    error.issues.forEach((issue) => {
      const field = issue.path[issue.path.length - 1];
      if (field) {
        const fieldName =
          field === "answers"
            ? "Answers"
            : field === "examId"
            ? "Exam ID"
            : field.charAt(0).toUpperCase() + field.slice(1);
        fields.add(fieldName);
      }
    });

    const fieldList = Array.from(fields).join(", ");
    return `Please check ${fieldList} inputs`;
  }
  return "Please check your input and try again";
};
