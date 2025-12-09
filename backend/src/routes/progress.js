import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  getEnhancedProgressController,
  getMyProgressController,
  getLeaderboardController,
  getStudyTimeAnalyticsController,
  getStudentAchievementsController,
  getMyAchievementsController,
  getTopAchieversController,
} from "../controllers/progressController.js";

const router = express.Router();

// All progress routes require authentication
router.use(authenticate);

// Student progress routes (students can view their own, admins can view any)
router.get("/my-progress", getMyProgressController);
router.get(
  "/student/:studentId",
  authorize("ADMIN"),
  getEnhancedProgressController
);

// Study analytics
router.get("/my-study-time", getStudyTimeAnalyticsController);

// Achievements
router.get("/my-achievements", getMyAchievementsController);
router.get(
  "/achievements/:studentId",
  authorize("ADMIN"),
  getStudentAchievementsController
);
router.get("/top-achievers", getTopAchieversController);

// Leaderboard (public within authenticated users)
router.get("/leaderboard", getLeaderboardController);

export default router;
