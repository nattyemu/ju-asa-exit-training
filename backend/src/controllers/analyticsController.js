import {
  getExamStatistics,
  getScoreDistribution,
} from "../services/analytics/examAnalytics.js";
import {
  getQuestionAnalysis,
  getDifficultyAnalysis,
} from "../services/analytics/questionAnalytics.js";
import {
  getDepartmentPerformance,
  getUniversityPerformance,
} from "../services/analytics/departmentAnalytics.js";
import {
  getTimeAnalytics,
  getSubmissionPattern,
} from "../services/analytics/timeAnalytics.js";

import {
  getAdminDashboard,
  getSystemMonitoring,
  getStudentProgress,
} from "../services/analytics/adminDashboard.js";
import {
  exportExamResults,
  exportQuestionAnalytics,
  exportDepartmentPerformance,
  exportCompleteReport,
} from "../services/analytics/exportService.js";

import {
  examIdSchema,
  analyticsQuerySchema,
  formatZodError,
} from "../validations/analyticsSchemas.js";

// NEW: Import admin validation schemas
import {
  adminDashboardSchema,
  exportRequestSchema,
  studentProgressSchema,
  monitoringSchema,
} from "../validations/adminSchemas.js";

/**
 * Get comprehensive exam statistics
 */
export const getExamAnalytics = async (req, res) => {
  try {
    const validationResult = examIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { examId } = validationResult.data;
    const result = await getExamStatistics(parseInt(examId));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to get exam statistics",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get exam analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve exam analytics",
    });
  }
};

/**
 * Get score distribution for an exam
 */
export const getExamScoreDistribution = async (req, res) => {
  try {
    const paramValidation = examIdSchema.safeParse(req.params);
    const queryValidation = analyticsQuerySchema.safeParse(req.query);

    if (!paramValidation.success) {
      const errorMessage = formatZodError(paramValidation.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { examId } = paramValidation.data;
    const { bins = 10 } = queryValidation.success ? queryValidation.data : {};

    const result = await getScoreDistribution(parseInt(examId), bins);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to get score distribution",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get score distribution error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve score distribution",
    });
  }
};

/**
 * Get question analysis for an exam
 */
export const getExamQuestionAnalysis = async (req, res) => {
  try {
    const validationResult = examIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { examId } = validationResult.data;
    const result = await getQuestionAnalysis(parseInt(examId));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to get question analysis",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get question analysis error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve question analysis",
    });
  }
};

/**
 * Get department performance for an exam
 */
export const getExamDepartmentPerformance = async (req, res) => {
  try {
    const validationResult = examIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { examId } = validationResult.data;
    const result = await getDepartmentPerformance(parseInt(examId));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to get department performance",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get department performance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve department performance",
    });
  }
};

/**
 * Get time analytics for an exam
 */
export const getExamTimeAnalytics = async (req, res) => {
  try {
    const validationResult = examIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { examId } = validationResult.data;
    const result = await getTimeAnalytics(parseInt(examId));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to get time analytics",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get time analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve time analytics",
    });
  }
};

/**
 * Get difficulty analysis for an exam
 */
export const getExamDifficultyAnalysis = async (req, res) => {
  try {
    const validationResult = examIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { examId } = validationResult.data;
    const result = await getDifficultyAnalysis(parseInt(examId));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to get difficulty analysis",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Get difficulty analysis error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve difficulty analysis",
    });
  }
};

// ================ NEW CONTROLLERS FOR TASK 4.3 ================

/**
 * Get comprehensive admin dashboard
 */
export const getAdminDashboardController = async (req, res) => {
  try {
    const validationResult = adminDashboardSchema.safeParse(req.query);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessage,
      });
    }

    const { timeRange = "day" } = validationResult.data;
    const result = await getAdminDashboard(timeRange);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to get admin dashboard",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Admin dashboard controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve admin dashboard",
    });
  }
};

/**
 * Get student progress tracking
 */
export const getStudentProgressController = async (req, res) => {
  try {
    const validationResult = studentProgressSchema.safeParse({
      ...req.params,
      ...req.query,
    });

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessage,
      });
    }

    const { studentId, timeRange = "month" } = validationResult.data;
    const result = await getStudentProgress(studentId, timeRange);

    if (!result.success) {
      return res.status(studentId ? 404 : 500).json({
        success: false,
        message: result.error || "Failed to get student progress",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Student progress controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student progress",
    });
  }
};

/**
 * Export exam results
 */
export const exportExamResultsController = async (req, res) => {
  try {
    const paramValidation = examIdSchema.safeParse(req.params);
    const queryValidation = exportRequestSchema.safeParse(req.query);

    if (!paramValidation.success) {
      const errorMessage = formatZodError(paramValidation.error);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessage,
      });
    }

    const { examId } = paramValidation.data;
    const { format = "csv" } = queryValidation.success
      ? queryValidation.data
      : {};

    const result = await exportExamResults(parseInt(examId), format);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to export exam results",
      });
    }

    // Set headers for file download
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.data.filename}"`
      );
      return res.status(200).send(result.data.content);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.data.filename}"`
      );
      return res.status(200).json({
        success: true,
        data: result.data.content,
        metadata: result.data.metadata,
      });
    }
  } catch (error) {
    console.error("Export results controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export exam results",
    });
  }
};

/**
 * Export question analytics
 */
export const exportQuestionAnalyticsController = async (req, res) => {
  try {
    const paramValidation = examIdSchema.safeParse(req.params);
    const queryValidation = exportRequestSchema.safeParse(req.query);

    if (!paramValidation.success) {
      const errorMessage = formatZodError(paramValidation.error);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessage,
      });
    }

    const { examId } = paramValidation.data;
    const { format = "csv" } = queryValidation.success
      ? queryValidation.data
      : {};

    const result = await exportQuestionAnalytics(parseInt(examId), format);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to export question analytics",
      });
    }

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.data.filename}"`
      );
      return res.status(200).send(result.data.content);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.data.filename}"`
      );
      return res.status(200).json({
        success: true,
        data: result.data.content,
        metadata: result.data.metadata,
      });
    }
  } catch (error) {
    console.error("Export question analytics controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export question analytics",
    });
  }
};

/**
 * Export department performance
 */
export const exportDepartmentPerformanceController = async (req, res) => {
  try {
    const paramValidation = examIdSchema.safeParse(req.params);
    const queryValidation = exportRequestSchema.safeParse(req.query);

    if (!queryValidation.success) {
      const errorMessage = formatZodError(queryValidation.error);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessage,
      });
    }

    const { format = "csv" } = queryValidation.data;
    const examId = paramValidation.success ? paramValidation.data.examId : null;

    const result = await exportDepartmentPerformance(examId, format);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to export department performance",
      });
    }

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.data.filename}"`
      );
      return res.status(200).send(result.data.content);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.data.filename}"`
      );
      return res.status(200).json({
        success: true,
        data: result.data.content,
        metadata: result.data.metadata,
      });
    }
  } catch (error) {
    console.error("Export department performance controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export department performance",
    });
  }
};

/**
 * Export complete analytics report
 */
export const exportCompleteReportController = async (req, res) => {
  try {
    const validationResult = exportRequestSchema.safeParse(req.query);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errorMessage,
      });
    }

    const { format = "json", startDate, endDate } = validationResult.data;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required for complete reports",
      });
    }

    const result = await exportCompleteReport(startDate, endDate, format);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to export complete report",
      });
    }

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.data.filename}"`
      );
      return res.status(200).send(result.data.content);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.data.filename}"`
      );
      return res.status(200).json({
        success: true,
        ...result.data,
      });
    }
  } catch (error) {
    console.error("Export complete report controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export complete report",
    });
  }
};
