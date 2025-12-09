import { z } from "zod";

export const adminDashboardSchema = z.object({
  timeRange: z.enum(["hour", "day", "week", "month"]).optional().default("day"),
});

export const exportRequestSchema = z.object({
  format: z.enum(["csv", "json"]).optional().default("csv"),
  examId: z.coerce.number().int().positive().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const studentProgressSchema = z.object({
  studentId: z.coerce.number().int().positive().optional(),
  timeRange: z.enum(["week", "month", "quarter"]).optional().default("month"),
});

export const monitoringSchema = z.object({
  interval: z
    .enum(["realtime", "hourly", "daily"])
    .optional()
    .default("realtime"),
});

export const formatZodError = (error) => {
  return error.errors
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join(", ");
};
