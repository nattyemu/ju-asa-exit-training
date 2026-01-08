import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useExam } from "../contexts/ExamContext";
import { examService } from "../services/examService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ConfirmationModal } from "../components/common/ConfirmationModal"; // NEW IMPORT
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
    setAnswers,
  } = useExam();

  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false); // NEW STATE
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [examExpired, setExamExpired] = useState(false);
  const [showFiveMinWarning, setShowFiveMinWarning] = useState(false);
  const timeExpiredToastShown = useRef(false);
  const isSubmittingRef = useRef(false);
  const pendingOperationsRef = useRef([]);
  // Track if we've already loaded to prevent infinite loops
  const hasLoadedRef = useRef(false);
  const saveAnswerDebounceRef = useRef(null);
  const mountedRef = useRef(false);
  const isNavigatingRef = useRef(false);

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
    // Prevent multiple calls
    if (
      timeExpiredToastShown.current ||
      isSubmittingRef.current ||
      !currentSession?.id
    ) {
      return;
    }

    timeExpiredToastShown.current = true;
    isSubmittingRef.current = true;

    try {
      console.log("🔄 ExamPage: Time up - Starting auto-submit");

      // Clear any pending saves
      if (saveAnswerDebounceRef.current) {
        clearTimeout(saveAnswerDebounceRef.current);
        saveAnswerDebounceRef.current = null;
      }

      // Show single toast
      const loadingToast = toast.loading("Time's up! Submitting exam...");

      // Save any unsaved answers
      await saveAllAnswers();

      // Submit with auto-submit flag
      const result = await submitExam(true);

      if (result.success || result.redirect || result.alreadySubmitted) {
        toast.success("Exam submitted successfully!", { id: loadingToast });

        // Wait a moment for state to clear
        setTimeout(() => {
          navigate(`/results/${examId}`, { replace: true });
        }, 1000);
      } else {
        toast.error("Failed to submit exam", { id: loadingToast });
      }
    } catch (error) {
      console.error("❌ Auto-submit error:", error);
      toast.error("Failed to auto-submit exam");
    } finally {
      isSubmittingRef.current = false;
    }
  }, [currentSession, submitExam, saveAllAnswers, examId, navigate]);

  // Main exam loading logic - FIXED DEPENDENCIES
  useEffect(() => {
    // Only run once on mount
    if (mountedRef.current) {
      console.log("🔄 ExamPage: Re-render, skipping load");
      return;
    }

    mountedRef.current = true;
    console.log("📱 ExamPage: Mounted for exam", examId);

    const loadExam = async () => {
      if (!examId || user?.role !== "STUDENT") {
        navigate("/dashboard");
        return;
      }

      try {
        setIsLoading(true);

        // Wait a moment for context
        await new Promise((resolve) => setTimeout(resolve, 100));

        // If we have session, use it
        if (currentSession) {
          if (currentSession.examId !== parseInt(examId)) {
            toast.error("Wrong exam session");
            navigate(`/exam/${currentSession.examId}`);
            return;
          }
          console.log("✅ Session found");
          setIsLoading(false);
          return;
        }

        // Load session
        console.log("⚠️ Loading session...");
        await loadActiveSession();
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load exam:", error);
        toast.error("Failed to load exam");
        navigate("/dashboard");
      }
    };

    loadExam();

    // Cleanup
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Timer effect - FIXED: Remove sessionChecked dependency to prevent loops
  useEffect(() => {
    if (remainingTimeInSeconds <= 0 || !currentSession || examExpired) return;

    const timerInterval = setInterval(() => {
      const newSeconds = remainingTimeInSeconds - 1;

      // Show 5-minute warning
      if (newSeconds === 300 && !showFiveMinWarning) {
        setShowFiveMinWarning(true);
        toast(
          (t) => (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium">⏰ Time Warning</p>
                <p className="text-sm opacity-90">
                  Only 5 minutes left! Submit soon.
                </p>
              </div>
            </div>
          ),
          {
            duration: 5000,
            icon: "⚠️",
          }
        );
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

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (saveAnswerDebounceRef.current) {
        clearTimeout(saveAnswerDebounceRef.current);
      }

      // Clear any pending operations
      if (isSubmittingRef.current) {
        console.log("Component unmounting while submitting...");
      }
    };
  }, []);

  const handleAnswerSelect = async (chosenAnswer) => {
    if (!currentSession?.id || !currentQuestion || examExpired) {
      return;
    }

    // Update local state immediately (NO API CALL)
    const normalizedAnswer = chosenAnswer.toUpperCase();
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: normalizedAnswer,
    }));

    // Queue for auto-save (delayed)
    if (saveAnswerDebounceRef.current) {
      clearTimeout(saveAnswerDebounceRef.current);
    }

    saveAnswerDebounceRef.current = setTimeout(async () => {
      try {
        const result = await saveAnswer(
          currentQuestion.id,
          normalizedAnswer,
          true
        );

        if (!result.success && result.timeExpired) {
          if (!timeExpiredToastShown.current) {
            timeExpiredToastShown.current = true;
            handleExamTimeUp();
          }
        }
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 2000); // Save after 2 seconds of inactivity
  };

  const handleNavigate = async (index) => {
    if (index >= 0 && index < questions.length) {
      // Clear any pending debounced save
      if (saveAnswerDebounceRef.current) {
        clearTimeout(saveAnswerDebounceRef.current);
      }

      // Save current answer immediately
      if (currentQuestion && answers[currentQuestion.id]) {
        await saveAnswer(
          currentQuestion.id,
          answers[currentQuestion.id],
          false
        );
      }

      setCurrentQuestionIndex(index);
    }
  };

  const handleManualSave = async () => {
    try {
      toast.loading("Saving answers...", { id: "saving" });
      const result = await saveAllAnswers();

      if (result.success) {
        toast.success(`Saved ${result.count || 0} answers`, { id: "saving" });
      } else {
        toast.error("Failed to save answers", { id: "saving" });
      }
    } catch (error) {
      toast.error("Failed to save answers", { id: "saving" });
    }
  };

  // Update handleSubmitExam:
  const handleSubmitExam = async () => {
    if (
      !currentSession?.id ||
      isSubmittingRef.current ||
      isNavigatingRef.current
    ) {
      return;
    }

    try {
      isSubmittingRef.current = true;
      isNavigatingRef.current = true;

      const loadingToast = toast.loading("Submitting exam...");

      // Clear any pending saves
      if (saveAnswerDebounceRef.current) {
        clearTimeout(saveAnswerDebounceRef.current);
      }

      const result = await submitExam();

      if (result.success || result.redirect || result.alreadySubmitted) {
        toast.success("Exam submitted successfully!", { id: loadingToast });

        // Clear context state
        if (cancelExam) {
          await cancelExam();
        }

        // Navigate with replace to prevent going back
        navigate(`/results/${examId}`, { replace: true });
      } else {
        toast.error(result.message || "Failed to submit exam", {
          id: loadingToast,
        });
        isNavigatingRef.current = false;
      }
    } catch (error) {
      console.error("Submit exam error:", error);
      toast.error("Failed to submit exam. Please try again.");
      isNavigatingRef.current = false;
    } finally {
      isSubmittingRef.current = false;
      setShowConfirmSubmit(false);
    }
  };

  // UPDATED: handleCancelExam with modal
  const handleCancelExam = async () => {
    setShowConfirmCancel(true);
  };

  const handleConfirmCancelExam = async () => {
    if (!currentSession?.id || examContextLoading) return;

    try {
      const result = await cancelExam();
      if (result.success) {
        toast.success("Exam cancelled");
        navigate("/dashboard");
      } else {
        toast.error(result.message || "Failed to cancel exam");
        setShowConfirmCancel(false);
      }
    } catch (error) {
      console.error("Cancel exam error:", error);
      toast.error("Failed to cancel exam");
      setShowConfirmCancel(false);
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
  if (isLoading || examContextLoading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">
            {examContextLoading ? "Loading exam session..." : "Loading exam..."}
          </p>
          {currentSession && (
            <p className="text-xs text-gray-500 mt-2">
              Session ID: {currentSession.id}
            </p>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Back to Dashboard
          </button>
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
                    initialTime={Math.max(0, remainingTimeInSeconds - 5)} // Subtract 5 seconds
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
                      compact={true}
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

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        onConfirm={handleSubmitExam}
        title="Submit Exam"
        message="Are you sure you want to submit your exam?"
        confirmText={examContextLoading ? "Submitting..." : "Submit Exam"}
        type="warning"
        isLoading={examContextLoading}
        confirmButtonDisabled={examContextLoading || isTimeExpired}
      >
        <div className="space-y-2">
          <p className="font-medium text-yellow-800">Important:</p>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>
              • You have answered {answeredCount} out of {totalQuestions}{" "}
              questions
            </li>
            <li>• Once submitted, you cannot change your answers</li>
            <li>• Your results will be available immediately</li>
            {isTimeExpired && (
              <li className="text-red-600 font-medium">
                • Exam time has expired
              </li>
            )}
          </ul>
        </div>
      </ConfirmationModal>

      {/* Cancel Exam Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        onConfirm={handleConfirmCancelExam}
        title="Cancel Exam"
        message="Are you sure you want to cancel this exam?"
        confirmText="Yes, Cancel Exam"
        cancelText="No, Continue Exam"
        type="danger"
        isLoading={examContextLoading}
        confirmButtonDisabled={examContextLoading}
      >
        <div className="space-y-2">
          <p className="font-medium text-red-800">Warning:</p>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• All your progress will be permanently lost</li>
            <li>• Your answers will not be saved</li>
            <li>• You will need to restart the exam from the beginning</li>
            <li>• This action cannot be undone</li>
          </ul>
        </div>
      </ConfirmationModal>
    </div>
  );
};
