import { db } from "../db/connection.js";
import { questions, exams } from "../db/schema.js";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";
import {
  createQuestionSchema,
  updateQuestionSchema,
  bulkQuestionsSchema,
  formatZodError,
} from "../validations/questionSchemas.js";

/**
 * Get total questions count for an exam
 */
const getQuestionCountForExam = async (examId) => {
  const [result] = await db
    .select({ count: count() })
    .from(questions)
    .where(eq(questions.examId, examId));

  return result.count || 0;
};

/**
 * Check if adding questions would exceed exam's totalQuestions limit
 */
const checkQuestionLimit = async (examId, questionsToAdd = 1) => {
  const [exam] = await db
    .select({ totalQuestions: exams.totalQuestions })
    .from(exams)
    .where(eq(exams.id, examId));

  if (!exam) {
    throw new Error("Exam not found");
  }

  const currentCount = await getQuestionCountForExam(examId);
  const newTotal = currentCount + questionsToAdd;

  if (newTotal > exam.totalQuestions) {
    throw new Error(
      `Cannot add ${questionsToAdd} question(s). ` +
        `Exam has ${currentCount}/${exam.totalQuestions} questions. ` +
        `Maximum allowed: ${exam.totalQuestions}`
    );
  }

  return { currentCount, maxAllowed: exam.totalQuestions };
};

/**
 * Add single question to exam
 */
export const addQuestion = async (req, res) => {
  try {
    const validationResult = createQuestionSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    const { examId, ...questionData } = validationResult.data;

    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found",
      });
    }

    try {
      await checkQuestionLimit(examId, 1);
    } catch (limitError) {
      return res.status(400).json({
        success: false,
        error: limitError.message,
      });
    }

    const [newQuestion] = await db.insert(questions).values({
      examId,
      ...questionData,
    });

    const questionCount = await getQuestionCountForExam(examId);

    return res.status(201).json({
      success: true,
      message: "Question added successfully",
      data: {
        question: {
          id: newQuestion.insertId || newQuestion.id,
          examId,
          ...questionData,
        },
        examStats: {
          examId,
          currentQuestions: questionCount,
          maxQuestions: exam.totalQuestions,
          remainingSlots: exam.totalQuestions - questionCount,
        },
      },
    });
  } catch (error) {
    console.error("Add question error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        error: "A similar question already exists in this exam",
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        success: false,
        error: "One or more fields exceed maximum length",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({
        success: false,
        error: "Exam not found",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to add question",
    });
  }
};

/**
 * Get all questions for an exam (Admin sees answers, Student doesn't)
 */
export const getExamQuestions = async (req, res) => {
  try {
    const examId = parseInt(req.params.examId);
    const userRole = req.user.role;

    if (isNaN(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid exam ID",
      });
    }

    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const baseSelectFields = {
      id: questions.id,
      examId: questions.examId,
      questionText: questions.questionText,
      optionA: questions.optionA,
      optionB: questions.optionB,
      optionC: questions.optionC,
      optionD: questions.optionD,
      subject: questions.subject,
      difficulty: questions.difficulty,
      explanation: questions.explanation,
    };

    const selectFields =
      userRole === "ADMIN"
        ? { ...baseSelectFields, correctAnswer: questions.correctAnswer }
        : baseSelectFields;

    const questionsList = await db
      .select(selectFields)
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(asc(questions.id))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(questions)
      .where(eq(questions.examId, examId));

    const totalCount = totalResult.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          totalQuestions: exam.totalQuestions,
        },
        questions: questionsList,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        stats: {
          currentQuestions: totalCount,
          maxQuestions: exam.totalQuestions,
          remainingSlots: exam.totalQuestions - totalCount,
        },
        canViewAnswers: userRole === "ADMIN",
      },
    });
  } catch (error) {
    console.error("Get exam questions error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch questions",
    });
  }
};
/**
 * Update question
 */
export const updateQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);

    if (isNaN(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid question ID",
      });
    }

    const validationResult = updateQuestionSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    const { examId, ...updateData } = validationResult.data;

    const [existingQuestion] = await db
      .select()
      .from(questions)
      .where(and(eq(questions.id, questionId), eq(questions.examId, examId)));

    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        error: "Question not found or does not belong to this exam",
      });
    }

    await db
      .update(questions)
      .set(updateData)
      .where(and(eq(questions.id, questionId), eq(questions.examId, examId)));

    const [updatedQuestion] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId));

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    });
  } catch (error) {
    console.error("Update question error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        error: "Question update conflicts with existing data",
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        success: false,
        error: "One or more fields exceed maximum length",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to update question",
    });
  }
};

/**
 * Delete question
 */
export const deleteQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);

    if (isNaN(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid question ID",
      });
    }

    const deleteSchema = {
      examId: {
        required_error: "Exam ID is required",
        invalid_type_error: "Exam ID must be a number",
        type: "number",
      },
    };

    const { examId } = req.body;

    if (!examId || isNaN(parseInt(examId)) || parseInt(examId) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid exam ID is required in request body",
      });
    }

    const parsedExamId = parseInt(examId);

    const [existingQuestion] = await db
      .select()
      .from(questions)
      .where(
        and(eq(questions.id, questionId), eq(questions.examId, parsedExamId))
      );

    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        error: "Question not found or does not belong to this exam",
      });
    }

    // Check if exam has attempts (prevent deletion from exams with attempts)
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, parsedExamId));

    if (exam.isActive) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete questions from active exams. Deactivate exam first.",
      });
    }

    // Delete question
    await db
      .delete(questions)
      .where(
        and(eq(questions.id, questionId), eq(questions.examId, parsedExamId))
      );

    // Get updated question count
    const questionCount = await getQuestionCountForExam(parsedExamId);

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: {
        examStats: {
          examId: parsedExamId,
          currentQuestions: questionCount,
          maxQuestions: exam.totalQuestions,
          remainingSlots: exam.totalQuestions - questionCount,
        },
      },
    });
  } catch (error) {
    console.error("Delete question error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete question",
    });
  }
};

/**
 * Bulk import questions
 */
export const bulkImportQuestions = async (req, res) => {
  try {
    const validationResult = bulkQuestionsSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    const { examId, questions: questionsData } = validationResult.data;

    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found",
      });
    }

    try {
      await checkQuestionLimit(examId, questionsData.length);
    } catch (limitError) {
      return res.status(400).json({
        success: false,
        error: limitError.message,
      });
    }

    const questionsToInsert = questionsData.map((q) => ({
      examId,
      ...q,
    }));

    let insertedCount = 0;

    await db.transaction(async (tx) => {
      for (const question of questionsToInsert) {
        await tx.insert(questions).values(question);
        insertedCount++;
      }
    });

    const questionCount = await getQuestionCountForExam(examId);

    return res.status(201).json({
      success: true,
      message: `${insertedCount} questions imported successfully`,
      data: {
        importedCount: insertedCount,
        totalRequested: questionsData.length,
        examStats: {
          examId,
          currentQuestions: questionCount,
          maxQuestions: exam.totalQuestions,
          remainingSlots: exam.totalQuestions - questionCount,
        },
      },
    });
  } catch (error) {
    console.error("Bulk import questions error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        error: "Some questions already exist in this exam",
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        success: false,
        error: "Some fields exceed maximum length",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to import questions",
    });
  }
};

/**
 * Get question statistics for exam
 */
export const getQuestionStats = async (req, res) => {
  try {
    const examId = parseInt(req.params.examId);

    if (isNaN(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid exam ID",
      });
    }
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: "Exam not found",
      });
    }

    const difficultyStats = await db
      .select({
        difficulty: questions.difficulty,
        count: sql`COUNT(*)`.as("count"),
      })
      .from(questions)
      .where(eq(questions.examId, examId))
      .groupBy(questions.difficulty);

    const subjectStats = await db
      .select({
        subject: questions.subject,
        count: sql`COUNT(*)`.as("count"),
      })
      .from(questions)
      .where(eq(questions.examId, examId))
      .groupBy(questions.subject);

    const [totalResult] = await db
      .select({ count: count() })
      .from(questions)
      .where(eq(questions.examId, examId));

    const totalCount = totalResult.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          totalQuestions: exam.totalQuestions,
        },
        stats: {
          totalQuestions: totalCount,
          maxAllowed: exam.totalQuestions,
          remainingSlots: exam.totalQuestions - totalCount,
          byDifficulty: difficultyStats,
          bySubject: subjectStats,
        },
      },
    });
  } catch (error) {
    console.error("Get question stats error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch question statistics",
    });
  }
};
