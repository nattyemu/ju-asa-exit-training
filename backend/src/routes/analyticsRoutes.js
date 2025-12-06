import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  getExamAnalytics,
  getExamScoreDistribution,
  getExamQuestionAnalysis,
  getExamDepartmentPerformance,
  getExamTimeAnalytics,
  getExamDifficultyAnalysis,
} from "../controllers/analyticsController.js";

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

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

export default router;
