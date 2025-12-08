import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  getExamAnalytics,
  getExamScoreDistribution,
  getExamQuestionAnalysis,
  getExamDepartmentPerformance,
  getExamTimeAnalytics,
  getExamDifficultyAnalysis,
  getAdminDashboardController,
  getStudentProgressController,
  exportExamResultsController,
  exportQuestionAnalyticsController,
  exportDepartmentPerformanceController,
  exportCompleteReportController,
} from "../controllers/analyticsController.js";

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

// ================ EXISTING ROUTES ================

// Exam statistics (Admin only)
router.get("/exam/:examId/stats", authorize("ADMIN"), getExamAnalytics);

// Score distribution (Admin only)
router.get(
  "/exam/:examId/score-distribution",
  authorize("ADMIN"),
  getExamScoreDistribution
);

// Question analysis (Admin only)
router.get(
  "/exam/:examId/question-analysis",
  authorize("ADMIN"),
  getExamQuestionAnalysis
);

// Department performance (Admin only)
router.get(
  "/exam/:examId/department-performance",
  authorize("ADMIN"),
  getExamDepartmentPerformance
);

// Time analytics (Admin only)
router.get(
  "/exam/:examId/time-analytics",
  authorize("ADMIN"),
  getExamTimeAnalytics
);

// Difficulty analysis (Admin only)
router.get(
  "/exam/:examId/difficulty-analysis",
  authorize("ADMIN"),
  getExamDifficultyAnalysis
);

// Health check (Public)

// ================ NEW ROUTES FOR TASK 4.3 ================

// Admin Dashboard (Comprehensive overview)
router.get("/admin/dashboard", authorize("ADMIN"), getAdminDashboardController);

// Student Progress Tracking
router.get(
  "/admin/student-progress",
  authorize("ADMIN"),
  getStudentProgressController
);
router.get(
  "/admin/student-progress/:studentId",
  authorize("ADMIN"),
  getStudentProgressController
);

// Export Features
router.get(
  "/export/exam/:examId/results",
  authorize("ADMIN"),
  exportExamResultsController
);
router.get(
  "/export/exam/:examId/questions",
  authorize("ADMIN"),
  exportQuestionAnalyticsController
);
router.get(
  "/export/department-performance",
  authorize("ADMIN"),
  exportDepartmentPerformanceController
);
router.get(
  "/export/department-performance/:examId",
  authorize("ADMIN"),
  exportDepartmentPerformanceController
);
router.get(
  "/export/complete-report",
  authorize("ADMIN"),
  exportCompleteReportController
);

export default router;
