import { db } from "../../db/connection.js";
import { exams, results, studentExams, profiles } from "../../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

/**
 * Get comprehensive statistics for an exam
 */
export const getExamStatistics = async (examId) => {
  try {
    // Get basic exam info
    const [exam] = await db
      .select({
        id: exams.id,
        title: exams.title,
        totalQuestions: exams.totalQuestions,
        passingScore: exams.passingScore,
      })
      .from(exams)
      .where(eq(exams.id, examId));

    if (!exam) {
      throw new Error("Exam not found");
    }

    // Get total participants
    const [participantCount] = await db
      .select({
        totalParticipants: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "total_participants"
        ),
      })
      .from(studentExams)
      .where(eq(studentExams.examId, examId));

    // Get basic score statistics (SIMPLIFIED: removed median for now)
    const [scoreStats] = await db
      .select({
        averageScore: sql`ROUND(AVG(${results.score}), 2)`.as("average_score"),
        highestScore: sql`MAX(${results.score})`.as("highest_score"),
        lowestScore: sql`MIN(${results.score})`.as("lowest_score"),
        passCount:
          sql`SUM(CASE WHEN ${results.score} >= ${exam.passingScore} THEN 1 ELSE 0 END)`.as(
            "pass_count"
          ),
        failCount:
          sql`SUM(CASE WHEN ${results.score} < ${exam.passingScore} THEN 1 ELSE 0 END)`.as(
            "fail_count"
          ),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, examId));

    // Get time statistics
    const [timeStats] = await db
      .select({
        avgTimeSpent: sql`ROUND(AVG(${results.timeSpent}), 2)`.as(
          "avg_time_spent"
        ),
        minTimeSpent: sql`MIN(${results.timeSpent})`.as("min_time_spent"),
        maxTimeSpent: sql`MAX(${results.timeSpent})`.as("max_time_spent"),
        totalTimeSpent: sql`SUM(${results.timeSpent})`.as("total_time_spent"),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, examId));

    // Calculate pass rate
    const totalParticipants = participantCount.totalParticipants || 0;
    const passCount = parseInt(scoreStats.passCount) || 0;
    const passRate =
      totalParticipants > 0
        ? Math.round((passCount / totalParticipants) * 100)
        : 0;

    return {
      success: true,
      data: {
        examInfo: {
          title: exam.title,
          totalQuestions: exam.totalQuestions,
          passingScore: `${exam.passingScore}%`,
        },
        participants: {
          total: totalParticipants,
          passed: passCount,
          failed: parseInt(scoreStats.failCount) || 0,
          passRate: `${passRate}%`,
        },
        performance: {
          averageScore: `${parseFloat(scoreStats.averageScore) || 0}%`,
          highestScore: `${parseFloat(scoreStats.highestScore) || 0}%`,
          lowestScore: `${parseFloat(scoreStats.lowestScore) || 0}%`,
        },
        timeAnalysis: {
          averageTimeSpent: `${
            parseFloat(timeStats.avgTimeSpent) || 0
          } minutes`,
          examDuration: `${exam.duration || 180} minutes`,
        },
      },
    };
  } catch (error) {
    // console.error("Exam analytics error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get score distribution (histogram) for an exam
 */
export const getScoreDistribution = async (examId, bins = 5) => {
  try {
    const scores = await db
      .select({
        score: results.score,
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, examId))
      .orderBy(sql`${results.score}`);

    if (scores.length === 0) {
      return {
        success: true,
        data: {
          totalStudents: 0,
          scoreRanges: [],
          message: "No score data available",
        },
      };
    }

    // Use fewer, more meaningful bins
    const binRanges = [
      { range: "0-20%", min: 0, max: 20 },
      { range: "21-40%", min: 20.1, max: 40 },
      { range: "41-60%", min: 40.1, max: 60 },
      { range: "61-80%", min: 60.1, max: 80 },
      { range: "81-100%", min: 80.1, max: 100 },
    ];

    const distribution = binRanges.map((bin) => {
      const count = scores.filter(
        (s) => s.score >= bin.min && s.score <= bin.max
      ).length;
      const percentage =
        scores.length > 0 ? Math.round((count / scores.length) * 100) : 0;

      return {
        range: bin.range,
        students: count,
        percentage: `${percentage}%`,
      };
    });

    // Find most common score range
    const mostCommonRange = distribution.reduce(
      (max, current) => (current.students > max.students ? current : max),
      { students: 0 }
    );

    // Calculate average score
    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, s) => sum + s.score, 0) / scores.length
          )
        : 0;

    return {
      success: true,
      data: {
        totalStudents: scores.length,
        averageScore: `${averageScore}%`,
        mostCommonScoreRange:
          mostCommonRange.students > 0 ? mostCommonRange.range : "None",
        scoreRanges: distribution.filter((range) => range.students > 0), // Only show ranges with students
      },
    };
  } catch (error) {
    // console.error("Score distribution error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
