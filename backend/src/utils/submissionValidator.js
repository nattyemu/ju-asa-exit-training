/**
 * Submission validation utilities
 */

/**
 * Validate if all questions are answered (optional feature)
 * @param {Array} studentAnswers - Student's answers
 * @param {Array} examQuestions - All exam questions
 * @returns {Object} Validation result
 */
export const validateAllQuestionsAnswered = (studentAnswers, examQuestions) => {
  try {
    const answeredQuestionIds = new Set(
      studentAnswers.map((answer) => answer.questionId)
    );
    const allQuestionIds = new Set(examQuestions.map((q) => q.id));

    const unansweredQuestions = [];
    for (const questionId of allQuestionIds) {
      if (!answeredQuestionIds.has(questionId)) {
        unansweredQuestions.push(questionId);
      }
    }

    return {
      isValid: unansweredQuestions.length === 0,
      unansweredCount: unansweredQuestions.length,
      unansweredQuestions,
      totalQuestions: allQuestionIds.size,
      answeredQuestions: answeredQuestionIds.size,
    };
  } catch (error) {
    console.error("Error validating questions:", error);
    return {
      isValid: false,
      unansweredCount: 0,
      unansweredQuestions: [],
      totalQuestions: 0,
      answeredQuestions: 0,
      error: "Validation failed",
    };
  }
};

/**
 * Validate exam submission conditions
 * @param {Object} session - Student exam session
 * @param {Object} exam - Exam details
 * @returns {Object} Validation result
 */
export const validateSubmissionConditions = (session, exam) => {
  try {
    const now = new Date();
    const startedAt = new Date(session.startedAt);
    const availableUntil = new Date(exam.availableUntil);

    // Check if already submitted
    if (session.submittedAt) {
      return {
        valid: false,
        message: "Exam already submitted",
      };
    }

    // Check if deadline passed
    if (now > availableUntil) {
      return {
        valid: false,
        message: "Exam submission deadline has passed",
      };
    }

    // Check if duration expired
    const durationEnd = new Date(startedAt.getTime() + exam.duration * 60000);
    if (now > durationEnd) {
      return {
        valid: false,
        message: "Exam time has expired",
      };
    }

    return {
      valid: true,
      message: "Valid for submission",
    };
  } catch (error) {
    console.error("Error validating submission conditions:", error);
    return {
      valid: false,
      message: "Error validating submission",
    };
  }
};
