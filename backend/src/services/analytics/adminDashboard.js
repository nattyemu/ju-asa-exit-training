import { db } from "../../db/connection.js";
import {
  users,
  profiles,
  exams,
  questions,
  studentExams,
  results,
  answers,
} from "../../db/schema.js";
import { sql, eq, desc, and, gte, lte, isNull } from "drizzle-orm";

/**
 * Get comprehensive admin dashboard statistics
 */
export const getAdminDashboard = async (timeRange = "day") => {
  try {
    // Calculate date range based on timeRange parameter
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "hour":
        startDate.setHours(now.getHours() - 1);
        break;
      case "day":
        startDate.setDate(now.getDate() - 1);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 1);
    }

    // 1. System Overview Statistics - Use separate queries
    const totalUsers = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(users);

    const totalStudents = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(users)
      .where(sql`${users.role} = 'STUDENT'`);

    const totalAdmins = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(users)
      .where(sql`${users.role} = 'ADMIN'`);

    const totalExams = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(exams);

    const activeExams = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(exams)
      .where(sql`${exams.isActive} = true`);

    const totalQuestions = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(questions);

    const totalSubmissions = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(studentExams);
    const submissionsToday = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(studentExams).where(sql`
        ${studentExams.submittedAt} IS NOT NULL 
        AND DATE(${studentExams.submittedAt}) = CURDATE()
      `);
    // 2. Recent Activity (last 24 hours)
    const recentActivity = await db
      .select({
        id: studentExams.id,
        studentName: profiles.fullName,
        examTitle: exams.title,
        score: results.score,
        submittedAt: results.submittedAt,
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(gte(results.submittedAt, startDate))
      .orderBy(desc(results.submittedAt))
      .limit(10);

    // Add status to recent activity
    const recentActivityWithStatus = await Promise.all(
      recentActivity.map(async (activity) => {
        const [exam] = await db
          .select({ passingScore: exams.passingScore })
          .from(exams)
          .where(eq(exams.title, activity.examTitle))
          .limit(1);

        const status =
          activity.score >= (exam?.passingScore || 50) ? "PASSED" : "FAILED";

        return {
          ...activity,
          status,
        };
      })
    );

    // 3. Active Sessions (currently taking exams)
    const activeSessions = await db
      .select({
        id: studentExams.id,
        studentName: profiles.fullName,
        examTitle: exams.title,
        startedAt: studentExams.startedAt,
      })
      .from(studentExams)
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(isNull(studentExams.submittedAt))
      .orderBy(desc(studentExams.startedAt));

    // Add time elapsed
    const activeSessionsWithTime = activeSessions.map((session) => ({
      ...session,
      timeElapsed: `${Math.floor(
        (new Date() - new Date(session.startedAt)) / 60000
      )} minutes`,
    }));

    // 4. Department Performance Summary
    const departmentSummary = await db
      .select({
        department: profiles.department,
        studentCount: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "student_count"
        ),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .groupBy(profiles.department)
      .orderBy(desc(sql`AVG(${results.score})`))
      .limit(5);

    // 5. Exam Performance Summary
    const examSummary = await db
      .select({
        examId: exams.id,
        title: exams.title,
        participants: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "participants"
        ),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .groupBy(exams.id)
      .orderBy(desc(sql`COUNT(${studentExams.id})`))
      .limit(5);

    // 6. Simple Activity Chart (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const activityChart = await db
      .select({
        date: sql`DATE(${results.submittedAt})`.as("date"),
        submissions: sql`COUNT(${results.id})`.as("submissions"),
      })
      .from(results)
      .where(gte(results.submittedAt, sevenDaysAgo))
      .groupBy(sql`DATE(${results.submittedAt})`)
      .orderBy(sql`DATE(${results.submittedAt})`);

    return {
      success: true,
      data: {
        systemOverview: {
          totalUsers: parseInt(totalUsers[0]?.count) || 0,
          totalStudents: parseInt(totalStudents[0]?.count) || 0,
          totalAdmins: parseInt(totalAdmins[0]?.count) || 0,
          totalExams: parseInt(totalExams[0]?.count) || 0,
          activeExams: parseInt(activeExams[0]?.count) || 0,
          totalQuestions: parseInt(totalQuestions[0]?.count) || 0,
          totalSubmissions: parseInt(totalSubmissions[0]?.count) || 0,
          submissionsToday: parseInt(submissionsToday[0]?.count) || 0,
          timeRange: timeRange,
        },
        recentActivity: recentActivityWithStatus.map((activity) => ({
          ...activity,
          score: `${parseFloat(activity.score) || 0}%`,
        })),
        activeSessions: activeSessionsWithTime,
        topDepartments: departmentSummary.map((dept) => ({
          department: dept.department,
          studentCount: parseInt(dept.studentCount) || 0,
          avgScore: `${parseFloat(dept.avgScore) || 0}%`,
        })),
        topExams: examSummary.map((exam) => ({
          title: exam.title,
          participants: parseInt(exam.participants) || 0,
          avgScore: `${parseFloat(exam.avgScore) || 0}%`,
        })),
        activityChart: activityChart.map((point) => ({
          date: point.date,
          submissions: parseInt(point.submissions) || 0,
        })),
      },
    };
  } catch (error) {
    // console.error("Admin dashboard error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
/**
 * Get real-time system monitoring data
 */
export const getSystemMonitoring = async () => {
  try {
    // Get active connections
    const activeConnections = await db
      .select({
        count: sql`COUNT(*)`.as("count"),
      })
      .from(studentExams)
      .where(isNull(studentExams.submittedAt));

    // Simple database check
    const [dbCheck] = await db.execute(sql`SELECT 1 as connection_test`);

    // Get basic database info
    const [dbInfo] = await db.execute(sql`
      SELECT 
        'MySQL' as type,
        @@version as version,
        @@max_connections as max_connections
    `);

    // Get table count
    const [tableCount] = await db.execute(sql`
      SELECT COUNT(*) as table_count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    return {
      success: true,
      data: {
        database: {
          status:
            dbCheck[0]?.connection_test === 1 ? "connected" : "disconnected",
          activeConnections: parseInt(activeConnections[0]?.count) || 0,
          type: dbInfo[0]?.type || "MySQL",
          version: dbInfo[0]?.version || "Unknown",
          maxConnections: parseInt(dbInfo[0]?.max_connections) || 100,
          tables: parseInt(tableCount[0]?.table_count) || 0,
        },
        system: {
          uptime: Math.floor(process.uptime()),
          memoryUsage: {
            rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(
              process.memoryUsage().heapTotal / 1024 / 1024
            )} MB`,
            heapUsed: `${Math.round(
              process.memoryUsage().heapUsed / 1024 / 1024
            )} MB`,
          },
          timestamp: new Date().toISOString(),
        },
        recentErrors: [],
      },
    };
  } catch (error) {
    // console.error("System monitoring error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
/**
 * Get student progress tracking
 */
export const getStudentProgress = async (
  studentId = null,
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

    const baseQuery = db
      .select({
        studentId: studentExams.studentId,
        studentName: profiles.fullName,
        examTitle: exams.title,
        score: results.score,
        submittedAt: results.submittedAt,
        timeSpent: results.timeSpent,
        rank: results.rank,
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(gte(results.submittedAt, startDate));

    // If studentId is provided, get individual progress
    if (studentId) {
      const studentProgress = await baseQuery.where(
        eq(studentExams.studentId, studentId)
      );

      // Calculate improvement metrics
      const scores = studentProgress.map((p) => parseFloat(p.score));
      const avgScore =
        scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      const improvement =
        scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;

      return {
        success: true,
        data: {
          student: {
            id: studentId,
            name: studentProgress[0]?.studentName || "Unknown",
          },
          progress: studentProgress.map((p) => ({
            exam: p.examTitle,
            score: `${parseFloat(p.score) || 0}%`,
            date: p.submittedAt,
            timeSpent: `${p.timeSpent} minutes`,
            rank: p.rank,
          })),
          metrics: {
            examsTaken: studentProgress.length,
            averageScore: `${avgScore.toFixed(2)}%`,
            improvement: `${improvement.toFixed(2)}%`,
            trend:
              improvement > 0
                ? "improving"
                : improvement < 0
                ? "declining"
                : "stable",
          },
        },
      };
    }

    // Get all students' progress summary
    const allProgress = await baseQuery;

    // Group by student and calculate progress
    const studentProgressMap = {};
    allProgress.forEach((p) => {
      if (!studentProgressMap[p.studentId]) {
        studentProgressMap[p.studentId] = {
          studentId: p.studentId,
          studentName: p.studentName,
          scores: [],
        };
      }
      studentProgressMap[p.studentId].scores.push(parseFloat(p.score));
    });

    const progressSummary = Object.values(studentProgressMap).map((student) => {
      const scores = student.scores;
      const avgScore =
        scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      const improvement =
        scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        examsTaken: scores.length,
        averageScore: `${avgScore.toFixed(2)}%`,
        improvement: `${improvement.toFixed(2)}%`,
        trend:
          improvement > 0
            ? "improving"
            : improvement < 0
            ? "declining"
            : "stable",
      };
    });

    return {
      success: true,
      data: {
        progressSummary: progressSummary.sort(
          (a, b) => b.improvement - a.improvement
        ),
        totalStudents: progressSummary.length,
        timeRange,
      },
    };
  } catch (error) {
    // console.error("Student progress error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
