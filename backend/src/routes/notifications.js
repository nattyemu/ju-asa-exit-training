import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  sendExamRemindersController,
  sendDeadlineWarningsController,
  sendSystemAnnouncementController,
  getNotificationPreferencesController,
} from "../controllers/notificationController.js";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Admin only routes
router.post(
  "/announcement",
  authorize("ADMIN"),
  sendSystemAnnouncementController
);
router.post(
  "/reminders/exam/:examId",
  authorize("ADMIN"),
  sendExamRemindersController
);
router.post(
  "/reminders/deadline",
  authorize("ADMIN"),
  sendDeadlineWarningsController
);

// User routes
router.get("/preferences/:userId", getNotificationPreferencesController);

export default router;
