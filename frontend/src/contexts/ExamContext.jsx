import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { examService } from "../services/examService";
import { useAuth } from "./AuthContext";

const ExamContext = createContext({});

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
  const [currentExam, setCurrentExam] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load active session on mount
  useEffect(() => {
    if (user?.role === "STUDENT") {
      loadActiveSession();
    }
  }, [user]);

  const loadActiveSession = async () => {
    try {
      setIsLoading(true);
      const response = await examService.getActiveSession();
      if (response.data.success && response.data.data) {
        const { session, exam, questions, savedAnswers, remainingTime } =
          response.data.data;

        setCurrentSession(session);
        setCurrentExam(exam);
        setQuestions(questions);

        // Convert saved answers to object
        const answersObj = {};
        savedAnswers.forEach((answer) => {
          answersObj[answer.questionId] = answer.chosenAnswer;
        });
        setAnswers(answersObj);

        setTimeLeft(remainingTime);
      }
    } catch (error) {
      console.error("No active session or error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startExam = async (examId) => {
    try {
      setIsLoading(true);
      const response = await examService.startExam(examId);
      if (response.data.success) {
        const { session, exam, questions, savedAnswers, remainingTime } =
          response.data.data;

        setCurrentSession(session);
        setCurrentExam(exam);
        setQuestions(questions);

        const answersObj = {};
        savedAnswers?.forEach((answer) => {
          answersObj[answer.questionId] = answer.chosenAnswer;
        });
        setAnswers(answersObj);

        setTimeLeft(remainingTime);
        return { success: true, sessionId: session.id };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to start exam",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnswer = async (questionId, chosenAnswer, isAutosave = false) => {
    if (!currentSession)
      return { success: false, message: "No active session" };

    try {
      // Update local state immediately for better UX
      setAnswers((prev) => ({ ...prev, [questionId]: chosenAnswer }));

      // Save to server
      const response = await examService.saveAnswer(
        currentSession.id,
        questionId,
        chosenAnswer,
        isAutosave
      );

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      // Revert local state on error
      setAnswers((prev) => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });

      return {
        success: false,
        message: error.response?.data?.message || "Failed to save answer",
      };
    }
  };

  const submitExam = async () => {
    if (!currentSession)
      return { success: false, message: "No active session" };

    try {
      const response = await examService.submitExam(currentSession.id);
      if (response.data.success) {
        // Clear exam state
        setCurrentSession(null);
        setCurrentExam(null);
        setQuestions([]);
        setAnswers({});
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to submit exam",
      };
    }
  };

  const cancelExam = async () => {
    if (!currentSession)
      return { success: false, message: "No active session" };

    try {
      const response = await examService.cancelSession(currentSession.id);
      if (response.data.success) {
        // Clear exam state
        setCurrentSession(null);
        setCurrentExam(null);
        setQuestions([]);
        setAnswers({});
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

  const updateTime = (newTime) => {
    setTimeLeft(newTime);
  };

  const value = {
    currentExam,
    currentSession,
    questions,
    answers,
    timeLeft,
    isLoading,
    startExam,
    saveAnswer,
    submitExam,
    cancelExam,
    updateTime,
    loadActiveSession,
    hasActiveSession: !!currentSession,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};
