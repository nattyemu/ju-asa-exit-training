import { db } from "../db/connection.js";
import { users, profiles, exams, studentExams } from "../db/schema.js";
import { eq, and, gt, lte, isNull, count, or } from "drizzle-orm";
import {
  sendExamReminder,
  sendDeadlineWarning,
  sendSystemAnnouncement,
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
          console.error(`Failed to send email: ${emailError.message}`);
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
    console.error("❌ Exam reminders error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
/**
 * Send deadline warnings for ongoing exams
 */
export const sendDeadlineWarnings = async () => {
  try {
    // console.log("Starting deadline warnings...");

    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Find active exams ending soon (in the next 3 hours)
    const endingExams = await db
      .select({
        id: exams.id,
        title: exams.title,
        availableUntil: exams.availableUntil,
      })
      .from(exams)
      .where(
        and(
          eq(exams.isActive, true),
          gt(exams.availableUntil, now), // Exam is still active
          lte(exams.availableUntil, threeHoursFromNow) // Ends within the next 3 hours
        )
      );

    // console.log(`Found ${endingExams.length} exams ending soon`);

    const results = [];

    for (const exam of endingExams) {
      // Find students who started but haven't submitted
      const activeStudents = await db
        .select({
          studentId: studentExams.studentId,
          email: users.email,
          fullName: profiles.fullName,
          startedAt: studentExams.startedAt,
        })
        .from(studentExams)
        .innerJoin(users, eq(studentExams.studentId, users.id))
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .where(
          and(
            eq(studentExams.examId, exam.id),
            isNull(studentExams.submittedAt) // Haven't submitted yet
          )
        );

      // console.log(
      //   `Found ${activeStudents.length} active students for exam: ${exam.title}`
      // );

      for (const student of activeStudents) {
        const timeLeft = Math.max(
          0,
          Math.floor((new Date(exam.availableUntil) - now) / (60 * 1000))
        );

        // Format time left for email
        let timeLeftText;
        if (timeLeft > 120) {
          const hours = Math.floor(timeLeft / 60);
          const minutes = timeLeft % 60;
          timeLeftText = `${hours} hours${
            minutes > 0 ? ` ${minutes} minutes` : ""
          }`;
        } else if (timeLeft > 60) {
          const hours = Math.floor(timeLeft / 60);
          const minutes = timeLeft % 60;
          timeLeftText = `${hours} hour${hours > 1 ? "s" : ""}${
            minutes > 0 ? ` ${minutes} minutes` : ""
          }`;
        } else {
          timeLeftText = `${timeLeft} minutes`;
        }

        try {
          const emailResult = await sendDeadlineWarning(student.email, {
            studentName: student.fullName,
            examTitle: exam.title,
            endTime: exam.availableUntil,
            timeLeft: timeLeftText,
          });

          results.push({
            examId: exam.id,
            examTitle: exam.title,
            studentId: student.studentId,
            studentName: student.fullName,
            email: student.email,
            type: "deadline_warning",
            timeLeftMinutes: timeLeft,
            timeLeftText: timeLeftText,
            success: emailResult.success,
            message: emailResult.message,
            sentAt: new Date(),
          });

          // console.log(`Sent deadline warning to ${student.email}`);
        } catch (emailError) {
          console.error(
            `Failed to send deadline warning to ${student.email}:`,
            emailError
          );
          results.push({
            examId: exam.id,
            studentId: student.studentId,
            email: student.email,
            type: "deadline_warning",
            success: false,
            message: emailError.message,
            sentAt: new Date(),
          });
        }
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: true,
      message: `Sent ${successful} deadline warnings successfully. ${failed} failed.`,
      data: {
        totalWarningsSent: results.length,
        successful: successful,
        failed: failed,
        urgent: results.filter((r) => r.timeLeftMinutes < 60).length,
        warning: results.filter(
          (r) => r.timeLeftMinutes >= 60 && r.timeLeftMinutes <= 180
        ).length,
        details: results,
      },
    };
  } catch (error) {
    console.error("Deadline warnings error:", error);
    return {
      success: false,
      error: error.message,
    };
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
        console.error(
          `Failed to send announcement to ${user.email}:`,
          emailError
        );
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
    console.error("System announcement error:", error);
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
  sendDeadlineWarnings,
  sendSystemAnnouncementToAll,
  getUserNotificationPreferences,
};
