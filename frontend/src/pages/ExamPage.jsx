import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useExam } from "../contexts/ExamContext";
import { examService } from "../services/examService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { QuestionCard } from "../components/student/QuestionCard";
import { QuestionNavigation } from "../components/student/QuestionNavigation";
import { Timer } from "../components/student/Timer";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

export const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentExam,
    currentSession,
    questions = [],
    answers = {},
    timeLeft,
    isLoading: examContextLoading,
    needsAutoSubmit,
    saveAnswer,
    saveAllAnswers,
    submitExam,
    cancelExam,
    updateTime,
    handleAutoSubmit,
    hasActiveSession,
    loadActiveSession,
  } = useExam();

  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [examExpired, setExamExpired] = useState(false);
  const [showFiveMinWarning, setShowFiveMinWarning] = useState(false);
  const timeExpiredToastShown = useRef(false);

  // Track if we've already loaded to prevent infinite loops
  const hasLoadedRef = useRef(false);

  // Get current question safely
  const currentQuestion = questions?.[currentQuestionIndex];

  // Convert timeLeft object to seconds for Timer component
  const remainingTimeInSeconds =
    timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;

  // Reset states when exam changes
  useEffect(() => {
    timeExpiredToastShown.current = false;
    setShowFiveMinWarning(false);
    hasLoadedRef.current = false; // Reset when examId changes
  }, [examId]);

  // Handle exam time up
  const handleExamTimeUp = useCallback(async () => {
    if (
      !currentSession?.id ||
      examContextLoading ||
      timeExpiredToastShown.current
    )
      return;

    try {
      timeExpiredToastShown.current = true;
      toast.error("Exam time has expired. Submitting automatically...");

      const result = await handleAutoSubmit();
      if (result.success) {
        // Redirect happens in handleAutoSubmit
      }
    } catch (error) {
      console.error("Time up handler error:", error);
    }
  }, [currentSession, examContextLoading, handleAutoSubmit]);

  // Main exam loading logic - FIXED DEPENDENCIES
  useEffect(() => {
    // Skip if already loading or already loaded this session
    if (hasLoadedRef.current && currentSession?.examId === parseInt(examId)) {
      console.log("🔄 ExamPage: Already loaded, skipping");
      return;
    }

    const loadExam = async () => {
      if (!examId || user?.role !== "STUDENT") {
        navigate("/dashboard");
        return;
      }

      try {
        setIsLoading(true);
        console.log("📱 ExamPage: Loading exam", examId);

        // If we already have the session in context, use it
        if (currentSession && currentSession.examId === parseInt(examId)) {
          console.log("✅ ExamPage: Using existing session from context");
          setSessionChecked(true);
          hasLoadedRef.current = true;
          return;
        }

        // No session in context, try to load it
        console.log("⚠️ ExamPage: Loading session...");

        // First try to get from API
        try {
          const activeResponse = await examService.getActiveSession();

          if (activeResponse.data.success) {
            const sessionData = activeResponse.data.data;

            // Verify it's the correct exam
            if (sessionData.session.examId !== parseInt(examId)) {
              console.log("❌ ExamPage: Wrong exam, redirecting...");
              toast.error("You have an active session for a different exam");
              navigate(`/exam/${sessionData.session.examId}`);
              return;
            }

            console.log("✅ ExamPage: Found session, loading into context");
            // Load into context (but only if not already loading)
            if (!examContextLoading) {
              await loadActiveSession();
            }

            setSessionChecked(true);
            hasLoadedRef.current = true;
            return;
          }
        } catch (sessionError) {
          console.log("📭 ExamPage: No active session via API");

          if (sessionError.response?.status === 404) {
            // Check if exam is completed
            try {
              const examResponse = await examService.getExamDetails(examId);
              if (
                examResponse.data.success &&
                examResponse.data.data?.status === "COMPLETED"
              ) {
                toast.info(
                  "This exam is already completed. Showing results..."
                );
                navigate(`/results/${examId}`);
                return;
              }
            } catch (examError) {
              console.log("Could not check exam status:", examError);
            }

            toast.error(
              "No active exam session found. Please start from dashboard."
            );
            navigate("/dashboard");
            return;
          }
        }

        // Generic error
        toast.error("Failed to load exam session. Please try again.");
        navigate("/dashboard");
      } catch (error) {
        console.error("❌ ExamPage: Failed to load exam:", error);

        if (error.response?.status === 404) {
          toast.error("Exam session not found. Please start from dashboard.");
          navigate("/dashboard");
        } else {
          toast.error("Failed to load exam. Please try again.");
          navigate("/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadExam();

    // Cleanup function
    return () => {
      // Don't reset hasLoadedRef here - we want to remember we loaded this session
    };
  }, [
    examId,
    user,
    currentSession,
    examContextLoading,
    navigate,
    loadActiveSession,
  ]);

  // Timer effect - FIXED: Remove sessionChecked dependency to prevent loops
  useEffect(() => {
    if (remainingTimeInSeconds <= 0 || !currentSession || examExpired) return;

    const timerInterval = setInterval(() => {
      const newSeconds = remainingTimeInSeconds - 1;

      // Show 5-minute warning
      if (newSeconds === 300 && !showFiveMinWarning) {
        setShowFiveMinWarning(true);
        toast.warning("Only 5 minutes left! Submit your answers soon.", {
          duration: 5000,
        });
      }

      if (newSeconds <= 0) {
        clearInterval(timerInterval);
        handleExamTimeUp();
        updateTime({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(newSeconds / 3600);
        const minutes = Math.floor((newSeconds % 3600) / 60);
        const seconds = newSeconds % 60;
        updateTime({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [
    remainingTimeInSeconds,
    currentSession,
    updateTime,
    examExpired,
    handleExamTimeUp,
    showFiveMinWarning,
  ]);

  // Save answers on page unload
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (currentSession?.id) {
        // Try to save all answers before page closes
        await saveAllAnswers();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentSession, saveAllAnswers]);

  const handleAnswerSelect = async (chosenAnswer) => {
    if (!currentSession?.id || !currentQuestion || examExpired) {
      toast.error("Cannot save answer - exam session not active");
      return;
    }

    try {
      setIsSavingAnswer(true);

      const normalizedAnswer = chosenAnswer.toUpperCase();
      const result = await saveAnswer(
        currentQuestion.id,
        normalizedAnswer,
        true
      );

      if (!result.success) {
        if (result.timeExpired) {
          if (!timeExpiredToastShown.current) {
            timeExpiredToastShown.current = true;
            toast.error(result.message);
            handleExamTimeUp();
          }
        } else if (!result.message.includes("auto-save")) {
          toast.error(result.message || "Failed to save answer");
        }
      }
    } catch (error) {
      console.error("Failed to save answer:", error);

      if (error.response?.status === 400 && error.response.data.timeExpired) {
        if (!timeExpiredToastShown.current) {
          timeExpiredToastShown.current = true;
          toast.error("Exam time has expired. Auto-submitting...");
          handleExamTimeUp();
        }
        return;
      }

      if (error.response?.status === 404) {
        if (error.response.data.message?.includes("exam session")) {
          toast.error("Exam session expired. Please start again.");
          navigate("/dashboard");
          return;
        }
      }

      toast.error("Failed to save answer. Please check your connection.");
    } finally {
      setIsSavingAnswer(false);
    }
  };

  const handleNavigate = async (index) => {
    if (index >= 0 && index < questions.length) {
      // Save current answer before navigating
      if (currentQuestion && answers[currentQuestion.id]) {
        await saveAnswer(currentQuestion.id, answers[currentQuestion.id], true);
      }

      setCurrentQuestionIndex(index);
    }
  };

  const handleManualSave = async () => {
    try {
      const result = await saveAllAnswers();
      if (result.success) {
        toast.success(`Saved ${result.count || 0} answers successfully`);
      } else {
        toast.error(result.message || "Failed to save answers");
      }
    } catch (error) {
      toast.error("Failed to save answers");
    }
  };

  const handleSubmitExam = async () => {
    if (!currentSession?.id || examContextLoading) return;

    try {
      const result = await submitExam();

      if (result.success) {
        toast.success("Exam submitted successfully!");
        navigate(`/results/${examId}`);
      } else if (result.redirect) {
        navigate(`/results/${examId}`);
      } else {
        toast.error(result.message || "Failed to submit exam");
      }
    } catch (error) {
      console.error("Submit exam error:", error);

      if (error.response?.status === 404) {
        toast.error("Exam session not found. Checking if already submitted...");

        try {
          const resultResponse = await examService.getExamResult(examId);
          if (resultResponse.data.success) {
            toast.success("Exam already submitted. Showing results...");
            navigate(`/results/${examId}`);
            return;
          }
        } catch (resultError) {
          console.error("Check result error:", resultError);
        }

        toast.error("Please contact support if this issue persists.");
        navigate("/dashboard");
        return;
      }

      if (error.response?.status === 400) {
        if (error.response.data.message.includes("already submitted")) {
          toast.error("Exam already submitted. Redirecting...");
          navigate(`/results/${examId}`);
          return;
        }

        if (error.response.data.message.includes("time has expired")) {
          toast.error("Exam time has expired. Auto-submitting...");
          handleExamTimeUp();
          return;
        }
      }

      toast.error("Failed to submit exam. Please try again.");
    } finally {
      setShowConfirmSubmit(false);
    }
  };

  const handleCancelExam = async () => {
    if (!currentSession?.id || examContextLoading) return;

    if (
      window.confirm(
        "Are you sure you want to cancel this exam? All progress will be lost."
      )
    ) {
      try {
        const result = await cancelExam();
        if (result.success) {
          toast.success("Exam cancelled");
          navigate("/dashboard");
        } else {
          toast.error(result.message || "Failed to cancel exam");
        }
      } catch (error) {
        console.error("Cancel exam error:", error);
        toast.error("Failed to cancel exam");
      }
    }
  };

  // Calculate progress
  const answeredCount = Object.keys(answers || {}).length;
  const totalQuestions = questions?.length || 0;
  const progressPercentage =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Determine if time has expired
  const isTimeExpired =
    remainingTimeInSeconds <= 0 || needsAutoSubmit || examExpired;

  // Loading state - check if we have session and questions
  if (isLoading || examContextLoading || (!currentSession && !examExpired)) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">
            {examContextLoading ? "Loading exam session..." : "Loading exam..."}
          </p>
          {currentSession && (
            <p className="text-xs text-gray-500 mt-2">
              Session: {currentSession.id}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (examExpired) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Exam Submission Deadline Passed
          </h2>
          <p className="text-text-secondary mb-6">
            The submission deadline for this exam has passed. Please check your
            results or contact your instructor.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">
            No Active Exam Session
          </h2>
          <p className="text-text-secondary mb-6">
            Unable to start or resume exam session.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check if we have questions
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">
            No Questions Available
          </h2>
          <p className="text-text-secondary mb-6">
            This exam doesn't have any questions yet.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
                disabled={examContextLoading}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>

              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-text-primary">
                  {currentExam?.title || "Exam"}
                </h1>
                <p className="text-sm text-text-secondary">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Timer - hide if time expired */}
              {!isTimeExpired && (
                <div className="hidden md:flex items-center gap-2">
                  <Clock className="w-5 h-5 text-text-secondary" />
                  <Timer
                    initialTime={remainingTimeInSeconds}
                    onTimeUp={handleExamTimeUp}
                    isSubmitting={examContextLoading}
                  />
                </div>
              )}

              {/* Progress */}
              <div className="hidden md:block">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-text-secondary" />
                  <span className="text-sm font-medium">
                    {answeredCount}/{totalQuestions}
                  </span>
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Submit Button - disable if time expired */}
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={examContextLoading || isTimeExpired}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {examContextLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Submitting...
                  </>
                ) : isTimeExpired ? (
                  <>
                    <Clock className="w-5 h-5" />
                    Time Expired
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Exam
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile header */}
          <div className="md:hidden mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-bold text-text-primary">
                  {currentExam?.title || "Exam"}
                </h1>
                <p className="text-sm text-text-secondary">
                  Q{currentQuestionIndex + 1}/{totalQuestions}
                </p>
              </div>

              {!isTimeExpired && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-secondary" />
                    <Timer
                      initialTime={remainingTimeInSeconds}
                      onTimeUp={handleExamTimeUp}
                      isSubmitting={examContextLoading}
                      compact
                    />
                  </div>

                  <div className="text-sm">
                    {answeredCount}/{totalQuestions}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm sticky top-24">
              <div className="mb-4">
                <h3 className="font-bold text-text-primary mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Questions
                </h3>
                <p className="text-sm text-text-secondary">
                  Click on any question to navigate
                </p>
              </div>

              {questions && questions.length > 0 ? (
                <QuestionNavigation
                  questions={questions}
                  answers={answers}
                  currentQuestion={currentQuestion?.id}
                  onSelectQuestion={(questionId) => {
                    const index = questions.findIndex(
                      (q) => q.id === questionId
                    );
                    if (index !== -1) handleNavigate(index);
                  }}
                  markedQuestions={markedQuestions}
                  onMarkQuestion={(questionId) => {
                    if (markedQuestions.includes(questionId)) {
                      setMarkedQuestions((prev) =>
                        prev.filter((id) => id !== questionId)
                      );
                    } else {
                      setMarkedQuestions((prev) => [...prev, questionId]);
                    }
                  }}
                />
              ) : (
                <div className="p-4 text-center">
                  <p className="text-text-secondary">No questions available</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleManualSave}
                  className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  disabled={examContextLoading || isTimeExpired}
                >
                  <Save className="w-4 h-4" />
                  Save Progress
                </button>

                <button
                  onClick={handleCancelExam}
                  className="w-full py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  disabled={examContextLoading || isTimeExpired}
                >
                  <LogOut className="w-4 h-4" />
                  Cancel Exam
                </button>

                <div className="text-xs text-text-secondary mt-4">
                  <p className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-100 border border-green-500 rounded"></span>
                    Answered
                  </p>
                  <p className="flex items-center gap-1 mt-1">
                    <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></span>
                    Not answered
                  </p>
                  <p className="flex items-center gap-1 mt-1">
                    <span className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></span>
                    Current
                  </p>
                  <p className="flex items-center gap-1 mt-1">
                    <span className="w-3 h-3 bg-red-100 border border-red-500 rounded"></span>
                    Marked for review
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content - Question */}
          <div className="lg:col-span-3">
            {showFiveMinWarning && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-medium text-red-800">
                    ⚠️ Only 5 minutes left! Submit your exam soon.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-border shadow-sm">
              {currentQuestion ? (
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={totalQuestions}
                  selectedAnswer={answers[currentQuestion.id]}
                  onAnswerSelect={handleAnswerSelect}
                  isSubmitting={isSavingAnswer}
                  timeExpired={isTimeExpired}
                />
              ) : (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    No Question Found
                  </h3>
                  <p className="text-text-secondary">
                    {questions && questions.length > 0
                      ? "Please select a question from the navigator."
                      : "No questions available for this exam."}
                  </p>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="border-t border-border p-4 flex justify-between">
                <button
                  onClick={() => handleNavigate(currentQuestionIndex - 1)}
                  disabled={
                    currentQuestionIndex === 0 ||
                    examContextLoading ||
                    !questions ||
                    questions.length === 0
                  }
                  className="px-6 py-2 border border-text-secondary text-text-secondary rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!currentQuestion || isTimeExpired) return;
                      if (markedQuestions.includes(currentQuestion.id)) {
                        setMarkedQuestions((prev) =>
                          prev.filter((id) => id !== currentQuestion.id)
                        );
                        toast.success("Unmarked for review");
                      } else {
                        setMarkedQuestions((prev) => [
                          ...prev,
                          currentQuestion.id,
                        ]);
                        toast.success("Marked for review");
                      }
                    }}
                    className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
                    disabled={
                      examContextLoading || !currentQuestion || isTimeExpired
                    }
                  >
                    {currentQuestion &&
                    markedQuestions.includes(currentQuestion.id)
                      ? "Unmark Review"
                      : "Mark for Review"}
                  </button>

                  <button
                    onClick={() => handleNavigate(currentQuestionIndex + 1)}
                    disabled={
                      !questions ||
                      currentQuestionIndex === questions.length - 1 ||
                      examContextLoading
                    }
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            </div>

            {/* Exam Info Card */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-text-primary mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Exam Instructions
              </h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Select only one answer per question</li>
                <li>• Answers are auto-saved as you select them</li>
                <li>• You can navigate between questions freely</li>
                <li>
                  • Use "Save Progress" button to manually save all answers
                </li>
                {isTimeExpired ? (
                  <li className="text-red-600 font-medium">
                    • Exam time has expired. Answers cannot be changed.
                  </li>
                ) : (
                  <>
                    <li>• The exam will auto-submit when time expires</li>
                    <li>• Once submitted, you cannot change answers</li>
                  </>
                )}
                <li>
                  • Use "Mark for Review" to flag questions you want to revisit
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              Submit Exam
            </h3>

            <div className="mb-6">
              <p className="text-text-secondary mb-3">
                Are you sure you want to submit your exam?
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Important:</p>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>
                        • You have answered {answeredCount} out of{" "}
                        {totalQuestions} questions
                      </li>
                      <li>• Once submitted, you cannot change your answers</li>
                      <li>• Your results will be available immediately</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-3 border border-text-secondary text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
                disabled={examContextLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={examContextLoading || isTimeExpired}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {examContextLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Submitting...
                  </>
                ) : isTimeExpired ? (
                  "Time Expired"
                ) : (
                  "Submit Exam"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
