import { db } from "../../db/connection.js";
import { results, studentExams, exams } from "../../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

/**
 * Get time-based analytics for an exam
 */
export const getTimeAnalytics = async (examId) => {
  try {
    // Get time vs score data
    const timeScoreData = await db
      .select({
        timeSpent: results.timeSpent,
        score: results.score,
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, examId));

    if (timeScoreData.length === 0) {
      return {
        success: true,
        data: {
          timeScoreCorrelation: "No data available",
          completionRate: "0%",
          timeUsage: {
            averageTime: "0 minutes",
            examDuration: "180 minutes",
            overTimeStudents: 0,
            totalStudents: 0,
          },
        },
      };
    }

    // Calculate correlation coefficient (simplified)
    const n = timeScoreData.length;
    const sumX = timeScoreData.reduce((sum, d) => sum + d.timeSpent, 0);
    const sumY = timeScoreData.reduce((sum, d) => sum + d.score, 0);
    const sumXY = timeScoreData.reduce(
      (sum, d) => sum + d.timeSpent * d.score,
      0
    );
    const sumX2 = timeScoreData.reduce(
      (sum, d) => sum + d.timeSpent * d.timeSpent,
      0
    );
    const sumY2 = timeScoreData.reduce((sum, d) => sum + d.score * d.score, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    const correlation = denominator !== 0 ? numerator / denominator : 0;

    // Get exam duration
    const [exam] = await db
      .select({
        duration: exams.duration,
      })
      .from(exams)
      .where(eq(exams.id, examId));

    const duration = exam?.duration || 180;

    // Categorize time usage (SIMPLIFIED)
    const timeExceeded = timeScoreData.filter(
      (d) => d.timeSpent >= duration
    ).length;
    const onTime = timeScoreData.length - timeExceeded;

    // Calculate completion rate
    const [completionStats] = await db
      .select({
        totalSessions: sql`COUNT(${studentExams.id})`.as("total_sessions"),
        completedSessions:
          sql`SUM(CASE WHEN ${studentExams.submittedAt} IS NOT NULL THEN 1 ELSE 0 END)`.as(
            "completed_sessions"
          ),
      })
      .from(studentExams)
      .where(eq(studentExams.examId, examId));

    const completionRate =
      completionStats.totalSessions > 0
        ? Math.round(
            (completionStats.completedSessions /
              completionStats.totalSessions) *
              100
          )
        : 0;

    // Calculate average time
    const averageTime = Math.round(sumX / n);

    return {
      success: true,
      data: {
        timeScoreCorrelation: getCorrelationInterpretation(correlation),
        completionRate: `${completionRate}%`,
        timeUsage: {
          averageTime: `${averageTime} minutes`,
          examDuration: `${duration} minutes`,
          onTimeStudents: onTime,
          overTimeStudents: timeExceeded,
          totalStudents: timeScoreData.length,
        },
      },
    };
  } catch (error) {
    console.error("Time analytics error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Helper function for correlation interpretation
const getCorrelationInterpretation = (correlation) => {
  if (correlation > 0.7)
    return "Strong positive correlation (more time = higher score)";
  if (correlation > 0.3) return "Moderate positive correlation";
  if (correlation > -0.3) return "Weak or no correlation";
  if (correlation > -0.7) return "Moderate negative correlation";
  return "Strong negative correlation (less time = higher score)";
};

/**
 * Get submission pattern (when students submitted)
 */
export const getSubmissionPattern = async (examId) => {
  try {
    const submissionData = await db
      .select({
        hour: sql`HOUR(${results.submittedAt})`.as("hour"),
        count: sql`COUNT(${results.id})`.as("count"),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, examId))
      .groupBy(sql`HOUR(${results.submittedAt})`)
      .orderBy(sql`HOUR(${results.submittedAt})`);

    // Simplify the response
    const simplified = submissionData.map((item) => ({
      hour: `${item.hour}:00`,
      submissions: parseInt(item.count),
    }));

    return {
      success: true,
      data: {
        submissionPattern: simplified,
        totalSubmissions: simplified.reduce(
          (sum, item) => sum + item.submissions,
          0
        ),
      },
    };
  } catch (error) {
    console.error("Submission pattern error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
