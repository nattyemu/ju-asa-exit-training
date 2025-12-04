import { db } from "../db/connection.js";
import { studentExams, exams, results, answers } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { eq, and, isNull } from "drizzle-orm";
import {
  calculateScore,
  updateAnswerCorrectness,
} from "../services/scoringService.js";
import {
  calculateRank,
  recalculateExamRankings,
} from "../services/rankingService.js"; // UPDATED IMPORT
import {
  calculateRemainingTime,
  shouldAutoSubmit,
} from "../utils/examTimer.js";
import {
  submitExamSchema,
  formatZodError,
} from "../validations/submissionSchemas.js";

/**
 * Manual exam submission
 */
export const submitExam = async (req, res) => {
  try {
    const validationResult = submitExamSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const sessionId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    // First check if exam is already submitted
    const [existingSession] = await db
      .select()
      .from(studentExams)
      .where(
        and(eq(studentExams.id, sessionId), eq(studentExams.studentId, userId))
      );

    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found",
      });
    }

    // Check if already submitted - PREVENT ALL ACTIONS
    if (existingSession.submittedAt) {
      const [existingResult] = await db
        .select()
        .from(results)
        .where(eq(results.studentExamId, sessionId));

      return res.status(400).json({
        success: false,
        message: "Exam already submitted. No further actions allowed.",
        data: {
          result: existingResult,
          session: existingSession,
          exam: await db
            .select()
            .from(exams)
            .where(eq(exams.id, existingSession.examId))
            .then(([e]) => e),
        },
      });
    }

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, existingSession.examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if exam time has expired - PREVENT ANSWER SUBMISSIONS
    const now = new Date();
    const startedAt = new Date(existingSession.startedAt);
    const durationEnd = new Date(startedAt.getTime() + exam.duration * 60000);

    if (now > durationEnd) {
      return res.status(400).json({
        success: false,
        message:
          "Exam time has expired. No further answer submissions allowed.",
      });
    }

    // Optional: Save any last-minute answers from request body
    const { answers: lastAnswers } = validationResult.data;
    let newAnswersCount = 0;
    let updatedAnswersCount = 0;

    if (lastAnswers && lastAnswers.length > 0) {
      for (const answerData of lastAnswers) {
        const { questionId, chosenAnswer } = answerData;

        // Check if answer already exists
        const [existingAnswer] = await db
          .select()
          .from(answers)
          .where(
            and(
              eq(answers.studentExamId, sessionId),
              eq(answers.questionId, questionId)
            )
          );

        if (existingAnswer) {
          // Normalize both values for comparison
          const existing = String(existingAnswer.chosenAnswer || "")
            .trim()
            .toUpperCase();
          const newAnswer = String(chosenAnswer || "")
            .trim()
            .toUpperCase();

          // Only update if answer is different
          if (existing !== newAnswer) {
            await db
              .update(answers)
              .set({ chosenAnswer })
              .where(
                and(
                  eq(answers.studentExamId, sessionId),
                  eq(answers.questionId, questionId)
                )
              );
            updatedAnswersCount++;
          }
        } else {
          await db.insert(answers).values({
            studentExamId: sessionId,
            questionId,
            chosenAnswer,
          });
          newAnswersCount++;
        }
      }
    }

    // Calculate time spent in minutes
    const submittedAt = new Date();
    const timeSpentMs = submittedAt - startedAt;
    const timeSpentMinutes = Math.floor(timeSpentMs / (1000 * 60));

    let finalResult;
    let action = "submitted";

    // Check if result already exists
    const [existingResult] = await db
      .select()
      .from(results)
      .where(eq(results.studentExamId, sessionId));

    if (existingResult) {
      // Result exists - check if we need to recalculate
      if (newAnswersCount > 0 || updatedAnswersCount > 0) {
        // Recalculate with new/updated answers
        await db.transaction(async (tx) => {
          await tx
            .update(studentExams)
            .set({
              submittedAt: submittedAt,
              timeSpent: timeSpentMinutes,
              updatedAt: new Date(),
            })
            .where(eq(studentExams.id, sessionId));

          const scoreResult = await calculateScore(sessionId);
          await updateAnswerCorrectness(sessionId, scoreResult.answers);
          const rank = await calculateRank(
            exam.id,
            sessionId, // ADDED: studentExamId parameter
            scoreResult.score,
            timeSpentMinutes
          );

          await tx
            .update(results)
            .set({
              score: scoreResult.score,
              correctAnswers: scoreResult.correctAnswers,
              totalQuestions: scoreResult.totalQuestions,
              rank: rank,
              timeSpent: timeSpentMinutes,
              submittedAt: submittedAt,
            })
            .where(eq(results.studentExamId, sessionId));
        });
        action = "resubmitted_with_changes";
      } else {
        // No changes to answers, just update submission time
        await db
          .update(studentExams)
          .set({
            submittedAt: submittedAt,
            updatedAt: new Date(),
          })
          .where(eq(studentExams.id, sessionId));

        await db
          .update(results)
          .set({
            submittedAt: submittedAt,
          })
          .where(eq(results.studentExamId, sessionId));
        action = "resubmitted_no_changes";
      }
    } else {
      // First time submission
      await db.transaction(async (tx) => {
        await tx
          .update(studentExams)
          .set({
            submittedAt: submittedAt,
            timeSpent: timeSpentMinutes,
            updatedAt: new Date(),
          })
          .where(eq(studentExams.id, sessionId));

        const scoreResult = await calculateScore(sessionId);
        await updateAnswerCorrectness(sessionId, scoreResult.answers);
        const rank = await calculateRank(
          exam.id,
          sessionId, // ADDED: studentExamId parameter
          scoreResult.score,
          timeSpentMinutes
        );

        await tx.insert(results).values({
          studentExamId: sessionId,
          score: scoreResult.score,
          correctAnswers: scoreResult.correctAnswers,
          totalQuestions: scoreResult.totalQuestions,
          rank: rank,
          timeSpent: timeSpentMinutes,
          submittedAt: submittedAt,
        });
      });
      action = "first_submission";
    }

    // Get the final result
    [finalResult] = await db
      .select()
      .from(results)
      .where(eq(results.studentExamId, sessionId));

    const messages = {
      first_submission: "Exam submitted successfully",
      resubmitted_no_changes: "Exam re-submitted (no answer changes)",
      resubmitted_with_changes: "Exam re-submitted with updated answers",
      submitted: "Exam submitted successfully",
    };

    return res.status(200).json({
      success: true,
      message: messages[action],
      data: {
        result: finalResult,
        session: {
          id: existingSession.id,
          examId: existingSession.examId,
          startedAt: existingSession.startedAt,
          submittedAt: submittedAt,
          timeSpent: timeSpentMinutes,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          totalQuestions: exam.totalQuestions,
          passingScore: exam.passingScore,
        },
        action,
        answerStats: {
          new: newAnswersCount,
          updated: updatedAnswersCount,
        },
      },
    });
  } catch (error) {
    console.error("Submit exam error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      const [existingResult] = await db
        .select()
        .from(results)
        .where(eq(results.studentExamId, parseInt(req.params.id)));

      return res.status(200).json({
        success: true,
        message: "Exam was already submitted. Returning existing results.",
        data: {
          result: existingResult,
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit exam",
    });
  }
};

/**
 * Auto-submit exam (for timeouts/deadlines)
 * This is called by a cron job or when conditions are met
 */
export const autoSubmitExam = async (studentExamId) => {
  try {
    const [session] = await db
      .select()
      .from(studentExams)
      .where(
        and(
          eq(studentExams.id, studentExamId),
          isNull(studentExams.submittedAt)
        )
      );

    if (!session) {
      return {
        success: false,
        message: "Session not found or already submitted",
      };
    }

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, session.examId));

    if (!exam) {
      return { success: false, message: "Exam not found" };
    }

    // Calculate time spent (use exam duration if time expired)
    const startedAt = new Date(session.startedAt);
    const now = new Date();
    let timeSpentMs = now - startedAt;

    // If time expired, use full duration
    const durationEnd = new Date(startedAt.getTime() + exam.duration * 60000);
    if (now > durationEnd) {
      timeSpentMs = exam.duration * 60000;
    }

    const timeSpentMinutes = Math.floor(timeSpentMs / (1000 * 60));
    const submittedAt = new Date();

    await db.transaction(async (tx) => {
      // Update student exam
      await tx
        .update(studentExams)
        .set({
          submittedAt: submittedAt,
          timeSpent: timeSpentMinutes,
          updatedAt: new Date(),
        })
        .where(eq(studentExams.id, studentExamId));

      // Calculate score
      const scoreResult = await calculateScore(studentExamId);
      await updateAnswerCorrectness(studentExamId, scoreResult.answers);

      // Calculate rank - NEEDS TO BE UPDATED
      const rank = await calculateRank(
        exam.id,
        studentExamId, // ADDED: studentExamId parameter
        scoreResult.score,
        timeSpentMinutes
      );

      // Store result
      await tx.insert(results).values({
        studentExamId: studentExamId,
        score: scoreResult.score,
        correctAnswers: scoreResult.correctAnswers,
        totalQuestions: scoreResult.totalQuestions,
        rank: rank,
        timeSpent: timeSpentMinutes,
        submittedAt: submittedAt,
      });
    });

    return { success: true, message: "Exam auto-submitted successfully" };
  } catch (error) {
    console.error("Auto-submit exam error:", error);
    return { success: false, message: "Failed to auto-submit exam" };
  }
};

/**
 * Check and auto-submit exams that meet conditions
 */
export const checkAutoSubmitConditions = async (req, res) => {
  try {
    const now = new Date();

    // Track which exams need ranking recalculation
    const examsNeedingRecalculation = new Set();

    const activeSessions = await db
      .select({
        session: studentExams,
        exam: exams,
        answerCount: sql`COUNT(answers.id)`.as("answer_count"),
      })
      .from(studentExams)
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .leftJoin(answers, eq(studentExams.id, answers.studentExamId))
      .where(and(isNull(studentExams.submittedAt), eq(exams.isActive, true)))
      .groupBy(studentExams.id);

    const results = [];

    for (const { session, exam, answerCount } of activeSessions) {
      const shouldAutoSubmitResult = shouldAutoSubmit(session, exam);

      if (shouldAutoSubmitResult) {
        if (answerCount > 0) {
          // Has answers → Auto-submit
          const result = await autoSubmitExam(session.id);
          results.push({
            sessionId: session.id,
            studentId: session.studentId,
            examId: exam.id,
            action: "auto_submitted",
            answerCount,
            ...result,
          });
          // Auto-submit already calculates rank
        } else {
          // No answers → Delete session (clean up)
          await db.transaction(async (tx) => {
            await tx
              .delete(answers)
              .where(eq(answers.studentExamId, session.id));
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
            success: true,
            message: "Empty session deleted",
          });

          // Mark this exam for ranking recalculation
          examsNeedingRecalculation.add(exam.id);
        }
      }
    }

    // Recalculate rankings for affected exams
    const recalculationResults = [];
    for (const examId of examsNeedingRecalculation) {
      try {
        const result = await recalculateExamRankings(examId);
        recalculationResults.push({
          examId,
          success: result.success,
          updated: result.updated,
        });
      } catch (error) {
        recalculationResults.push({
          examId,
          success: false,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Auto-check completed for ${activeSessions.length} sessions`,
      data: {
        checked: activeSessions.length,
        autoSubmitted: results.filter(
          (r) => r.action === "auto_submitted" && r.success
        ).length,
        deleted: results.filter(
          (r) => r.action === "deleted_empty" && r.success
        ).length,
        rankingsRecalculated: recalculationResults.filter((r) => r.success)
          .length,
        results,
        recalculationResults,
      },
    });
  } catch (error) {
    console.error("Check auto-submit conditions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check auto-submit conditions",
    });
  }
};
