import { useState, useEffect } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Award,
  Clock,
  Download,
  Calendar,
  Eye,
  EyeOff,
  BookOpen,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useSearchParams } from "react-router-dom"; // Add this import

const ScoreDistributionChart = ({ distributionData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (
    !distributionData ||
    !Array.isArray(distributionData) ||
    distributionData.length === 0
  ) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">
          No score data available
        </span>
      </div>
    );
  }

  const validData = distributionData.filter(
    (item) =>
      item && typeof item === "object" && "students" in item && "range" in item
  );

  if (validData.length === 0) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">
          Invalid score data format
        </span>
      </div>
    );
  }

  const maxStudents = Math.max(...validData.map((item) => item.students || 0));
  const totalStudents = validData.reduce(
    (sum, item) => sum + (item.students || 0),
    0
  );

  const mostCommonRange = validData.reduce((prev, current) =>
    (prev.students || 0) > (current.students || 0) ? prev : current
  );

  return (
    <div className="h-48 w-full bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-primary">
          Score Distribution
        </span>
        <span className="text-xs text-text-secondary">Histogram</span>
      </div>
      <div className="h-24 flex items-end gap-1 mb-2">
        {validData.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary-dark"
              style={{
                height:
                  maxStudents > 0 && item.students > 0
                    ? `${Math.max((item.students / maxStudents) * 80, 5)}%`
                    : "0%",
                minHeight: item.students > 0 ? "5%" : "0%",
              }}
              title={`${item.range}: ${item.students} student${
                item.students !== 1 ? "s" : ""
              } (${
                item.percentage ||
                Math.round((item.students / totalStudents) * 100)
              }%)`}
            ></div>
            <span className="text-xs text-text-secondary mt-1">
              {item.range}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-1 mt-2">
        <div className="text-xs text-text-primary font-medium text-center">
          {totalStudents === 1
            ? "1 student total"
            : `${totalStudents} total students`}
        </div>
        <div className="text-xs text-text-secondary text-center">
          Most common:{" "}
          <span className="font-semibold text-primary-dark">
            {mostCommonRange?.range || "N/A"}
          </span>
          {mostCommonRange?.students
            ? ` (${mostCommonRange.students} students)`
            : ""}
        </div>
      </div>
    </div>
  );
};

const DifficultyChart = ({ difficultyData, isLoading, questionAnalysis }) => {
  if (isLoading) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  let displayData = [];
  if (
    difficultyData &&
    Array.isArray(difficultyData) &&
    difficultyData.length > 0
  ) {
    displayData = difficultyData
      .map((item) => ({
        difficulty: item.difficulty || item.level || "UNKNOWN",
        totalQuestions: item.totalQuestions || item.count || 0,
        averageAccuracy: item.averageAccuracy || item.accuracy || 0,
      }))
      .filter((item) => item.totalQuestions > 0);
  }

  if (displayData.length === 0) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">No difficulty data</span>
      </div>
    );
  }

  const total = displayData.reduce((sum, item) => sum + item.totalQuestions, 0);
  const allZeroAccuracy = displayData.every(
    (item) => item.averageAccuracy === 0
  );

  const colors = {
    EASY: "bg-green-500",
    MEDIUM: "bg-yellow-500",
    HARD: "bg-red-500",
    VERY_EASY: "bg-green-300",
    VERY_HARD: "bg-red-700",
    BEGINNER: "bg-blue-300",
    ADVANCED: "bg-purple-500",
    UNKNOWN: "bg-gray-500",
  };

  const labels = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
    VERY_EASY: "Very Easy",
    VERY_HARD: "Very Hard",
    BEGINNER: "Beginner",
    ADVANCED: "Advanced",
    UNKNOWN: "Unknown",
  };

  const pieData = displayData.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.totalQuestions / total) * 100) : 0,
    color: colors[item.difficulty] || "bg-gray-500",
    label: labels[item.difficulty] || item.difficulty,
  }));

  const weightedAvgAccuracy =
    total > 0
      ? Math.round(
          pieData.reduce(
            (sum, item) => sum + item.averageAccuracy * item.totalQuestions,
            0
          ) / total
        )
      : 0;

  return (
    <div className="h-48 w-full bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-primary">
          Question Difficulty
        </span>
        <span className="text-xs text-text-secondary">Distribution</span>
      </div>

      <div className="h-24 flex items-center justify-center mb-2">
        <div className="relative w-20 h-20">
          {pieData.map((item, index, arr) => {
            const prevPercentage = arr
              .slice(0, index)
              .reduce((sum, i) => sum + i.percentage, 0);
            const rotation = (prevPercentage / 100) * 360;

            return (
              <div
                key={item.difficulty}
                className={`absolute inset-0 border-8 ${item.color} rounded-full`}
                style={{
                  clipPath: `inset(0 ${100 - item.percentage}% 0 0)`,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center",
                }}
              ></div>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-text-primary">
                {weightedAvgAccuracy}%
              </div>
              <div className="text-xs text-text-secondary">Avg Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-2 flex-wrap">
        {pieData.map((item) => (
          <div key={item.difficulty} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
            <span className="text-xs">
              {item.label} ({item.totalQuestions})
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="text-xs text-text-primary text-center">
          {displayData.length} difficulty level
          {displayData.length !== 1 ? "s" : ""}
        </div>
        {allZeroAccuracy && total > 0 && (
          <div className="text-xs text-amber-600 font-medium text-center">
            All questions have 0% accuracy
          </div>
        )}
      </div>
    </div>
  );
};

const SubjectPerformanceChart = ({ subjectData, isLoading, examStats }) => {
  if (isLoading) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!subjectData || subjectData.length === 0) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">No subject data</span>
      </div>
    );
  }

  const validSubjects = subjectData.filter(
    (subject) => subject.participants > 0
  );

  if (validSubjects.length === 0) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">
          No completed subject data
        </span>
      </div>
    );
  }

  const sortedSubjects = [...validSubjects].sort(
    (a, b) => b.avgScore - a.avgScore
  );
  const topSubject = sortedSubjects[0];

  const maxScore = Math.max(...sortedSubjects.map((item) => item.avgScore));
  const minScore = Math.min(...sortedSubjects.map((item) => item.avgScore));

  const scoreRange = maxScore - minScore;
  const displayMax = scoreRange === 0 ? Math.max(maxScore, 10) : maxScore;

  return (
    <div className="h-48 w-full bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-primary">
          Subject Performance
        </span>
        <span className="text-xs text-text-secondary">
          Top {Math.min(sortedSubjects.length, 5)} Subjects
        </span>
      </div>

      <div className="h-24 flex items-end gap-2 mb-2">
        {sortedSubjects.slice(0, 5).map((item, i) => {
          const height =
            displayMax > 0
              ? Math.max((item.avgScore / displayMax) * 90, 10)
              : 10;

          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  item.avgScore >= 70
                    ? "bg-green-500 hover:bg-green-600"
                    : item.avgScore >= 50
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
                style={{
                  height: `${height}%`,
                }}
                title={`${item.subject}: ${item.avgScore}% (${item.participants} questions)`}
              ></div>
              <span className="text-xs font-medium text-text-primary mt-1 truncate w-full text-center px-1">
                {item.subject.substring(0, 8)}
                {item.subject.length > 8 ? "..." : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-1 mt-2">
        <div className="text-xs text-text-primary font-medium text-center">
          {sortedSubjects.length} subject
          {sortedSubjects.length !== 1 ? "s" : ""}
        </div>
        {topSubject && (
          <div className="text-xs text-text-secondary text-center">
            Top:{" "}
            <span className="font-semibold text-primary-dark">
              {topSubject.subject}
            </span>{" "}
            ({topSubject.avgScore}%)
          </div>
        )}
      </div>
    </div>
  );
};

// Export Modal Component
const ExportModal = ({ isOpen, onClose, onExport, selectedExam, loading }) => {
  const [exportType, setExportType] = useState("complete");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Set default dates (last 30 days)
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      // Format dates as YYYY-MM-DD (backend expects this format)
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      setStartDate(formatDate(thirtyDaysAgo));
      setEndDate(formatDate(today));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate dates
    if (exportType === "complete") {
      if (!startDate || !endDate) {
        alert("Please select both start and end dates for complete report");
        return;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        alert("Please use YYYY-MM-DD format for dates");
        return;
      }

      onExport(exportType, { startDate, endDate });
    } else {
      onExport(exportType);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Export Report
            </h3>
            <p className="text-sm text-text-secondary">
              Select export options for {selectedExam?.title || "selected exam"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Export Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportType"
                    value="complete"
                    checked={exportType === "complete"}
                    onChange={(e) => setExportType(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium">Complete Report</div>
                    <div className="text-sm text-text-secondary">
                      Comprehensive analytics with date range
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportType"
                    value="results"
                    checked={exportType === "results"}
                    onChange={(e) => setExportType(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium">Exam Results Only</div>
                    <div className="text-sm text-text-secondary">
                      Student scores and rankings
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportType"
                    value="questions"
                    checked={exportType === "questions"}
                    onChange={(e) => setExportType(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium">Question Analytics</div>
                    <div className="text-sm text-text-secondary">
                      Question performance and subject analysis
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {exportType === "complete" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Info className="w-4 h-4" />
                  <span>Complete report requires date range selection</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Start Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      pattern="\d{4}-\d{2}-\d{2}"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Format: YYYY-MM-DD
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      End Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      pattern="\d{4}-\d{2}-\d{2}"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Format: YYYY-MM-DD
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Info Modal Component
const InfoModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-text-primary">{message}</p>
          <button
            onClick={onClose}
            className="w-full mt-6 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams(); // Add this hook
  const [selectedExam, setSelectedExam] = useState(null);
  const [timeRange, setTimeRange] = useState("week");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [examStats, setExamStats] = useState(null);
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [questionAnalysis, setQuestionAnalysis] = useState(null);
  const [difficultyData, setDifficultyData] = useState([]);
  const [timeAnalytics, setTimeAnalytics] = useState(null);
  const [subjectPerformance, setSubjectPerformance] = useState([]);

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalMessage, setInfoModalMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  // Check for examId in URL params
  useEffect(() => {
    const examIdFromUrl = searchParams.get("examId");
    if (examIdFromUrl) {
      // Convert to number if needed
      const examId = Number(examIdFromUrl);
      if (examId && !isNaN(examId)) {
        setSelectedExam(examId);
      }
    }
  }, [searchParams]);

  // Fetch available exams for selection
  const loadExams = async () => {
    try {
      const response = await adminService.getAllExams(1, 100);
      if (response.data.success) {
        const availableExams = response.data.data.exams || [];
        setExams(availableExams);

        // REMOVE THE AUTO-SELECTION LOGIC HERE
        // Just set loading to false
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to load exams:", error);
      setLoading(false);
    }
  };

  const loadAnalyticsData = async (examId) => {
    if (!examId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const promises = [
        adminService
          .getExamAnalytics(examId)
          .catch((err) => ({ data: { success: false, error: err.message } })),
        adminService
          .getScoreDistribution(examId)
          .catch((err) => ({ data: { success: false, error: err.message } })),
        adminService
          .getQuestionAnalysis(examId)
          .catch((err) => ({ data: { success: false, error: err.message } })),
        adminService
          .getDifficultyAnalysis(examId)
          .catch((err) => ({ data: { success: false, error: err.message } })),
        adminService
          .getTimeAnalytics(examId)
          .catch((err) => ({ data: { success: false, error: err.message } })),
      ];

      const [
        examStatsRes,
        scoreDistributionRes,
        questionAnalysisRes,
        difficultyRes,
        timeAnalyticsRes,
      ] = await Promise.all(promises);

      if (examStatsRes.data.success) {
        setExamStats(examStatsRes.data.data);
      }

      if (scoreDistributionRes.data.success) {
        const scoreData = scoreDistributionRes.data.data;
        if (Array.isArray(scoreData)) {
          setScoreDistribution(scoreData);
        } else if (scoreData.scoreRanges) {
          setScoreDistribution(scoreData.scoreRanges);
        } else if (scoreData.distribution) {
          setScoreDistribution(scoreData.distribution);
        } else {
          setScoreDistribution([]);
        }
      } else {
        setScoreDistribution([]);
      }

      if (questionAnalysisRes.data.success) {
        const questionData = questionAnalysisRes.data.data;
        setQuestionAnalysis(questionData);

        if (questionData.questions && questionData.questions.length > 0) {
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

          const subjects = Object.values(subjectsMap)
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

          setSubjectPerformance(subjects);
        } else {
          setSubjectPerformance([]);
        }
      } else {
        setSubjectPerformance([]);
      }

      if (difficultyRes.data.success) {
        const difficultyResult = difficultyRes.data.data;
        if (Array.isArray(difficultyResult)) {
          setDifficultyData(difficultyResult);
        } else if (difficultyResult.difficulties) {
          setDifficultyData(difficultyResult.difficulties);
        } else {
          setDifficultyData([]);
        }
      } else {
        setDifficultyData([]);
      }

      if (timeAnalyticsRes.data.success) {
        setTimeAnalytics(timeAnalyticsRes.data.data);
      }
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, params = {}) => {
    try {
      if (!selectedExam) {
        setInfoModalTitle("Export Failed");
        setInfoModalMessage("Please select an exam first.");
        setShowInfoModal(true);
        return;
      }

      setExporting(true);

      // Get the selected exam title for display
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
          // For complete report, we need to send startDate and endDate
          if (!params.startDate || !params.endDate) {
            setInfoModalTitle("Export Failed");
            setInfoModalMessage(
              "Please provide both start and end dates for complete report."
            );
            setExporting(false);
            return;
          }

          try {
            response = await adminService.exportCompleteReport(
              selectedExam,
              params.startDate,
              params.endDate
            );
            exportMessage = `Complete report for ${selectedExamTitle} (${params.startDate} to ${params.endDate}) has been exported.`;
          } catch (error) {
            console.error("Complete report failed:", error);
            if (error.response?.status === 400) {
              try {
                response = await adminService.exportExamResults(selectedExam);
                exportMessage = `Complete report service is temporarily unavailable. ${selectedExamTitle} results have been exported instead.`;
              } catch (fallbackError) {
                throw fallbackError;
              }
            } else {
              throw error;
            }
          }
          break;
        default:
          response = await adminService.exportExamResults(selectedExam);
          exportMessage = `${selectedExamTitle} results have been exported successfully.`;
      }

      // Check if response is valid
      if (!response || !response.data) {
        throw new Error("No response data received from server");
      }

      // Create download link
      const contentType = response.headers?.["content-type"] || "text/csv";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from content-disposition header
      let filename = "export.csv";
      const contentDisposition = response.headers?.["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        } else {
          // Generate filename based on export type
          const timestamp = new Date().toISOString().split("T")[0];
          switch (type) {
            case "results":
              filename = `exam-results-${selectedExam}-${timestamp}.csv`;
              break;
            case "questions":
              filename = `question-analytics-${selectedExam}-${timestamp}.csv`;
              break;
            case "complete":
              filename = `complete-report-${selectedExam}-${timestamp}.csv`;
              break;
          }
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success modal and close export modal
      setInfoModalTitle("Export Successful");
      setInfoModalMessage(exportMessage);
      setShowExportModal(false);
      setShowInfoModal(true);
    } catch (error) {
      console.error("Export failed:", error);

      let errorMessage = "Export failed. Please try again.";

      // Provide more specific error messages
      if (error.response?.status === 400) {
        errorMessage =
          "Bad request. Please check the date format (YYYY-MM-DD) and try again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Export service not found. Please contact support.";
      } else if (error.response?.status === 500) {
        errorMessage =
          "Server error. Please try again later or contact support.";
      }

      setInfoModalTitle("Export Failed");
      setInfoModalMessage(errorMessage);
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

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadAnalyticsData(selectedExam);
    }
  }, [selectedExam]);

  const handleExamChange = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);

    // Update URL with the selected examId
    if (examId) {
      setSearchParams({ examId });
    } else {
      // Remove examId from URL if no exam selected
      const params = new URLSearchParams(searchParams);
      params.delete("examId");
      setSearchParams(params);
    }
  };

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
          {selectedExam && exams.find((e) => e.id === selectedExam) && (
            <div className="text-sm text-text-secondary">
              <span className="font-medium">Selected: </span>
              {exams.find((e) => e.id === selectedExam)?.title}
            </div>
          )}
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
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary">
                    Total Participants
                  </p>
                  <p className="text-2xl font-bold text-text-primary">
                    {examStats?.participants?.total || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-xs text-text-secondary">
                <span className="text-green-600 font-medium">
                  {examStats?.participants?.passed || 0}
                </span>{" "}
                passed •{" "}
                <span className="text-red-600">
                  {examStats?.participants?.failed || 0}
                </span>{" "}
                failed
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary">Average Score</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {examStats?.performance?.averageScore || "0%"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-xs text-text-secondary">
                Pass Rate: {examStats?.participants?.passRate || "0%"}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary">Highest Score</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {examStats?.performance?.highestScore || "0%"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-xs text-text-secondary">
                Lowest: {examStats?.performance?.lowestScore || "0%"}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary">Avg Time Spent</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {examStats?.timeAnalysis?.averageTimeSpent || "0m"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="text-xs text-text-secondary">
                Duration: {examStats?.timeAnalysis?.examDuration || "180m"}
              </div>
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
                distributionData={scoreDistribution}
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
                difficultyData={difficultyData}
                isLoading={loading}
                questionAnalysis={questionAnalysis}
              />
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-text-primary">
                  Subject Performance
                </h3>
              </div>
              <SubjectPerformanceChart
                subjectData={subjectPerformance}
                isLoading={loading}
                examStats={examStats}
              />
            </div>
          </div>

          {/* Subject Performance Table */}
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-text-primary">
                Detailed Subject Analysis
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport("questions")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedExam || subjectPerformance.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>
            </div>

            {subjectPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                        Subject
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                        Avg Score
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                        Questions
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                        Difficulty Level
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectPerformance.map((subject, index) => (
                      <tr
                        key={index}
                        className="border-b border-border hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-text-primary">
                            {subject.subject}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div
                            className={`font-medium ${
                              subject.avgScore >= 70
                                ? "text-green-600"
                                : subject.avgScore >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {subject.avgScore}%
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-text-primary">
                            {subject.participants}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              subject.difficulty === "EASY"
                                ? "bg-green-100 text-green-800"
                                : subject.difficulty === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : subject.difficulty === "HARD"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {subject.difficulty === "EASY"
                              ? "Easy"
                              : subject.difficulty === "MEDIUM"
                              ? "Medium"
                              : subject.difficulty === "HARD"
                              ? "Hard"
                              : subject.difficulty}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  subject.avgScore >= 70
                                    ? "bg-green-500"
                                    : subject.avgScore >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${subject.avgScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-text-secondary w-12 text-right">
                              {subject.avgScore}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-xs text-text-secondary text-center">
                  Showing {subjectPerformance.length} subject
                  {subjectPerformance.length !== 1 ? "s" : ""}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-text-secondary">
                  No subject performance data available
                </p>
              </div>
            )}
          </div>

          {/* Advanced Analytics Section */}
          {showAdvanced && (
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
              <h3 className="font-medium text-text-primary mb-6">
                Advanced Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      Time Analytics
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Correlation:</span>
                      <span className="font-medium">
                        {timeAnalytics?.timeScoreCorrelation || "No data"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Completion Rate:</span>
                      <span className="font-medium">
                        {timeAnalytics?.completionRate || "0%"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">On Time Students:</span>
                      <span className="font-medium">
                        {timeAnalytics?.timeUsage?.onTimeStudents || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Performance Trends
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Total Questions:</span>
                      <span className="font-medium">
                        {questionAnalysis?.summary?.totalQuestions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Attempted:</span>
                      <span className="font-medium">
                        {questionAnalysis?.summary?.attemptedQuestions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Avg Accuracy:</span>
                      <span className="font-medium">
                        {questionAnalysis?.summary?.averageAccuracy || "0%"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-800">
                      Question Analysis
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Most Difficult:</span>
                      <span className="font-medium">
                        {questionAnalysis?.summary?.mostDifficultQuestions?.[0]
                          ?.subject || "None"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Difficulty:</span>
                      <span className="font-medium">
                        {questionAnalysis?.summary?.mostDifficultQuestions?.[0]
                          ?.accuracy || "0%"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">
                        Total Difficulty Levels:
                      </span>
                      <span className="font-medium">
                        {difficultyData.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        selectedExam={exams.find((e) => e.id === selectedExam)}
        loading={exporting}
      />

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalTitle}
        message={infoModalMessage}
      />
    </div>
  );
};
