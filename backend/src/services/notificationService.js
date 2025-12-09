import { db } from "../db/connection.js";
import { users, profiles, exams, studentExams } from "../db/schema.js";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
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
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find exams starting soon
    const upcomingExams = await db
      .select({
        examId: exams.id,
        title: exams.title,
        availableFrom: exams.availableFrom,
        availableUntil: exams.availableUntil,
        duration: exams.duration,
        isActive: exams.isActive,
      })
      .from(exams)
      .where(
        and(
          eq(exams.isActive, true),
          lte(exams.availableFrom, oneDayFromNow),
          examId ? eq(exams.id, examId) : undefined
        )
      );

    const results = [];

    for (const exam of upcomingExams) {
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
            eq(studentExams.examId, exam.examId)
          )
        )
        .where(
          and(
            eq(users.role, "STUDENT"),
            eq(users.isActive, true),
            isNull(studentExams.id) // Haven't taken the exam yet
          )
        );

      for (const student of studentsToNotify) {
        const emailResult = await sendExamReminder(student.email, {
          studentName: student.fullName,
          examTitle: exam.title,
          startTime: exam.availableFrom,
          endTime: exam.availableUntil,
          duration: exam.duration,
        });

        results.push({
          examId: exam.examId,
          studentId: student.userId,
          email: student.email,
          type: "exam_reminder",
          success: emailResult.success,
          message: emailResult.message,
          sentAt: new Date(),
        });
      }
    }

    return {
      success: true,
      data: {
        totalRemindersSent: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        details: results,
      },
    };
  } catch (error) {
    console.error("Exam reminders error:", error);
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
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // Find active exams ending soon
    const endingExams = await db
      .select({
        examId: exams.id,
        title: exams.title,
        availableUntil: exams.availableUntil,
      })
      .from(exams)
      .where(and(eq(exams.isActive, true), gte(exams.availableUntil, now)));

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
            eq(studentExams.examId, exam.examId),
            isNull(studentExams.submittedAt) // Haven't submitted yet
          )
        );

      for (const student of activeStudents) {
        const timeLeft = Math.max(
          0,
          Math.floor((new Date(exam.availableUntil) - now) / (60 * 1000))
        );
        const timeLeftText =
          timeLeft > 60
            ? `${Math.floor(timeLeft / 60)} hours ${timeLeft % 60} minutes`
            : `${timeLeft} minutes`;

        const emailResult = await sendDeadlineWarning(student.email, {
          studentName: student.fullName,
          examTitle: exam.title,
          endTime: exam.availableUntil,
          timeLeft: timeLeftText,
        });

        results.push({
          examId: exam.examId,
          studentId: student.studentId,
          email: student.email,
          type: "deadline_warning",
          timeLeftMinutes: timeLeft,
          success: emailResult.success,
          message: emailResult.message,
          sentAt: new Date(),
        });
      }
    }

    return {
      success: true,
      data: {
        totalWarningsSent: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        urgent: results.filter((r) => r.timeLeftMinutes < 30).length,
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

    const results = [];

    for (const user of allUsers) {
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
    }

    return {
      success: true,
      data: {
        totalRecipients: allUsers.length,
        announcementsSent: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
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
