import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  startExamSession,
  getActiveSession,
  getSessionDetails,
  saveAnswer,
  saveMultipleAnswers,
  resumeSession,
  checkSessionStatus,
  cancelSession,
} from "../controllers/examSessionController.js";

const router = express.Router();

// All routes require authentication and student role
router.use(authenticate, authorize("STUDENT"));

// Start a new exam session
router.post("/start", startExamSession);

// Get active exam session
router.get("/active", getActiveSession);

// Get session details
router.get("/:id", getSessionDetails);

// Save answer to session
router.post("/:sessionId/answers", saveAnswer);

// Save multiple answers
router.post("/:sessionId/answers/batch", saveMultipleAnswers);

// Resume exam session
router.get("/:id/resume", resumeSession);

// Check session status
router.get("/:id/status", checkSessionStatus);

// Cancel/abort exam session
router.delete("/:id", cancelSession);

export default router;
