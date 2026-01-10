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
          totalQuestions: exams.totalQuestions, // From exams table - source of truth
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
    const totalQuestions = result.exam.totalQuestions; // CORRECT: Use from exams table
    const correctAnswers = result.result.correctAnswers; // From results table
    const score = result.result.score; // From results table
    const timeSpent = result.result.timeSpent; // From results table
    const examDuration = result.exam.duration;

    // Count answered questions from detailedAnswers
    const answeredQuestions = detailedAnswers.length;

    // Calculate correct count from detailedAnswers for verification
    const actualCorrectCount = detailedAnswers.filter(
      (answer) => answer.isCorrect
    ).length;

    // Verify consistency - This is for debugging/logging
    if (correctAnswers !== actualCorrectCount) {
      // console.warn(
      //   `Result consistency warning: Result table has ${correctAnswers} correct, but detailed count is ${actualCorrectCount}`
      // );
    }

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
        percentage:
          stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      })
    );

    // Calculate unanswered questions correctly
    const unansweredQuestions = totalQuestions - answeredQuestions;
    const incorrectAnswers = answeredQuestions - correctAnswers;

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
          answeredQuestions,
          correctAnswers,
          incorrectAnswers,
          unansweredQuestions,
          score: `${score}%`,
          timeSpent: `${timeSpent} minutes`,
          timePercentage:
            examDuration > 0
              ? `${Math.round((timeSpent / examDuration) * 100)}%`
              : "N/A",
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
    // console.error("Get student result error:", error);
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

    // Use the imported ranking service function - ADD AWAIT
    const rankings = await getTopRankings(parsedExamId, limit);

    // Check if rankings is an array
    if (!Array.isArray(rankings)) {
      // console.error("Rankings is not an array:", rankings);
      return res.status(200).json({
        success: true,
        data: {
          rankings: [],
          totalParticipants: 0,
        },
      });
    }

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
            profileImageUrl: profiles.profileImageUrl,
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
              profileImageUrl: null,
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
    // console.error("Get exam rankings error:", error);
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
    // console.error("Get result history error:", error);
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
    // console.error("Get subject performance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subject performance",
    });
  }
};
/**
 * Get detailed exam results with answers
 */

export const getDetailedResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.userId;
    const { showIncorrectOnly, bySubject } = req.query;

    const parsedExamId = parseInt(examId);
    if (isNaN(parsedExamId) || parsedExamId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID",
      });
    }

    // First check if exam exists
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, parsedExamId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if student has taken this exam
    const [studentExam] = await db
      .select({
        session: studentExams,
        result: results,
      })
      .from(studentExams)
      .leftJoin(results, eq(results.studentExamId, studentExams.id))
      .where(
        and(
          eq(studentExams.studentId, userId),
          eq(studentExams.examId, parsedExamId)
        )
      )
      .orderBy(desc(studentExams.startedAt))
      .limit(1);

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: "You haven't taken this exam",
        code: "NOT_TAKEN",
      });
    }

    // Get all questions for this exam
    const allQuestions = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        subject: questions.subject,
        difficulty: questions.difficulty,
      })
      .from(questions)
      .where(eq(questions.examId, parsedExamId))
      .orderBy(asc(questions.id));

    // Get student's answers if they exist
    const studentAnswers = studentExam.session?.id
      ? await db
          .select({
            questionId: answers.questionId,
            chosenAnswer: answers.chosenAnswer,
            isCorrect: answers.isCorrect,
          })
          .from(answers)
          .where(eq(answers.studentExamId, studentExam.session.id))
      : [];

    // Create a map of student answers for easy lookup
    const studentAnswerMap = new Map();
    studentAnswers.forEach((answer) => {
      studentAnswerMap.set(answer.questionId, answer);
    });

    // Combine questions with student answers
    const detailedAnswers = allQuestions.map((question) => {
      const studentAnswer = studentAnswerMap.get(question.id);
      return {
        questionId: question.id,
        question: {
          ...question,
          // Include correct answer for review
          correctAnswer: question.correctAnswer,
        },
        chosenAnswer: studentAnswer?.chosenAnswer || null,
        isCorrect: studentAnswer?.isCorrect || false,
        isAnswered: !!studentAnswer,
        isAutoSubmitted: !studentAnswer && studentExam.session?.submittedAt,
      };
    });

    // Calculate statistics
    const answeredQuestions = detailedAnswers.filter((a) => a.isAnswered);
    const correctAnswers = answeredQuestions.filter((a) => a.isCorrect);
    const incorrectAnswers = answeredQuestions.filter((a) => !a.isCorrect);
    const unansweredQuestions = detailedAnswers.filter((a) => !a.isAnswered);

    // Calculate score if result exists, otherwise calculate from answers
    let score = 0;
    let correctCount = correctAnswers.length;
    let totalQuestions = allQuestions.length;

    if (studentExam.result) {
      score = studentExam.result.score;
      correctCount = studentExam.result.correctAnswers;
    } else if (answeredQuestions.length > 0) {
      score = Math.round((correctAnswers.length / totalQuestions) * 100);
      correctCount = correctAnswers.length;
    }

    // Check if exam was auto-submitted
    const isAutoSubmitted =
      studentExam.session?.submittedAt &&
      (!studentAnswerMap.size || studentAnswerMap.size < totalQuestions);

    // Get exam stats for comparison
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

    // Calculate percentile if result exists
    let percentile = 0;
    if (studentExam.result) {
      const [betterThan] = await db
        .select({ count: sql`COUNT(*)` })
        .from(results)
        .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
        .where(
          and(
            eq(studentExams.examId, parsedExamId),
            sql`${results.score} < ${studentExam.result.score}`
          )
        );

      percentile =
        examStats.totalParticipants > 0
          ? Math.round((betterThan.count / examStats.totalParticipants) * 100)
          : 0;
    }

    // Group by subject for performance analysis
    const subjectPerformance = {};
    detailedAnswers.forEach((answer) => {
      const subject = answer.question.subject;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = {
          total: 0,
          correct: 0,
          answered: 0,
        };
      }
      subjectPerformance[subject].total++;
      if (answer.isAnswered) {
        subjectPerformance[subject].answered++;
        if (answer.isCorrect) {
          subjectPerformance[subject].correct++;
        }
      }
    });

    const subjectAnalysis = Object.entries(subjectPerformance).map(
      ([subject, stats]) => ({
        subject,
        totalQuestions: stats.total,
        answeredQuestions: stats.answered,
        correctAnswers: stats.correct,
        unansweredQuestions: stats.total - stats.answered,
        percentage:
          stats.answered > 0
            ? Math.round((stats.correct / stats.total) * 100)
            : 0,
      })
    );

    // Apply filters if provided
    let filteredAnswers = detailedAnswers;
    if (showIncorrectOnly === "true") {
      filteredAnswers = detailedAnswers.filter(
        (answer) => answer.isAnswered && !answer.isCorrect
      );
    }
    if (bySubject) {
      filteredAnswers = filteredAnswers.filter(
        (answer) => answer.question.subject === bySubject
      );
    }

    // Determine result status
    let performance = "UNKNOWN";
    if (studentExam.result) {
      performance =
        studentExam.result.score >= exam.passingScore ? "PASS" : "FAIL";
    } else if (score > 0) {
      performance = score >= exam.passingScore ? "PASS" : "FAIL";
    }

    return res.status(200).json({
      success: true,
      data: {
        result: {
          ...(studentExam.result || {}),
          score,
          correctAnswers: correctCount,
          totalQuestions,
          rank: studentExam.result?.rank || 0,
          percentile: `${percentile}%`,
          performance,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          totalQuestions: exam.totalQuestions,
          passingScore: exam.passingScore,
          duration: exam.duration,
          availableUntil: exam.availableUntil,
        },
        session: {
          startedAt: studentExam.session?.startedAt,
          submittedAt: studentExam.session?.submittedAt,
          timeSpent: studentExam.session?.timeSpent || 0,
          isAutoSubmitted,
          submissionType: isAutoSubmitted ? "auto" : "manual",
        },
        review: {
          totalQuestions,
          answeredQuestions: answeredQuestions.length,
          correctAnswers: correctAnswers.length,
          incorrectAnswers: incorrectAnswers.length,
          unansweredQuestions: unansweredQuestions.length,
          score: `${score}%`,
          timeSpent: `${studentExam.session?.timeSpent || 0} minutes`,
          timePercentage:
            studentExam.session?.timeSpent && exam.duration
              ? `${Math.round(
                  (studentExam.session.timeSpent / exam.duration) * 100
                )}%`
              : "N/A",
          submittedAt: studentExam.session?.submittedAt,
        },
        comparison: {
          examAverage: `${examStats.averageScore || 0}%`,
          totalParticipants: examStats.totalParticipants || 0,
          betterThan: `${percentile}% of participants`,
        },
        answers: filteredAnswers,
        subjectAnalysis,
        detailedResults: true, // Always true now since we always return questions
        hasAnswers: studentAnswers.length > 0,
        isComplete: studentAnswers.length === totalQuestions,
        submissionStatus: studentExam.session?.submittedAt
          ? isAutoSubmitted
            ? "auto_submitted"
            : "manually_submitted"
          : "in_progress",
        filters: {
          showIncorrectOnly: showIncorrectOnly === "true",
          bySubject: bySubject || null,
        },
      },
    });
  } catch (error) {
    // console.error("Get detailed result error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve exam results",
    });
  }
};
