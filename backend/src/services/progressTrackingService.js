import { db } from "../db/connection.js";
import { exams, studentExams, results, profiles, users } from "../db/schema.js";
import { eq, and, gte, desc, sql } from "drizzle-orm";

/**
 * Get enhanced student progress tracking
 */
export const getEnhancedStudentProgress = async (
  studentId,
  timeRange = "month"
) => {
  try {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get student's exam history
    const examHistory = await db
      .select({
        examId: exams.id,
        title: exams.title,
        startedAt: studentExams.startedAt,
        submittedAt: studentExams.submittedAt,
        timeSpent: studentExams.timeSpent,
        score: results.score,
        rank: results.rank,
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correctAnswers,
      })
      .from(studentExams)
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .leftJoin(results, eq(studentExams.id, results.studentExamId))
      .where(
        and(
          eq(studentExams.studentId, studentId),
          gte(studentExams.startedAt, startDate)
        )
      )
      .orderBy(desc(studentExams.startedAt));

    // Calculate study time (total time spent on exams)
    const totalStudyTime = examHistory.reduce((total, exam) => {
      return total + (parseInt(exam.timeSpent) || 0);
    }, 0);

    // Calculate completion rate
    const totalExamsAvailable = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(exams)
      .where(eq(exams.isActive, true));

    const completionRate =
      totalExamsAvailable[0]?.count > 0
        ? Math.round((examHistory.length / totalExamsAvailable[0].count) * 100)
        : 0;

    // Calculate performance metrics
    const scores = examHistory
      .filter((e) => e.score)
      .map((e) => parseFloat(e.score));
    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

    const improvement =
      scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;

    // Get rank trend
    const ranks = examHistory
      .filter((e) => e.rank)
      .map((e) => parseInt(e.rank));
    const rankImprovement =
      ranks.length > 1
        ? ranks[0] - ranks[ranks.length - 1] // Positive = improved rank
        : 0;

    return {
      success: true,
      data: {
        studentId,
        overview: {
          examsTaken: examHistory.length,
          totalExamsAvailable: parseInt(totalExamsAvailable[0]?.count) || 0,
          completionRate: `${Math.min(completionRate, 100)}%`,
          totalStudyTime: `${totalStudyTime} minutes`,
          averageStudyTimePerExam:
            examHistory.length > 0
              ? `${Math.round(totalStudyTime / examHistory.length)} minutes`
              : "0 minutes",
        },
        performance: {
          averageScore: `${averageScore.toFixed(1)}%`,
          highestScore: scores.length > 0 ? `${Math.max(...scores)}%` : "N/A",
          lowestScore: scores.length > 0 ? `${Math.min(...scores)}%` : "N/A",
          scoreImprovement: `${improvement.toFixed(1)}%`,
          rankImprovement:
            rankImprovement > 0
              ? `+${rankImprovement}`
              : rankImprovement.toString(),
          trend:
            improvement > 0
              ? "improving"
              : improvement < 0
              ? "declining"
              : "stable",
        },
        recentActivity: examHistory.slice(0, 5).map((exam) => ({
          exam: exam.title,
          date: exam.submittedAt || exam.startedAt,
          score: exam.score ? `${exam.score}%` : "Not graded",
          timeSpent: `${exam.timeSpent || 0} minutes`,
          status: exam.submittedAt ? "completed" : "in-progress",
        })),
        timeRange,
      },
    };
  } catch (error) {
    // console.error("Progress tracking error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get leaderboard data
 */
export const getLeaderboard = async (timeRange = "month", limit = 10) => {
  try {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "all":
        startDate = new Date(0); // All time
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const leaderboard = await db
      .select({
        studentId: studentExams.studentId,
        fullName: profiles.fullName,
        department: profiles.department,
        examsTaken: sql`COUNT(DISTINCT ${studentExams.examId})`.as(
          "exams_taken"
        ),
        averageScore: sql`ROUND(AVG(${results.score}), 2)`.as("average_score"),
        totalStudyTime: sql`SUM(${studentExams.timeSpent})`.as(
          "total_study_time"
        ),
      })
      .from(studentExams)
      .innerJoin(results, eq(studentExams.id, results.studentExamId))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .where(gte(studentExams.startedAt, startDate))
      .groupBy(studentExams.studentId, profiles.fullName, profiles.department)
      .having(sql`COUNT(${studentExams.id}) >= 1`)
      .orderBy(desc(sql`AVG(${results.score})`))
      .limit(limit);

    return {
      success: true,
      data: {
        leaderboard: leaderboard.map((student, index) => ({
          rank: index + 1,
          studentId: student.studentId,
          name: student.fullName,
          department: student.department,
          examsTaken: parseInt(student.examsTaken),
          averageScore: `${parseFloat(student.averageScore)}%`,
          studyTime: `${parseInt(student.totalStudyTime) || 0} minutes`,
        })),
        timeRange,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    // console.error("Leaderboard error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get study time analytics for a student
 */
export const getStudyTimeAnalytics = async (studentId) => {
  try {
    const studyData = await db
      .select({
        date: sql`DATE(${studentExams.startedAt})`.as("date"),
        totalTime: sql`SUM(${studentExams.timeSpent})`.as("total_time"),
        examCount: sql`COUNT(*)`.as("exam_count"),
      })
      .from(studentExams)
      .where(
        and(
          eq(studentExams.studentId, studentId),
          sql`${studentExams.submittedAt} IS NOT NULL`
        )
      )
      .groupBy(sql`DATE(${studentExams.startedAt})`)
      .orderBy(sql`DATE(${studentExams.startedAt}) DESC`)
      .limit(30);

    const totalStudyTime = studyData.reduce(
      (sum, day) => sum + (parseInt(day.totalTime) || 0),
      0
    );
    const averageDailyTime =
      studyData.length > 0 ? totalStudyTime / studyData.length : 0;

    return {
      success: true,
      data: {
        studentId,
        summary: {
          totalStudyHours: `${Math.round(totalStudyTime / 60)} hours`,
          studyDays: studyData.length,
          averageDailyTime: `${Math.round(averageDailyTime)} minutes`,
          lastStudied: studyData[0]?.date || "Never",
        },
        dailyData: studyData.map((day) => ({
          date: day.date,
          studyTime: `${parseInt(day.totalTime) || 0} minutes`,
          examsTaken: parseInt(day.examCount),
        })),
      },
    };
  } catch (error) {
    // console.error("Study time analytics error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
