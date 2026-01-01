import api from "./api";

export const exportService = {
  exportExamResults: (examId, format = "pdf") =>
    api.get(`/analytics/export/exam/${examId}/results`, {
      responseType: "blob",
      params: { format },
    }),

  exportQuestionAnalytics: (examId, format = "pdf") =>
    api.get(`/analytics/export/exam/${examId}/questions`, {
      responseType: "blob",
      params: { format },
    }),

  exportCompleteReport: (examId, format = "pdf") =>
    api.get(`/analytics/export/complete-report`, {
      responseType: "blob",
      params: { examId, format },
    }),

  downloadBlob: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
