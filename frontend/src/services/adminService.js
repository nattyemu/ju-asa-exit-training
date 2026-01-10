import api from "./api";

export const adminService = {
  // Exam Management
  getAllExams: (page = 1, limit = 10) =>
    api.get(`/exams/all?page=${page}&limit=${limit}`),

  createExam: (examData) => api.post("/exams", examData),

  updateExam: (examId, examData) => api.put(`/exams/${examId}`, examData),

  updateExamStatus: (examId, isActive) =>
    api.put(`/exams/${examId}/status`, { isActive }),

  // Question Management
  addQuestion: (questionData) => api.post("/questions", questionData),

  updateQuestion: (questionId, questionData) =>
    api.put(`/questions/${questionId}`, questionData),

  deleteQuestion: (questionId, examId) =>
    api.delete(`/questions/${questionId}`, { data: { examId } }),

  bulkImportQuestions: (importData) => api.post("/questions/bulk", importData),

  getQuestionStats: (examId) => api.get(`/questions/stats/${examId}`),

  getExamQuestions: (examId, page = 1, limit = 20) =>
    api.get(`/questions/exam/${examId}?page=${page}&limit=${limit}`),

  // User Management
  getAllUsers: (page = 1, limit = 10) =>
    api.get(`/user?page=${page}&limit=${limit}`),

  updateUserRole: (userId, roleData) => {
    return api.put(`/user/${userId}/role`, roleData);
  },

  deactivateUser: (userId) => api.put(`/user/${userId}`),

  // Student Registration
  registerStudent: (studentData) => api.post("/auth/register", studentData),

  // Analytics
  getAdminDashboard: () => api.get("/analytics/admin/dashboard"),

  getStudentProgress: (studentId = null) =>
    studentId
      ? api.get(`/analytics/admin/student-progress/${studentId}`)
      : api.get("/analytics/admin/student-progress"),

  getExamAnalytics: (examId) => api.get(`/analytics/exam/${examId}/stats`),

  getScoreDistribution: (examId) =>
    api.get(`/analytics/exam/${examId}/score-distribution`),
  updateUserProfile: (userId, profileData) =>
    api.put(`/user/${userId}/profile`, profileData),
  getQuestionAnalysis: (examId) =>
    api.get(`/analytics/exam/${examId}/question-analysis`),

  // REMOVED: getDepartmentPerformance
  getTimeAnalytics: (examId) =>
    api.get(`/analytics/exam/${examId}/time-analytics`),

  getDifficultyAnalysis: (examId) =>
    api.get(`/analytics/exam/${examId}/difficulty-analysis`),

  // Export - UPDATED
  // exportExamResults: (examId) =>
  //   api.get(`/analytics/export/exam/${examId}/results`, {
  //     responseType: "blob",
  //   }),

  // exportQuestionAnalytics: (examId) =>
  //   api.get(`/analytics/export/exam/${examId}/questions`, {
  //     responseType: "blob",
  //   }),

  // REMOVED: exportDepartmentPerformance

  // exportCompleteReport: (examId, startDate, endDate) => {
  //   const params = new URLSearchParams();
  //   params.append("examId", examId);
  //   params.append("startDate", startDate);
  //   params.append("endDate", endDate);

  //   return api.get(`/analytics/export/complete-report?${params.toString()}`, {
  //     responseType: "blob",
  //   });
  // },
  // Notifications
  sendExamReminders: (examId) => {
    // console.log("📧 AdminService: Sending reminders for examId:", examId);

    if (
      examId === null ||
      examId === undefined ||
      examId === "" ||
      examId === "all"
    ) {
      // console.log("📧 Using /all endpoint");
      return api.post(`/notifications/reminders/exam/all`);
    }

    // console.log("📧 Using specific exam endpoint for ID:", examId);
    return api.post(`/notifications/reminders/exam/${examId}`);
  },

  // Notifications - Unstarted Exam Reminders
  sendUnstartedExamReminders: (examId) => {
    // console.log(
    //   "📝 AdminService: Sending unstarted exam reminders for examId:",
    //   examId
    // );

    if (!examId) {
      throw new Error("Exam ID is required for unstarted exam reminders");
    }

    return api.post(`/notifications/reminders/unstarted/${examId}`);
  },
  // Get unstarted exam statistics
  getUnstartedExamStats: () => {
    // console.log("📊 Getting unstarted exam statistics");
    return api.get("/notifications/unstarted-stats");
  },
  sendSystemAnnouncement: (announcement) => {
    // console.log("📢 Sending system announcement:", announcement.title);
    return api.post("/notifications/announcement", announcement);
  },

  // Student Analytics
  getMyProgress: () => api.get("/progress/my-progress"),

  getStudyTimeAnalytics: () => api.get("/progress/my-study-time"),

  getMyAchievements: () => api.get("/progress/my-achievements"),

  getSubjectPerformance: () => api.get("/results/performance/subjects"),

  getLeaderboard: () => api.get("/progress/leaderboard"),

  getTopAchievers: () => api.get("/progress/top-achievers"),
};
