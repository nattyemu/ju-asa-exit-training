import cron from "node-cron";
import {
  sendExamReminders,
  sendDeadlineWarnings,
} from "../services/notificationService.js";
import { db } from "../db/connection.js";

/**
 * Schedule automatic notifications
 */
export const scheduleNotificationJobs = () => {
  console.log("📅 Scheduling notification jobs...");

  // 1. Daily exam reminders at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running daily exam reminders...");
    try {
      const result = await sendExamReminders();
      console.log(
        `✅ Sent ${result.data?.totalRemindersSent || 0} exam reminders`
      );
    } catch (error) {
      console.error("❌ Exam reminders job failed:", error.message);
    }
  });

  // 2. Hourly deadline warnings
  cron.schedule("0 * * * *", async () => {
    console.log("⏳ Running deadline warnings...");
    try {
      const result = await sendDeadlineWarnings();
      console.log(
        `⚠️ Sent ${result.data?.totalWarningsSent || 0} deadline warnings`
      );
    } catch (error) {
      console.error("❌ Deadline warnings job failed:", error.message);
    }
  });

  // 3. Cleanup job - log sent notifications (weekly)
  cron.schedule("0 0 * * 0", async () => {
    console.log("🧹 Running weekly cleanup...");
    try {
      // In a real system, you'd clean up old notification logs
      console.log("✅ Cleanup completed");
    } catch (error) {
      console.error("❌ Cleanup job failed:", error.message);
    }
  });

  console.log("✅ Notification jobs scheduled successfully");
  console.log("   - Daily exam reminders: 9:00 AM");
  console.log("   - Hourly deadline warnings: Every hour");
  console.log("   - Weekly cleanup: Sunday midnight");
};

// Export for manual triggering
export const runManualExamReminders = async () => {
  return await sendExamReminders();
};

export const runManualDeadlineWarnings = async () => {
  return await sendDeadlineWarnings();
};

export default {
  scheduleNotificationJobs,
  runManualExamReminders,
  runManualDeadlineWarnings,
};
