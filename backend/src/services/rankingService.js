import { db } from "../db/connection.js";
import { results, studentExams } from "../db/schema.js";
import { eq, desc, asc, and } from "drizzle-orm";

/**
 * Calculate rank for a student's exam result
 * @param {number} examId - Exam ID
 * @param {number} studentExamId - Student exam session ID
 * @param {number} studentScore - Student's score
 * @param {number} timeSpent - Time spent in minutes
 * @returns {number} Rank position
 */
export const calculateRank = async (
  examId,
  studentExamId,
  studentScore,
  timeSpent
) => {
  try {
    // Get all results with student identity
    const allResults = await db
      .select({
        studentExamId: results.studentExamId,
        score: results.score,
        timeSpent: results.timeSpent,
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, examId))
      .orderBy(desc(results.score), asc(results.timeSpent));

    // Find rank by matching exact studentExamId
    let rank = 1;
    for (const result of allResults) {
      if (result.studentExamId === studentExamId) {
        return rank;
      }
      rank++;
    }

    return allResults.length + 1; // If not found
  } catch (error) {
    // console.error("Error calculating rank:", error);
    throw new Error("Failed to calculate ranking");
  }
};

/**
 * Recalculate and update ALL ranks for an exam in database
 * Call this when sessions are deleted or new results added
 */
export const recalculateExamRankings = async (examId) => {
  try {
    // Get all results for this exam ordered by score (desc) and time (asc)
    const allResults = await db
      .select({
        id: results.id,
        studentExamId: results.studentExamId,
        score: results.score,
        timeSpent: results.timeSpent,
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, examId))
      .orderBy(desc(results.score), asc(results.timeSpent));

    // Update ranks in a transaction
    await db.transaction(async (tx) => {
      for (let i = 0; i < allResults.length; i++) {
        const rank = i + 1; // Start from 1
        await tx
          .update(results)
          .set({ rank })
          .where(eq(results.id, allResults[i].id));
      }
    });

    return {
      success: true,
      updated: allResults.length,
      message: `Recalculated rankings for ${allResults.length} results`,
    };
  } catch (error) {
    // console.error("Error recalculating rankings:", error);
    throw new Error("Failed to recalculate rankings");
  }
};

/**
 * Get top rankings for an exam
 * @param {number} examId - Exam ID
 * @param {number} limit - Number of top rankings to return
 * @returns {Array} Top rankings
 */
export const getTopRankings = async (examId, limit = 10) => {
  try {
    const rankings = await db
      .select({
        rank: results.rank,
        score: results.score,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        timeSpent: results.timeSpent,
        submittedAt: results.submittedAt,
        student: {
          id: studentExams.studentId,
        },
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, examId))
      .orderBy(asc(results.rank))
      .limit(limit);

    return Array.isArray(rankings) ? rankings : [];
  } catch (error) {
    // console.error("Error getting top rankings:", error);
    return [];
  }
};
