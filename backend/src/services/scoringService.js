import { db } from "../db/connection.js";
import { answers, questions, studentExams, exams } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Calculate score for a student exam
 * @param {number} studentExamId - Student exam session ID
 * @returns {Object} Score result
 */
export const calculateScore = async (studentExamId) => {
  try {
    // First, get the exam's total questions
    const [examData] = await db
      .select({
        totalQuestions: exams.totalQuestions,
      })
      .from(studentExams)
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(eq(studentExams.id, studentExamId));

    if (!examData) {
      throw new Error("Exam session not found");
    }

    const examTotalQuestions = examData.totalQuestions;

    // Get all answers for this exam session
    const studentAnswers = await db
      .select({
        questionId: answers.questionId,
        chosenAnswer: answers.chosenAnswer,
      })
      .from(answers)
      .where(eq(answers.studentExamId, studentExamId));

    if (studentAnswers.length === 0) {
      return {
        totalQuestions: examTotalQuestions, // Use exam's total questions, not 0
        correctAnswers: 0,
        score: 0,
        answers: [],
      };
    }

    // Get question IDs
    const questionIds = studentAnswers.map((a) => a.questionId);

    // Get correct answers for these questions
    const questionData = await db
      .select({
        id: questions.id,
        correctAnswer: questions.correctAnswer,
      })
      .from(questions)
      .where(inArray(questions.id, questionIds));

    // Create map for quick lookup
    const correctAnswerMap = {};
    questionData.forEach((q) => {
      correctAnswerMap[q.id] = q.correctAnswer;
    });

    // Calculate score
    let correctCount = 0;
    const detailedResults = [];

    studentAnswers.forEach((answer) => {
      const correctAnswer = correctAnswerMap[answer.questionId];
      const isCorrect = correctAnswer === answer.chosenAnswer;

      if (isCorrect) {
        correctCount++;
      }

      detailedResults.push({
        questionId: answer.questionId,
        chosenAnswer: answer.chosenAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
      });
    });

    // Use exam's total questions, NOT studentAnswers.length
    const totalQuestions = examTotalQuestions;
    const score =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return {
      totalQuestions, // This now matches exams.totalQuestions
      correctAnswers: correctCount,
      score: parseFloat(score.toFixed(2)),
      answers: detailedResults,
    };
  } catch (error) {
    console.error("Error calculating score:", error);
    throw new Error("Failed to calculate exam score");
  }
};

/**
 * Update answers with is_correct values
 * @param {number} studentExamId - Student exam session ID
 * @param {Array} detailedResults - Results from calculateScore
 */
export const updateAnswerCorrectness = async (
  studentExamId,
  detailedResults
) => {
  try {
    for (const result of detailedResults) {
      await db
        .update(answers)
        .set({
          isCorrect: result.isCorrect,
        })
        .where(
          and(
            eq(answers.studentExamId, studentExamId),
            eq(answers.questionId, result.questionId)
          )
        );
    }
  } catch (error) {
    console.error("Error updating answer correctness:", error);
    throw new Error("Failed to update answer correctness");
  }
};
