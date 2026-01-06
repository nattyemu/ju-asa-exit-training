import api from "./api";

export const examService = {
  // Get all exams (for admin)
  getAllExams: (page = 1, limit = 10) =>
    api.get(`/exams/all?page=${page}&limit=${limit}`),

  // Student: Get available exams
  getAvailableExams: () => api.get("/exams"),

  // Get exam by ID
  getExamById: (examId) => api.get(`/exams/${examId}`),

  // Get exam result for a student
  getResult: (examId) => api.get(`/results/exam/${examId}`),
  // Get detailed results with answers
  getDetailedResult: async (examId) => {
    try {
      // Try to get detailed results
      return await api.get(`/results/${examId}/detailed`);
    } catch (error) {
      // If detailed endpoint not found (404), try basic endpoint
      if (error.response?.status === 404) {
        console.log("Detailed results not found, trying basic endpoint");

        // Try basic result endpoint
        try {
          const basicResult = await api.get(`/results/exam/${examId}`);

          // If we get basic results, format them to match expected structure
          if (basicResult.data.success) {
            const resultData = basicResult.data.data;

            // Create a simplified detailed result structure
            const formattedResult = {
              success: true,
              data: {
                result: resultData.result || {},
                exam: resultData.exam || {},
                session: resultData.session || {},
                review: resultData.review || {
                  totalQuestions: 0,
                  answeredQuestions: 0,
                  correctAnswers: 0,
                  incorrectAnswers: 0,
                  unansweredQuestions: 0,
                  score: "0%",
                  timeSpent: "N/A",
                  timePercentage: "N/A",
                },
                comparison: resultData.comparison || {
                  examAverage: "N/A",
                  totalParticipants: 0,
                  betterThan: "N/A",
                },
                // Return empty answers array since we don't have detailed answers
                answers: [],
                subjectAnalysis: resultData.subjectAnalysis || [],
                detailedResults: false, // Flag to indicate no detailed answers available
                filters: {
                  showIncorrectOnly: false,
                  bySubject: null,
                },
              },
            };

            return formattedResult;
          }
        } catch (basicError) {
          // If basic endpoint also fails, re-throw original error
          throw error;
        }
      }

      // For other errors, throw original error
      throw error;
    }
  },
  // Get rankings for an exam
  getRankings: (examId, limit = 10) =>
    api.get(`/results/rankings/${examId}?limit=${limit}`),
  // Start exam session
  startExam: (examId) => api.post("/exam-session/start", { examId }),

  // Get active exam session
  getActiveSession: () => api.get("/exam-session/active"),

  // Get session by ID
  getSession: (sessionId) => api.get(`/exam-session/${sessionId}`),

  // Resume exam session
  resumeSession: (sessionId) => api.get(`/exam-session/${sessionId}/resume`),

  // Save answer - FIXED: changed "answer" to "chosenAnswer"
  saveAnswer: (sessionId, questionId, chosenAnswer, isAutosave = false) =>
    api.post(`/exam-session/${sessionId}/answers`, {
      questionId,
      chosenAnswer, // ← Changed from "answer" to "chosenAnswer"
      isAutosave,
    }),

  // Save multiple answers
  saveAnswersBatch: (sessionId, answers) =>
    api.post(`/exam-session/${sessionId}/answers/batch`, { answers }),

  // Get session status
  getSessionStatus: (sessionId) => api.get(`/exam-session/${sessionId}/status`),

  // Submit exam
  submitExam: (sessionId, isAutoSubmit = false) =>
    api.post(`/submission/exam-session/${sessionId}/submit`, {
      submittedAt: new Date(),
      isAutoSubmit,
    }),

  // Delete/abandon exam session
  deleteSession: (sessionId) => api.delete(`/exam-session/${sessionId}`),

  // Get all results for student
  getResults: () => api.get("/results"),

  // Get specific exam result
  getExamResult: async (examId) => {
    try {
      // First try detailed endpoint
      return await api.get(`/results/${examId}/detailed`);
    } catch (error) {
      // If detailed endpoint not found (404), try basic endpoint
      if (error.response?.status === 404) {
        return await api.get(`/results/exam/${examId}`);
      }
      throw error;
    }
  },

  // Get detailed results with answers
  getDetailedResult: (examId) => api.get(`/results/${examId}/detailed`),

  // Get performance by subject
  getSubjectPerformance: () => api.get("/results/performance/subjects"),

  // Get result history
  getResultHistory: () => api.get("/results/history"),

  // Get progress analytics
  getProgressAnalytics: () => api.get("/progress/my-progress"),

  // Get study time analytics
  getStudyTimeAnalytics: () => api.get("/progress/my-study-time"),

  // Get achievements
  getMyAchievements: () => api.get("/progress/my-achievements"),

  // Get leaderboard
  getLeaderboard: () => api.get("/progress/leaderboard"),

  // Admin: Create exam
  createExam: (examData) => api.post("/exams", examData),

  // Admin: Update exam
  updateExam: (examId, examData) => api.put(`/exams/${examId}`, examData),

  // Admin: Update exam status
  updateExamStatus: (examId, isActive) =>
    api.put(`/exams/${examId}/status`, { isActive }),
};
