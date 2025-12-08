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
    const { showIncorrectOnly, bySubject } = req.query;
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
          duration: exams.duration,
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

    // Apply filters if provided
    let filteredAnswers = detailedAnswers;
    if (showIncorrectOnly === "true") {
      filteredAnswers = detailedAnswers.filter((answer) => !answer.isCorrect);
    }
    if (bySubject) {
      filteredAnswers = filteredAnswers.filter(
        (answer) => answer.question.subject === bySubject
      );
    }

    // Calculate performance metrics
    const totalQuestions = result.exam.totalQuestions;
    const correctAnswers = result.result.correctAnswers;
    const score = result.result.score;
    const timeSpent = result.result.timeSpent;
    const examDuration = result.exam.duration;

    // Get exam average for comparison
    const [examStats] = await db
      .select({
        averageScore: sql`ROUND(AVG(${results.score}), 2)`.as("average_score"),
        totalParticipants: sql`COUNT(DISTINCT ${studentExams.studentId})`.as(
          "total_participants"
        ),
      })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(eq(studentExams.examId, parsedExamId));

    // Calculate percentile
    const [betterThan] = await db
      .select({ count: sql`COUNT(*)` })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(
        and(
          eq(studentExams.examId, parsedExamId),
          sql`${results.score} < ${score}`
        )
      );

    const percentile =
      examStats.totalParticipants > 0
        ? Math.round((betterThan.count / examStats.totalParticipants) * 100)
        : 0;

    // Group answers by subject for performance analysis
    const subjectPerformance = {};
    detailedAnswers.forEach((answer) => {
      const subject = answer.question.subject;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = {
          total: 0,
          correct: 0,
        };
      }
      subjectPerformance[subject].total++;
      if (answer.isCorrect) {
        subjectPerformance[subject].correct++;
      }
    });

    // Calculate subject-wise percentages
    const subjectAnalysis = Object.entries(subjectPerformance).map(
      ([subject, stats]) => ({
        subject,
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        percentage: Math.round((stats.correct / stats.total) * 100),
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        result: {
          ...result.result,
          rank: result.result.rank,
          percentile: `${percentile}%`,
          performance: score >= result.exam.passingScore ? "PASS" : "FAIL",
        },
        exam: result.exam,
        session: result.session,
        review: {
          totalQuestions,
          answeredQuestions: detailedAnswers.length,
          correctAnswers,
          incorrectAnswers: totalQuestions - correctAnswers,
          unansweredQuestions: totalQuestions - detailedAnswers.length,
          score: `${score}%`,
          timeSpent: `${timeSpent} minutes`,
          timePercentage: `${Math.round((timeSpent / examDuration) * 100)}%`,
        },
        comparison: {
          examAverage: `${examStats.averageScore || 0}%`,
          totalParticipants: examStats.totalParticipants || 0,
          betterThan: `${percentile}% of participants`,
        },
        answers: filteredAnswers,
        subjectAnalysis,
        filters: {
          showIncorrectOnly: showIncorrectOnly === "true",
          bySubject: bySubject || null,
        },
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

    // Use the imported ranking service function
    const rankings = await getTopRankings(parsedExamId, limit);

    // Enhance rankings with profile data
    const enhancedRankings = await Promise.all(
      rankings.map(async (ranking) => {
        // Get profile for this student
        const [profile] = await db
          .select({
            fullName: profiles.fullName,
            department: profiles.department,
            university: profiles.university,
            year: profiles.year,
          })
          .from(profiles)
          .where(eq(profiles.userId, ranking.student.id))
          .limit(1);

        // Get user email
        const [user] = await db
          .select({
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, ranking.student.id))
          .limit(1);

        return {
          ...ranking,
          student: {
            id: ranking.student.id,
            email: user?.email || "",
            profile: profile || {
              fullName: "Unknown",
              department: "Unknown",
              university: "Unknown",
              year: 0,
            },
          },
        };
      })
    );

    // Get total participants
    const [totalResult] = await db
      .select({ count: sql`COUNT(DISTINCT student_id)` })
      .from(studentExams)
      .where(eq(studentExams.examId, parsedExamId));

    return res.status(200).json({
      success: true,
      data: {
        rankings: enhancedRankings,
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

/**
 * Get performance summary by subject - NEW ENHANCEMENT
 */
export const getSubjectPerformance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subjectPerformance = await db
      .select({
        subject: questions.subject,
        totalQuestions: sql`COUNT(DISTINCT ${answers.questionId})`.as(
          "total_questions"
        ),
        correctAnswers:
          sql`SUM(CASE WHEN ${answers.isCorrect} = true THEN 1 ELSE 0 END)`.as(
            "correct_answers"
          ),
        totalExams: sql`COUNT(DISTINCT ${exams.id})`.as("total_exams"),
      })
      .from(answers)
      .innerJoin(questions, eq(answers.questionId, questions.id))
      .innerJoin(studentExams, eq(answers.studentExamId, studentExams.id))
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(eq(studentExams.studentId, userId))
      .groupBy(questions.subject)
      .orderBy(
        sql`SUM(CASE WHEN ${answers.isCorrect} = true THEN 1 ELSE 0 END) DESC`
      );

    const formattedPerformance = subjectPerformance.map((subject) => ({
      subject: subject.subject,
      totalQuestions: parseInt(subject.totalQuestions),
      correctAnswers: parseInt(subject.correctAnswers),
      accuracy: Math.round(
        (parseInt(subject.correctAnswers) / parseInt(subject.totalQuestions)) *
          100
      ),
      totalExams: parseInt(subject.totalExams),
    }));

    return res.status(200).json({
      success: true,
      data: {
        subjects: formattedPerformance,
        totalSubjects: formattedPerformance.length,
        overallAccuracy:
          formattedPerformance.length > 0
            ? Math.round(
                formattedPerformance.reduce((sum, s) => sum + s.accuracy, 0) /
                  formattedPerformance.length
              )
            : 0,
      },
    });
  } catch (error) {
    console.error("Get subject performance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subject performance",
    });
  }
};
