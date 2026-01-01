import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { examService } from "../services/examService";
import { exportService } from "../services/exportService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  Trophy,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  BarChart3,
  Download,
  Filter,
  ArrowLeft,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";

export const ResultsPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadResult();
    loadRankings();
  }, [examId]);

  const loadResult = async () => {
    try {
      setLoading(true);
      const response = await examService.getResult(examId);
      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load result:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRankings = async () => {
    try {
      const response = await examService.getRankings(examId, 10);
      if (response.data.success) {
        setRankings(response.data.data.rankings);
      }
    } catch (error) {
      console.error("Failed to load rankings:", error);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const response = await exportService.exportExamResults(examId);
      exportService.downloadBlob(response.data, `Exam-Results-${examId}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export results. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No results found
          </h3>
          <p className="text-text-secondary mb-6">
            You haven't taken this exam yet.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { exam, review, comparison, answers, subjectAnalysis } = result;
  const passed = result.result.performance === "PASS";
  const score = result.result.score;
  const percentile = result.result.percentile;

  // Filter answers based on settings
  const filteredAnswers = answers.filter((answer) => {
    if (showIncorrectOnly && answer.isCorrect) return false;
    if (selectedSubject && answer.question.subject !== selectedSubject)
      return false;
    return true;
  });

  // Get unique subjects for filter
  const subjects = [...new Set(answers.map((a) => a.question.subject))];

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  Exam Results
                </h1>
                <p className="text-sm text-text-secondary">
                  {exam.title} •{" "}
                  {format(new Date(review.submittedAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showAnswers ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showAnswers ? "Hide Answers" : "Show Answers"}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Score Card & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Card */}
            <div
              className={`rounded-xl p-6 border-2 ${
                passed
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="text-center mb-6">
                <div
                  className={`w-20 h-20 rounded-full ${
                    passed ? "bg-green-100" : "bg-red-100"
                  } flex items-center justify-center mx-auto mb-4`}
                >
                  {passed ? (
                    <Trophy className="w-10 h-10 text-green-600" />
                  ) : (
                    <Award className="w-10 h-10 text-red-600" />
                  )}
                </div>
                <div className="text-4xl font-bold mb-2">{score}%</div>
                <div
                  className={`text-lg font-semibold ${
                    passed ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {passed ? "PASSED" : "FAILED"}
                </div>
                <p className="text-sm text-text-secondary mt-2">
                  Passing Score: {exam.passingScore}%
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Rank</span>
                  <span className="font-semibold text-text-primary">
                    #{result.result.rank}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Percentile</span>
                  <span className="font-semibold text-text-primary">
                    {percentile}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Time Spent</span>
                  <span className="font-semibold text-text-primary">
                    {review.timeSpent}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Date Submitted</span>
                  <span className="font-semibold text-text-primary">
                    {format(new Date(review.submittedAt), "MMM d, HH:mm")}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Breakdown
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Correct Answers</span>
                    <span className="font-medium text-text-primary">
                      {review.correctAnswers}/{review.totalQuestions}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${
                          (review.correctAnswers / review.totalQuestions) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">
                      Incorrect Answers
                    </span>
                    <span className="font-medium text-text-primary">
                      {review.incorrectAnswers}/{review.totalQuestions}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${
                          (review.incorrectAnswers / review.totalQuestions) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Time Usage</span>
                    <span className="font-medium text-text-primary">
                      {review.timePercentage}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: review.timePercentage }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Stats */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-medium text-text-primary mb-4">Comparison</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Exam Average</span>
                  <span className="font-semibold text-text-primary">
                    {comparison.examAverage}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">
                    Total Participants
                  </span>
                  <span className="font-semibold text-text-primary">
                    {comparison.totalParticipants}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">
                    You Scored Better Than
                  </span>
                  <span className="font-semibold text-text-primary">
                    {comparison.betterThan}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Question Review */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                <h2 className="text-xl font-bold text-text-primary">
                  Question Review
                </h2>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowIncorrectOnly(!showIncorrectOnly)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      showIncorrectOnly
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    {showIncorrectOnly ? "Showing Incorrect Only" : "Show All"}
                  </button>

                  {subjects.length > 0 && (
                    <select
                      value={selectedSubject || ""}
                      onChange={(e) =>
                        setSelectedSubject(e.target.value || null)
                      }
                      className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Subject Performance */}
              {subjectAnalysis && subjectAnalysis.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-text-primary mb-3">
                    Subject Performance
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {subjectAnalysis.map((subject) => (
                      <div
                        key={subject.subject}
                        className="bg-gray-50 rounded-lg p-3 border border-border"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm text-text-primary">
                            {subject.subject}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              subject.percentage >= 70
                                ? "text-green-600"
                                : subject.percentage >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {subject.percentage}%
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary">
                          {subject.correctAnswers}/{subject.totalQuestions}{" "}
                          correct
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {filteredAnswers.length > 0 ? (
                  filteredAnswers.map((answer, index) => (
                    <div
                      key={answer.questionId}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <div
                        className={`p-4 ${
                          answer.isCorrect ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">
                              Q{index + 1}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              {answer.question.subject}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                answer.question.difficulty === "HARD"
                                  ? "bg-red-100 text-red-800"
                                  : answer.question.difficulty === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {answer.question.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {answer.isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span
                              className={`font-medium ${
                                answer.isCorrect
                                  ? "text-green-700"
                                  : "text-red-700"
                              }`}
                            >
                              {answer.isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                        </div>

                        <p className="text-text-primary mb-4">
                          {answer.question.questionText}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {["A", "B", "C", "D"].map((option) => {
                            const isCorrect =
                              option === answer.question.correctAnswer;
                            const isChosen = option === answer.chosenAnswer;

                            let bgColor = "bg-white";
                            let borderColor = "border-gray-200";
                            let textColor = "text-text-primary";

                            if (showAnswers && isCorrect) {
                              bgColor = "bg-green-100";
                              borderColor = "border-green-300";
                            } else if (isChosen) {
                              bgColor = answer.isCorrect
                                ? "bg-green-100"
                                : "bg-red-100";
                              borderColor = answer.isCorrect
                                ? "border-green-300"
                                : "border-red-300";
                              textColor = answer.isCorrect
                                ? "text-green-800"
                                : "text-red-800";
                            }

                            return (
                              <div
                                key={option}
                                className={`p-3 border rounded-lg ${bgColor} ${borderColor} ${textColor}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-medium ${
                                      isChosen
                                        ? answer.isCorrect
                                          ? "bg-green-600 text-white"
                                          : "bg-red-600 text-white"
                                        : showAnswers && isCorrect
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {option}
                                  </div>
                                  <span className="text-sm">
                                    {answer.question[`option${option}`]}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {answer.question.explanation && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Explanation
                              </span>
                            </div>
                            <p className="text-sm text-blue-700">
                              {answer.question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      No questions to review
                    </h3>
                    <p className="text-text-secondary">
                      {showIncorrectOnly
                        ? "You answered all questions correctly!"
                        : "Select different filters to see questions."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rankings Section */}
            {rankings.length > 0 && (
              <div className="mt-8">
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-text-primary mb-6">
                    Top Rankings
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                            Rank
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                            Student
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                            Score
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                            Time
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                            Submitted
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankings.map((ranking, index) => (
                          <tr
                            key={ranking.student.id}
                            className={`border-b border-border hover:bg-gray-50 ${
                              ranking.student.id === user?.id
                                ? "bg-primary/5"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {ranking.rank <= 3 ? (
                                  <Trophy
                                    className={`w-5 h-5 ${
                                      ranking.rank === 1
                                        ? "text-yellow-500"
                                        : ranking.rank === 2
                                        ? "text-gray-400"
                                        : "text-amber-700"
                                    }`}
                                  />
                                ) : (
                                  <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">
                                    {ranking.rank}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-text-primary">
                                  {ranking.student.profile?.fullName ||
                                    "Unknown"}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  {ranking.student.profile?.department ||
                                    "No department"}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-text-primary">
                                {ranking.score}%
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 text-sm text-text-secondary">
                                <Clock className="w-3 h-3" />
                                {ranking.timeSpent} min
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-text-secondary">
                                {format(
                                  new Date(ranking.submittedAt),
                                  "MMM d, HH:mm"
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {result.result.rank > 10 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-text-primary">
                            Your Position
                          </div>
                          <div className="text-sm text-text-secondary">
                            Overall ranking
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          #{result.result.rank}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
