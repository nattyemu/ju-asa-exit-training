import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  getStudentResult,
  getExamRankings,
  getStudentResultHistory,
} from "../controllers/resultController.js";

const router = express.Router();

// Student routes
router.get(
  "/exam/:examId",
  authenticate,
  authorize("STUDENT"),
  getStudentResult
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
