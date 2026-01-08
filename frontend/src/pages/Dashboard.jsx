import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { ExamCard } from "../components/student/ExamCard";
import { examService } from "../services/examService";
import { adminService } from "../services/adminService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import ProfileUpdateModal from "../components/common/ProfileUpdateModal";
import {
  LogOut,
  GraduationCap,
  Calendar,
  Award,
  BookOpen,
  Trophy,
  CheckCircle,
  Users,
  BarChart3,
  Plus,
  Send,
  TrendingUp,
  Edit,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export const Dashboard = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState({
    activeExams: 0,
    totalStudents: 0,
    totalQuestions: 0,
    submissionsToday: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isStartingExam, setIsStartingExam] = useState(false);
  useEffect(() => {
    if (user?.role === "STUDENT") {
      loadExams();
    } else if (user?.role === "ADMIN") {
      loadAdminStats();
    }
  }, [user]);
  const formatRank = (rank) => {
    if (!rank || rank === 0 || rank === "N/A") {
      return (
        <span className="flex items-center gap-1">
          <span>Not Available</span>
        </span>
      );
    }
    return `#${rank}`;
  };
  const loadAdminStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await adminService.getAdminDashboard();
      console.log("Admin dashboard API response:", response);

      if (response.data.success) {
        const data = response.data.data;
        console.log("Admin dashboard data:", data);

        // Extract stats from the correct structure
        const systemOverview = data.systemOverview || {};

        setAdminStats({
          activeExams: systemOverview.activeExams || 0,
          totalStudents: systemOverview.totalStudents || 0,
          totalQuestions: systemOverview.totalQuestions || 0,
          submissionsToday: systemOverview.submissionsToday || 0,
        });
      }
    } catch (error) {
      console.error("Failed to load admin stats:", error);
      toast.error("Failed to load admin dashboard statistics");
      setAdminStats({
        activeExams: 0,
        totalStudents: 0,
        totalQuestions: 0,
        submissionsToday: 0,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleStartExam = async (exam) => {
    if (isStartingExam) {
      toast.info("Please wait, starting exam...");
      return;
    }

    setIsStartingExam(true);

    try {
      // Handle completed exams
      if (exam.status === "COMPLETED") {
        navigate(`/results`, {
          state: {
            examData: exam,
            resultData: exam.result,
          },
        });
        return;
      }

      // Handle in-progress exams
      if (exam.status === "IN_PROGRESS") {
        // Check if exam is expired
        const now = new Date();
        const availableUntil = new Date(exam.availableUntil);

        if (now > availableUntil) {
          toast.info("This exam has expired. Showing results...");
          navigate(`/results`, {
            state: {
              examData: exam,
              resultData: exam.result,
            },
          });
        } else {
          // Still valid, continue exam
          navigate(`/exam/${exam.id}`);
        }
        return;
      }

      // NEW EXAM - Start new session
      console.log("🚀 Dashboard: Starting NEW exam session for exam", exam.id);

      const startResponse = await examService.startExam(exam.id);

      if (startResponse.data.success) {
        console.log("✅ Dashboard: Exam session started successfully");
        // Navigate to exam page
        navigate(`/exam/${exam.id}`);
      } else {
        console.error(
          "❌ Dashboard: Failed to start exam:",
          startResponse.data.message
        );

        // Handle specific errors
        if (startResponse.data.message.includes("already completed")) {
          toast.error("You have already completed this exam");
          navigate(`/results/${exam.id}`);
        } else if (startResponse.data.message.includes("already exists")) {
          // Session already exists
          toast.info("Resuming existing session...");
          navigate(`/exam/${exam.id}`);
        } else {
          toast.error(startResponse.data.message || "Failed to start exam");
        }
      }
    } catch (error) {
      console.error("❌ Dashboard: Error starting exam:", error);

      // Handle 409 (Conflict) - session already exists
      if (error.response?.status === 409) {
        toast.info("Resuming existing session...");
        navigate(`/exam/${exam.id}`);
        return;
      }

      // Handle 400 - exam already completed
      if (
        error.response?.status === 400 &&
        error.response.data.message?.includes("already completed")
      ) {
        toast.error("You have already completed this exam");
        navigate(`/results/${exam.id}`);
        return;
      }

      toast.error("Failed to start exam. Please try again.");
    } finally {
      setIsStartingExam(false);
    }
  };
  const loadExams = async () => {
    try {
      setIsLoading(true);
      const response = await examService.getAvailableExams();
      console.log("📋 Exam response:", response.data); // ADD THIS LINE

      if (response.data.success) {
        // Get exams from response
        const examsData = response.data.data.exams || [];

        // DEBUG: Check exam dates
        examsData.forEach((exam, index) => {
          console.log(`Exam ${index + 1}:`, {
            id: exam.id,
            title: exam.title,
            createdAt: exam.createdAt,
            availableFrom: exam.availableFrom,
            availableUntil: exam.availableUntil,
          });
        });

        // Sort exams by createdAt in descending order (newest first)
        const sortedExams = examsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          console.log(
            `Sorting: ${a.id} (${dateA}) vs ${b.id} (${dateB}) = ${
              dateB - dateA
            }`
          ); // ADD THIS
          return dateB - dateA; // Newest first (descending)
        });

        // DEBUG: Check sorted order
        console.log(
          "📊 Sorted exams:",
          sortedExams.map((e) => ({
            id: e.id,
            title: e.title,
            createdAt: e.createdAt,
          }))
        );

        setExams(sortedExams);
      }
    } catch (error) {
      console.error("Failed to load exams:", error);

      // Don't show toast for 404 - it's normal when no exams
      if (error.response?.status !== 404) {
        toast.error("Failed to load available exams");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleProfileUpdated = (updatedData) => {
    updateUserProfile(updatedData);
    setShowProfileModal(false);
  };

  const getProfileImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    // If it's already a full URL, return as is
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("blob:")) return imageUrl;

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    // Ensure the URL starts with a slash
    if (!imageUrl.startsWith("/")) {
      imageUrl = "/" + imageUrl;
    }

    console.log("Getting profile image URL for:", backendUrl + imageUrl);
    return backendUrl + imageUrl;
  };

  // Handle image error - fixed version
  const handleImageError = (e) => {
    e.target.style.display = "none";
    const fallbackElement = e.target.nextElementSibling;
    if (fallbackElement && fallbackElement.style) {
      fallbackElement.style.display = "flex";
    }
  };

  // Calculate student progress stats
  const calculateStudentStats = () => {
    const completedExams = exams.filter((e) => e.status === "COMPLETED");
    const passedExams = completedExams.filter(
      (e) => e.result?.score >= e.passingScore
    );
    const inProgressExams = exams.filter((e) => e.status === "IN_PROGRESS");
    const availableExams = exams.filter((e) => e.status === "NOT_STARTED");

    return {
      completed: completedExams.length,
      passed: passedExams.length,
      inProgress: inProgressExams.length,
      available: availableExams.length,
    };
  };

  const studentStats = calculateStudentStats();

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  Exit Exam Dashboard
                </h1>
                <p className="text-sm text-text-secondary">
                  Welcome back, {user?.profile?.fullName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Edit Profile Button */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-background-light rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-background-light rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info & Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                    {user?.profile?.profileImageUrl ? (
                      <img
                        src={getProfileImageUrl(user.profile.profileImageUrl)}
                        alt={user.profile.fullName}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : null}
                    {!user?.profile?.profileImageUrl && (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {user?.profile?.fullName?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors shadow-md"
                    title="Edit Profile"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-text-primary">
                    {user?.profile?.fullName || "User"}
                  </h2>
                  <p className="text-sm text-text-secondary">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {user?.role}
                    </span>
                    {user?.profile?.year && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        GC {user.profile.year}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-text-secondary" />
                  <span className="text-sm">
                    {user?.profile?.university || "JU University"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-text-secondary" />
                  <span className="text-sm">
                    Year {user?.profile?.year || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-text-secondary" />
                  <span className="text-sm">
                    {user?.profile?.department || "Department"}
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="border-t border-border pt-6">
                {user?.role === "STUDENT" ? (
                  <div className="space-y-2">
                    <Link
                      to="/progress"
                      className="flex items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <TrendingUp className="w-5 h-5 text-text-secondary" />
                      <span className="text-sm">My Progress</span>
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Trophy className="w-5 h-5 text-text-secondary" />
                      <span className="text-sm">My Results</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/admin/analytics"
                      className="flex items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <BarChart3 className="w-5 h-5 text-text-secondary" />
                      <span className="text-sm">Analytics</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      className="flex items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Users className="w-5 h-5 text-text-secondary" />
                      <span className="text-sm">User Management</span>
                    </Link>
                    <Link
                      to="/admin/exams"
                      className="flex items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <BookOpen className="w-5 h-5 text-text-secondary" />
                      <span className="text-sm">Exam Management</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-text-primary mb-6">
              {user?.role === "ADMIN"
                ? "Admin Dashboard"
                : "Available Practice Exams"}
            </h2>

            {user?.role === "ADMIN" ? (
              <div className="space-y-8">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        Welcome, Admin!
                      </h2>
                      <p className="opacity-90">
                        Manage exams, students, and view system analytics
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate("/admin/exams")}
                        className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-opacity-90 font-medium transition-colors"
                      >
                        Manage Exams
                      </button>
                      <button
                        onClick={() => navigate("/admin/users")}
                        className="px-4 py-2 border border-white border-opacity-30 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                      >
                        View Users
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {isLoadingStats ? (
                    Array(4)
                      .fill()
                      .map((_, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl border border-border p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-text-secondary mb-2">
                                {index === 0
                                  ? "Active Exams"
                                  : index === 1
                                  ? "Total Students"
                                  : index === 2
                                  ? "Questions"
                                  : "Submissions Today"}
                              </p>
                              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {index === 0 ? (
                                <CheckCircle className="w-5 h-5 text-gray-400" />
                              ) : index === 1 ? (
                                <Users className="w-5 h-5 text-gray-400" />
                              ) : index === 2 ? (
                                <BookOpen className="w-5 h-5 text-gray-400" />
                              ) : (
                                <BarChart3 className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <>
                      <div className="bg-white rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-text-secondary">
                              Active Exams
                            </p>
                            <p className="text-2xl font-bold text-text-primary">
                              {adminStats.activeExams}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-text-secondary">
                              Total Students
                            </p>
                            <p className="text-2xl font-bold text-text-primary">
                              {adminStats.totalStudents}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-text-secondary">
                              Questions
                            </p>
                            <p className="text-2xl font-bold text-text-primary">
                              {adminStats.totalQuestions}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-text-secondary">
                              Submissions Today
                            </p>
                            <p className="text-2xl font-bold text-text-primary">
                              {adminStats.submissionsToday}
                            </p>
                          </div>
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-yellow-600" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-border p-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => navigate("/admin/exams")}
                      className="p-4 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            Create Exam
                          </div>
                          <div className="text-xs text-text-secondary">
                            New practice exam
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => navigate("/admin/analytics")}
                      className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            View Analytics
                          </div>
                          <div className="text-xs text-text-secondary">
                            Performance reports
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/admin/notifications");
                      }}
                      className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Send className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            Send Notifications
                          </div>
                          <div className="text-xs text-text-secondary">
                            Exam reminders
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => navigate("/admin/users")}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            Manage Students
                          </div>
                          <div className="text-xs text-text-secondary">
                            User accounts
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                {/* Student Section */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-text-primary">
                    Available Practice Exams
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Your Progress Stats - Moved to top */}
                <div className="mb-8">
                  <h3 className="font-medium text-text-primary mb-4">
                    Your Progress
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-background-light rounded-lg border border-border">
                      <div className="text-lg font-bold text-primary mb-1">
                        {studentStats.completed}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Completed
                      </div>
                    </div>
                    <div className="p-3 bg-background-light rounded-lg border border-border">
                      <div className="text-lg font-bold text-yellow-600 mb-1">
                        {studentStats.inProgress}
                      </div>
                      <div className="text-xs text-text-secondary">
                        In Progress
                      </div>
                    </div>
                    <div className="p-3 bg-background-light rounded-lg border border-border">
                      <div className="text-lg font-bold text-blue-600 mb-1">
                        {studentStats.available}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Available
                      </div>
                    </div>
                    <div className="p-3 bg-background-light rounded-lg border border-border">
                      <div className="text-lg font-bold text-green-600 mb-1">
                        {studentStats.passed}
                      </div>
                      <div className="text-xs text-text-secondary">Passed</div>
                    </div>
                  </div>
                </div>

                {/* Exams List */}
                {isLoading ? (
                  <div className="py-12 text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-text-secondary">Loading exams...</p>
                  </div>
                ) : exams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onStart={handleStartExam}
                        isStarting={isStartingExam}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      No Exams Available
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Check back later for available practice exams.
                    </p>
                  </div>
                )}

                {/* Completed Exams Review Section */}
                {studentStats.completed > 0 && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="text-lg font-bold text-text-primary mb-4">
                      Recently Completed Exams
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {exams
                        .filter((e) => e.status === "COMPLETED")
                        .slice(0, 2)
                        .map((exam) => (
                          <div
                            key={exam.id}
                            className="border border-border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-text-primary">
                                {exam.title}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                                  exam.result?.score >= exam.passingScore
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {exam.result?.score >= exam.passingScore ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {exam.result?.score || 0}%
                              </span>
                            </div>

                            <div className="flex items-center gap-4 mb-4 text-sm">
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4 text-text-secondary" />
                                <span>{exam.totalQuestions} Questions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4 text-text-secondary" />
                                <span>{formatRank(exam.result?.rank)}</span>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div
                                className={`text-sm font-medium ${
                                  exam.result?.score >= exam.passingScore
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {exam.result?.score >= exam.passingScore
                                  ? "PASSED"
                                  : "FAILED"}
                              </div>
                              <div className="text-xs text-text-secondary">
                                Score: {exam.result?.score}% • Required:{" "}
                                {exam.passingScore}%
                              </div>
                              {exam.result?.rank && (
                                <div className="text-xs text-text-secondary">
                                  Achieved Rank: #{exam.result.rank}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleStartExam(exam)}
                              className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors text-sm font-medium"
                            >
                              Review Exam Details
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Profile Update Modal */}
      <ProfileUpdateModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={user?.profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};
