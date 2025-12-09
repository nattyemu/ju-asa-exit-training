import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required").max(2000),
  sentBy: z.string().optional(),
});

export const emailTestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const timeRangeSchema = z.object({
  timeRange: z
    .enum(["week", "month", "quarter", "all"])
    .optional()
    .default("month"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const formatZodError = (error) => {
  return error.errors
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join(", ");
};
