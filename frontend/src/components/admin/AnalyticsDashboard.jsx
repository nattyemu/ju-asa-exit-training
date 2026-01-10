import React from "react";
import { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  Eye,
  EyeOff,
  BookOpen,
  Trophy,
  Crown,
  Medal,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { examService } from "../../services/examService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Link, useLocation } from "react-router-dom";
import ScoreDistributionChart from "./analytics/ScoreDistributionChart";
import DifficultyChart from "./analytics/DifficultyChart";
import SubjectPerformanceChart from "./analytics/SubjectPerformanceChart";
import ExportModal from "./analytics/ExportModal";
import InfoModal from "./analytics/InfoModal";
import StatsCards from "./analytics/StatsCards";
import SubjectTable from "./analytics/SubjectTable";
// import AdvancedAnalytics from "./analytics/AdvancedAnalytics";
import { ImageModal } from "../common/ImageModal";

export const AnalyticsDashboard = () => {
  const location = useLocation();
  const [selectedExam, setSelectedExam] = useState(() => {
    return location.state?.examId || null;
  });
  const [timeRange, setTimeRange] = useState("week");
  // const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);

  // State for exam rankings
  const [examRankings, setExamRankings] = useState({
    rankings: [],
    examTitle: "",
    totalParticipants: 0,
  });
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [showAllRankings, setShowAllRankings] = useState(false);

  // State for image modal
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: null,
    alt: "",
  });

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
      // console.error("Failed to load exams:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load rankings for selected exam - UPDATED FIX
  const loadExamRankings = async (examId) => {
    if (!examId) {
      setExamRankings({
        rankings: [],
        examTitle: "",
        totalParticipants: 0,
      });
      return;
    }

    try {
      setLoadingRankings(true);
      const rankingsRes = await examService.getRankings(examId, 100);

      if (rankingsRes.data?.success && rankingsRes.data.data?.rankings) {
        // Try to get exam title from multiple sources
        const selectedExamDetails = exams.find((e) => e.id === examId);
        const examTitleFromRankings = rankingsRes.data.data.examTitle;

        setExamRankings({
          rankings: rankingsRes.data.data.rankings || [],
          examTitle:
            selectedExamDetails?.title ||
            examTitleFromRankings ||
            "Selected Exam",
          totalParticipants: rankingsRes.data.data.totalParticipants || 0,
        });
      } else {
        // Even if no rankings, set the exam title if we have it
        const selectedExamDetails = exams.find((e) => e.id === examId);
        setExamRankings({
          rankings: [],
          examTitle: selectedExamDetails?.title || "Selected Exam",
          totalParticipants: 0,
        });
      }
    } catch (error) {
      // console.error(`Failed to load rankings for exam ${examId}:`, error);
      // Still try to get title from exams list
      const selectedExamDetails = exams.find((e) => e.id === examId);
      setExamRankings({
        rankings: [],
        examTitle: selectedExamDetails?.title || "Selected Exam",
        totalParticipants: 0,
      });
    } finally {
      setLoadingRankings(false);
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
      // console.error("Failed to load analytics data:", error);
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
      // console.error("Export failed:", error);
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

  // Helper function to get profile image URL
  const getProfileImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("blob:")) return imageUrl;

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    if (!imageUrl.startsWith("/")) {
      imageUrl = "/" + imageUrl;
    }

    return backendUrl + imageUrl;
  };

  // Handle image error
  const handleImageError = (e) => {
    e.target.style.display = "none";
    const fallbackElement = e.target.nextElementSibling;
    if (fallbackElement && fallbackElement.style) {
      fallbackElement.style.display = "flex";
    }
  };

  // Open image modal
  const openImageModal = (imageUrl, alt = "") => {
    setImageModal({
      isOpen: true,
      imageUrl: getProfileImageUrl(imageUrl),
      alt,
    });
  };

  // Close image modal
  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: null,
      alt: "",
    });
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadAnalyticsData(selectedExam);
      loadExamRankings(selectedExam);
    }
  }, [selectedExam]);

  // Get selected exam details
  const selectedExamDetails = exams.find((e) => e.id === selectedExam);

  return (
    <div>
      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        imageUrl={imageModal.imageUrl}
        alt={imageModal.alt}
        onClose={closeImageModal}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium hidden sm:inline">Back</span>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-text-primary">
                Analytics Dashboard
              </h2>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Performance insights and statistics
            </p>
          </div>
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
          {/* <button
      onClick={() => setShowAdvanced(!showAdvanced)}
      className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm"
    >
      {showAdvanced ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
      {showAdvanced ? "Basic View" : "Advanced View"}
    </button> */}
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

          {/* Exam Rankings Section - FIXED TITLE DISPLAY */}
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <h3 className="font-medium text-text-primary">Exam Rankings</h3>
              </div>
            </div>

            {/* Rankings Display */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-text-primary">
                    {selectedExamDetails?.title ||
                      examRankings.examTitle ||
                      "Selected Exam"}{" "}
                    - Student Rankings
                  </h4>
                  <p className="text-sm text-text-secondary">
                    Total participants: {examRankings.totalParticipants}{" "}
                    students
                  </p>
                </div>
                <div className="text-xs text-text-secondary">
                  {examRankings.totalParticipants} participants
                </div>
              </div>

              {/* Rankings List */}
              {loadingRankings ? (
                <div className="py-8 text-center">
                  <LoadingSpinner size="md" />
                  <p className="mt-2 text-text-secondary">
                    Loading rankings...
                  </p>
                </div>
              ) : examRankings.rankings.length > 0 ? (
                <div className="relative min-h-[240px]">
                  {/* Scrollable container */}
                  <div
                    className={`space-y-3 overflow-y-auto ${
                      showAllRankings ? "h-[400px]" : "h-[200px]"
                    }`}
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "#cbd5e1 #f1f5f9",
                    }}
                  >
                    {examRankings.rankings
                      .slice(0, showAllRankings ? undefined : 5)
                      .map((student, index) => {
                        const scoreValue = student.score || 0;
                        const studentName =
                          student.student?.profile?.fullName ||
                          student.fullName ||
                          student.name ||
                          student.student?.email?.split("@")[0] ||
                          `Student ${index + 1}`;
                        const profileImageUrl =
                          student.student?.profile?.profileImageUrl;

                        // Fixed time display - timeSpent is already in minutes
                        const timeTaken =
                          student.timeSpent !== undefined &&
                          student.timeSpent !== null
                            ? student.timeSpent === 0 && student.score > 0
                              ? "< 1m"
                              : `${student.timeSpent}m`
                            : "N/A";

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg transition-colors border border-transparent hover:border-gray-200 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {/* Rank Number */}
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                    : index === 1
                                    ? "bg-gray-100 text-gray-800 border-gray-300"
                                    : index === 2
                                    ? "bg-orange-100 text-orange-800 border-orange-300"
                                    : "bg-blue-100 text-blue-800 border-blue-300"
                                }`}
                              >
                                {index === 0 ? (
                                  <Crown className="w-4 h-4" />
                                ) : index === 1 || index === 2 ? (
                                  <Medal className="w-4 h-4" />
                                ) : (
                                  `#${index + 1}`
                                )}
                              </div>

                              {/* Profile Image */}
                              <div className="relative group">
                                <div
                                  className="w-10 h-10 rounded-full overflow-hidden border border-border cursor-pointer transition-transform duration-200 hover:scale-110 hover:shadow-lg"
                                  onClick={() => {
                                    if (profileImageUrl) {
                                      openImageModal(
                                        profileImageUrl,
                                        studentName
                                      );
                                    }
                                  }}
                                >
                                  {profileImageUrl ? (
                                    <>
                                      <img
                                        src={getProfileImageUrl(
                                          profileImageUrl
                                        )}
                                        alt={studentName}
                                        className="w-full h-full object-cover"
                                        onError={handleImageError}
                                      />
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                                      <span className="text-white font-bold text-sm">
                                        {studentName[0]?.toUpperCase() || "S"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Student Info */}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm text-text-primary truncate">
                                  {studentName}
                                </div>
                                <div className="text-xs text-text-secondary truncate">
                                  {student.student?.profile?.department ||
                                    student.department ||
                                    "General Department"}
                                </div>
                              </div>
                            </div>

                            {/* Score and Time */}
                            <div className="text-right flex-shrink-0 ml-2">
                              <div
                                className={`font-bold ${
                                  scoreValue >= 80
                                    ? "text-green-600"
                                    : scoreValue >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {scoreValue}%
                              </div>
                              <div className="flex items-center gap-1 text-xs text-text-secondary">
                                <Clock className="w-3 h-3" />
                                {timeTaken}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Show more/less button */}
                  {examRankings.rankings.length > 5 && (
                    <div className="mt-4 pt-4 border-t border-border text-center">
                      <button
                        onClick={() => setShowAllRankings(!showAllRankings)}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        {showAllRankings ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Show Less (Top 5)
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View All {examRankings.rankings.length} Students
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No rankings available for this exam yet.</p>
                  <p className="text-sm mt-1">
                    Students need to complete the exam to appear in rankings.
                  </p>
                </div>
              )}
            </div>
          </div>

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
