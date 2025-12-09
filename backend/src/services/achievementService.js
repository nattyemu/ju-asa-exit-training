import { db } from "../db/connection.js";
import { studentExams, results, exams } from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Check and award achievements for a student
 */
export const checkAchievements = async (studentId) => {
  try {
    const achievements = [];

    // 1. First Exam Achievement
    const firstExam = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(studentExams)
      .where(eq(studentExams.studentId, studentId));

    if (parseInt(firstExam[0]?.count) === 1) {
      achievements.push({
        id: "first_exam",
        title: "First Step",
        description: "Completed your first exam",
        icon: "🎯",
        unlockedAt: new Date().toISOString(),
      });
    }

    // 2. Perfect Score Achievement
    const perfectScores = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(
        and(eq(studentExams.studentId, studentId), eq(results.score, 100))
      );

    if (parseInt(perfectScores[0]?.count) > 0) {
      achievements.push({
        id: "perfect_score",
        title: "Perfect Score",
        description: "Scored 100% on an exam",
        icon: "🏆",
        count: parseInt(perfectScores[0]?.count),
        unlockedAt: new Date().toISOString(),
      });
    }

    // 3. Marathon Runner (long study session)
    const longSessions = await db
      .select({
        examCount: sql`COUNT(*)`.as("exam_count"),
        totalTime: sql`SUM(${studentExams.timeSpent})`.as("total_time"),
      })
      .from(studentExams)
      .where(eq(studentExams.studentId, studentId));

    const totalTime = parseInt(longSessions[0]?.totalTime) || 0;
    if (totalTime > 300) {
      // 5 hours total study time
      achievements.push({
        id: "marathon_runner",
        title: "Marathon Runner",
        description: "Studied for more than 5 hours total",
        icon: "🏃‍♂️",
        studyTime: `${totalTime} minutes`,
        unlockedAt: new Date().toISOString(),
      });
    }

    // 4. Consistent Performer (3+ exams with >80% score)
    const highScores = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(
        and(eq(studentExams.studentId, studentId), sql`${results.score} >= 80`)
      );

    if (parseInt(highScores[0]?.count) >= 3) {
      achievements.push({
        id: "consistent_performer",
        title: "Consistent Performer",
        description: "Scored 80% or higher on 3+ exams",
        icon: "📈",
        count: parseInt(highScores[0]?.count),
        unlockedAt: new Date().toISOString(),
      });
    }

    // 5. Quick Learner (completed exam in half the time)
    const quickExams = await db
      .select({
        examId: studentExams.examId,
        timeSpent: studentExams.timeSpent,
        duration: exams.duration,
      })
      .from(studentExams)
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(
        and(
          eq(studentExams.studentId, studentId),
          sql`${studentExams.timeSpent} <= (${exams.duration} / 2)`
        )
      )
      .limit(1);

    if (quickExams.length > 0) {
      achievements.push({
        id: "quick_learner",
        title: "Quick Learner",
        description: "Completed an exam in half the allotted time",
        icon: "⚡",
        unlockedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      data: {
        totalAchievements: achievements.length,
        achievements,
      },
    };
  } catch (error) {
    console.error("Achievements check error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get student's achievements
 */
export const getStudentAchievements = async (studentId) => {
  const result = await checkAchievements(studentId);
  return result;
};

/**
 * Get top achievers
 */
export const getTopAchievers = async (limit = 5) => {
  try {
    // First, let's use a simpler query without complex joins
    const topStudents = await db.execute(sql`
      SELECT 
        se.student_id as studentId,
        p.full_name as fullName,
        COUNT(DISTINCT se.exam_id) as examCount,
        ROUND(AVG(r.score), 2) as avgScore
      FROM student_exams se
      INNER JOIN results r ON se.id = r.student_exam_id
      LEFT JOIN profiles p ON se.student_id = p.user_id
      WHERE se.submitted_at IS NOT NULL
      GROUP BY se.student_id, p.full_name
      HAVING COUNT(se.id) >= 1
      ORDER BY AVG(r.score) DESC
      LIMIT ${limit}
    `);

    return {
      success: true,
      data: {
        topAchievers: topStudents[0].map((student, index) => ({
          rank: index + 1,
          studentId: student.studentId,
          name: student.fullName || "Unknown Student",
          examsTaken: parseInt(student.examCount),
          averageScore: `${parseFloat(student.avgScore) || 0}%`,
        })),
      },
    };
  } catch (error) {
    console.error("Top achievers error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
