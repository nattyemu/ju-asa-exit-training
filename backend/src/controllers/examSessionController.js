import { db } from "../db/connection.js";
import {
  studentExams,
  questions,
  answers,
  exams,
  users,
} from "../db/schema.js";
import { eq, and, asc, desc, or, isNull } from "drizzle-orm";
import {
  calculateRemainingTime,
  shouldAutoSubmit,
} from "../utils/examTimer.js";
import {
  startExamSessionSchema,
  saveAnswerSchema,
  saveMultipleAnswersSchema,
  formatZodError,
} from "../validations/examSessionSchemas.js";

/**
 * Start a new exam session
 */
export const startExamSession = async (req, res) => {
  try {
    const validationResult = startExamSessionSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { examId } = validationResult.data;
    const userId = req.user.userId;

    // Check if exam exists and is active
    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.isActive, true)));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or not active",
      });
    }

    // Check exam availability dates
    const now = new Date();
    const availableFrom = new Date(exam.availableFrom);
    const availableUntil = new Date(exam.availableUntil);

    if (now < availableFrom) {
      return res.status(400).json({
        success: false,
        message: "Exam is not available yet",
      });
    }

    if (now > availableUntil) {
      return res.status(400).json({
        success: false,
        message: "Exam availability period has ended",
      });
    }

    // Check if student already has a session for this exam
    const existingSessions = await db
      .select()
      .from(studentExams)
      .where(
        and(eq(studentExams.studentId, userId), eq(studentExams.examId, examId))
      );

    if (existingSessions.length > 0) {
      const activeSession = existingSessions.find(
        (session) => !session.submittedAt
      );
      const completedSession = existingSessions.find(
        (session) => session.submittedAt
      );

      if (activeSession) {
        // Has active session - return it
        const remainingTime = calculateRemainingTime(
          activeSession.startedAt,
          exam.duration,
          exam.availableUntil
        );

        // Get saved answers
        const savedAnswers = await db
          .select({
            questionId: answers.questionId,
            chosenAnswer: answers.chosenAnswer,
          })
          .from(answers)
          .where(eq(answers.studentExamId, activeSession.id));

        return res.status(200).json({
          success: true,
          message: "Resuming existing exam session",
          data: {
            session: {
              id: activeSession.id,
              startedAt: activeSession.startedAt,
              examId: activeSession.examId,
              submittedAt: activeSession.submittedAt,
            },
            exam: {
              id: exam.id,
              title: exam.title,
              description: exam.description,
              duration: exam.duration,
              totalQuestions: exam.totalQuestions,
              passingScore: exam.passingScore,
            },
            savedAnswers,
            remainingTime,
          },
        });
      } else if (completedSession) {
        // Already completed - cannot retake
        return res.status(400).json({
          success: false,
          message: "You have already completed this exam",
        });
      }
    }

    // Create new exam session
    const [newSession] = await db.insert(studentExams).values({
      studentId: userId,
      examId: examId,
      startedAt: new Date(),
      submittedAt: null,
      timeSpent: 0,
    });

    const sessionId = newSession.insertId;

    // Get exam questions (without correct answers)
    const examQuestions = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        subject: questions.subject,
        difficulty: questions.difficulty,
      })
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(asc(questions.id));

    const remainingTime = calculateRemainingTime(
      new Date(),
      exam.duration,
      exam.availableUntil
    );

    return res.status(201).json({
      success: true,
      message: "Exam session started successfully",
      data: {
        session: {
          id: sessionId,
          startedAt: new Date(),
          examId: examId,
          submittedAt: null,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions,
          passingScore: exam.passingScore,
        },
        questions: examQuestions,
        remainingTime,
      },
    });
  } catch (error) {
    console.error("Start exam session error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An active session already exists for this exam",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to start exam session",
    });
  }
};

/**
 * Get active exam session for student
 */
export const getActiveSession = async (req, res) => {
  try {
    const userId = req.user.userId;

    const activeSessions = await db
      .select()
      .from(studentExams)
      .where(
        and(
          eq(studentExams.studentId, userId),
          isNull(studentExams.submittedAt)
        )
      )
      .orderBy(desc(studentExams.startedAt))
      .limit(1);

    if (activeSessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active exam session found",
      });
    }

    const session = activeSessions[0];

    // Get exam details
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, session.examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Get saved answers
    const savedAnswers = await db
      .select({
        questionId: answers.questionId,
        chosenAnswer: answers.chosenAnswer,
      })
      .from(answers)
      .where(eq(answers.studentExamId, session.id));

    // Get exam questions
    const examQuestions = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        subject: questions.subject,
        difficulty: questions.difficulty,
      })
      .from(questions)
      .where(eq(questions.examId, session.examId))
      .orderBy(asc(questions.id));

    const remainingTime = calculateRemainingTime(
      session.startedAt,
      exam.duration,
      exam.availableUntil
    );

    const needsAutoSubmit = shouldAutoSubmit(session, exam);

    return res.status(200).json({
      success: true,
      data: {
        session: {
          id: session.id,
          startedAt: session.startedAt,
          examId: session.examId,
          submittedAt: session.submittedAt,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions,
          passingScore: exam.passingScore,
        },
        questions: examQuestions,
        savedAnswers,
        remainingTime,
        needsAutoSubmit,
      },
    });
  } catch (error) {
    console.error("Get active session error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve active session",
    });
  }
};
/**
 * Get session details
 */
export const getSessionDetails = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const [session] = await db
      .select()
      .from(studentExams)
      .where(
        and(eq(studentExams.id, sessionId), eq(studentExams.studentId, userId))
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found",
      });
    }

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, session.examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Get saved answers
    const savedAnswers = await db
      .select({
        questionId: answers.questionId,
        chosenAnswer: answers.chosenAnswer,
      })
      .from(answers)
      .where(eq(answers.studentExamId, session.id));

    const remainingTime = calculateRemainingTime(
      session.startedAt,
      exam.duration,
      exam.availableUntil
    );

    // Check if auto-submit is needed
    const needsAutoSubmit = shouldAutoSubmit(session, exam);

    return res.status(200).json({
      success: true,
      data: {
        session,
        exam,
        savedAnswers,
        remainingTime,
        needsAutoSubmit,
      },
    });
  } catch (error) {
    console.error("Get session details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve session details",
    });
  }
};

/**
 * Save or update an answer
 */
export const saveAnswer = async (req, res) => {
  try {
    const validationResult = saveAnswerSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const {
      questionId,
      chosenAnswer,
      isAutosave = false,
    } = validationResult.data;
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.user.userId;

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    // Verify session ownership
    const [session] = await db
      .select()
      .from(studentExams)
      .where(
        and(eq(studentExams.id, sessionId), eq(studentExams.studentId, userId))
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found",
      });
    }

    // Check if session is submitted
    if (session.submittedAt) {
      return res.status(400).json({
        success: false,
        message: "Exam already submitted",
      });
    }

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, session.examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if question belongs to this exam
    const [question] = await db
      .select()
      .from(questions)
      .where(and(eq(questions.id, questionId), eq(questions.examId, exam.id)));

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found in this exam",
      });
    }

    // Check if answer already exists
    const existingAnswer = await db
      .select()
      .from(answers)
      .where(
        and(
          eq(answers.studentExamId, sessionId),
          eq(answers.questionId, questionId)
        )
      );

    if (existingAnswer.length > 0) {
      // Update existing answer
      await db
        .update(answers)
        .set({
          chosenAnswer: chosenAnswer,
        })
        .where(
          and(
            eq(answers.studentExamId, sessionId),
            eq(answers.questionId, questionId)
          )
        );
    } else {
      // Insert new answer (isCorrect will be calculated on submission)
      await db.insert(answers).values({
        studentExamId: sessionId,
        questionId: questionId,
        chosenAnswer: chosenAnswer,
        isCorrect: null,
      });
    }

    // Update session's last activity
    await db
      .update(studentExams)
      .set({ updatedAt: new Date() })
      .where(eq(studentExams.id, sessionId));

    return res.status(200).json({
      success: true,
      message: isAutosave ? "Answer auto-saved" : "Answer saved successfully",
    });
  } catch (error) {
    console.error("Save answer error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Answer already exists for this question",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save answer",
    });
  }
};

/**
 * Save multiple answers at once
 */
export const saveMultipleAnswers = async (req, res) => {
  try {
    const validationResult = saveMultipleAnswersSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const { answers: answersData } = validationResult.data;
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.user.userId;

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    // Verify session ownership
    const [session] = await db
      .select()
      .from(studentExams)
      .where(
        and(eq(studentExams.id, sessionId), eq(studentExams.studentId, userId))
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found",
      });
    }

    // Check if session is submitted
    if (session.submittedAt) {
      return res.status(400).json({
        success: false,
        message: "Exam already submitted",
      });
    }

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, session.examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Get all question IDs for this exam
    const examQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.examId, exam.id));

    const validQuestionIds = new Set(examQuestions.map((q) => q.id));

    // Validate all questions belong to this exam
    for (const answerData of answersData) {
      if (!validQuestionIds.has(answerData.questionId)) {
        return res.status(400).json({
          success: false,
          message: `Question ID ${answerData.questionId} does not belong to this exam`,
        });
      }
    }

    // Use transaction for bulk operations
    await db.transaction(async (tx) => {
      for (const answerData of answersData) {
        const { questionId, chosenAnswer } = answerData;

        // Check if answer exists
        const [existingAnswer] = await tx
          .select()
          .from(answers)
          .where(
            and(
              eq(answers.studentExamId, sessionId),
              eq(answers.questionId, questionId)
            )
          );

        if (existingAnswer) {
          await tx
            .update(answers)
            .set({
              chosenAnswer: chosenAnswer,
            })
            .where(
              and(
                eq(answers.studentExamId, sessionId),
                eq(answers.questionId, questionId)
              )
            );
        } else {
          await tx.insert(answers).values({
            studentExamId: sessionId,
            questionId: questionId,
            chosenAnswer: chosenAnswer,
            isCorrect: null,
          });
        }
      }

      // Update session activity
      await tx
        .update(studentExams)
        .set({ updatedAt: new Date() })
        .where(eq(studentExams.id, sessionId));
    });

    return res.status(200).json({
      success: true,
      message: `${answersData.length} answers saved successfully`,
    });
  } catch (error) {
    console.error("Save multiple answers error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "One or more answers already exist",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save answers",
    });
  }
};

/**
 * Resume an exam session
 */
export const resumeSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const [session] = await db
      .select()
      .from(studentExams)
      .where(
        and(eq(studentExams.id, sessionId), eq(studentExams.studentId, userId))
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found",
      });
    }

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, session.examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if session is still valid
    const now = new Date();
    const availableUntil = new Date(exam.availableUntil);

    if (now > availableUntil) {
      return res.status(400).json({
        success: false,
        message: "Exam submission deadline has passed",
      });
    }

    // Get all questions for the exam (without correct answers)
    const examQuestions = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        subject: questions.subject,
        difficulty: questions.difficulty,
      })
      .from(questions)
      .where(eq(questions.examId, session.examId))
      .orderBy(asc(questions.id));

    // Get saved answers
    const savedAnswers = await db
      .select({
        questionId: answers.questionId,
        chosenAnswer: answers.chosenAnswer,
      })
      .from(answers)
      .where(eq(answers.studentExamId, session.id));

    const remainingTime = calculateRemainingTime(
      session.startedAt,
      exam.duration,
      exam.availableUntil
    );

    // Check if auto-submit is needed
    const needsAutoSubmit = shouldAutoSubmit(session, exam);

    if (needsAutoSubmit) {
      return res.status(400).json({
        success: false,
        message: "Exam time has expired",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam session resumed",
      data: {
        session: {
          id: session.id,
          startedAt: session.startedAt,
          examId: session.examId,
          submittedAt: session.submittedAt,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions,
          passingScore: exam.passingScore,
        },
        questions: examQuestions,
        savedAnswers,
        remainingTime,
        needsAutoSubmit,
      },
    });
  } catch (error) {
    console.error("Resume session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resume exam session",
    });
  }
};

/**
 * Check session status
 */
export const checkSessionStatus = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const [session] = await db
      .select()
      .from(studentExams)
      .where(
        and(eq(studentExams.id, sessionId), eq(studentExams.studentId, userId))
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found",
      });
    }

    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, session.examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const remainingTime = calculateRemainingTime(
      session.startedAt,
      exam.duration,
      exam.availableUntil
    );

    const needsAutoSubmit = shouldAutoSubmit(session, exam);

    // Get count of saved answers
    const savedAnswers = await db
      .select()
      .from(answers)
      .where(eq(answers.studentExamId, session.id));

    const answeredCount = savedAnswers.length;

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        examId: session.examId,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        remainingTime,
        needsAutoSubmit,
        answeredCount,
        totalQuestions: exam.totalQuestions,
        examDeadline: exam.availableUntil,
      },
    });
  } catch (error) {
    console.error("Check session status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check session status",
    });
  }
};

/**
 * Cancel/abort an exam session
 */
export const cancelSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    // Verify session ownership
    const [session] = await db
      .select()
      .from(studentExams)
      .where(
        and(eq(studentExams.id, sessionId), eq(studentExams.studentId, userId))
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found",
      });
    }

    // Check if session is already submitted
    if (session.submittedAt) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel already submitted exam",
      });
    }

    // Use transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Delete all answers for this session
      await tx.delete(answers).where(eq(answers.studentExamId, sessionId));

      // Delete the session
      await tx.delete(studentExams).where(eq(studentExams.id, sessionId));
    });

    return res.status(200).json({
      success: true,
      message: "Exam session cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel exam session",
    });
  }
};
