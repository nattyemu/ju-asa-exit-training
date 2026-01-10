import { db } from "../db/connection.js";
import { studentExams, exams, answers } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { autoSubmitExam } from "../controllers/submissionController.js";

/**
 * Check for exams that need auto-submission
 * This should be run periodically (e.g., every minute)
 */
export const runAutoSubmissionCheck = async () => {
  try {
    const now = new Date();
    // console.log(
    //   `🔄 [AUTO-CHECK] Running auto-submission check at ${now.toISOString()}`
    // );

    // Find active sessions with answer count
    const activeSessions = await db
      .select({
        session: studentExams,
        exam: exams,
        answerCount: sql`COUNT(${answers.id})`.as("answer_count"),
      })
      .from(studentExams)
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .leftJoin(answers, eq(studentExams.id, answers.studentExamId))
      .where(and(isNull(studentExams.submittedAt), eq(exams.isActive, true)))
      .groupBy(studentExams.id);

    // console.log(
    //   `📊 [AUTO-CHECK] Found ${activeSessions.length} active sessions`
    // );

    const results = [];

    for (const { session, exam, answerCount } of activeSessions) {
      const startedAt = new Date(session.startedAt);
      const availableUntil = new Date(exam.availableUntil);

      // Condition 1: Exam duration expired
      const durationEnd = new Date(startedAt.getTime() + exam.duration * 60000);
      const durationExpired = now >= durationEnd;

      // Condition 2: Exam availability deadline passed
      const deadlinePassed = now >= availableUntil;

      // Condition 3: Session abandoned (no activity for 24 hours)
      const updatedAt = session.updatedAt
        ? new Date(session.updatedAt)
        : startedAt;
      const abandoned = now - updatedAt > 24 * 60 * 60 * 1000; // 24 hours

      if (durationExpired || deadlinePassed || abandoned) {
        // console.log(`🚨 [AUTO-CHECK] Processing session ${session.id}:`, {
        //   durationExpired,
        //   deadlinePassed,
        //   abandoned,
        //   studentId: session.studentId,
        //   examId: exam.id,
        //   answerCount,
        // });

        if (answerCount > 0) {
          // Has answers → Auto-submit with scoring
          const result = await autoSubmitExam(session.id);
          results.push({
            sessionId: session.id,
            studentId: session.studentId,
            examId: exam.id,
            action: "auto_submitted",
            answerCount,
            reason: durationExpired
              ? "time_expired"
              : deadlinePassed
              ? "deadline_passed"
              : "abandoned",
            ...result,
          });
        } else {
          // No answers → Delete session (clean up)
          await db.transaction(async (tx) => {
            // Delete any potential answers (though count is 0)
            await tx
              .delete(answers)
              .where(eq(answers.studentExamId, session.id));
            // Delete the session
            await tx
              .delete(studentExams)
              .where(eq(studentExams.id, session.id));
          });

          results.push({
            sessionId: session.id,
            studentId: session.studentId,
            examId: exam.id,
            action: "deleted_empty",
            answerCount,
            reason: durationExpired
              ? "time_expired_empty"
              : deadlinePassed
              ? "deadline_passed_empty"
              : "abandoned_empty",
            success: true,
            message: "Empty session deleted",
          });
        }
      }
    }

    const autoSubmitted = results.filter(
      (r) => r.action === "auto_submitted" && r.success
    ).length;
    const deleted = results.filter(
      (r) => r.action === "deleted_empty" && r.success
    ).length;

    // console.log(
    //   `✅ [AUTO-CHECK] Completed: ${autoSubmitted} auto-submitted, ${deleted} deleted`
    // );

    return {
      success: true,
      checked: activeSessions.length,
      autoSubmitted,
      deleted,
      results,
    };
  } catch (error) {
    // console.error("❌ [AUTO-CHECK] Error:", error);
    return {
      success: false,
      message: "Auto-submission check failed",
      error: error.message,
    };
  }
};

/**
 * Setup cron job for auto-submission
 * Note: This requires a cron library like 'node-cron'
 */
export const setupAutoSubmissionCron = () => {
  // Example using node-cron (install: npm install node-cron)
  /*
  const cron = require('node-cron');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await runAutoSubmissionCheck();
  });
  
  console.log('⏰ Auto-submission cron job scheduled: every minute');
  */
  // For now, just export the function
  // console.log(
  //   "⏰ Auto-submission job ready. Call runAutoSubmissionCheck() periodically."
  // );
};
