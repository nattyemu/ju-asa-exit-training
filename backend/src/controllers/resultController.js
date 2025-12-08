import { db } from "../db/connection.js";
import {
  results,
  studentExams,
  exams,
  users,
  profiles,
  answers,
  questions,
} from "../db/schema.js";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { getTopRankings } from "../services/rankingService.js";

/**
 * Get student's result for a specific exam
 */
export const getStudentResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.userId;

    const parsedExamId = parseInt(examId);
    if (isNaN(parsedExamId) || parsedExamId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID",
      });
    }

    const [result] = await db
      .select({
        result: results,
        session: {
          startedAt: studentExams.startedAt,
          submittedAt: studentExams.submittedAt,
          timeSpent: studentExams.timeSpent,
        },
        exam: {
          id: exams.id,
          title: exams.title,
          totalQuestions: exams.totalQuestions,
          passingScore: exams.passingScore,
        },
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(
        and(
          eq(studentExams.studentId, userId),
          eq(studentExams.examId, parsedExamId)
        )
      )
      .orderBy(desc(results.submittedAt))
      .limit(1);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No result found for this exam",
      });
    }

    // Get detailed answers for review
    const detailedAnswers = await db
      .select({
        questionId: answers.questionId,
        chosenAnswer: answers.chosenAnswer,
        isCorrect: answers.isCorrect,
        question: {
          questionText: questions.questionText,
          optionA: questions.optionA,
          optionB: questions.optionB,
          optionC: questions.optionC,
          optionD: questions.optionD,
          correctAnswer: questions.correctAnswer,
          explanation: questions.explanation,
          subject: questions.subject,
          difficulty: questions.difficulty,
        },
      })
      .from(answers)
      .innerJoin(questions, eq(answers.questionId, questions.id))
      .where(eq(answers.studentExamId, result.result.studentExamId))
      .orderBy(asc(questions.id));

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        detailedAnswers,
      },
    });
  } catch (error) {
    console.error("Get student result error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve exam result",
    });
  }
};

/**
 * Get top rankings for an exam
 */
export const getExamRankings = async (req, res) => {
  try {
    const { examId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const parsedExamId = parseInt(examId);
    if (isNaN(parsedExamId) || parsedExamId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID",
      });
    }

    const rankings = await db
      .select({
        rank: results.rank,
        score: results.score,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        timeSpent: results.timeSpent,
        submittedAt: results.submittedAt,
        student: {
          id: users.id,
          email: users.email,
          profile: {
            fullName: profiles.fullName,
            department: profiles.department,
            university: profiles.university,
            year: profiles.year,
          },
        },
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(users, eq(studentExams.studentId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(studentExams.examId, parsedExamId))
      .orderBy(asc(results.rank))
      .limit(limit);

    // Get total participants
    const [totalResult] = await db
      .select({ count: sql`COUNT(DISTINCT student_id)` })
      .from(studentExams)
      .where(eq(studentExams.examId, parsedExamId));

    return res.status(200).json({
      success: true,
      data: {
        rankings,
        totalParticipants: totalResult.count || 0,
      },
    });
  } catch (error) {
    console.error("Get exam rankings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve exam rankings",
    });
  }
};

/**
 * Get student's result history
 */
export const getStudentResultHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const resultsHistory = await db
      .select({
        result: results,
        exam: {
          id: exams.id,
          title: exams.title,
          totalQuestions: exams.totalQuestions,
          passingScore: exams.passingScore,
        },
        session: {
          startedAt: studentExams.startedAt,
          submittedAt: studentExams.submittedAt,
          timeSpent: studentExams.timeSpent,
        },
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(eq(studentExams.studentId, userId))
      .orderBy(desc(results.submittedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalCountResult] = await db
      .select({ count: sql`COUNT(*)` })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.studentId, userId));

    const totalCount = totalCountResult.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        results: resultsHistory,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get result history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve result history",
    });
  }
};
