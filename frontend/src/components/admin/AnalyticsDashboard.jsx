import React from "react";
import { useState, useEffect } from "react";
import { Download, Calendar, Eye, EyeOff, BookOpen } from "lucide-react";
import { adminService } from "../../services/adminService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useLocation } from "react-router-dom";
import ScoreDistributionChart from "./analytics/ScoreDistributionChart";
import DifficultyChart from "./analytics/DifficultyChart";
import SubjectPerformanceChart from "./analytics/SubjectPerformanceChart";
import ExportModal from "./analytics/ExportModal";
import InfoModal from "./analytics/InfoModal";
import StatsCards from "./analytics/StatsCards";
import SubjectTable from "./analytics/SubjectTable";
import AdvancedAnalytics from "./analytics/AdvancedAnalytics";
// Import new components

export const AnalyticsDashboard = () => {
  const location = useLocation();
  const [selectedExam, setSelectedExam] = useState(() => {
    // Get examId from navigation state
    return location.state?.examId || null;
  });
  const [timeRange, setTimeRange] = useState("week");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);

  // Analytics data states
  const [analyticsData, setAnalyticsData] = useState({
    examStats: null,
    scoreDistribution: [],
    questionAnalysis: null,
    difficultyData: [],
    timeAnalytics: null,
    subjectPerformance: [],
  });

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalMessage, setInfoModalMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  // Fetch available exams
  const loadExams = async () => {
    try {
      const response = await adminService.getAllExams(1, 100);
      if (response.data.success) {
        setExams(response.data.data.exams || []);
      }
    } catch (error) {
      console.error("Failed to load exams:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load analytics data for selected exam
  const loadAnalyticsData = async (examId) => {
    if (!examId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const promises = [
        adminService.getExamAnalytics(examId),
        adminService.getScoreDistribution(examId),
        adminService.getQuestionAnalysis(examId),
        adminService.getDifficultyAnalysis(examId),
        adminService.getTimeAnalytics(examId),
      ];

      const [
        examStatsRes,
        scoreDistributionRes,
        questionAnalysisRes,
        difficultyRes,
        timeAnalyticsRes,
      ] = await Promise.all(
        promises.map((p) => p.catch((err) => ({ data: { success: false } })))
      );

      // Process and set all analytics data
      setAnalyticsData({
        examStats: examStatsRes.data.success ? examStatsRes.data.data : null,
        scoreDistribution: scoreDistributionRes.data.success
          ? processScoreDistribution(scoreDistributionRes.data.data)
          : [],
        questionAnalysis: questionAnalysisRes.data.success
          ? questionAnalysisRes.data.data
          : null,
        difficultyData: difficultyRes.data.success
          ? processDifficultyData(difficultyRes.data.data)
          : [],
        timeAnalytics: timeAnalyticsRes.data.success
          ? timeAnalyticsRes.data.data
          : null,
        subjectPerformance: questionAnalysisRes.data.success
          ? processSubjectPerformance(questionAnalysisRes.data.data)
          : [],
      });
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for data processing
  const processScoreDistribution = (scoreData) => {
    if (Array.isArray(scoreData)) return scoreData;
    if (scoreData?.scoreRanges) return scoreData.scoreRanges;
    if (scoreData?.distribution) return scoreData.distribution;
    return [];
  };

  const processDifficultyData = (difficultyResult) => {
    if (Array.isArray(difficultyResult)) return difficultyResult;
    if (difficultyResult?.difficulties) return difficultyResult.difficulties;
    return [];
  };

  const processSubjectPerformance = (questionData) => {
    if (!questionData?.questions || !Array.isArray(questionData.questions)) {
      return [];
    }

    const subjectsMap = {};
    questionData.questions.forEach((q) => {
      const subject = q.subject || "Unknown";
      if (!subjectsMap[subject]) {
        subjectsMap[subject] = {
          subject: subject,
          totalScore: 0,
          count: 0,
          difficulties: {},
        };
      }

      let accuracy = 0;
      if (q.statistics?.accuracy !== undefined) {
        accuracy = parseInt(q.statistics.accuracy) || 0;
      } else if (
        q.statistics?.correctAnswers !== undefined &&
        q.statistics?.totalAttempts > 0
      ) {
        accuracy = Math.round(
          (q.statistics.correctAnswers / q.statistics.totalAttempts) * 100
        );
      }

      subjectsMap[subject].totalScore += accuracy;
      subjectsMap[subject].count++;

      const difficulty = q.difficulty || "UNKNOWN";
      subjectsMap[subject].difficulties[difficulty] =
        (subjectsMap[subject].difficulties[difficulty] || 0) + 1;
    });

    return Object.values(subjectsMap)
      .map((subject) => {
        const difficulties = subject.difficulties;
        let mostCommonDifficulty = "UNKNOWN";
        let maxCount = 0;
        Object.entries(difficulties).forEach(([diff, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommonDifficulty = diff;
          }
        });

        return {
          subject: subject.subject,
          avgScore:
            subject.count > 0
              ? Math.round(subject.totalScore / subject.count)
              : 0,
          participants: subject.count,
          difficulty: mostCommonDifficulty,
        };
      })
      .filter((subject) => subject.participants > 0)
      .sort((a, b) => b.avgScore - a.avgScore);
  };

  // Export handler
  const handleExport = async (type, params = {}) => {
    try {
      if (!selectedExam) {
        setInfoModalTitle("Export Failed");
        setInfoModalMessage("Please select an exam first.");
        setShowInfoModal(true);
        return;
      }

      setExporting(true);
      const selectedExamTitle =
        exams.find((e) => e.id === selectedExam)?.title || "Exam";
      let response;
      let exportMessage = "";

      switch (type) {
        case "results":
          response = await adminService.exportExamResults(selectedExam);
          exportMessage = `${selectedExamTitle} results have been exported successfully.`;
          break;
        case "questions":
          response = await adminService.exportQuestionAnalytics(selectedExam);
          exportMessage = `${selectedExamTitle} question analytics have been exported successfully.`;
          break;
        case "complete":
          if (!params.startDate || !params.endDate) {
            throw new Error("Please provide both start and end dates");
          }
          response = await adminService.exportCompleteReport(
            selectedExam,
            params.startDate,
            params.endDate
          );
          exportMessage = `Complete report for ${selectedExamTitle} (${params.startDate} to ${params.endDate}) has been exported.`;
          break;
        default:
          response = await adminService.exportExamResults(selectedExam);
          exportMessage = `${selectedExamTitle} results have been exported successfully.`;
      }

      if (!response?.data) throw new Error("No response data");

      // Create download link
      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Set filename
      const contentDisposition = response.headers?.["content-disposition"];
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch?.[1] || `export-${Date.now()}.csv`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setInfoModalTitle("Export Successful");
      setInfoModalMessage(exportMessage);
      setShowExportModal(false);
      setShowInfoModal(true);
    } catch (error) {
      console.error("Export failed:", error);
      setInfoModalTitle("Export Failed");
      setInfoModalMessage(error.message || "Export failed. Please try again.");
      setShowInfoModal(true);
    } finally {
      setExporting(false);
    }
  };

  const handleExportClick = () => {
    if (!selectedExam) {
      setInfoModalTitle("Select Exam");
      setInfoModalMessage("Please select an exam first.");
      setShowInfoModal(true);
      return;
    }
    setShowExportModal(true);
  };

  const handleExamChange = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadAnalyticsData(selectedExam);
    }
  }, [selectedExam]);

  // Get selected exam details
  const selectedExamDetails = exams.find((e) => e.id === selectedExam);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Analytics Dashboard
          </h2>
          <p className="text-sm text-text-secondary">
            Performance insights and statistics
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-secondary" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            {showAdvanced ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {showAdvanced ? "Basic View" : "Advanced View"}
          </button>

          <button
            onClick={handleExportClick}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedExam || loading}
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Exam Selection */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-primary mb-1">
              Select Exam for Analysis
            </label>
            <select
              value={selectedExam || ""}
              onChange={handleExamChange}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              disabled={loading}
            >
              <option value="">Select an exam...</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} {exam.isActive ? "✓" : ""}
                </option>
              ))}
            </select>
          </div>
          {/* {selectedExam && selectedExamDetails && (
            <div className="text-sm text-text-secondary">
              <span className="font-medium">Selected: </span>
              {selectedExamDetails.title}
            </div>
          )} */}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">Loading analytics data...</p>
        </div>
      ) : !selectedExam ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No Exam Selected
          </h3>
          <p className="text-text-secondary mb-6">
            Please select an exam from the dropdown above to view analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <StatsCards examStats={analyticsData.examStats} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-text-primary">
                  Score Distribution
                </h3>
              </div>
              <ScoreDistributionChart
                distributionData={analyticsData.scoreDistribution}
                isLoading={loading}
              />
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-text-primary">
                  Question Difficulty
                </h3>
              </div>
              <DifficultyChart
                difficultyData={analyticsData.difficultyData}
                isLoading={loading}
                questionAnalysis={analyticsData.questionAnalysis}
              />
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-text-primary">
                  Subject Performance
                </h3>
              </div>
              <SubjectPerformanceChart
                subjectData={analyticsData.subjectPerformance}
                isLoading={loading}
                examStats={analyticsData.examStats}
              />
            </div>
          </div>

          {/* Subject Performance Table */}
          <SubjectTable
            subjectPerformance={analyticsData.subjectPerformance}
            selectedExam={selectedExam}
            onExport={handleExport}
          />

          {/* Advanced Analytics Section */}
          {showAdvanced && (
            <AdvancedAnalytics
              timeAnalytics={analyticsData.timeAnalytics}
              questionAnalysis={analyticsData.questionAnalysis}
              difficultyData={analyticsData.difficultyData}
            />
          )}
        </>
      )}

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        selectedExam={selectedExamDetails}
        loading={exporting}
      />

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalTitle}
        message={infoModalMessage}
      />
    </div>
  );
};
