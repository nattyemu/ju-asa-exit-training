import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z
    .object({
      fullName: z
        .string()
        .min(2, "Full name must be at least 2 characters")
        .max(255, "Full name cannot exceed 255 characters")
        .optional()
        .or(z.literal("")),
      department: z
        .string()
        .min(2, "Department must be at least 2 characters")
        .max(255, "Department cannot exceed 255 characters")
        .optional()
        .or(z.literal("")),
      university: z
        .string()
        .min(2, "University must be at least 2 characters")
        .max(255, "University cannot exceed 255 characters")
        .optional()
        .or(z.literal("")),
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
      profileImageUrl: z.string().max(500).nullable().optional(),
    })
    .refine(
      (data) => {
        // Check that at least one field is provided AND not empty string
        const hasValidData = Object.keys(data).some((key) => {
          const value = data[key];
          // For strings, check if not undefined and not empty string
          if (typeof value === "string") {
            return value !== undefined && value.trim() !== "";
          }
          // For numbers, check if not undefined
          return value !== undefined;
        });
        return hasValidData;
      },
      {
        message: "At least one non-empty field must be provided for update",
        path: ["body"],
      }
    ),
});
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "User ID must be a number"),
  }),
  body: z.object({
    role: z.enum(["ADMIN", "STUDENT"], {
      required_error: "Role is required",
      invalid_type_error: "Role must be either ADMIN or STUDENT",
    }),
    department: z.string().optional(),
    adminPassword: z
      .string({
        required_error: "Admin password is required",
      })
      .min(1, "Admin password is required"),
  }),
});
const formatZodError = (error) => {
  if (error.issues && error.issues.length > 0) {
    const fields = new Set();

    error.issues.forEach((issue) => {
      const field = issue.path[issue.path.length - 1];
      if (field) {
        const fieldName =
          field === "fullName"
            ? "Full name"
            : field === "currentPassword"
            ? "Current password"
            : field === "newPassword"
            ? "New password"
            : field.charAt(0).toUpperCase() + field.slice(1);
        fields.add(fieldName);
      }
    });

    const fieldList = Array.from(fields).join(", ");
    return `Please check ${fieldList} inputs`;
  }
  return "Please check your input and try again";
};

export { formatZodError };
