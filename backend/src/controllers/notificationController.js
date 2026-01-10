import {
  sendExamReminders,
  sendUnstartedExamReminders,
  sendSystemAnnouncementToAll,
  getUserNotificationPreferences,
  getUnstartedExamStats,
} from "../services/notificationService.js";

/**
 * Send exam reminders manually
 */
export const sendExamRemindersController = async (req, res) => {
  try {
    const { examId } = req.params;
    const result = await sendExamReminders(examId || null);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to send exam reminders",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully sent ${result.data.totalRemindersSent} exam reminders`,
      data: result.data,
    });
  } catch (error) {
    // console.error("Send exam reminders controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send exam reminders",
    });
  }
};

/**
 * Send reminders to students who haven't started a specific exam
 */
export const sendUnstartedExamRemindersController = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required",
      });
    }

    const result = await sendUnstartedExamReminders(examId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to send unstarted exam reminders",
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    // console.error("Send unstarted exam reminders controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send unstarted exam reminders",
    });
  }
};
/**
 * Send system announcement
 */
export const sendSystemAnnouncementController = async (req, res) => {
  try {
    const { title, message, sentBy } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const result = await sendSystemAnnouncementToAll({
      title,
      message,
      sentBy,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to send system announcement",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Announcement sent to ${result.data.totalRecipients} users`,
      data: result.data,
    });
  } catch (error) {
    // console.error("Send system announcement controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send system announcement",
    });
  }
};
/**
 * Get unstarted exam statistics
 */
export const getUnstartedExamStatsController = async (req, res) => {
  try {
    const result = await getUnstartedExamStats();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to get unstarted exam statistics",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    // console.error("Get unstarted exam stats controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unstarted exam statistics",
    });
  }
};
/**
 * Get notification preferences
 */
export const getNotificationPreferencesController = async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await getUserNotificationPreferences(parseInt(userId));

    return res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    // console.error("Get notification preferences controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get notification preferences",
    });
  }
};
