import cron from "node-cron";
import { sendExamReminders } from "../services/notificationService.js";
import { db } from "../db/connection.js";

/**
 * Schedule automatic notifications
 */
export const scheduleNotificationJobs = () => {
  // console.log("📅 Scheduling notification jobs...");

  // 1. Daily exam reminders at 9 AM (for exams starting in next 24 hours)
  cron.schedule("0 9 * * *", async () => {
    // console.log("⏰ Running daily exam reminders...");
    try {
      const result = await sendExamReminders();
      // console.log(
      //   `✅ Sent ${result.data?.totalRemindersSent || 0} exam reminders`
      // );
    } catch (error) {
      // console.error("❌ Exam reminders job failed:", error.message);
    }
  });

  // 2. Removed: Hourly deadline warnings (replaced with manual unstarted exam reminders)

  // 3. Cleanup job - log sent notifications (weekly)
  cron.schedule("0 0 * * 0", async () => {
    // console.log("🧹 Running weekly cleanup...");
    try {
      // In a real system, you'd clean up old notification logs
      // console.log("✅ Cleanup completed");
    } catch (error) {
      // console.error("❌ Cleanup job failed:", error.message);
    }
  });

  // console.log("✅ Notification jobs scheduled successfully");
  // console.log("   - Daily exam reminders: 9:00 AM");
  // console.log("   - Weekly cleanup: Sunday midnight");
  // console.log("   - Unstarted exam reminders: Manual only (admin triggered)");
};

// Export for manual triggering
export const runManualExamReminders = async () => {
  return await sendExamReminders();
};

// Removed: runManualDeadlineWarnings export

export default {
  scheduleNotificationJobs,
  runManualExamReminders,
};
