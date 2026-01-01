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

  // System Announcement State
  const [announcementData, setAnnouncementData] = useState({
    title: "",
    message: "",
  });

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    examsCount: 0,
    upcomingExamsCount: 0,
    endingExamsCount: 0,
    selectedExam: "",
    lastApiCall: null,
    apiResponse: null,
  });

  // Fetch exams when component mounts
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoadingExams(true);

        const response = await examService.getAllExams(1, 100);

        if (response.data && response.data.success) {
          const examsData = response.data.data.exams || [];
          setExams(examsData);

          // Update debug info
          const now = new Date();
          const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

          const upcoming = examsData.filter((exam) => {
            if (!exam.isActive) return false;
            const examStart = new Date(exam.availableFrom);
            return examStart > now && examStart <= oneDayFromNow;
          });

          setDebugInfo((prev) => ({
            ...prev,
            examsCount: examsData.length,
            upcomingExamsCount: upcoming.length,
            lastApiCall: new Date().toISOString(),
          }));
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

    if (activeTab === "examReminders") {
      fetchExams();
    }
  }, [activeTab]);

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

  // Handle sending exam reminders
  const handleSendExamReminders = async () => {
    try {
      setIsLoading(true);

      const examId = selectedExam === "" ? null : selectedExam;
      const response = await adminService.sendExamReminders(examId);

      if (response.data.success) {
        toast.success(response.data.message);
        setDebugInfo((prev) => ({
          ...prev,
          selectedExam: examId || "all",
          apiResponse: response.data,
        }));
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
          {/* Tabs - REMOVED DEADLINE WARNINGS TAB */}
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
                  Exam Reminders
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
                    Send Exam Reminders
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

          {/* Information Panel - UPDATED TO REMOVE DEADLINE WARNINGS */}
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
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
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
