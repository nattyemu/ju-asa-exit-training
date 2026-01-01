import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  createExam,
  getAllExams,
  getAvailableExams,
  getExamById,
  updateExam,
  updateExamStatus,
  getAdminDashboardStats,
} from "../controllers/examController.js";

const router = express.Router();

router.use(authenticate);

// Admin only routes
router.post("/", authorize("ADMIN"), createExam);
router.get("/all", authorize("ADMIN"), getAllExams);
router.put("/:id", authorize("ADMIN"), updateExam);
router.put("/:id/status", authorize("ADMIN"), updateExamStatus);
router.get("/admin/dashboard", authorize("ADMIN"), getAdminDashboardStats);
// Student routes - get available exams
router.get("/", getAvailableExams);

// Shared routes - get exam details (both admin and student can view)
router.get("/:id", getExamById);

export default router;
