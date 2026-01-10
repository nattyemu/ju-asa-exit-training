import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { examService } from "../services/examService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  Trophy,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  BarChart3,
  Filter,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  shuffleQuestionOptions,
  mapOriginalToShuffled,
} from "../utils/shuffleUtils";

export const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);

  const { examData, resultData } = location.state || {};

  const loadResults = async () => {
    try {
      setLoading(true);

      if (examData?.id) {
        await loadResultFromApi(examData.id);
      } else {
        const examId = location.pathname.split("/").pop();
        if (examId && examId !== "results") {
          await loadResultFromApi(examId);
        }
      }
    } catch (error) {
      // console.error("Failed to load results:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadResultFromApi = async (examId) => {
    try {
      const response = await examService.getDetailedResult(examId);

      if (response.data?.success) {
        const apiData = response.data.data;

        const formattedResult = {
          ...apiData,
          result: apiData.result || {},
          exam: apiData.exam || {},
          session: apiData.session || {},
          review: apiData.review || {
            totalQuestions: 0,
            answeredQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            unansweredQuestions: 0,
            score: "0%",
            timeSpent: "N/A",
            timePercentage: "N/A",
          },
          comparison: apiData.comparison || {
            examAverage: "N/A",
            totalParticipants: 0,
            betterThan: "N/A",
          },
          answers: apiData.answers || [],
          subjectAnalysis: apiData.subjectAnalysis || [],
          hasAnswers: apiData.hasAnswers || false,
          isComplete: apiData.isComplete || false,
          submissionStatus: apiData.submissionStatus || "unknown",
        };

        setResult(formattedResult);

        // Shuffle answers for display using the same userId
        if (formattedResult.answers.length > 0 && user?.id) {
          const shuffled = formattedResult.answers.map((answer) => {
            try {
              const shuffledData = shuffleQuestionOptions(
                answer.question,
                user.id,
                answer.questionId
              );

              return {
                ...answer,
                shuffledOptions: shuffledData.shuffledOptions,
                optionMapping: shuffledData.optionMapping,
                displayChosenAnswer: mapOriginalToShuffled(
                  answer.chosenAnswer,
                  shuffledData.optionMapping
                ),
                displayCorrectAnswer: mapOriginalToShuffled(
                  answer.question.correctAnswer,
                  shuffledData.optionMapping
                ),
              };
            } catch (error) {
              // console.error("Error shuffling answer:", error);
              return {
                ...answer,
                shuffledOptions: [
                  { key: "A", value: answer.question.optionA },
                  { key: "B", value: answer.question.optionB },
                  { key: "C", value: answer.question.optionC },
                  { key: "D", value: answer.question.optionD },
                ],
                displayChosenAnswer: answer.chosenAnswer,
                displayCorrectAnswer: answer.question.correctAnswer,
              };
            }
          });
          setShuffledAnswers(shuffled);
        } else {
          setShuffledAnswers(formattedResult.answers);
        }

        loadRankings(examId);
      }
    } catch (error) {
      // console.error("Failed to load result from API:", error);

      if (error.response?.status === 404) {
        if (examData && resultData) {
          const mockResult = createMockResultFromState();
          setResult(mockResult);
          setShuffledAnswers([]);
        } else {
          toast.error("Exam results not found");
        }
      } else {
        // toast.error("Failed to load exam results");
      }
    }
  };

  const createMockResultFromState = () => {
    return {
      result: {
        ...resultData,
        rank: resultData?.rank || 0,
        performance:
          resultData?.score >= examData?.passingScore ? "PASS" : "FAIL",
        percentile: "N/A",
      },
      exam: {
        id: examData?.id,
        title: examData?.title || "Exam",
        totalQuestions: examData?.totalQuestions || 0,
        passingScore: examData?.passingScore || 70,
        duration: examData?.duration || 60,
      },
      session: {
        startedAt: resultData?.submittedAt || new Date().toISOString(),
        submittedAt: resultData?.submittedAt || new Date().toISOString(),
        timeSpent: "N/A",
        isAutoSubmitted: true,
        submissionType: "auto",
      },
      review: {
        totalQuestions: examData?.totalQuestions || 0,
        answeredQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        unansweredQuestions: examData?.totalQuestions || 0,
        score: `${resultData?.score || 0}%`,
        timeSpent: "N/A",
        timePercentage: "N/A",
        submittedAt: resultData?.submittedAt || new Date().toISOString(),
      },
      comparison: {
        examAverage: "N/A",
        totalParticipants: "N/A",
        betterThan: "N/A",
      },
      answers: [],
      subjectAnalysis: [],
      hasAnswers: false,
      isComplete: false,
      submissionStatus: "auto_submitted",
    };
  };

  const loadRankings = async (examId) => {
    try {
      const response = await examService.getRankings(examId, 10);
      if (response.data?.success) {
        setRankings(response.data.data.rankings);
      }
    } catch (error) {
      // console.error("Failed to load rankings:", error);
    }
  };

  useEffect(() => {
    loadResults();
  }, [location]);

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
            You haven't taken this exam yet or the results are not available.
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

  const {
    exam,
    review,
    comparison,
    subjectAnalysis,
    session,
    hasAnswers,
    isComplete,
    submissionStatus,
  } = result;

  const passed = result?.result?.performance === "PASS";
  const score = result?.result?.score || 0;
  const percentile = result?.result?.percentile || "N/A";
  const isAutoSubmitted =
    session?.isAutoSubmitted || submissionStatus === "auto_submitted";

  const formatRank = (rank) => {
    if (!rank || rank === 0 || rank === "N/A") {
      return (
        <span className="flex items-center gap-1">
          <HelpCircle className="w-4 h-4" />
          <span>Not Available</span>
        </span>
      );
    }
    return `#${rank}`;
  };

  const filteredAnswers = shuffledAnswers.filter((answer) => {
    if (showIncorrectOnly && answer.isCorrect) return false;
    if (selectedSubject && answer.question?.subject !== selectedSubject)
      return false;
    return true;
  });

  const subjects = [
    ...new Set(shuffledAnswers.map((a) => a.question?.subject).filter(Boolean)),
  ];

  return (
    <div className="min-h-screen bg-background-light">
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
                  {exam?.title} •{" "}
                  {format(
                    new Date(review?.submittedAt || new Date()),
                    "MMM d, yyyy hh:mm a"
                  )}
                  {isAutoSubmitted && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Auto-Submitted
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                {showAnswers ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showAnswers ? "Hide Answers" : "Show Answers"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
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
                  Passing Score: {exam?.passingScore}%
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Rank
                  </span>
                  <span className="font-semibold text-text-primary">
                    {formatRank(result?.result?.rank)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Percentile</span>
                  <span className="font-semibold text-text-primary">
                    {percentile !== "N/A" ? `${percentile}` : "Calculating..."}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time Spent
                  </span>
                  <span className="font-semibold text-text-primary">
                    {review?.timeSpent || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Submission</span>
                  <span className="font-semibold text-text-primary">
                    {isAutoSubmitted ? "Auto" : "Manual"}
                  </span>
                </div>
              </div>

              {!hasAnswers && isAutoSubmitted && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Exam Auto-Submitted
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This exam was automatically submitted due to time
                        expiration.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                      {review?.correctAnswers || 0}/
                      {review?.totalQuestions || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${
                          ((review?.correctAnswers || 0) /
                            (review?.totalQuestions || 1)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">
                      Answered Questions
                    </span>
                    <span className="font-medium text-text-primary">
                      {review?.answeredQuestions || 0}/
                      {review?.totalQuestions || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${
                          ((review?.answeredQuestions || 0) /
                            (review?.totalQuestions || 1)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {!isComplete && review?.answeredQuestions > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      You answered {review.answeredQuestions} out of{" "}
                      {review.totalQuestions} questions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!showAnswers && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Click "Show Answers" to Review
                </h3>
                <p className="text-sm text-text-secondary">
                  Click the "Show Answers" button above to see:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Correct answers (marked in green)
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-blue-500" />
                    Explanations for learning
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    Question Review
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    {shuffledAnswers.length} questions •{" "}
                    <span className="font-medium">
                      {showAnswers
                        ? "Answers & explanations visible"
                        : "Click 'Show Answers' for correct answers"}
                    </span>
                  </p>
                </div>

                {shuffledAnswers.length > 0 && (
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
                      {showIncorrectOnly
                        ? "Showing Incorrect Only"
                        : "Show All Questions"}
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
                )}
              </div>

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
                        <div className="text-xs text-text-secondary space-y-1">
                          <div>
                            {subject.correctAnswers}/{subject.answeredQuestions}{" "}
                            correct
                          </div>
                          <div>{subject.unansweredQuestions} unanswered</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredAnswers.length > 0 ? (
                  filteredAnswers.map((answer, index) => (
                    <div
                      key={answer.questionId}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <div
                        className={`p-4 ${
                          answer.isAnswered
                            ? answer.isCorrect
                              ? "bg-green-50"
                              : "bg-red-50"
                            : "bg-gray-50"
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
                            {!answer.isAnswered && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                                Not Answered
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {answer.isAnswered ? (
                              answer.isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                            <span
                              className={`font-medium ${
                                answer.isAnswered
                                  ? answer.isCorrect
                                    ? "text-green-700"
                                    : "text-red-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {answer.isAnswered
                                ? answer.isCorrect
                                  ? "Correct"
                                  : "Incorrect"
                                : "Not Answered"}
                            </span>
                          </div>
                        </div>

                        <p className="text-text-primary mb-6 text-lg">
                          {answer.question.questionText}
                        </p>

                        {/* Options - ALWAYS VISIBLE (SHUFFLED) */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-text-secondary mb-3">
                            Options:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(
                              answer.shuffledOptions || [
                                { key: "A", value: answer.question.optionA },
                                { key: "B", value: answer.question.optionB },
                                { key: "C", value: answer.question.optionC },
                                { key: "D", value: answer.question.optionD },
                              ]
                            ).map((option) => {
                              const isCorrectAnswer =
                                option.key === answer.displayCorrectAnswer;
                              const isChosen =
                                option.key === answer.displayChosenAnswer;
                              const isUnanswered = !answer.isAnswered;
                              const isShowingCorrect =
                                showAnswers && isCorrectAnswer;

                              return (
                                <div
                                  key={option.key}
                                  className={`p-3 border rounded-lg transition-all duration-200 ${
                                    isShowingCorrect
                                      ? "bg-green-50 border-green-300 shadow-sm"
                                      : isChosen
                                      ? "bg-blue-50 border-blue-300"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center font-medium ${
                                        isShowingCorrect
                                          ? "bg-green-600 text-white"
                                          : isChosen
                                          ? "bg-blue-600 text-white"
                                          : "bg-gray-200 text-gray-700"
                                      }`}
                                    >
                                      {option.key}
                                    </div>
                                    <div className="flex-1">
                                      <span
                                        className={`text-sm ${
                                          isShowingCorrect
                                            ? "text-green-800 font-medium"
                                            : isChosen
                                            ? "text-blue-800 font-medium"
                                            : "text-text-primary"
                                        }`}
                                      >
                                        {option.value}
                                      </span>
                                      <div className="flex items-center gap-1 mt-1">
                                        {isChosen && (
                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded flex items-center gap-1">
                                            <CheckSquare className="w-3 h-3" />
                                            Your Answer
                                          </span>
                                        )}
                                        {isShowingCorrect && (
                                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Correct Answer
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation - Only show when Show Answers is clicked */}
                        {showAnswers && answer.question.explanation && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Explanation
                              </span>
                            </div>
                            <p className="text-sm text-blue-700">
                              {answer.question.explanation}
                            </p>
                          </div>
                        )}

                        {/* Status message for unanswered questions */}
                        {!answer.isAnswered && isAutoSubmitted && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-yellow-700">
                                This question was not answered.{" "}
                                {showAnswers
                                  ? "Correct answer is highlighted in green above."
                                  : "Click 'Show Answers' to see the correct answer."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : shuffledAnswers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      No Questions Available
                    </h3>
                    <p className="text-text-secondary mb-4 max-w-md mx-auto">
                      Questions are not available for review at this time.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                      <p className="text-sm text-blue-700">
                        <strong>Your Score:</strong> {score}% •{" "}
                        <strong>Result:</strong> {passed ? "PASSED" : "FAILED"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      No questions match your filters
                    </h3>
                    <p className="text-text-secondary">
                      Try changing your filter settings to see questions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
