import { useState, useEffect } from "react";
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  BarChart3,
  Calendar,
  BookOpen,
  Trophy,
  Star,
  Zap,
} from "lucide-react";
import { examService } from "../../services/examService";
import { LoadingSpinner } from "../common/LoadingSpinner";

export const ProgressDashboard = () => {
  const [progress, setProgress] = useState(null);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  useEffect(() => {
    loadProgressData();
  }, [timeRange]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      // Load multiple data sources
      const [progressRes, subjectsRes] = await Promise.all([
        examService.getResultHistory(),
        examService.getSubjectPerformance(),
      ]);

      if (progressRes.data.success) {
        setProgress(progressRes.data.data);
      }

      if (subjectsRes.data.success) {
        setSubjectPerformance(subjectsRes.data.data.subjects || []);
      }
    } catch (error) {
      console.error("Failed to load progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock achievements for demo
  const achievements = [
    {
      id: 1,
      title: "First Exam",
      description: "Completed your first practice exam",
      icon: Trophy,
      earned: true,
    },
    {
      id: 2,
      title: "Perfect Score",
      description: "Achieved 100% on any exam",
      icon: Star,
      earned: false,
    },
    {
      id: 3,
      title: "Speed Demon",
      description: "Complete exam in half the time",
      icon: Zap,
      earned: true,
    },
    {
      id: 4,
      title: "Consistent Performer",
      description: "Score above 80% on 5 exams",
      icon: TrendingUp,
      earned: false,
    },
  ];

  if (loading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-secondary">Loading your progress...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">My Progress</h2>
          <p className="text-sm text-text-secondary">
            Track your performance and achievements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-secondary" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary">Exams Taken</p>
              <p className="text-2xl font-bold text-text-primary">
                {progress?.results?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            <span className="text-green-600 font-medium">↑ 2 this month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary">Avg Score</p>
              <p className="text-2xl font-bold text-text-primary">
                {progress?.results?.length
                  ? Math.round(
                      progress.results.reduce(
                        (sum, r) => sum + r.result.score,
                        0
                      ) / progress.results.length
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            <span className="text-green-600 font-medium">↑ 5.2%</span>{" "}
            improvement
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary">Study Time</p>
              <p className="text-2xl font-bold text-text-primary">
                {progress?.results?.length
                  ? progress.results.reduce(
                      (sum, r) => sum + (r.result.timeSpent || 0),
                      0
                    )
                  : 0}
                m
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            Total time spent on exams
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary">Achievements</p>
              <p className="text-2xl font-bold text-text-primary">
                {achievements.filter((a) => a.earned).length}/
                {achievements.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            Unlocked {achievements.filter((a) => a.earned).length} badges
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      {subjectPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h3 className="font-medium text-text-primary mb-6">
            Subject Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectPerformance.map((subject, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-text-primary">
                    {subject.subject}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      subject.accuracy >= 80
                        ? "text-green-600"
                        : subject.accuracy >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {subject.accuracy}%
                  </div>
                </div>
                <div className="text-sm text-text-secondary mb-3">
                  {subject.correctAnswers}/{subject.totalQuestions} correct
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        subject.accuracy >= 80
                          ? "bg-green-500"
                          : subject.accuracy >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${subject.accuracy}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-text-secondary w-12 text-right">
                    {subject.accuracy}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Exams */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3 className="font-medium text-text-primary mb-6">
          Recent Exam Results
        </h3>
        {progress?.results?.length ? (
          <div className="space-y-4">
            {progress.results.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-text-primary">
                    {result.exam.title}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Completed:{" "}
                    {new Date(result.session.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div
                      className={`text-xl font-bold ${
                        result.result.score >= result.exam.passingScore
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {result.result.score}%
                    </div>
                    <div className="text-xs text-text-secondary">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-text-primary">
                      #{result.result.rank}
                    </div>
                    <div className="text-xs text-text-secondary">Rank</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-text-primary">
                      {result.result.timeSpent}m
                    </div>
                    <div className="text-xs text-text-secondary">Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-text-secondary">
              No exam results yet. Start practicing!
            </p>
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-medium text-text-primary mb-6">Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={`border rounded-lg p-4 transition-all ${
                  achievement.earned
                    ? "border-green-200 bg-green-50 hover:bg-green-100"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      achievement.earned
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {achievement.title}
                    </div>
                    <div
                      className={`text-xs ${
                        achievement.earned ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      {achievement.earned ? "Earned" : "Locked"}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">
                  {achievement.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
