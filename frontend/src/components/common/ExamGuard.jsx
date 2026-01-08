import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Changed from useParams
import { useAuth } from "../../contexts/AuthContext";
import { examService } from "../../services/examService";
import { LoadingSpinner } from "./LoadingSpinner";
import toast from "react-hot-toast";
import { useState } from "react";

export const ExamGuard = ({ children }) => {
  const location = useLocation(); // Added
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  // Get examId from location state
  const examId = location.state?.examId;

  useEffect(() => {
    const checkExamStatus = async () => {
      if (!examId || user?.role !== "STUDENT") {
        setIsChecking(false);
        return;
      }

      try {
        // Check if exam exists and is available
        const examResponse = await examService.getExamById(examId);

        if (!examResponse.data.success) {
          toast.error("Exam not found");
          navigate("/dashboard");
          return;
        }

        const exam = examResponse.data.data;
        const now = new Date();
        const availableUntil = new Date(exam.availableUntil);

        // Check if exam has expired
        if (now > availableUntil) {
          // Check if student has results for this exam
          try {
            const resultResponse = await examService.getExamResult(examId);
            if (resultResponse.data.success) {
              // Has results, redirect to results page
              toast.error("This exam has expired. Showing your results...");
              navigate(`/results`, {
                state: { examId: examId, examData: exam },
              });
            } else {
              // No results, exam is just unavailable
              toast.error("This exam is no longer available.");
              navigate("/dashboard");
            }
          } catch (error) {
            // No results found
            toast.error("This exam is no longer available.");
            navigate("/dashboard");
          }
          return;
        }

        // Check if exam is active
        if (!exam.isActive) {
          toast.error("This exam is not currently active.");
          navigate("/dashboard");
          return;
        }

        // Check for active session
        try {
          const sessionResponse = await examService.getActiveSession();
          if (sessionResponse.data.success) {
            const activeSession = sessionResponse.data.data.session;

            // If active session is for a different exam
            if (activeSession.examId !== parseInt(examId)) {
              toast.error(
                `You have an active session for another exam. Please complete it first.`
              );
              navigate("/dashboard");
            }
          }
        } catch (error) {
          // No active session, that's fine - we'll create one in ExamPage
        }
      } catch (error) {
        console.error("Exam check error:", error);

        // Handle specific errors
        if (error.response?.status === 404) {
          toast.error("Exam not found");
        } else {
          toast.error("Failed to verify exam status");
        }

        navigate("/dashboard");
      } finally {
        setIsChecking(false);
      }
    };

    checkExamStatus();
  }, [examId, user, navigate]); // Changed dependency

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">Checking exam status...</p>
        </div>
      </div>
    );
  }

  return children;
};
