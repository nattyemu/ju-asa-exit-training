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

// FIXED: Handle "all" as a special parameter value
router.post("/reminders/exam/:examId", authorize("ADMIN"), async (req, res) => {
  try {
    let { examId } = req.params;

    // If examId is "all", treat it as null
    if (examId === "all") {
      examId = null;
    }

    // Create modified request object
    const modifiedReq = {
      ...req,
      params: { examId },
    };

    return sendExamRemindersController(modifiedReq, res);
  } catch (error) {
    // console.error("Route handler error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post(
  "/reminders/deadline",
  authorize("ADMIN"),
  sendDeadlineWarningsController
);

// User routes
router.get("/preferences/:userId", getNotificationPreferencesController);

export default router;
