import {
  getEnhancedStudentProgress,
  getLeaderboard,
  getStudyTimeAnalytics,
} from "../services/progressTrackingService.js";
import {
  getStudentAchievements,
  getTopAchievers,
} from "../services/achievementService.js";

/**
 * Get enhanced student progress
 */
export const getEnhancedProgressController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { timeRange = "month" } = req.query;

    const result = await getEnhancedStudentProgress(
      parseInt(studentId),
      timeRange
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to get student progress",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Enhanced progress controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student progress",
    });
  }
};

/**
 * Get student progress for authenticated student
 */
export const getMyProgressController = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { timeRange = "month" } = req.query;

    const result = await getEnhancedStudentProgress(studentId, timeRange);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to get your progress",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("My progress controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your progress",
    });
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboardController = async (req, res) => {
  try {
    const { timeRange = "month", limit = 10 } = req.query;

    const result = await getLeaderboard(timeRange, parseInt(limit));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to get leaderboard",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Leaderboard controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve leaderboard",
    });
  }
};

/**
 * Get study time analytics
 */
export const getStudyTimeAnalyticsController = async (req, res) => {
  try {
    const studentId = req.user.id;
    const result = await getStudyTimeAnalytics(studentId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to get study time analytics",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Study time analytics controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve study time analytics",
    });
  }
};

/**
 * Get student achievements
 */
export const getStudentAchievementsController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await getStudentAchievements(parseInt(studentId));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to get achievements",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Student achievements controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve achievements",
    });
  }
};

/**
 * Get my achievements
 */
export const getMyAchievementsController = async (req, res) => {
  try {
    const studentId = req.user.id;
    const result = await getStudentAchievements(studentId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to get your achievements",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("My achievements controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your achievements",
    });
  }
};

/**
 * Get top achievers
 */
export const getTopAchieversController = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const result = await getTopAchievers(parseInt(limit));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to get top achievers",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Top achievers controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve top achievers",
    });
  }
};
