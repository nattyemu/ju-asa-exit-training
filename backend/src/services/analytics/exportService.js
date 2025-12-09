import { db } from "../../db/connection.js";
import {
  exams,
  results,
  studentExams,
  profiles,
  questions,
  answers,
  users,
} from "../../db/schema.js";
import { sql, eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * Export exam results to CSV
 */
export const exportExamResults = async (examId, format = "csv") => {
  try {
    const resultsData = await db
      .select({
        studentId: studentExams.studentId,
        fullName: profiles.fullName,
        department: profiles.department,
        university: profiles.university,
        score: results.score,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        timeSpent: results.timeSpent,
        submittedAt: results.submittedAt,
        rank: results.rank,
        status: sql`CASE 
          WHEN ${results.score} >= ${exams.passingScore} THEN 'PASSED'
          ELSE 'FAILED'
        END`.as("status"),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(eq(studentExams.examId, examId))
      .orderBy(desc(results.score));

    const examInfo = await db
      .select({
        title: exams.title,
        totalQuestions: exams.totalQuestions,
        passingScore: exams.passingScore,
      })
      .from(exams)
      .where(eq(exams.id, examId));

    if (format === "csv") {
      // Convert to CSV format manually
      const headers = [
        "Rank",
        "Student ID",
        "Full Name",
        "Department",
        "University",
        "Score",
        "Correct Answers",
        "Total Questions",
        "Time Spent (minutes)",
        "Status",
        "Submitted At",
      ].join(",");

      const rows = resultsData.map((row) =>
        [
          row.rank,
          row.studentId,
          `"${row.fullName}"`,
          `"${row.department}"`,
          `"${row.university}"`,
          `${row.score}%`,
          row.correctAnswers,
          row.totalQuestions,
          row.timeSpent,
          row.status,
          row.submittedAt,
        ].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return {
        success: true,
        data: {
          format: "csv",
          filename: `exam-results-${examId}-${
            new Date().toISOString().split("T")[0]
          }.csv`,
          content: csv,
          metadata: {
            exam: examInfo[0],
            totalRecords: resultsData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    } else {
      // JSON format
      return {
        success: true,
        data: {
          format: "json",
          filename: `exam-results-${examId}-${
            new Date().toISOString().split("T")[0]
          }.json`,
          content: resultsData,
          metadata: {
            exam: examInfo[0],
            totalRecords: resultsData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    }
  } catch (error) {
    console.error("Export results error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Export question analytics to CSV/JSON
 */
export const exportQuestionAnalytics = async (examId, format = "csv") => {
  try {
    const questionData = await db
      .select({
        questionId: questions.id,
        questionText: sql`SUBSTRING(${questions.questionText}, 1, 200)`.as(
          "question_text"
        ),
        subject: questions.subject,
        difficulty: questions.difficulty,
        correctAnswer: questions.correctAnswer,
        totalAttempts: sql`COUNT(${answers.id})`.as("total_attempts"),
        correctAttempts:
          sql`SUM(CASE WHEN ${answers.isCorrect} = 1 THEN 1 ELSE 0 END)`.as(
            "correct_attempts"
          ),
        accuracy: sql`ROUND(
          AVG(CASE WHEN ${answers.isCorrect} = 1 THEN 100 ELSE 0 END), 
          2
        )`.as("accuracy"),
        optionACount:
          sql`SUM(CASE WHEN ${answers.chosenAnswer} = 'A' THEN 1 ELSE 0 END)`.as(
            "option_a_count"
          ),
        optionBCount:
          sql`SUM(CASE WHEN ${answers.chosenAnswer} = 'B' THEN 1 ELSE 0 END)`.as(
            "option_b_count"
          ),
        optionCCount:
          sql`SUM(CASE WHEN ${answers.chosenAnswer} = 'C' THEN 1 ELSE 0 END)`.as(
            "option_c_count"
          ),
        optionDCount:
          sql`SUM(CASE WHEN ${answers.chosenAnswer} = 'D' THEN 1 ELSE 0 END)`.as(
            "option_d_count"
          ),
      })
      .from(questions)
      .leftJoin(answers, eq(questions.id, answers.questionId))
      .leftJoin(studentExams, eq(answers.studentExamId, studentExams.id))
      .where(eq(questions.examId, examId))
      .groupBy(questions.id);

    if (format === "csv") {
      const headers = [
        "Question ID",
        "Question Text",
        "Subject",
        "Difficulty",
        "Correct Answer",
        "Total Attempts",
        "Correct Attempts",
        "Accuracy (%)",
        "Option A Count",
        "Option B Count",
        "Option C Count",
        "Option D Count",
      ].join(",");

      const rows = questionData.map((row) =>
        [
          row.questionId,
          `"${row.questionText}"`,
          row.subject,
          row.difficulty,
          row.correctAnswer,
          row.totalAttempts,
          row.correctAttempts,
          row.accuracy,
          row.optionACount,
          row.optionBCount,
          row.optionCCount,
          row.optionDCount,
        ].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return {
        success: true,
        data: {
          format: "csv",
          filename: `question-analytics-${examId}-${
            new Date().toISOString().split("T")[0]
          }.csv`,
          content: csv,
          metadata: {
            totalQuestions: questionData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    } else {
      return {
        success: true,
        data: {
          format: "json",
          filename: `question-analytics-${examId}-${
            new Date().toISOString().split("T")[0]
          }.json`,
          content: questionData,
          metadata: {
            totalQuestions: questionData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    }
  } catch (error) {
    console.error("Export question analytics error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Export department performance report
 */
export const exportDepartmentPerformance = async (
  examId = null,
  format = "csv"
) => {
  try {
    let query = db
      .select({
        department: profiles.department,
        studentCount: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "student_count"
        ),
        examCount: sql`COUNT(DISTINCT ${studentExams.examId})`.as("exam_count"),
        totalSubmissions: sql`COUNT(${studentExams.id})`.as(
          "total_submissions"
        ),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
        highestScore: sql`MAX(${results.score})`.as("highest_score"),
        lowestScore: sql`MIN(${results.score})`.as("lowest_score"),
        passRate: sql`ROUND(
          AVG(CASE WHEN ${results.score} >= 50 THEN 1 ELSE 0 END) * 100, 
          2
        )`.as("pass_rate"),
        avgTimeSpent: sql`ROUND(AVG(${results.timeSpent}), 2)`.as(
          "avg_time_spent"
        ),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId));

    if (examId) {
      query = query.where(eq(studentExams.examId, examId));
    }

    const departmentData = await query.groupBy(profiles.department);

    if (format === "csv") {
      const headers = [
        "Department",
        "Student Count",
        "Exam Count",
        "Total Submissions",
        "Average Score (%)",
        "Highest Score (%)",
        "Lowest Score (%)",
        "Pass Rate (%)",
        "Average Time Spent (minutes)",
      ].join(",");

      const rows = departmentData.map((row) =>
        [
          `"${row.department}"`,
          row.studentCount,
          row.examCount,
          row.totalSubmissions,
          row.avgScore,
          row.highestScore,
          row.lowestScore,
          row.passRate,
          row.avgTimeSpent,
        ].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return {
        success: true,
        data: {
          format: "csv",
          filename: examId
            ? `department-performance-${examId}-${
                new Date().toISOString().split("T")[0]
              }.csv`
            : `department-performance-all-${
                new Date().toISOString().split("T")[0]
              }.csv`,
          content: csv,
          metadata: {
            scope: examId ? `Exam ${examId}` : "All Exams",
            totalDepartments: departmentData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    } else {
      return {
        success: true,
        data: {
          format: "json",
          filename: examId
            ? `department-performance-${examId}-${
                new Date().toISOString().split("T")[0]
              }.json`
            : `department-performance-all-${
                new Date().toISOString().split("T")[0]
              }.json`,
          content: departmentData,
          metadata: {
            scope: examId ? `Exam ${examId}` : "All Exams",
            totalDepartments: departmentData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    }
  } catch (error) {
    console.error("Export department performance error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Export complete analytics report
 */
export const exportCompleteReport = async (
  startDate,
  endDate,
  format = "json"
) => {
  try {
    const dateFilter = and(
      gte(results.submittedAt, new Date(startDate)),
      lte(results.submittedAt, new Date(endDate))
    );

    // Get summary statistics
    const [summary] = await db
      .select({
        totalExams: sql`COUNT(DISTINCT ${studentExams.examId})`.as(
          "total_exams"
        ),
        totalStudents: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "total_students"
        ),
        totalSubmissions: sql`COUNT(${results.id})`.as("total_submissions"),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
        passRate: sql`ROUND(
          AVG(CASE WHEN ${results.score} >= 50 THEN 1 ELSE 0 END) * 100, 
          2
        )`.as("pass_rate"),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(dateFilter);

    // Get daily activity
    const dailyActivity = await db
      .select({
        date: sql`DATE(${results.submittedAt})`.as("date"),
        submissions: sql`COUNT(${results.id})`.as("submissions"),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
        passRate: sql`ROUND(
          AVG(CASE WHEN ${results.score} >= 50 THEN 1 ELSE 0 END) * 100, 
          2
        )`.as("pass_rate"),
      })
      .from(results)
      .where(dateFilter)
      .groupBy(sql`DATE(${results.submittedAt})`)
      .orderBy(sql`DATE(${results.submittedAt})`);

    const reportData = {
      metadata: {
        title: "Complete Analytics Report",
        period: `${startDate} to ${endDate}`,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        totalExams: parseInt(summary.totalExams) || 0,
        totalStudents: parseInt(summary.totalStudents) || 0,
        totalSubmissions: parseInt(summary.totalSubmissions) || 0,
        averageScore: `${parseFloat(summary.avgScore) || 0}%`,
        overallPassRate: `${parseFloat(summary.passRate) || 0}%`,
      },
      dailyActivity: dailyActivity.map((day) => ({
        date: day.date,
        submissions: parseInt(day.submissions) || 0,
        averageScore: `${parseFloat(day.avgScore) || 0}%`,
        passRate: `${parseFloat(day.passRate) || 0}%`,
      })),
    };

    if (format === "csv") {
      const headers = [
        "Date",
        "Submissions",
        "Average Score",
        "Pass Rate",
      ].join(",");

      const rows = reportData.dailyActivity.map((day) =>
        [day.date, day.submissions, day.averageScore, day.passRate].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return {
        success: true,
        data: {
          format: "csv",
          filename: `analytics-report-${startDate}-to-${endDate}.csv`,
          content: csv,
          summary: reportData.summary,
          metadata: reportData.metadata,
        },
      };
    } else {
      return {
        success: true,
        data: {
          format: "json",
          filename: `analytics-report-${startDate}-to-${endDate}.json`,
          content: reportData,
        },
      };
    }
  } catch (error) {
    console.error("Export complete report error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
