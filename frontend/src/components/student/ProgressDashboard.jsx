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
} from "lucide-react";
import { examService } from "../../services/examService";
import { adminService } from "../../services/adminService";
import { LoadingSpinner } from "../common/LoadingSpinner";
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [studyTime, setStudyTime] = useState([]);
  const [scoreTrend, setScoreTrend] = useState([]);
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const leaderboardRef = useRef(null);
  const subjectsRef = useRef(null);

  useEffect(() => {
    loadProgressData();
  }, [timeRange]);

  const loadProgressData = async () => {
    try {
      setLoading(true);

      console.log("Loading progress data...");

      // Load multiple data sources
      const [
        progressRes,
        subjectsRes,
        leaderboardRes,
        achievementsRes,
        studyTimeRes,
      ] = await Promise.allSettled([
        examService.getResultHistory(),
        examService.getSubjectPerformance(),
        adminService.getLeaderboard(),
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

        // Generate score trend from real data
        if (progressData?.results) {
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
        console.log("Subject Performance Data:", subjectsData);
        setSubjectPerformance(Array.isArray(subjectsData) ? subjectsData : []);
      }

      // Handle leaderboard - check real API response
      if (leaderboardRes.status === "fulfilled" && leaderboardRes.value?.data) {
        console.log("Raw Leaderboard Data:", leaderboardRes.value.data);
        // Try different response structures
        let leaderboardData = [];
        const responseData = leaderboardRes.value.data;

        if (responseData.success && responseData.data) {
          if (Array.isArray(responseData.data)) {
            leaderboardData = responseData.data;
          } else if (responseData.data.rankings) {
            leaderboardData = responseData.data.rankings;
          } else if (responseData.data.leaderboard) {
            leaderboardData = responseData.data.leaderboard;
          }
        } else if (Array.isArray(responseData)) {
          leaderboardData = responseData;
        }

        console.log("Processed Leaderboard:", leaderboardData);
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      }

      // Handle achievements
      if (
        achievementsRes.status === "fulfilled" &&
        achievementsRes.value?.data
      ) {
        console.log("Raw Achievements Data:", achievementsRes.value.data);
        let achievementsData = [];
        const responseData = achievementsRes.value.data;

        if (responseData.success && responseData.data) {
          if (Array.isArray(responseData.data)) {
            achievementsData = responseData.data;
          } else if (responseData.data.achievements) {
            achievementsData = responseData.data.achievements;
          } else if (responseData.data.myAchievements) {
            achievementsData = responseData.data.myAchievements;
          }
        } else if (Array.isArray(responseData)) {
          achievementsData = responseData;
        }

        console.log("Processed Achievements:", achievementsData);
        setAchievements(
          Array.isArray(achievementsData) ? achievementsData : []
        );
      }

      // Handle study time analytics - REAL DATA ONLY
      if (studyTimeRes.status === "fulfilled" && studyTimeRes.value?.data) {
        console.log("Raw Study Time Data:", studyTimeRes.value.data);
        let studyTimeData = [];
        const responseData = studyTimeRes.value.data;

        if (responseData.success && responseData.data) {
          if (Array.isArray(responseData.data)) {
            studyTimeData = responseData.data;
          } else if (responseData.data.studyTime) {
            studyTimeData = responseData.data.studyTime;
          } else if (responseData.data.dailyStudy) {
            studyTimeData = responseData.data.dailyStudy;
          }
        }

        // If no real data, don't show the chart
        if (Array.isArray(studyTimeData) && studyTimeData.length > 0) {
          console.log("Processed Study Time:", studyTimeData);
          setStudyTime(studyTimeData);
        } else {
          console.log("No real study time data available");
          setStudyTime([]);
        }
      }
    } catch (error) {
      console.error("Failed to load progress data:", error);
      toast.error("Failed to load progress data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from real data
  const calculateStats = () => {
    if (!progress?.results || !Array.isArray(progress.results)) {
      return {
        totalExams: 0,
        avgScore: 0,
        totalTime: 0,
        passedExams: 0,
        passRate: 0,
        improvement: 0,
      };
    }

    const results = progress.results;
    const totalExams = results.length;
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

    // Calculate improvement
    let improvement = 0;
    if (results.length >= 2) {
      const firstScore = results[0]?.result?.score || 0;
      const lastScore = results[results.length - 1]?.result?.score || 0;
      improvement = lastScore - firstScore;
    }

    return {
      totalExams,
      avgScore,
      totalTime,
      passedExams,
      passRate,
      improvement,
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

  // Prepare REAL data for charts
  const prepareScoreTrendData = () => {
    if (scoreTrend.length > 0) {
      return scoreTrend;
    }

    // Fallback: create from progress results
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
    // Only show if we have real study time data
    if (Array.isArray(studyTime) && studyTime.length > 0) {
      return studyTime;
    }

    // Don't show dummy data
    return [];
  };

  // Extract percentage from string values like "0%"
  const extractPercentage = (value) => {
    if (typeof value === "string" && value.includes("%")) {
      return parseFloat(value.replace("%", ""));
    }
    return parseFloat(value) || 0;
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
        <div className="bg-white rounded-xl border border-border p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Average Score</p>
              <p className="text-3xl font-bold text-text-primary">
                {stats.avgScore}
              </p>
              <div
                className={`flex items-center gap-1 text-xs mt-1 ${
                  stats.improvement > 0
                    ? "text-green-600"
                    : stats.improvement < 0
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {stats.improvement > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    <span>+{stats.improvement.toFixed(1)} improvement</span>
                  </>
                ) : stats.improvement < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    <span>{stats.improvement.toFixed(1)} decline</span>
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

      {/* FIXED: Top Performers with static height and scroll */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <h3 className="font-medium text-text-primary">Top Performers</h3>
            </div>
            <div className="text-xs text-text-secondary">
              {leaderboard.length} students
            </div>
          </div>

          {/* FIXED: Static height container with proper scroll */}
          <div ref={leaderboardRef} className="relative min-h-[240px]">
            {/* Scrollable container with FIXED height */}
            <div
              className={`space-y-3 overflow-y-auto ${
                showAllLeaderboard ? "h-[400px]" : "h-[200px]"
              }`}
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 #f1f5f9",
              }}
            >
              {leaderboard
                .slice(0, showAllLeaderboard ? leaderboard.length : 100)
                .map((user, index) => {
                  const scoreValue = extractPercentage(
                    user.averageScore || user.score || 0
                  );

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                              : index === 1
                              ? "bg-gray-100 text-gray-800 border border-gray-300"
                              : index === 2
                              ? "bg-orange-100 text-orange-800 border border-orange-300"
                              : "bg-blue-100 text-blue-800 border border-blue-300"
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-text-primary truncate">
                            {user.student?.profile?.fullName ||
                              user.fullName ||
                              user.name ||
                              user.email?.split("@")[0] ||
                              `Student ${index + 1}`}
                          </div>
                          <div className="text-xs text-text-secondary truncate">
                            {user.department ||
                              user.student?.profile?.department ||
                              "General Department"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-text-primary">
                          {scoreValue}%
                        </div>
                        <div className="text-xs text-text-secondary">
                          {user.examsTaken ||
                            user.examsCompleted ||
                            user.totalExams ||
                            "0"}{" "}
                          exams
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Show more/less button */}
            {leaderboard.length > 5 && (
              <div className="mt-4 pt-4 border-t border-border text-center">
                <button
                  onClick={() => setShowAllLeaderboard(!showAllLeaderboard)}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  {showAllLeaderboard ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less (Top 5)
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      View All {leaderboard.length} Students
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REARRANGED: Charts in a compact 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Score Trend Chart with FIXED height */}
        {prepareScoreTrendData().length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-text-primary">Score Trend</h3>
            </div>
            {/* FIXED: Added minHeight and minWidth to ResponsiveContainer */}
            <div className="h-64" style={{ minHeight: "256px" }}>
              <ResponsiveContainer
                width="100%"
                height="100%"
                minHeight={256}
                minWidth={0}
              >
                <RechartsLineChart data={prepareScoreTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    domain={[0, 100]}
                    label={{
                      value: "Score",
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
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value}`, "Score"]}
                    labelFormatter={(label) => `Date: ${label}`}
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

        {/* Right Column: Subject Performance Bar Chart with FIXED height */}
        {prepareSubjectBarChartData().length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-text-primary">
                Subject Performance
              </h3>
            </div>
            {/* FIXED: Added minHeight and minWidth to ResponsiveContainer */}
            <div className="h-64" style={{ minHeight: "256px" }}>
              <ResponsiveContainer
                width="100%"
                height="100%"
                minHeight={256}
                minWidth={0}
              >
                <RechartsBarChart data={prepareSubjectBarChartData()}>
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
        {/* Pie Chart - Left Side */}
        {prepareSubjectPieChartData().length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-text-primary">
                Questions by Subject
              </h3>
            </div>
            {/* FIXED: Added minHeight and minWidth to ResponsiveContainer */}
            <div className="h-64" style={{ minHeight: "256px" }}>
              <ResponsiveContainer
                width="100%"
                height="100%"
                minHeight={256}
                minWidth={0}
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

        {/* Top Subjects List - Right Side with SCROLLABLE container */}
        {subjectPerformance.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-text-primary">Top Subjects</h3>
              </div>
              <div className="text-xs text-text-secondary">
                {subjectPerformance.length} subjects
              </div>
            </div>

            {/* Scrollable container for Top Subjects */}
            <div ref={subjectsRef} className="relative min-h-[240px]">
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
                  .slice(0, showAllSubjects ? subjectPerformance.length : 100)
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

      {/* Study Time Chart (if available) */}
      {prepareStudyTimeChartData().length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-text-primary">
              Study Time Distribution
            </h3>
          </div>
          {/* FIXED: Added minHeight and minWidth to ResponsiveContainer */}
          <div className="h-64" style={{ minHeight: "256px" }}>
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={256}
              minWidth={0}
            >
              <RechartsBarChart data={prepareStudyTimeChartData()}>
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
                <Bar dataKey="minutes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-sm text-text-secondary mt-2">
            Real study time tracking data
          </div>
        </div>
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
                            {score}
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
                          to={`/student/results/${result.exam?.id}`}
                          className="text-primary hover:text-primary-dark text-sm font-medium"
                        >
                          Review Details →
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

      {/* Empty State - Show when no data */}
      {(!progress?.results || progress.results.length === 0) &&
        subjectPerformance.length === 0 &&
        leaderboard.length === 0 &&
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
