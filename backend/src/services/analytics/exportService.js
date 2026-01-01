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
import { sql, eq, and, desc, gte, lte, inArray } from "drizzle-orm";

/**
 * Export exam results to CSV/JSON
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
        duration: exams.duration,
      })
      .from(exams)
      .where(eq(exams.id, examId));

    if (resultsData.length === 0) {
      return {
        success: false,
        error: "No results found for this exam",
      };
    }

    if (format === "csv") {
      // Convert to CSV format
      const headers = [
        "Rank",
        "Student ID",
        "Full Name",
        "Department",
        "University",
        "Score (%)",
        "Correct Answers",
        "Total Questions",
        "Time Spent (minutes)",
        "Status",
        "Submitted At",
      ].join(",");

      const rows = resultsData.map((row) =>
        [
          row.rank || "N/A",
          row.studentId,
          `"${row.fullName || "N/A"}"`,
          `"${row.department || "N/A"}"`,
          `"${row.university || "N/A"}"`,
          row.score?.toFixed(2) || "0.00",
          row.correctAnswers || 0,
          row.totalQuestions || 0,
          row.timeSpent || 0,
          row.status || "N/A",
          new Date(row.submittedAt).toLocaleString(),
        ].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return {
        success: true,
        data: {
          format: "csv",
          filename: `exam-results-${examId}-${
            examInfo[0]?.title?.replace(/\s+/g, "-") || "exam"
          }-${new Date().toISOString().split("T")[0]}.csv`,
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
            examInfo[0]?.title?.replace(/\s+/g, "-") || "exam"
          }-${new Date().toISOString().split("T")[0]}.json`,
          content: resultsData.map((row) => ({
            ...row,
            submittedAt: new Date(row.submittedAt).toISOString(),
          })),
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
      error: error.message || "Failed to export exam results",
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
        questionText: sql`SUBSTRING(${questions.questionText}, 1, 500)`.as(
          "question_text"
        ),
        subject: questions.subject,
        difficulty: questions.difficulty,
        correctAnswer: questions.correctAnswer,
        totalAttempts: sql`COUNT(${answers.id})`.as("total_attempts"),
        correctAttempts:
          sql`SUM(CASE WHEN ${answers.isCorrect} = true THEN 1 ELSE 0 END)`.as(
            "correct_attempts"
          ),
        accuracy: sql`ROUND(
          COALESCE(
            SUM(CASE WHEN ${answers.isCorrect} = true THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(COUNT(${answers.id}), 0), 
            0
          ), 
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
      .groupBy(questions.id)
      .orderBy(questions.id);

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
        "Most Common Answer",
      ].join(",");

      const rows = questionData.map((row) => {
        const optionCounts = {
          A: row.optionACount || 0,
          B: row.optionBCount || 0,
          C: row.optionCCount || 0,
          D: row.optionDCount || 0,
        };
        const mostCommonAnswer = Object.keys(optionCounts).reduce((a, b) =>
          optionCounts[a] > optionCounts[b] ? a : b
        );

        return [
          row.questionId,
          `"${(row.questionText || "").replace(/"/g, '""')}"`,
          row.subject || "N/A",
          row.difficulty || "medium",
          row.correctAnswer || "N/A",
          row.totalAttempts || 0,
          row.correctAttempts || 0,
          row.accuracy || 0,
          row.optionACount || 0,
          row.optionBCount || 0,
          row.optionCCount || 0,
          row.optionDCount || 0,
          mostCommonAnswer,
        ].join(",");
      });

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
      error: error.message || "Failed to export question analytics",
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
    let baseQuery = db
      .select({
        department: profiles.department,
        studentCount: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "student_count"
        ),
        examCount: sql`COUNT(DISTINCT ${studentExams.examId})`.as("exam_count"),
        totalSubmissions: sql`COUNT(${studentExams.id})`.as(
          "total_submissions"
        ),
        avgScore: sql`COALESCE(ROUND(AVG(${results.score}), 2), 0)`.as(
          "avg_score"
        ),
        highestScore: sql`COALESCE(MAX(${results.score}), 0)`.as(
          "highest_score"
        ),
        lowestScore: sql`COALESCE(MIN(${results.score}), 0)`.as("lowest_score"),
        passRate: sql`COALESCE(ROUND(
          AVG(CASE WHEN ${results.score} >= 50 THEN 1.0 ELSE 0.0 END) * 100, 
          2
        ), 0)`.as("pass_rate"),
        avgTimeSpent: sql`COALESCE(ROUND(AVG(${results.timeSpent}), 2), 0)`.as(
          "avg_time_spent"
        ),
      })
      .from(profiles)
      .leftJoin(studentExams, eq(profiles.userId, studentExams.studentId))
      .leftJoin(results, eq(studentExams.id, results.studentExamId))
      .where(sql`${profiles.department} IS NOT NULL`);

    if (examId) {
      baseQuery = baseQuery.where(eq(studentExams.examId, examId));
    }

    const departmentData = await baseQuery
      .groupBy(profiles.department)
      .orderBy(profiles.department);

    const filteredData = departmentData.filter(
      (dept) => dept.department && dept.studentCount > 0
    );

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

      const rows = filteredData.map((row) =>
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
            totalDepartments: filteredData.length,
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
          content: filteredData,
          metadata: {
            scope: examId ? `Exam ${examId}` : "All Exams",
            totalDepartments: filteredData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    }
  } catch (error) {
    console.error("Export department performance error:", error);
    return {
      success: false,
      error: error.message || "Failed to export department performance",
    };
  }
};

/**
 * Export time-based analytics
 */
export const exportTimeAnalytics = async (
  startDate,
  endDate,
  format = "csv"
) => {
  try {
    const dateFilter = and(
      gte(results.submittedAt, new Date(startDate)),
      lte(results.submittedAt, new Date(endDate))
    );

    const timeData = await db
      .select({
        hour: sql`EXTRACT(HOUR FROM ${results.submittedAt})`.as("hour"),
        dayOfWeek: sql`EXTRACT(DOW FROM ${results.submittedAt})`.as(
          "day_of_week"
        ),
        submissions: sql`COUNT(${results.id})`.as("submissions"),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
        passRate: sql`ROUND(
          AVG(CASE WHEN ${results.score} >= 50 THEN 1 ELSE 0 END) * 100, 
          2
        )`.as("pass_rate"),
        avgTimeSpent: sql`ROUND(AVG(${results.timeSpent}), 2)`.as(
          "avg_time_spent"
        ),
      })
      .from(results)
      .where(dateFilter)
      .groupBy(
        sql`EXTRACT(HOUR FROM ${results.submittedAt})`,
        sql`EXTRACT(DOW FROM ${results.submittedAt})`
      )
      .orderBy(
        sql`EXTRACT(DOW FROM ${results.submittedAt})`,
        sql`EXTRACT(HOUR FROM ${results.submittedAt})`
      );

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    if (format === "csv") {
      const headers = [
        "Day of Week",
        "Hour (24h)",
        "Submissions",
        "Average Score (%)",
        "Pass Rate (%)",
        "Average Time Spent (minutes)",
      ].join(",");

      const rows = timeData.map((row) =>
        [
          daysOfWeek[row.dayOfWeek] || "Unknown",
          row.hour,
          row.submissions,
          row.avgScore,
          row.passRate,
          row.avgTimeSpent,
        ].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return {
        success: true,
        data: {
          format: "csv",
          filename: `time-analytics-${startDate}-to-${endDate}.csv`,
          content: csv,
          metadata: {
            period: `${startDate} to ${endDate}`,
            totalRecords: timeData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    } else {
      return {
        success: true,
        data: {
          format: "json",
          filename: `time-analytics-${startDate}-to-${endDate}.json`,
          content: timeData.map((row) => ({
            ...row,
            dayOfWeek: daysOfWeek[row.dayOfWeek] || "Unknown",
          })),
          metadata: {
            period: `${startDate} to ${endDate}`,
            totalRecords: timeData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    }
  } catch (error) {
    console.error("Export time analytics error:", error);
    return {
      success: false,
      error: error.message || "Failed to export time analytics",
    };
  }
};

/**
 * Export student performance report
 */
export const exportStudentPerformance = async (studentId, format = "csv") => {
  try {
    const studentData = await db
      .select({
        examTitle: exams.title,
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
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(eq(studentExams.studentId, studentId))
      .orderBy(desc(results.submittedAt));

    const studentInfo = await db
      .select({
        fullName: profiles.fullName,
        department: profiles.department,
        university: profiles.university,
      })
      .from(profiles)
      .where(eq(profiles.userId, studentId));

    if (studentData.length === 0) {
      return {
        success: false,
        error: "No exam data found for this student",
      };
    }

    if (format === "csv") {
      const headers = [
        "Exam Title",
        "Score (%)",
        "Correct Answers",
        "Total Questions",
        "Time Spent (minutes)",
        "Rank",
        "Status",
        "Submitted At",
      ].join(",");

      const rows = studentData.map((row) =>
        [
          `"${row.examTitle}"`,
          row.score?.toFixed(2) || "0.00",
          row.correctAnswers || 0,
          row.totalQuestions || 0,
          row.timeSpent || 0,
          row.rank || "N/A",
          row.status || "N/A",
          new Date(row.submittedAt).toLocaleString(),
        ].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return {
        success: true,
        data: {
          format: "csv",
          filename: `student-performance-${
            studentInfo[0]?.fullName?.replace(/\s+/g, "-") || studentId
          }-${new Date().toISOString().split("T")[0]}.csv`,
          content: csv,
          metadata: {
            student: studentInfo[0],
            totalExams: studentData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    } else {
      return {
        success: true,
        data: {
          format: "json",
          filename: `student-performance-${
            studentInfo[0]?.fullName?.replace(/\s+/g, "-") || studentId
          }-${new Date().toISOString().split("T")[0]}.json`,
          content: studentData.map((row) => ({
            ...row,
            submittedAt: new Date(row.submittedAt).toISOString(),
          })),
          metadata: {
            student: studentInfo[0],
            totalExams: studentData.length,
            exportedAt: new Date().toISOString(),
          },
        },
      };
    }
  } catch (error) {
    console.error("Export student performance error:", error);
    return {
      success: false,
      error: error.message || "Failed to export student performance",
    };
  }
};

/**
 * Export complete analytics report - SIMPLE WORKING VERSION
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

    // 1. Get basic summary - SIMPLE
    const [summary] = await db
      .select({
        totalExams: sql`COUNT(DISTINCT ${studentExams.examId})`.as(
          "total_exams"
        ),
        totalStudents: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "total_students"
        ),
        totalSubmissions: sql`COUNT(${results.id})`.as("total_submissions"),
        avgScore: sql`COALESCE(ROUND(AVG(${results.score}), 2), 0)`.as(
          "avg_score"
        ),
        passRate: sql`COALESCE(ROUND(
          AVG(CASE WHEN ${results.score} >= 50 THEN 1 ELSE 0 END) * 100, 
          2
        ), 0)`.as("pass_rate"),
        avgTimeSpent: sql`COALESCE(ROUND(AVG(${results.timeSpent}), 2), 0)`.as(
          "avg_time_spent"
        ),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(dateFilter);

    // 2. Get daily activity - SIMPLE
    const dailyActivity = await db
      .select({
        date: sql`DATE(${results.submittedAt})`.as("date"),
        submissions: sql`COUNT(${results.id})`.as("submissions"),
        avgScore: sql`COALESCE(ROUND(AVG(${results.score}), 2), 0)`.as(
          "avg_score"
        ),
      })
      .from(results)
      .where(dateFilter)
      .groupBy(sql`DATE(${results.submittedAt})`)
      .orderBy(sql`DATE(${results.submittedAt})`);

    // 3. Get top students - SIMPLE
    const topStudents = await db
      .select({
        studentId: studentExams.studentId,
        fullName: profiles.fullName,
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
        totalExams: sql`COUNT(DISTINCT ${studentExams.examId})`.as(
          "total_exams"
        ),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(profiles, eq(studentExams.studentId, profiles.userId))
      .where(dateFilter)
      .groupBy(studentExams.studentId, profiles.fullName)
      .orderBy(sql`AVG(${results.score}) DESC`)
      .limit(10);

    // 4. Get exam performance - SIMPLE
    const examPerformance = await db
      .select({
        examId: studentExams.examId,
        examTitle: exams.title,
        totalParticipants: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "total_participants"
        ),
        avgScore: sql`ROUND(AVG(${results.score}), 2)`.as("avg_score"),
        passRate: sql`ROUND(
          AVG(CASE WHEN ${results.score} >= 50 THEN 1 ELSE 0 END) * 100, 
          2
        )`.as("pass_rate"),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(dateFilter)
      .groupBy(studentExams.examId, exams.title)
      .orderBy(sql`AVG(${results.score}) DESC`);

    // 5. Get score distribution - SIMPLE
    const scoreDistribution = await db
      .select({
        scoreRange: sql`
          CASE
            WHEN ${results.score} < 50 THEN '0-49'
            WHEN ${results.score} < 70 THEN '50-69'
            WHEN ${results.score} < 85 THEN '70-84'
            ELSE '85-100'
          END
        `.as("score_range"),
        count: sql`COUNT(${results.id})`.as("count"),
      })
      .from(results)
      .where(dateFilter).groupBy(sql`
        CASE
          WHEN ${results.score} < 50 THEN '0-49'
          WHEN ${results.score} < 70 THEN '50-69'
          WHEN ${results.score} < 85 THEN '70-84'
          ELSE '85-100'
        END
      `).orderBy(sql`
        CASE
          WHEN ${results.score} < 50 THEN '0-49'
          WHEN ${results.score} < 70 THEN '50-69'
          WHEN ${results.score} < 85 THEN '70-84'
          ELSE '85-100'
        END
      `);

    // 6. Get hourly pattern - SIMPLE
    const hourlyPattern = await db
      .select({
        hour: sql`HOUR(${results.submittedAt})`.as("hour"),
        submissions: sql`COUNT(${results.id})`.as("submissions"),
      })
      .from(results)
      .where(dateFilter)
      .groupBy(sql`HOUR(${results.submittedAt})`)
      .orderBy(sql`HOUR(${results.submittedAt})`);

    // Compile report data
    const totalSubmissions = parseInt(summary.totalSubmissions) || 1;

    const reportData = {
      metadata: {
        title: "Analytics Report",
        period: `${startDate} to ${endDate}`,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        totalExams: parseInt(summary.totalExams) || 0,
        totalStudents: parseInt(summary.totalStudents) || 0,
        totalSubmissions: totalSubmissions,
        averageScore: `${parseFloat(summary.avgScore) || 0}%`,
        overallPassRate: `${parseFloat(summary.passRate) || 0}%`,
        averageTimeSpent: `${parseFloat(summary.avgTimeSpent) || 0} minutes`,
      },
      dailyActivity: dailyActivity.map((day) => ({
        date: new Date(day.date).toISOString().split("T")[0],
        submissions: parseInt(day.submissions) || 0,
        averageScore: `${parseFloat(day.avgScore) || 0}%`,
      })),
      topStudents: topStudents.map((student, index) => ({
        rank: index + 1,
        studentId: student.studentId,
        fullName: student.fullName,
        averageScore: `${parseFloat(student.avgScore) || 0}%`,
        totalExamsAttempted: parseInt(student.totalExams) || 0,
      })),
      examPerformance: examPerformance.map((exam) => ({
        examId: exam.examId,
        examTitle: exam.examTitle,
        totalParticipants: parseInt(exam.totalParticipants) || 0,
        averageScore: `${parseFloat(exam.avgScore) || 0}%`,
        passRate: `${parseFloat(exam.passRate) || 0}%`,
      })),
      scoreDistribution: scoreDistribution.map((range) => ({
        scoreRange: range.scoreRange,
        count: parseInt(range.count) || 0,
        percentage:
          totalSubmissions > 0
            ? `${((parseInt(range.count) / totalSubmissions) * 100).toFixed(
                2
              )}%`
            : "0%",
      })),
      hourlyPattern: hourlyPattern.map((hour) => ({
        hour: `${hour.hour}:00`,
        submissions: parseInt(hour.submissions) || 0,
      })),
    };

    if (format === "csv") {
      // Create simple CSV
      const csv = [
        "ANALYTICS REPORT",
        `Period: ${reportData.metadata.period}`,
        `Generated: ${new Date(
          reportData.metadata.generatedAt
        ).toLocaleString()}`,
        "",
        "SUMMARY",
        ...Object.entries(reportData.summary).map(
          ([key, value]) => `${key.replace(/([A-Z])/g, " $1").trim()},${value}`
        ),
        "",
        "DAILY ACTIVITY",
        "Date,Submissions,Average Score",
        ...reportData.dailyActivity.map(
          (day) => `${day.date},${day.submissions},${day.averageScore}`
        ),
        "",
        "TOP STUDENTS",
        "Rank,Student ID,Full Name,Average Score,Exams Attempted",
        ...reportData.topStudents.map(
          (student) =>
            `${student.rank},${student.studentId},"${student.fullName}",${student.averageScore},${student.totalExamsAttempted}`
        ),
        "",
        "EXAM PERFORMANCE",
        "Exam ID,Exam Title,Participants,Average Score,Pass Rate",
        ...reportData.examPerformance.map(
          (exam) =>
            `${exam.examId},"${exam.examTitle}",${exam.totalParticipants},${exam.averageScore},${exam.passRate}`
        ),
      ].join("\n");

      return {
        success: true,
        data: {
          format: "csv",
          filename: `analytics-report-${startDate}-to-${endDate}.csv`,
          content: csv,
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
      error: error.message || "Failed to export complete report",
    };
  }
};

export default {
  exportExamResults,
  exportQuestionAnalytics,
  exportDepartmentPerformance,
  exportTimeAnalytics,
  exportStudentPerformance,
  exportCompleteReport,
};
