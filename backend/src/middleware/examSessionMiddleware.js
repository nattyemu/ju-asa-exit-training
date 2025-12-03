import { db } from "../db/connection.js";
import { studentExams, exams, questions, answers } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import {
  calculateRemainingTime,
  shouldAutoSubmit,
} from "../utils/examTimer.js";

/**
 * Middleware to validate student owns the exam session
 */
export const validateSessionOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sessionId = parseInt(id, 10);
    const userId = req.user.userId;

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID. Please provide a valid session ID.",
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
        message: "Exam session not found or access denied.",
      });
    }

    req.session = session;
    next();
  } catch (error) {
    console.error("Session validation error:", error);

    return res.status(500).json({
      success: false,
      message: "Error validating exam session. Please try again later.",
    });
  }
};

/**
 * Middleware to validate sessionId param for routes using sessionId
 */
export const validateSessionIdParam = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const parsedSessionId = parseInt(sessionId, 10);
    const userId = req.user.userId;

    if (isNaN(parsedSessionId) || parsedSessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID. Please provide a valid session ID.",
      });
    }

    const [session] = await db
      .select()
      .from(studentExams)
      .where(
        and(
          eq(studentExams.id, parsedSessionId),
          eq(studentExams.studentId, userId)
        )
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Exam session not found or access denied.",
      });
    }

    req.session = session;
    next();
  } catch (error) {
    console.error("Session ID param validation error:", error);

    return res.status(500).json({
      success: false,
      message: "Error validating session ID. Please try again later.",
    });
  }
};

/**
 * Middleware to validate exam session is active (not submitted)
 */
export const validateActiveSession = async (req, res, next) => {
  try {
    const session = req.session;

    if (session.submittedAt) {
      return res.status(400).json({
        success: false,
        message: "Exam already submitted. Cannot modify submitted exam.",
      });
    }

    // Check if exam is still available
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, session.examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found. The exam may have been removed.",
      });
    }

    const now = new Date();
    const availableUntil = new Date(exam.availableUntil);

    if (now > availableUntil) {
      return res.status(400).json({
        success: false,
        message: "Exam submission deadline has passed.",
      });
    }

    req.exam = exam;
    next();
  } catch (error) {
    console.error("Active session validation error:", error);

    return res.status(500).json({
      success: false,
      message: "Error validating session status. Please try again later.",
    });
  }
};

/**
 * Middleware to check if student can start a new exam
 */
export const validateExamStart = async (req, res, next) => {
  try {
    const { examId } = req.body;
    const userId = req.user.userId;

    // Check if exam exists and is active
    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.isActive, true)));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or not active.",
      });
    }

    // Check exam availability dates
    const now = new Date();
    const availableFrom = new Date(exam.availableFrom);
    const availableUntil = new Date(exam.availableUntil);

    if (now < availableFrom) {
      return res.status(400).json({
        success: false,
        message: "Exam is not available yet.",
      });
    }

    if (now > availableUntil) {
      return res.status(400).json({
        success: false,
        message: "Exam availability period has ended.",
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
        // Has active session - attach it to request
        req.existingActiveSession = activeSession;
      } else if (completedSession) {
        // Already completed - cannot retake
        return res.status(400).json({
          success: false,
          message: "You have already completed this exam.",
        });
      }
    }

    req.exam = exam;
    next();
  } catch (error) {
    console.error("Exam start validation error:", error);

    return res.status(500).json({
      success: false,
      message: "Error validating exam start. Please try again later.",
    });
  }
};
