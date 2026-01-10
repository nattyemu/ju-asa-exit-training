import { db } from "../db/connection.js";
import { users, profiles, exams, studentExams } from "../db/schema.js";
import { eq, and, gt, lte, isNull, count, or } from "drizzle-orm";
import {
  sendExamReminder,
  sendSystemAnnouncement,
  sendUnstartedExamReminder,
} from "../utils/emailService.js";

/**
 * Send exam reminders to students
 */
export const sendExamReminders = async (examId = null) => {
  try {
    // console.log("=== STARTING EXAM REMINDERS ===");
    // console.log("Exam ID parameter:", examId);

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // console.log("Current time:", now.toISOString());
    // console.log("24 hours from now:", oneDayFromNow.toISOString());

    // Build the query conditions
    let examConditions = and(
      eq(exams.isActive, true),
      gt(exams.availableFrom, now), // Exam hasn't started yet
      lte(exams.availableFrom, oneDayFromNow) // Will start within 24 hours
    );

    // If specific exam is requested, filter by it
    if (examId && examId !== "all") {
      examConditions = and(examConditions, eq(exams.id, parseInt(examId)));
      // console.log("Filtering by specific exam ID:", examId);
    }

    // Find exams starting soon (in the next 24 hours)
    const upcomingExams = await db
      .select({
        id: exams.id,
        title: exams.title,
        availableFrom: exams.availableFrom,
        availableUntil: exams.availableUntil,
        duration: exams.duration,
        isActive: exams.isActive,
      })
      .from(exams)
      .where(examConditions);

    // console.log(`Found ${upcomingExams.length} upcoming exams:`);
    upcomingExams.forEach((exam) => {
      // console.log(`- Exam ${exam.id}: "${exam.title}"`);
      // console.log(`  Starts: ${exam.availableFrom}`);
      // console.log(`  Ends: ${exam.availableUntil}`);
    });

    // If no exams found
    if (upcomingExams.length === 0) {
      // console.log("❌ No upcoming exams found matching criteria");
      return {
        success: true,
        message: "No upcoming exams found in the next 24 hours",
        data: {
          totalRemindersSent: 0,
          successful: 0,
          failed: 0,
          examsProcessed: 0,
          details: [],
        },
      };
    }

    const results = [];

    for (const exam of upcomingExams) {
      // console.log(`\n=== Processing exam: ${exam.title} (ID: ${exam.id}) ===`);

      // Find students who haven't taken this exam yet
      const studentsToNotify = await db
        .select({
          userId: users.id,
          email: users.email,
          fullName: profiles.fullName,
        })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .leftJoin(
          studentExams,
          and(
            eq(studentExams.studentId, users.id),
            eq(studentExams.examId, exam.id)
          )
        )
        .where(
          and(
            eq(users.role, "STUDENT"),
            eq(users.isActive, true),
            isNull(studentExams.id) // Haven't taken the exam yet
          )
        );

      // console.log(
      //   `Found ${studentsToNotify.length} students who haven't taken this exam yet`
      // );

      if (studentsToNotify.length === 0) {
        // console.log(
        //   "ℹ️ No students need reminders for this exam (all have taken it or no active students)"
        // );
      }

      // Also check: How many total active students are there?
      const totalActiveStudents = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.role, "STUDENT"), eq(users.isActive, true)));

      // console.log(
      //   `Total active students in system: ${totalActiveStudents[0]?.count || 0}`
      // );

      for (const student of studentsToNotify) {
        // console.log(
        //   `Sending reminder to: ${student.fullName} (${student.email})`
        // );

        try {
          const emailResult = await sendExamReminder(student.email, {
            studentName: student.fullName,
            examTitle: exam.title,
            startTime: exam.availableFrom,
            endTime: exam.availableUntil,
            duration: exam.duration,
          });

          // console.log(
          //   `Email result: ${emailResult.success ? "✅ Success" : "❌ Failed"}`
          // );

          results.push({
            examId: exam.id,
            examTitle: exam.title,
            studentId: student.userId,
            studentName: student.fullName,
            email: student.email,
            type: "exam_reminder",
            success: emailResult.success,
            message: emailResult.message,
            sentAt: new Date(),
          });
        } catch (emailError) {
          // console.error(`Failed to send email: ${emailError.message}`);
          results.push({
            examId: exam.id,
            studentId: student.userId,
            email: student.email,
            type: "exam_reminder",
            success: false,
            message: emailError.message,
            sentAt: new Date(),
          });
        }
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // console.log(`\n=== COMPLETED ===`);
    // console.log(`Total reminders sent: ${results.length}`);
    // console.log(`Successful: ${successful}`);
    // console.log(`Failed: ${failed}`);

    return {
      success: true,
      message: `Processed ${upcomingExams.length} exam(s). Sent ${successful} reminders successfully. ${failed} failed.`,
      data: {
        totalRemindersSent: results.length,
        successful: successful,
        failed: failed,
        examsProcessed: upcomingExams.length,
        details: results,
      },
    };
  } catch (error) {
    // console.error("❌ Exam reminders error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
/**
 * Send reminders to students who haven't started a specific exam
 */
export const sendUnstartedExamReminders = async (examId) => {
  try {
    const now = new Date();

    if (!examId) {
      throw new Error("Exam ID is required");
    }

    // 1️⃣ Get active exam
    const examResult = await db
      .select({
        id: exams.id,
        title: exams.title,
        availableUntil: exams.availableUntil,
      })
      .from(exams)
      .where(
        and(
          eq(exams.id, Number(examId)),
          eq(exams.isActive, true),
          lte(exams.availableFrom, now),
          gt(exams.availableUntil, now)
        )
      )
      .limit(1);

    if (examResult.length === 0) {
      return {
        success: false,
        message: "Exam not found or not active",
      };
    }

    const exam = examResult[0];

    // 2️⃣ Get ACTIVE students who have NOT started the exam
    // ✅ EXACT SAME LOGIC AS STATS
    const studentsToNotify = await db
      .select({
        userId: users.id,
        email: users.email,
      })
      .from(users)
      .leftJoin(
        studentExams,
        and(
          eq(studentExams.studentId, users.id),
          eq(studentExams.examId, exam.id)
        )
      )
      .where(
        and(
          eq(users.role, "STUDENT"),
          eq(users.isActive, true),
          isNull(studentExams.id)
        )
      );

    let sent = 0;
    let failed = 0;

    for (const student of studentsToNotify) {
      try {
        await sendUnstartedExamReminder(student.email, {
          studentName: "Student", // safe fallback
          examTitle: exam.title,
          endTime: exam.availableUntil,
        });

        sent++;
      } catch (err) {
        failed++;
      }
    }

    return {
      success: true,
      message: `Sent ${sent} reminders to students who haven't started "${exam.title}". ${failed} failed.`,
      data: {
        examId: exam.id,
        totalUnstartedStudents: studentsToNotify.length,
        sent,
        failed,
      },
    };
  } catch (error) {
    // console.error("❌ sendUnstartedExamReminders error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get statistics for unstarted students in active exams
 */
export const getUnstartedExamStats = async () => {
  try {
    // console.log("=== GETTING UNSTARTED EXAM STATS ===");

    const now = new Date();

    // Get all active exams (currently available)
    const activeExams = await db
      .select({
        id: exams.id,
        title: exams.title,
        availableUntil: exams.availableUntil,
        isActive: exams.isActive,
      })
      .from(exams)
      .where(
        and(
          eq(exams.isActive, true),
          lte(exams.availableFrom, now), // Exam has started
          gt(exams.availableUntil, now) // Exam hasn't ended yet
        )
      );

    // console.log(`Found ${activeExams.length} active exams`);

    // Get total active students count
    const totalActiveStudentsResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, "STUDENT"), eq(users.isActive, true)));

    const totalActiveStudents = totalActiveStudentsResult[0]?.count || 0;
    // console.log(`Total active students: ${totalActiveStudents}`);

    // Get unstarted counts for each exam
    const stats = [];

    for (const exam of activeExams) {
      // Get count of students who haven't started this exam
      const unstartedStudentsResult = await db
        .select({ count: count() })
        .from(users)
        .leftJoin(
          studentExams,
          and(
            eq(studentExams.studentId, users.id),
            eq(studentExams.examId, exam.id)
          )
        )
        .where(
          and(
            eq(users.role, "STUDENT"),
            eq(users.isActive, true),
            isNull(studentExams.id) // Haven't started (no studentExams record)
          )
        );

      const unstartedCount = unstartedStudentsResult[0]?.count || 0;

      // Also get count of students who have started
      const startedStudentsResult = await db
        .select({ count: count() })
        .from(studentExams)
        .where(eq(studentExams.examId, exam.id));

      const startedCount = startedStudentsResult[0]?.count || 0;

      stats.push({
        examId: exam.id,
        examTitle: exam.title,
        availableUntil: exam.availableUntil,
        totalActiveStudents: totalActiveStudents,
        unstartedStudents: unstartedCount,
        startedStudents: startedCount,
        completionRate:
          totalActiveStudents > 0
            ? Math.round((startedCount / totalActiveStudents) * 100)
            : 0,
      });

      // console.log(`Exam "${exam.title}": ${unstartedCount} unstarted out of ${totalActiveStudents} students`);
    }

    return {
      success: true,
      data: {
        totalActiveStudents,
        activeExams: stats,
        lastUpdated: new Date(),
      },
    };
  } catch (error) {
    // console.error("❌ Get unstarted exam stats error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
// Helper function to format time left
const formatTimeLeft = (endTime, currentTime) => {
  const timeLeft = Math.max(
    0,
    Math.floor((new Date(endTime) - currentTime) / (60 * 1000))
  );

  if (timeLeft > 120) {
    const hours = Math.floor(timeLeft / 60);
    const minutes = timeLeft % 60;
    return `${hours} hours${minutes > 0 ? ` ${minutes} minutes` : ""}`;
  } else if (timeLeft > 60) {
    const hours = Math.floor(timeLeft / 60);
    const minutes = timeLeft % 60;
    return `${hours} hour${hours > 1 ? "s" : ""}${
      minutes > 0 ? ` ${minutes} minutes` : ""
    }`;
  } else {
    return `${timeLeft} minutes`;
  }
};
/**
 * Send system announcement to all users
 */
export const sendSystemAnnouncementToAll = async (announcementData) => {
  try {
    const { title, message, sentBy } = announcementData;

    if (!title || !message) {
      throw new Error("Title and message are required");
    }

    // Get all active users
    const allUsers = await db
      .select({
        userId: users.id,
        email: users.email,
        fullName: profiles.fullName,
        role: users.role,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(users.isActive, true));

    // console.log(`Sending announcement to ${allUsers.length} users`);

    const results = [];

    for (const user of allUsers) {
      try {
        const emailResult = await sendSystemAnnouncement(user.email, {
          title,
          message,
          sentBy: sentBy || "System Administrator",
        });

        results.push({
          userId: user.userId,
          email: user.email,
          role: user.role,
          type: "system_announcement",
          success: emailResult.success,
          message: emailResult.message,
          sentAt: new Date(),
        });
      } catch (emailError) {
        // console.error(
        //   `Failed to send announcement to ${user.email}:`,
        //   emailError
        // );
        results.push({
          userId: user.userId,
          email: user.email,
          role: user.role,
          type: "system_announcement",
          success: false,
          message: emailError.message,
          sentAt: new Date(),
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: true,
      message: `Announcement sent to ${successful} users successfully. ${failed} failed.`,
      data: {
        totalRecipients: allUsers.length,
        announcementsSent: results.length,
        successful: successful,
        failed: failed,
        details: results,
      },
    };
  } catch (error) {
    // console.error("System announcement error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get user notification preferences (simplified - always enabled for now)
 */
export const getUserNotificationPreferences = async (userId) => {
  // In a real system, you'd store preferences in database
  // For now, return default preferences
  return {
    emailNotifications: true,
    examReminders: true,
    deadlineWarnings: true,
    systemAnnouncements: true,
  };
};

export default {
  sendExamReminders,
  sendUnstartedExamReminders,
  sendSystemAnnouncementToAll,
  getUserNotificationPreferences,
  getUnstartedExamStats,
};
