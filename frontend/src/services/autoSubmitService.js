import { examService } from "./examService";
import toast from "react-hot-toast";

class AutoSubmitService {
  constructor() {
    this.currentSessionId = null;
    this.isExamStarted = false;
  }

  // Simple check if exam should be auto-submitted
  async checkAndAutoSubmitIfNeeded(sessionId) {
    try {
      const statusResponse = await examService.getSessionStatus(sessionId);

      if (statusResponse.data.success) {
        const { needsAutoSubmit, remainingTime } = statusResponse.data.data;

        // If exam needs auto-submit or time is up
        if (needsAutoSubmit || remainingTime <= 0) {
          try {
            const submitResponse = await examService.submitExam(
              sessionId,
              true
            );

            if (submitResponse.data.success) {
              toast.success(
                "Exam submitted automatically due to time expiration"
              );

              // Redirect to results page
              const examId = submitResponse.data.data?.exam?.id;
              if (examId) {
                setTimeout(() => {
                  window.location.href = `/results/${examId}`;
                }, 2000);
              }

              return true;
            }
          } catch (submitError) {
            console.error("Auto-submit error:", submitError);

            if (
              submitError.response?.status === 404 ||
              (submitError.response?.status === 400 &&
                submitError.response.data.message?.includes(
                  "already submitted"
                ))
            ) {
              toast.success("Exam already submitted");
              setTimeout(() => {
                window.location.href = "/dashboard";
              }, 2000);
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Auto-submit check error:", error);
      return false;
    }
  }

  // Manual trigger for auto-submit
  async forceAutoSubmit(sessionId) {
    return this.checkAndAutoSubmitIfNeeded(sessionId);
  }
}

export const autoSubmitService = new AutoSubmitService();
