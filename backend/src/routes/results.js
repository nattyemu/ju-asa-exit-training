import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  getStudentResult,
  getExamRankings,
  getStudentResultHistory,
  getSubjectPerformance,
} from "../controllers/resultController.js";

const router = express.Router();

router.get(
  "/exam/:examId",
  authenticate,
  authorize("STUDENT"),
  getStudentResult
);

// Performance analysis
router.get(
  "/performance/subjects",
  authenticate,
  authorize("STUDENT"),
  getSubjectPerformance
);

router.get(
  "/history",
  authenticate,
  authorize("STUDENT"),
  getStudentResultHistory
);

// Public rankings (authenticated users can see)
router.get("/rankings/:examId", authenticate, getExamRankings);

export default router;
