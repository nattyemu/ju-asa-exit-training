import { db } from "../../db/connection.js";
import { profiles, results, studentExams } from "../../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

/**
 * Get department-wise performance for an exam
 */
export const getDepartmentPerformance = async (examId) => {
  try {
    const departmentStats = await db
      .select({
        department: profiles.department,
        participantCount: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "participant_count"
        ),
        averageScore: sql`ROUND(AVG(${results.score}), 2)`.as("average_score"),
        highestScore: sql`MAX(${results.score})`.as("highest_score"),
        lowestScore: sql`MIN(${results.score})`.as("lowest_score"),
        passCount:
          sql`SUM(CASE WHEN ${results.score} >= 50 THEN 1 ELSE 0 END)`.as(
            "pass_count"
          ),
        avgTimeSpent: sql`ROUND(AVG(${results.timeSpent}), 2)`.as(
          "avg_time_spent"
        ),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .where(eq(studentExams.examId, examId))
      .groupBy(profiles.department)
      .orderBy(sql`AVG(${results.score}) DESC`);

    // Calculate pass rates and add rankings (with proper parsing)
    const rankedDepartments = departmentStats.map((dept, index) => {
      const participantCount = parseInt(dept.participantCount) || 0;
      const passCount = parseInt(dept.passCount) || 0;
      const passRate =
        participantCount > 0
          ? Math.round((passCount / participantCount) * 100)
          : 0;

      return {
        rank: index + 1,
        department: dept.department,
        participants: participantCount,
        averageScore: parseFloat(dept.averageScore) || 0,
        highestScore: parseFloat(dept.highestScore) || 0,
        lowestScore: parseFloat(dept.lowestScore) || 0,
        passCount: passCount,
        passRate: `${passRate}%`,
        averageTimeSpent: `${parseFloat(dept.avgTimeSpent) || 0} minutes`,
      };
    });

    // Calculate overall statistics
    const totalParticipants = rankedDepartments.reduce(
      (sum, dept) => sum + dept.participants,
      0
    );
    const overallAverage =
      rankedDepartments.length > 0
        ? Math.round(
            rankedDepartments.reduce(
              (sum, dept) => sum + dept.averageScore,
              0
            ) / rankedDepartments.length
          )
        : 0;

    return {
      success: true,
      data: {
        departments: rankedDepartments,
        summary: {
          totalDepartments: rankedDepartments.length,
          totalParticipants,
          overallAverageScore: overallAverage,
          topDepartment: rankedDepartments[0] || null,
        },
      },
    };
  } catch (error) {
    // console.error("Department analytics error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get university-wise performance
 */
export const getUniversityPerformance = async (examId) => {
  try {
    const universityStats = await db
      .select({
        university: profiles.university,
        department: profiles.department,
        participantCount: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "participant_count"
        ),
        averageScore: sql`ROUND(AVG(${results.score}), 2)`.as("average_score"),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .where(eq(studentExams.examId, examId))
      .groupBy(profiles.university, profiles.department)
      .orderBy(sql`AVG(${results.score}) DESC`);

    return {
      success: true,
      data: universityStats.map((stat) => ({
        university: stat.university,
        department: stat.department,
        participants: parseInt(stat.participantCount) || 0,
        averageScore: parseFloat(stat.averageScore) || 0,
      })),
    };
  } catch (error) {
    // console.error("University analytics error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
