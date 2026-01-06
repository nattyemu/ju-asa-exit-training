import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  BarChart3,
  Calendar,
  BookOpen,
  Trophy,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Target as TargetIcon,
  Timer,
  ChevronDown,
  ChevronUp,
  User,
  Crown,
  Medal,
  ChevronRight,
} from "lucide-react";
import { examService } from "../../services/examService";
import { adminService } from "../../services/adminService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ImageModal } from "../common/ImageModal";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

// Chart Components
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

export const ProgressDashboard = () => {
  const [progress, setProgress] = useState(null);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [achievements, setAchievements] = useState([]);
  const [studyTime, setStudyTime] = useState([]);
  const [scoreTrend, setScoreTrend] = useState([]);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [chartLoading, setChartLoading] = useState(true);

  // NEW: State for exam selector and rankings
  const [completedExams, setCompletedExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedExamRankings, setSelectedExamRankings] = useState({
    rankings: [],
    examTitle: "",
    totalParticipants: 0,
    myRank: null,
  });
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [showAllRankings, setShowAllRankings] = useState(false);

  // Image modal state
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: null,
    alt: "",
  });

  useEffect(() => {
    loadProgressData();
  }, [timeRange]);

  useEffect(() => {
    // Load rankings when exam is selected
    if (selectedExamId) {
      loadExamRankings(selectedExamId);
    }
  }, [selectedExamId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setChartLoading(true);

      const [progressRes, subjectsRes, achievementsRes, studyTimeRes] =
        await Promise.allSettled([
          examService.getResultHistory(),
          examService.getSubjectPerformance(),
          adminService.getMyAchievements(),
          adminService.getStudyTimeAnalytics(),
        ]);

      // Handle progress data
      if (
        progressRes.status === "fulfilled" &&
        progressRes.value?.data?.success
      ) {
        const progressData = progressRes.value.data.data;
        console.log("Progress Data:", progressData);
        setProgress(progressData);

        // Extract completed exams for dropdown
        if (progressData?.results) {
          const exams = progressData.results
            .filter((result) => result.result)
            .map((result) => ({
              id: result.exam?.id,
              title: result.exam?.title,
              score: result.result?.score,
              date: result.session?.submittedAt,
              passed: result.result?.score >= (result.exam?.passingScore || 70),
            }));

          setCompletedExams(exams);

          // Auto-select first exam if available
          if (exams.length > 0 && !selectedExamId) {
            setSelectedExamId(exams[0].id);
          }

          // Generate score trend
          const trendData = progressData.results.map((result, index) => ({
            name: `Exam ${index + 1}`,
            score: result.result?.score || 0,
            date: result.session?.submittedAt
              ? new Date(result.session.submittedAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                )
              : `Exam ${index + 1}`,
          }));
          setScoreTrend(trendData);
        }
      }

      // Handle subject performance
      if (
        subjectsRes.status === "fulfilled" &&
        subjectsRes.value?.data?.success
      ) {
        const subjectsData = subjectsRes.value.data.data?.subjects || [];
        setSubjectPerformance(Array.isArray(subjectsData) ? subjectsData : []);
      }

      // Handle achievements
      if (
        achievementsRes.status === "fulfilled" &&
        achievementsRes.value?.data
      ) {
        const responseData = achievementsRes.value.data;
        let achievementsData = [];

        if (responseData.success && responseData.data) {
          if (Array.isArray(responseData.data)) {
            achievementsData = responseData.data;
          } else if (responseData.data.achievements) {
            achievementsData = responseData.data.achievements;
          } else if (responseData.data.myAchievements) {
            achievementsData = responseData.data.myAchievements;
          }
        }

        setAchievements(
          Array.isArray(achievementsData) ? achievementsData : []
        );
      }

      // Handle study time analytics
      if (studyTimeRes.status === "fulfilled" && studyTimeRes.value?.data) {
        const responseData = studyTimeRes.value.data;
        let studyTimeData = [];

        if (responseData.success && responseData.data) {
          if (Array.isArray(responseData.data)) {
            studyTimeData = responseData.data;
          } else if (responseData.data.studyTime) {
            studyTimeData = responseData.data.studyTime;
          } else if (responseData.data.dailyStudy) {
            studyTimeData = responseData.data.dailyStudy;
          }
        }

        if (Array.isArray(studyTimeData) && studyTimeData.length > 0) {
          setStudyTime(studyTimeData);
        } else {
          setStudyTime([]);
        }
      }
    } catch (error) {
      console.error("Failed to load progress data:", error);
      toast.error("Failed to load progress data");
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  const loadExamRankings = async (examId) => {
    try {
      setLoadingRankings(true);
      const rankingsRes = await examService.getRankings(examId, 100);

      if (rankingsRes.data?.success && rankingsRes.data.data?.rankings) {
        // Find the selected exam from completed exams
        const selectedExam = completedExams.find((exam) => exam.id === examId);
        const myRank = selectedExam
          ? progress?.results?.find((r) => r.exam?.id === examId)?.result?.rank
          : null;

        setSelectedExamRankings({
          rankings: rankingsRes.data.data.rankings || [],
          examTitle: selectedExam?.title || "Selected Exam",
          totalParticipants: rankingsRes.data.data.totalParticipants || 0,
          myRank,
        });
      }
    } catch (error) {
      console.error(`Failed to load rankings for exam ${examId}:`, error);
      toast.error("Failed to load rankings");
      setSelectedExamRankings({
        rankings: [],
        examTitle: "",
        totalParticipants: 0,
        myRank: null,
      });
    } finally {
      setLoadingRankings(false);
    }
  };

  // Calculate statistics with FIXED improvement calculation
  const calculateStats = () => {
    if (!progress?.results || !Array.isArray(progress.results)) {
      return {
        totalExams: 0,
        avgScore: 0,
        totalTime: 0,
        passedExams: 0,
        passRate: 0,
        improvement: 0,
        improvementType: "no-change", // 'improving', 'declining', 'no-change'
      };
    }

    const results = progress.results;
    const totalExams = results.length;

    // Calculate average including zero scores
    const totalScore = results.reduce(
      (sum, r) => sum + (r.result?.score || 0),
      0
    );
    const avgScore = totalExams > 0 ? Math.round(totalScore / totalExams) : 0;

    const totalTime = results.reduce(
      (sum, r) => sum + (r.result?.timeSpent || 0),
      0
    );

    const passedExams = results.filter(
      (r) => r.result?.score >= (r.exam?.passingScore || 70)
    ).length;

    const passRate =
      totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;

    // FIXED: Calculate improvement properly
    // Get only exams with scores, sorted by date
    const scoredExams = results
      .filter((r) => r.result?.score !== undefined)
      .sort(
        (a, b) =>
          new Date(a.session?.submittedAt || 0) -
          new Date(b.session?.submittedAt || 0)
      );

    let improvement = 0;
    let improvementType = "no-change";

    if (scoredExams.length >= 2) {
      const firstScore = scoredExams[0]?.result?.score || 0;
      const lastScore = scoredExams[scoredExams.length - 1]?.result?.score || 0;
      improvement = lastScore - firstScore;

      // Determine improvement type
      if (improvement > 0) {
        improvementType = "improving";
      } else if (improvement < 0) {
        improvementType = "declining";
      }
    }

    return {
      totalExams,
      avgScore,
      totalTime,
      passedExams,
      passRate,
      improvement,
      improvementType,
    };
  };

  const stats = calculateStats();

  // Safe achievements filtering
  const earnedAchievementsCount = Array.isArray(achievements)
    ? achievements.filter((a) => a && a.earned).length
    : 0;
  const totalAchievementsCount = Array.isArray(achievements)
    ? achievements.length
    : 0;

  // Prepare data for charts
  const prepareScoreTrendData = () => {
    if (scoreTrend.length > 0) {
      return scoreTrend;
    }

    if (progress?.results) {
      return progress.results.map((result, index) => ({
        name: `Exam ${index + 1}`,
        score: result.result?.score || 0,
        date: result.session?.submittedAt
          ? new Date(result.session.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : `Exam ${index + 1}`,
      }));
    }

    return [];
  };

  const prepareSubjectBarChartData = () => {
    if (!Array.isArray(subjectPerformance) || subjectPerformance.length === 0) {
      return [];
    }

    return subjectPerformance.map((subject) => ({
      subject: subject.subject || "Unknown",
      accuracy: subject.accuracy || 0,
      correct: subject.correctAnswers || 0,
      total: subject.totalQuestions || 0,
    }));
  };

  const prepareSubjectPieChartData = () => {
    if (!Array.isArray(subjectPerformance) || subjectPerformance.length === 0) {
      return [];
    }

    return subjectPerformance
      .map((subject) => ({
        name: subject.subject || "Unknown",
        value: subject.totalQuestions || 0,
      }))
      .filter((item) => item.value > 0);
  };

  const prepareStudyTimeChartData = () => {
    if (Array.isArray(studyTime) && studyTime.length > 0) {
      return studyTime;
    }
    return [];
  };

  // Helper functions
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

  const handleImageError = (e) => {
    e.target.style.display = "none";
    const fallbackElement = e.target.nextElementSibling;
    if (fallbackElement && fallbackElement.style) {
      fallbackElement.style.display = "flex";
    }
  };

  const openImageModal = (imageUrl, alt = "") => {
    setImageModal({
      isOpen: true,
      imageUrl: getProfileImageUrl(imageUrl),
      alt,
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: null,
      alt: "",
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-secondary">
          Loading your progress data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        imageUrl={imageModal.imageUrl}
        alt={imageModal.alt}
        onClose={closeImageModal}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            My Progress Dashboard
          </h2>
          <p className="text-sm text-text-secondary">
            Track performance, analyze strengths, and improve your scores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-text-secondary" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent focus:outline-none text-sm"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">Last 365 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <button
            onClick={loadProgressData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Score Card - FIXED */}
        <div className="bg-white rounded-xl border border-border p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Average Score</p>
              <p className="text-3xl font-bold text-text-primary">
                {stats.avgScore}%
              </p>
              <div
                className={`flex items-center gap-1 text-xs mt-1 ${
                  stats.improvementType === "improving"
                    ? "text-green-600"
                    : stats.improvementType === "declining"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {stats.improvementType === "improving" ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    <span>+{stats.improvement.toFixed(1)}% improvement</span>
                  </>
                ) : stats.improvementType === "declining" ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    <span>{stats.improvement.toFixed(1)}% decline</span>
                  </>
                ) : (
                  <span>No change</span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">
                Exams Completed
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {stats.totalExams}
              </p>
              <div className="text-xs text-green-600 mt-1">
                <span className="font-medium">{stats.passRate}% pass rate</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">
                Total Study Time
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {stats.totalTime}m
              </p>
              <div className="text-xs text-text-secondary mt-1">
                {stats.totalExams > 0
                  ? `${Math.round(
                      stats.totalTime / stats.totalExams
                    )}m avg per exam`
                  : "No exams taken"}
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Timer className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Achievements</p>
              <p className="text-3xl font-bold text-text-primary">
                {earnedAchievementsCount}/{totalAchievementsCount}
              </p>
              <div className="text-xs text-text-secondary mt-1">
                {totalAchievementsCount - earnedAchievementsCount} more to
                unlock
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Exam Rankings with Dropdown Selector */}
      {completedExams.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="font-medium text-text-primary">Exam Rankings</h3>
            </div>

            {/* Exam Selector Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">Select Exam:</span>
              <div className="relative min-w-[300px]">
                <select
                  value={selectedExamId || ""}
                  onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white appearance-none"
                  disabled={loadingRankings}
                >
                  <option value="">Select an exam...</option>
                  {completedExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.score}%)
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                </div>
              </div>
            </div>
          </div>

          {/* Rankings Display */}
          {selectedExamId && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-text-primary">
                    {selectedExamRankings.examTitle} - Rankings
                  </h4>
                  <p className="text-sm text-text-secondary">
                    Your rank:{" "}
                    <span className="font-bold text-primary">
                      #{selectedExamRankings.myRank || "N/A"}
                    </span>{" "}
                    of {selectedExamRankings.totalParticipants} students
                  </p>
                </div>
                <div className="text-xs text-text-secondary">
                  {selectedExamRankings.totalParticipants} participants
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
              ) : selectedExamRankings.rankings.length > 0 ? (
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
                    {selectedExamRankings.rankings
                      .slice(0, showAllRankings ? undefined : 5)
                      .map((student, index) => {
                        const scoreValue = student.score || 0;
                        const isCurrentUser =
                          selectedExamRankings.myRank === index + 1;
                        const studentName =
                          student.student?.profile?.fullName ||
                          student.fullName ||
                          student.name ||
                          student.student?.email?.split("@")[0] ||
                          `Student ${index + 1}`;
                        const profileImageUrl =
                          student.student?.profile?.profileImageUrl;

                        // FIXED: Correct time display - timeSpent is already in minutes
                        const timeTaken =
                          student.timeSpent !== undefined &&
                          student.timeSpent !== null
                            ? `${student.timeSpent}m`
                            : "N/A";
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors border ${
                              isCurrentUser
                                ? "border-primary bg-primary/5"
                                : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                            }`}
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
                                {isCurrentUser && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[10px] border border-white">
                                    ✓
                                  </div>
                                )}
                              </div>

                              {/* Student Info */}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm text-text-primary truncate">
                                  {studentName}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs font-medium text-primary">
                                      (You)
                                    </span>
                                  )}
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
                              <div className="text-xs text-text-secondary">
                                Time: {timeTaken}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Show more/less button */}
                  {selectedExamRankings.rankings.length > 5 && (
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
                            View All {selectedExamRankings.rankings.length}{" "}
                            Students
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No rankings available for this exam yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Charts Section */}
      {!chartLoading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Trend Chart */}
            {prepareScoreTrendData().length > 0 && (
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-text-primary">Score Trend</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={256}
                    minWidth={0}
                    debounce={1}
                  >
                    <RechartsLineChart
                      data={prepareScoreTrendData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-sm text-text-secondary mt-2">
                  Based on {prepareScoreTrendData().length} exam results
                </div>
              </div>
            )}

            {/* Subject Performance Bar Chart */}
            {prepareSubjectBarChartData().length > 0 && (
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-text-primary">
                    Subject Performance
                  </h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={256}
                    minWidth={0}
                    debounce={1}
                  >
                    <RechartsBarChart
                      data={prepareSubjectBarChartData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="subject"
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value, name) => {
                          if (name === "accuracy") {
                            return [`${value}`, "Accuracy"];
                          }
                          return [value, name];
                        }}
                      />
                      <Bar
                        dataKey="accuracy"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        name="Accuracy"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-sm text-text-secondary mt-2">
                  {prepareSubjectBarChartData().length} subjects analyzed
                </div>
              </div>
            )}
          </div>

          {/* Second Row: Pie Chart and Top Subjects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            {prepareSubjectPieChartData().length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-text-primary">
                    Questions by Subject
                  </h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={256}
                    minWidth={0}
                    debounce={1}
                  >
                    <RechartsPieChart>
                      <Pie
                        data={prepareSubjectPieChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareSubjectPieChartData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#3b82f6",
                                "#10b981",
                                "#f59e0b",
                                "#ef4444",
                                "#8b5cf6",
                              ][index % 5]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Questions"]} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Subjects List */}
            {subjectPerformance.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h3 className="font-medium text-text-primary">
                      Top Subjects
                    </h3>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {subjectPerformance.length} subjects
                  </div>
                </div>

                {/* Scrollable container for Top Subjects */}
                <div className="relative min-h-[240px]">
                  <div
                    className={`space-y-4 overflow-y-auto ${
                      showAllSubjects ? "h-[400px]" : "h-[200px]"
                    }`}
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "#cbd5e1 #f1f5f9",
                    }}
                  >
                    {subjectPerformance
                      .filter((subject) => subject && subject.subject)
                      .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))
                      .slice(0, showAllSubjects ? undefined : 5)
                      .map((subject, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                (subject.accuracy || 0) >= 80
                                  ? "bg-green-100 text-green-600"
                                  : (subject.accuracy || 0) >= 60
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-text-primary truncate">
                                {subject.subject || "Unknown"}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {subject.correctAnswers || 0}/
                                {subject.totalQuestions || 0} correct
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div
                              className={`text-lg font-bold ${
                                (subject.accuracy || 0) >= 80
                                  ? "text-green-600"
                                  : (subject.accuracy || 0) >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {subject.accuracy || 0}%
                            </div>
                            <div className="text-xs text-text-secondary">
                              Accuracy
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Show more/less button for Top Subjects */}
                  {subjectPerformance.length > 5 && (
                    <div className="mt-4 pt-4 border-t border-border text-center">
                      <button
                        onClick={() => setShowAllSubjects(!showAllSubjects)}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        {showAllSubjects ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Show Less (Top 5)
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View All {subjectPerformance.length} Subjects
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Study Time Chart */}
          {prepareStudyTimeChartData().length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-text-primary">
                  Study Time Distribution
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minHeight={256}
                  minWidth={0}
                  debounce={1}
                >
                  <RechartsBarChart
                    data={prepareStudyTimeChartData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      label={{
                        value: "Minutes",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value) => [`${value} min`, "Study Time"]}
                    />
                    <Bar
                      dataKey="minutes"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-text-secondary mt-2">
                Real study time tracking data
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent Exam Results */}
      {progress?.results?.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-text-primary">
                Recent Exam Results
              </h3>
            </div>
            <div className="text-sm text-text-secondary">
              Last {Math.min(5, progress.results.length)} of{" "}
              {progress.results.length} exams
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Exam
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Score
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {progress.results.slice(0, 5).map((result, index) => {
                  const score = result.result?.score || 0;
                  const passingScore = result.exam?.passingScore || 70;
                  const isPassed = score >= passingScore;

                  return (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-primary">
                          {result.exam?.title || "Unknown Exam"}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {result.exam?.totalQuestions || 0} questions •{" "}
                          {result.exam?.duration || 0} minutes
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {result.session?.submittedAt
                          ? new Date(
                              result.session.submittedAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "No date"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-lg font-bold ${
                              isPassed ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {score}%
                          </div>
                          {result.result?.rank && (
                            <div className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                              Rank: #{result.result.rank}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-text-secondary" />
                          {result.result?.timeSpent || 0}m
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            isPassed
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isPassed ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Passed
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/results`}
                          state={{
                            examId: result.exam?.id,
                            examData: result.exam,
                            resultData: result.result,
                          }}
                          className="text-primary hover:text-primary-dark text-sm font-medium inline-flex items-center gap-1"
                        >
                          Review Details <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {Array.isArray(achievements) && achievements.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <h3 className="font-medium text-text-primary">
                Your Achievements
              </h3>
            </div>
            <div className="text-sm text-text-secondary">
              {earnedAchievementsCount} of {totalAchievementsCount} unlocked (
              {Math.round(
                (earnedAchievementsCount / totalAchievementsCount) * 100
              )}
              %)
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.slice(0, 8).map((achievement, index) => {
              if (!achievement) return null;

              const Icon = achievement.icon || Trophy;
              const isEarned = achievement.earned || false;

              return (
                <div
                  key={achievement.id || index}
                  className={`border rounded-lg p-4 transition-all ${
                    isEarned
                      ? "border-green-200 bg-green-50 hover:bg-green-100"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isEarned
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-text-primary">
                        {achievement.title || "Achievement"}
                      </div>
                      <div
                        className={`text-xs ${
                          isEarned
                            ? "text-green-700 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {isEarned ? "✓ Earned" : "Not earned yet"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {achievement.description || "Complete this achievement"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!progress?.results || progress.results.length === 0) &&
        subjectPerformance.length === 0 &&
        achievements.length === 0 && (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-3">
              No Progress Data Yet
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Start taking exams to track your progress, analyze performance,
              and earn achievements.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              <TargetIcon className="w-5 h-5" />
              Take Your First Exam
            </Link>
          </div>
        )}
    </div>
  );
};
