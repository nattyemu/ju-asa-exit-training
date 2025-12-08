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
  examIdSchema,
  analyticsQuerySchema,
  formatZodError,
} from "../validations/analyticsSchemas.js";

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
