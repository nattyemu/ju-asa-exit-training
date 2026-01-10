import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { adminService } from "../../services/adminService";
import { examService } from "../../services/examService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Send,
  Bell,
  AlertCircle,
  Users,
  Mail,
  Clock,
  Calendar,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("examReminders");
  const [exams, setExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);

  // Exam Reminders State
  const [selectedExam, setSelectedExam] = useState("");

  // Unstarted Exam Reminders State
  const [selectedUnstartedExam, setSelectedUnstartedExam] = useState("");
  const [unstartedStats, setUnstartedStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeExamsWithStats, setActiveExamsWithStats] = useState([]);

  // System Announcement State
  const [announcementData, setAnnouncementData] = useState({
    title: "",
    message: "",
  });

  // Fetch exams when component mounts or tab changes
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoadingExams(true);
        const response = await examService.getAllExams(1, 100);

        if (response.data && response.data.success) {
          const examsData = response.data.data.exams || [];
          setExams(examsData);
        } else {
          toast.error("Failed to load exams: Invalid response from server");
        }
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
        } else if (error.response?.status === 403) {
          toast.error("You don't have permission to view exams.");
        } else if (error.response?.data?.message) {
          toast.error(`Failed to load exams: ${error.response.data.message}`);
        } else {
          toast.error("Failed to load exams. Please check your connection.");
        }
      } finally {
        setIsLoadingExams(false);
      }
    };

    if (activeTab === "examReminders" || activeTab === "unstartedReminders") {
      fetchExams();
    }
  }, [activeTab]);

  // Fetch unstarted stats when unstarted tab is active
  // Replace the entire useEffect for fetching unstarted stats with this:
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchUnstartedStats = async () => {
      if (activeTab === "unstartedReminders") {
        try {
          setIsLoadingStats(true);
          const response = await adminService.getUnstartedExamStats();

          if (!isMounted) return;

          if (response.data.success) {
            setUnstartedStats(response.data.data);

            // Update exams with student counts
            const activeExams = getActiveExams();
            const updatedExams = activeExams.map((exam) => {
              const stat = response.data.data.activeExams.find(
                (s) => s.examId === exam.id
              );
              return {
                ...exam,
                unstartedStudents: stat?.unstartedStudents || 0,
                startedStudents: stat?.startedStudents || 0,
              };
            });

            setActiveExamsWithStats(updatedExams);
          }
        } catch (error) {
          if (!isMounted || error.name === "AbortError") return;

          // console.error("Failed to fetch unstarted stats:", error);
          // If API fails, still show exams without counts
          setActiveExamsWithStats(getActiveExams());
        } finally {
          if (isMounted) {
            setIsLoadingStats(false);
          }
        }
      }
    };

    if (activeTab === "unstartedReminders") {
      fetchUnstartedStats();
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [activeTab, exams]);
  // Get upcoming exams (starting in next 24 hours)
  const getUpcomingExams = () => {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming = exams.filter((exam) => {
      if (!exam.isActive) return false;
      try {
        const examStart = new Date(exam.availableFrom);
        return examStart > now && examStart <= oneDayFromNow;
      } catch (error) {
        return false;
      }
    });

    return upcoming;
  };

  // Get currently active exams (available now)
  const getActiveExams = () => {
    const now = new Date();

    const active = exams.filter((exam) => {
      if (!exam.isActive) return false;
      try {
        const start = new Date(exam.availableFrom);
        const end = new Date(exam.availableUntil);
        return start <= now && end > now; // Available now
      } catch (error) {
        return false;
      }
    });

    return active;
  };

  // Handle sending exam reminders (24-hour)
  const handleSendExamReminders = async () => {
    try {
      setIsLoading(true);
      const examId = selectedExam === "" ? null : selectedExam;
      const response = await adminService.sendExamReminders(examId);

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to send reminders");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send exam reminders"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending unstarted exam reminders
  const handleSendUnstartedReminders = async () => {
    if (!selectedUnstartedExam) {
      toast.error("Please select an exam first");
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminService.sendUnstartedExamReminders(
        selectedUnstartedExam
      );

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || "Failed to send reminders");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send unstarted exam reminders"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending system announcement
  const handleSendSystemAnnouncement = async () => {
    if (!announcementData.title.trim() || !announcementData.message.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminService.sendSystemAnnouncement({
        ...announcementData,
        sentBy: user?.profile?.fullName || "System Admin",
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setAnnouncementData({ title: "", message: "" });
      } else {
        toast.error(response.data.message || "Failed to send announcement");
      }
    } catch (error) {
      toast.error("Failed to send system announcement");
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingExams = getUpcomingExams();
  const activeExams = getActiveExams();
  const displayExams =
    activeTab === "unstartedReminders"
      ? activeExamsWithStats.length > 0
        ? activeExamsWithStats
        : activeExams.map((exam) => ({
            ...exam,
            unstartedStudents: 0,
            startedStudents: 0,
          }))
      : [];

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  Notification Management
                </h1>
                <p className="text-sm text-text-secondary">
                  Send reminders and announcements to users
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="bg-white rounded-xl border border-border p-1 mb-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab("examReminders")}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "examReminders"
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" />
                  Exam Reminders (24h)
                </div>
              </button>
              <button
                onClick={() => setActiveTab("unstartedReminders")}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "unstartedReminders"
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Unstarted Exams
                </div>
              </button>
              <button
                onClick={() => setActiveTab("systemAnnouncement")}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "systemAnnouncement"
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  System Announcement
                </div>
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            {activeTab === "examReminders" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-2">
                    Send Exam Reminders (24-Hour)
                  </h2>
                  <p className="text-text-secondary mb-6">
                    Send email reminders to students who haven't taken upcoming
                    exams starting in the next 24 hours.
                  </p>

                  {/* Exam Statistics */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <h3 className="font-medium text-blue-800 mb-1">
                          Upcoming Exams (Next 24 Hours)
                        </h3>
                        {isLoadingExams ? (
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            <p className="text-sm text-blue-700">
                              Loading exams...
                            </p>
                          </div>
                        ) : upcomingExams.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-blue-700">
                              Found {upcomingExams.length} exam
                              {upcomingExams.length !== 1 ? "s" : ""} starting
                              soon:
                            </p>
                            <ul className="text-xs text-blue-600 space-y-1">
                              {upcomingExams.slice(0, 3).map((exam) => (
                                <li
                                  key={exam.id}
                                  className="flex items-center gap-2"
                                >
                                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                  <span className="flex-1">
                                    {exam.title} - Starts:{" "}
                                    {new Date(
                                      exam.availableFrom
                                    ).toLocaleString()}
                                  </span>
                                </li>
                              ))}
                              {upcomingExams.length > 3 && (
                                <li className="text-blue-500">
                                  + {upcomingExams.length - 3} more exams
                                </li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-blue-700">
                              {exams.length === 0
                                ? "No exams found in the system"
                                : "No exams starting in the next 24 hours"}
                            </p>
                            {exams.length > 0 && (
                              <p className="text-xs text-blue-600 mt-2">
                                Found {exams.length} total exams, but none are
                                starting in the next 24 hours. Check exam start
                                dates.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Select Exam (Optional)
                      </label>
                      <div className="relative">
                        <select
                          value={selectedExam}
                          onChange={(e) => {
                            setSelectedExam(e.target.value);
                          }}
                          disabled={
                            isLoadingExams || upcomingExams.length === 0
                          }
                          className="w-full p-3 bg-background-light border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            All Upcoming Exams (Next 24 Hours)
                          </option>
                          {isLoadingExams ? (
                            <option value="" disabled>
                              Loading exams...
                            </option>
                          ) : upcomingExams.length === 0 ? (
                            <option value="" disabled>
                              No upcoming exams found
                            </option>
                          ) : (
                            upcomingExams.map((exam) => (
                              <option key={exam.id} value={exam.id}>
                                {exam.title} -{" "}
                                {new Date(
                                  exam.availableFrom
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Africa/Nairobi",
                                  hour12: true,
                                })}{" "}
                                EAT
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <p className="text-xs text-text-secondary mt-2">
                        {selectedExam
                          ? `Reminders will be sent only for the selected exam`
                          : "Leave empty to send reminders for all exams starting in the next 24 hours"}
                      </p>
                    </div>

                    <button
                      onClick={handleSendExamReminders}
                      disabled={
                        isLoading ||
                        isLoadingExams ||
                        upcomingExams.length === 0
                      }
                      className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" />
                          Sending Reminders...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {upcomingExams.length === 0
                            ? "No Exams to Remind"
                            : "Send Exam Reminders"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "unstartedReminders" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-2">
                    Send Unstarted Exam Reminders
                  </h2>
                  <p className="text-text-secondary mb-6">
                    Send email reminders to active students who haven't started
                    a specific exam that is currently available.
                  </p>

                  {/* Active Exams Statistics */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-orange-800 mb-3">
                          Currently Active Exams
                        </h3>

                        {isLoadingExams || isLoadingStats ? (
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            <p className="text-sm text-orange-700">
                              Loading exams and student counts...
                            </p>
                          </div>
                        ) : displayExams.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-orange-700 mb-3">
                              Found {displayExams.length} exam
                              {displayExams.length !== 1 ? "s" : ""} currently
                              available:
                            </p>

                            {/* Scrollable list */}
                            <div className="max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                              <div className="space-y-2">
                                {displayExams.map((exam) => (
                                  <div
                                    key={exam.id}
                                    className={`p-3 rounded-lg border ${
                                      selectedUnstartedExam ===
                                      exam.id.toString()
                                        ? "bg-orange-100 border-orange-300"
                                        : "bg-white border-orange-100"
                                    } hover:bg-orange-50 transition-colors`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                          <input
                                            type="radio"
                                            id={`exam-${exam.id}`}
                                            name="unstartedExam"
                                            value={exam.id}
                                            checked={
                                              selectedUnstartedExam ===
                                              exam.id.toString()
                                            }
                                            onChange={(e) =>
                                              setSelectedUnstartedExam(
                                                e.target.value
                                              )
                                            }
                                            className="mt-1"
                                          />
                                          <div className="flex-1">
                                            <label
                                              htmlFor={`exam-${exam.id}`}
                                              className="font-medium text-sm text-gray-800 cursor-pointer block"
                                            >
                                              {exam.title}
                                            </label>
                                            <div className="flex flex-wrap gap-3 mt-1">
                                              <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3 text-gray-500" />
                                                <span className="text-xs text-gray-600">
                                                  {exam.unstartedStudents}{" "}
                                                  student
                                                  {exam.unstartedStudents !== 1
                                                    ? "s"
                                                    : ""}{" "}
                                                  not started
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-gray-500" />
                                                <span className="text-xs text-gray-600">
                                                  Available until:{" "}
                                                  {new Date(
                                                    exam.availableUntil
                                                  ).toLocaleDateString()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Scroll indicator */}
                            {displayExams.length > 3 && (
                              <div className="mt-2 text-center">
                                <p className="text-xs text-orange-500">
                                  Scroll to see all exams
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-orange-700">
                              {exams.length === 0
                                ? "No exams found in the system"
                                : "No exams currently active"}
                            </p>
                            {exams.length > 0 && (
                              <p className="text-xs text-orange-600 mt-2">
                                Found {exams.length} total exams, but none are
                                currently active.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Selected Exam
                      </label>
                      <div className="relative">
                        <select
                          value={selectedUnstartedExam}
                          onChange={(e) => {
                            setSelectedUnstartedExam(e.target.value);
                          }}
                          disabled={isLoadingExams || displayExams.length === 0}
                          className="w-full p-3 bg-background-light border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            Select an exam from the list above...
                          </option>
                          {displayExams.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedUnstartedExam && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-text-secondary">
                            This will send reminders to students who haven't
                            started this exam yet.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {displayExams.find(
                                (e) => e.id.toString() === selectedUnstartedExam
                              )?.unstartedStudents || 0}{" "}
                              students will receive this notification
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSendUnstartedReminders}
                      disabled={
                        isLoading || isLoadingExams || !selectedUnstartedExam
                      }
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" />
                          Sending Reminders...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Notify Unstarted Students
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "systemAnnouncement" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-2">
                    Send System Announcement
                  </h2>
                  <p className="text-text-secondary mb-6">
                    Send an announcement to all active users in the system.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Announcement Title
                      </label>
                      <input
                        type="text"
                        value={announcementData.title}
                        onChange={(e) =>
                          setAnnouncementData({
                            ...announcementData,
                            title: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-background-light border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="e.g., System Maintenance Notice"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Announcement Message
                      </label>
                      <textarea
                        value={announcementData.message}
                        onChange={(e) =>
                          setAnnouncementData({
                            ...announcementData,
                            message: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-background-light border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[150px] resize-none"
                        placeholder="Type your announcement message here..."
                        maxLength={1000}
                      />
                      <p className="text-xs text-text-secondary mt-2">
                        This message will be sent to all active users via email.
                      </p>
                    </div>

                    <button
                      onClick={handleSendSystemAnnouncement}
                      disabled={
                        isLoading ||
                        !announcementData.title.trim() ||
                        !announcementData.message.trim()
                      }
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" />
                          Sending Announcement...
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          Send System Announcement
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Information Panel */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary mb-2">
                  How Notifications Work
                </h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                    <span>
                      <strong>Exam Reminders (24 hours):</strong> Sent to
                      students who haven't taken exams starting in the next 24
                      hours
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5"></div>
                    <span>
                      <strong>Unstarted Exam Reminders:</strong> Sent to active
                      students who haven't started a specific exam that is
                      currently available
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5"></div>
                    <span>
                      <strong>System Announcements:</strong> Sent to all active
                      users for important updates
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
