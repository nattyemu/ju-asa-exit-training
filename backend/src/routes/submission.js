import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  submitExam,
  checkAutoSubmitConditions,
} from "../controllers/submissionController.js";
import { submitExamSchema } from "../validations/submissionSchemas.js";

const router = express.Router();

// Manual submission (student only)
router.post(
  "/exam-session/:id/submit",
  authenticate,
  authorize("STUDENT"),
  submitExam
);

// Auto-submission check (admin only - for cron jobs)
router.post(
  "/auto-check",
  authenticate,
  authorize("ADMIN"),
  checkAutoSubmitConditions
);

export default router;
