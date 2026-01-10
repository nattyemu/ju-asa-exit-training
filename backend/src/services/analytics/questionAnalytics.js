import { db } from "../../db/connection.js";
import { questions, answers, studentExams, results } from "../../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

/**
 * Get question performance analysis for an exam
 */
export const getQuestionAnalysis = async (examId) => {
  try {
    // Get all questions for the exam
    const examQuestions = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        subject: questions.subject,
        difficulty: questions.difficulty,
        correctAnswer: questions.correctAnswer,
      })
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(sql`${questions.id}`);

    if (examQuestions.length === 0) {
      return {
        success: true,
        data: {
          questions: [],
          summary: {},
        },
      };
    }

    const questionIds = examQuestions.map((q) => q.id);

    // FIXED: Better query to get answer statistics
    const answerStats = await db
      .select({
        questionId: answers.questionId,
        totalAttempts: sql`COUNT(${answers.id})`.as("total_attempts"),
        correctAttempts:
          sql`SUM(CASE WHEN ${answers.isCorrect} = 1 THEN 1 ELSE 0 END)`.as(
            "correct_attempts"
          ),
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
      .from(answers)
      .innerJoin(studentExams, eq(answers.studentExamId, studentExams.id))
      .where(
        and(
          eq(studentExams.examId, examId),
          sql`${answers.questionId} IN ${questionIds}`
        )
      )
      .groupBy(answers.questionId);

    // Convert answer stats to a map for easy lookup
    const statsMap = {};
    answerStats.forEach((stat) => {
      statsMap[stat.questionId] = {
        totalAttempts: parseInt(stat.totalAttempts),
        correctAttempts: parseInt(stat.correctAttempts),
        optionACount: parseInt(stat.optionACount),
        optionBCount: parseInt(stat.optionBCount),
        optionCCount: parseInt(stat.optionCCount),
        optionDCount: parseInt(stat.optionDCount),
      };
    });

    // Combine question data with statistics
    const questionsWithStats = examQuestions.map((question) => {
      const stats = statsMap[question.id] || {};
      const totalAttempts = stats.totalAttempts || 0;
      const correctAttempts = stats.correctAttempts || 0;
      const accuracy =
        totalAttempts > 0
          ? Math.round((correctAttempts / totalAttempts) * 100)
          : 0;

      return {
        id: question.id,
        questionText:
          question.questionText.substring(0, 100) +
          (question.questionText.length > 100 ? "..." : ""),
        subject: question.subject,
        difficulty: question.difficulty,
        correctAnswer: question.correctAnswer,
        statistics: {
          totalAttempts,
          correctAttempts,
          incorrectAttempts: totalAttempts - correctAttempts,
          accuracy: `${accuracy}%`,
          optionDistribution: {
            A: stats.optionACount || 0,
            B: stats.optionBCount || 0,
            C: stats.optionCCount || 0,
            D: stats.optionDCount || 0,
          },
        },
      };
    });

    // Calculate overall statistics
    const totalQuestions = questionsWithStats.length;
    const attemptedQuestions = questionsWithStats.filter(
      (q) => q.statistics.totalAttempts > 0
    ).length;
    const averageAccuracy =
      attemptedQuestions > 0
        ? Math.round(
            questionsWithStats
              .filter((q) => q.statistics.totalAttempts > 0)
              .reduce((sum, q) => {
                const acc = parseInt(q.statistics.accuracy) || 0;
                return sum + acc;
              }, 0) / attemptedQuestions
          )
        : 0;

    // Find most difficult questions (lowest accuracy, with at least 1 attempt)
    const difficultQuestions = [...questionsWithStats]
      .filter((q) => q.statistics.totalAttempts > 0)
      .sort((a, b) => {
        const accA = parseInt(a.statistics.accuracy) || 0;
        const accB = parseInt(b.statistics.accuracy) || 0;
        return accA - accB;
      })
      .slice(0, 5);

    return {
      success: true,
      data: {
        questions: questionsWithStats,
        summary: {
          totalQuestions,
          attemptedQuestions,
          averageAccuracy: `${averageAccuracy}%`,
          mostDifficultQuestions: difficultQuestions.map((q) => ({
            id: q.id,
            accuracy: q.statistics.accuracy,
            subject: q.subject,
          })),
        },
      },
    };
  } catch (error) {
    // console.error("Question analysis error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get difficulty level analysis
 */
export const getDifficultyAnalysis = async (examId) => {
  try {
    // FIXED: Simplified query for MySQL compatibility
    const analysis = await db
      .select({
        difficulty: questions.difficulty,
        totalQuestions: sql`COUNT(DISTINCT ${questions.id})`.as(
          "total_questions"
        ),
        averageAccuracy: sql`
          ROUND(
            AVG(
              CASE 
                WHEN ${answers.isCorrect} = 1 THEN 100 
                WHEN ${answers.isCorrect} = 0 THEN 0 
                ELSE NULL 
              END
            ), 
            2
          )
        `.as("average_accuracy"),
      })
      .from(questions)
      .leftJoin(answers, eq(questions.id, answers.questionId))
      .leftJoin(studentExams, eq(answers.studentExamId, studentExams.id))
      .where(eq(questions.examId, examId))
      .groupBy(questions.difficulty);

    return {
      success: true,
      data: analysis.map((item) => ({
        difficulty: item.difficulty,
        totalQuestions: parseInt(item.totalQuestions),
        averageAccuracy: parseFloat(item.averageAccuracy) || 0,
      })),
    };
  } catch (error) {
    // console.error("Difficulty analysis error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
