import api from "./api";

export const examService = {
  // Get all exams (for admin) - ADD THIS METHOD
  getAllExams: (page = 1, limit = 10) =>
    api.get(`/exams/all?page=${page}&limit=${limit}`),

  // Student: Get available exams
  getAvailableExams: () => api.get("/exams"),

  // Get exam by ID
  getExamById: (examId) => api.get(`/exams/${examId}`),

  // Start exam session
  startExam: (examId) => api.post("/exam-session/start", { examId }),

  // Get active exam session
  getActiveSession: () => api.get("/exam-session/active"),

  // Get session by ID
  getSession: (sessionId) => api.get(`/exam-session/${sessionId}`),

  // Resume exam session
  resumeSession: (sessionId) => api.get(`/exam-session/${sessionId}/resume`),

  // Save answer
  saveAnswer: (sessionId, questionId, answer, isAutosave = false) =>
    api.post(`/exam-session/${sessionId}/answers`, {
      questionId,
      answer,
      isAutosave,
    }),

  // Save multiple answers
  saveAnswersBatch: (sessionId, answers) =>
    api.post(`/exam-session/${sessionId}/answers/batch`, { answers }),

  // Get session status
  getSessionStatus: (sessionId) => api.get(`/exam-session/${sessionId}/status`),

  // Submit exam
  submitExam: (sessionId) =>
    api.post(`/exam-session/${sessionId}/submit`, { submittedAt: new Date() }),

  // Delete/abandon exam session
  deleteSession: (sessionId) => api.delete(`/exam-session/${sessionId}`),

  // Get exam results
  getResults: () => api.get("/results"),

  // Get specific exam result
  getExamResult: (examId) => api.get(`/results/${examId}`),

  // Get detailed results with answers
  getDetailedResult: (examId) => api.get(`/results/${examId}/detailed`),

  // Get performance by subject
  getSubjectPerformance: () => api.get("/results/performance/subjects"),

  // Admin: Create exam (if you need this)
  createExam: (examData) => api.post("/exams", examData),

  // Admin: Update exam
  updateExam: (examId, examData) => api.put(`/exams/${examId}`, examData),

  // Admin: Update exam status
  updateExamStatus: (examId, isActive) =>
    api.put(`/exams/${examId}/status`, { isActive }),
};
