import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { examService } from "../services/examService";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const ExamContext = createContext({});

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
  const [currentExam, setCurrentExam] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const hasLoadedSessionRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [needsAutoSubmit, setNeedsAutoSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Load answers from localStorage on mount
  useEffect(() => {
    if (user?.role === "STUDENT") {
      const savedAnswers = localStorage.getItem("exam_answers_backup");
      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);
          if (parsed.sessionId && parsed.answers) {
            setAnswers(parsed.answers);
          }
        } catch (error) {
          localStorage.removeItem("exam_answers_backup");
        }
      }
    }
  }, [user]);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (currentSession?.id && Object.keys(answers).length > 0) {
      const backup = {
        sessionId: currentSession.id,
        examId: currentExam?.id,
        answers,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("exam_answers_backup", JSON.stringify(backup));
    }
  }, [answers, currentSession, currentExam]);

  // Load active session on mount
  useEffect(() => {
    if (user?.role === "STUDENT" && !currentSession) {
      loadActiveSession();
    }
  }, [user, currentSession]);

  const loadActiveSession = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 ExamContext: Loading active session...");

      const response = await examService.getActiveSession();

      if (response.data.success && response.data.data) {
        const {
          session,
          exam,
          questions,
          savedAnswers,
          remainingTime,
          needsAutoSubmit,
        } = response.data.data;

        console.log("✅ ExamContext: Session found:", {
          sessionId: session?.id,
          examId: exam?.id,
          questionCount: questions?.length,
          needsAutoSubmit,
        });

        // If session needs auto-submit, DO NOT load it
        if (needsAutoSubmit) {
          console.log("⚠️ ExamContext: Session needs auto-submit, clearing");
          clearExamState();
          return false;
        }

        setCurrentSession(session);
        setCurrentExam(exam);
        setQuestions(questions || []);
        setNeedsAutoSubmit(false);

        // Convert saved answers to object
        const answersObj = {};
        savedAnswers.forEach((answer) => {
          answersObj[answer.questionId] = answer.chosenAnswer;
        });
        setAnswers(answersObj);

        // Convert remainingTime from seconds to hours/minutes/seconds
        if (remainingTime && remainingTime.total > 0) {
          const totalSeconds = Math.floor(remainingTime.total / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          setTimeLeft({ hours, minutes, seconds });
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }

        return true; // Successfully loaded
      } else {
        console.log("📭 ExamContext: No active session found in response");
        return false; // No session
      }
    } catch (error) {
      console.log("❌ ExamContext: Error loading session:", error.message);
      return false; // Error or no session
    } finally {
      setIsLoading(false);
      console.log("🏁 ExamContext: loadActiveSession completed");
    }
  };
  // Update the useEffect that loads on mount
  // useEffect(() => {
  //   if (user?.role === "STUDENT") {
  //     console.log("🚀 ExamContext: User is student, loading session...");
  //     loadActiveSession();
  //   } else {
  //     console.log("👤 ExamContext: User is not student, clearing session");
  //     clearExamState();
  //   }
  // }, [user]);

  // Reset when user changes
  // useEffect(() => {
  //   if (user?.role === "STUDENT") {
  //     hasLoadedSessionRef.current = false; // Reset for new user
  //     loadActiveSession();
  //   } else {
  //     clearExamState();
  //     hasLoadedSessionRef.current = false;
  //   }
  // }, [user]);
  // Update the useEffect that loads on mount
  // useEffect(() => {
  //   if (user?.role === "STUDENT") {
  //     console.log("🚀 ExamContext: User is student, loading session...");
  //     loadActiveSession();
  //   } else {
  //     console.log("👤 ExamContext: User is not student, clearing session");
  //     clearExamState();
  //   }
  // }, [user]);

  const startExam = async (examId) => {
    try {
      console.log("🔄 ExamContext: Checking for active sessions...");

      // First, check if there's any active session
      const sessionResponse = await examService.getActiveSession();

      if (sessionResponse.data.success && sessionResponse.data.data) {
        const { session } = sessionResponse.data.data;

        // Check if active session is for the requested exam
        if (session.examId === parseInt(examId)) {
          // Same exam - load it
          await loadActiveSession();
          return {
            success: true,
            message: "Loaded existing session",
            isResumed: true,
          };
        } else {
          // Different exam - block
          return {
            success: false,
            message: `You have an active session for another exam (ID: ${session.examId}). Please complete it first.`,
            wrongExam: true,
            activeExamId: session.examId,
          };
        }
      }

      // No active session found
      return {
        success: false,
        message:
          "No active session found. Please start the exam from dashboard.",
        redirectToDashboard: true,
      };
    } catch (error) {
      console.error("❌ ExamContext load error:", error);
      return {
        success: false,
        message: "Failed to load exam session",
      };
    }
  };

  const saveAnswer = async (questionId, chosenAnswer, isAutosave = false) => {
    if (!currentSession) {
      console.error("No active session when trying to save answer");
      return { success: false, message: "No active session" };
    }

    try {
      // Update local state immediately
      setAnswers((prev) => ({ ...prev, [questionId]: chosenAnswer }));

      // Add autosave header if it's an auto-save
      const config = isAutosave
        ? {
            headers: { "X-Autosave": "true" },
          }
        : {};

      const response = await examService.saveAnswer(
        currentSession.id,
        questionId,
        chosenAnswer,
        isAutosave,
        config
      );

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Save answer error in context:", error);

      // Don't revert on network errors during auto-save
      if (!isAutosave || error.code !== "ERR_NETWORK") {
        setAnswers((prev) => {
          const newAnswers = { ...prev };
          delete newAnswers[questionId];
          return newAnswers;
        });
      }

      if (error.response?.status === 400 && error.response.data.timeExpired) {
        setNeedsAutoSubmit(true);
        return {
          success: false,
          message: error.response.data.message,
          timeExpired: true,
        };
      }

      return {
        success: false,
        message: error.response?.data?.message || "Failed to save answer",
      };
    }
  };

  const saveAllAnswers = async (isAutoSubmit = false) => {
    if (!currentSession || !questions.length)
      return { success: false, message: "No active session or questions" };

    try {
      const answersArray = Object.entries(answers).map(
        ([questionId, chosenAnswer]) => ({
          questionId: parseInt(questionId),
          chosenAnswer,
        })
      );

      if (answersArray.length === 0) {
        return { success: true, message: "No answers to save" };
      }

      const response = await examService.saveAnswersBatch(
        currentSession.id,
        answersArray,
        isAutoSubmit
      );

      // Clear localStorage backup after successful save
      localStorage.removeItem("exam_answers_backup");

      return {
        success: response.data.success,
        message: response.data.message,
        count: answersArray.length,
      };
    } catch (error) {
      console.error("Save all answers error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to save answers",
      };
    }
  };

  const handleAutoSubmit = async () => {
    if (!currentSession || !currentExam || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await examService.submitExam(currentSession.id, true);
      if (response.data.success) {
        clearExamState();
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Auto-submit failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Auto-submit failed",
      };
    } finally {
      setIsSubmitting(false);
    }
  };
  const submitExam = async (isAutoSubmit = false) => {
    if (!currentSession || isSubmitting) {
      return {
        success: false,
        message: "No active session or already submitting",
      };
    }

    try {
      setIsSubmitting(true);

      // Save any remaining answers first
      await saveAllAnswers(isAutoSubmit);

      const response = await examService.submitExam(
        currentSession.id,
        isAutoSubmit
      );

      if (response.data.success) {
        // IMPORTANT: Clear state BEFORE returning
        clearExamState();

        return {
          success: true,
          data: response.data.data,
          isAutoSubmit,
        };
      }

      // Handle specific cases
      if (response.data.message?.includes("already submitted")) {
        clearExamState();
        return {
          success: true,
          message: "Exam already submitted",
          redirect: true,
          alreadySubmitted: true,
        };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Submit exam error:", error);

      if (error.response?.status === 400) {
        if (error.response.data.message?.includes("already submitted")) {
          clearExamState();
          return {
            success: true,
            message: "Exam already submitted",
            redirect: true,
            alreadySubmitted: true,
          };
        }

        if (error.response.data.timeExpired && !isAutoSubmit) {
          // Try auto-submit
          return await submitExam(true);
        }
      }

      return {
        success: false,
        message: error.response?.data?.message || "Failed to submit exam",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelExam = async () => {
    if (!currentSession)
      return { success: false, message: "No active session" };

    try {
      const response = await examService.deleteSession(currentSession.id);
      if (response.data.success) {
        clearExamState();
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to cancel exam",
      };
    }
  };

  const clearExamState = () => {
    setCurrentSession(null);
    setCurrentExam(null);
    setQuestions([]);
    setAnswers({});
    setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
    localStorage.removeItem("exam_answers_backup");
  };

  const updateTime = (newTime) => {
    setTimeLeft(newTime);

    // Only check for time expiration, DON'T trigger auto-submit here
    const totalSeconds =
      newTime.hours * 3600 + newTime.minutes * 60 + newTime.seconds;
    if (totalSeconds <= 0 && !needsAutoSubmit && currentSession) {
      setNeedsAutoSubmit(true);
      // Remove the handleAutoSubmit() call here - let ExamPage handle it
    }
  };

  const value = {
    currentExam,
    currentSession,
    questions,
    answers,
    timeLeft,
    isLoading,
    needsAutoSubmit,
    startExam,
    saveAnswer,
    saveAllAnswers,
    submitExam,
    cancelExam,
    updateTime,
    handleAutoSubmit,
    loadActiveSession,
    hasActiveSession: !!currentSession,
    setAnswers,
    isSubmitting,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};
