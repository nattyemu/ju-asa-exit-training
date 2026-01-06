import { Clock, Award, Calendar, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "../common/LoadingSpinner";

export const ExamCard = ({ exam, onStart, isStarting = false }) => {
  const getStatusColor = (status, exam) => {
    if (status === "COMPLETED") {
      // For completed exams, show PASS/FAIL based on score
      if (exam.result?.score >= exam.passingScore) {
        return "bg-green-100 text-green-800";
      } else {
        return "bg-red-100 text-red-800";
      }
    }

    switch (status) {
      case "NOT_STARTED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status, exam) => {
    if (status === "COMPLETED") {
      if (exam.result?.score >= exam.passingScore) {
        return <CheckCircle className="w-4 h-4" />;
      } else {
        return <XCircle className="w-4 h-4" />;
      }
    }

    switch (status) {
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />;
      case "NOT_STARTED":
        return <Calendar className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusText = (status, exam) => {
    if (status === "COMPLETED") {
      if (exam.result?.score >= exam.passingScore) {
        return "PASSED";
      } else {
        return "FAILED";
      }
    }

    switch (status) {
      case "NOT_STARTED":
        return "AVAILABLE";
      case "IN_PROGRESS":
        return "IN PROGRESS";
      default:
        return "AVAILABLE";
    }
  };

  const getButtonText = (status, exam, isStarting) => {
    if (isStarting) return "Starting...";

    switch (status) {
      case "IN_PROGRESS":
        // Check if exam is expired
        const now = new Date();
        const availableUntil = new Date(exam.availableUntil);
        return now > availableUntil ? "View Results" : "Continue Exam";
      case "COMPLETED":
        return "View Results";
      default:
        return "Start Exam";
    }
  };

  const getButtonColor = (status, exam) => {
    if (status === "COMPLETED") {
      return exam.result?.score >= exam.passingScore
        ? "bg-green-600 hover:bg-green-700 text-white"
        : "bg-red-600 hover:bg-red-700 text-white";
    }

    switch (status) {
      case "IN_PROGRESS":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case "NOT_STARTED":
        return "bg-primary hover:bg-primary-dark text-white";
      default:
        return "bg-primary hover:bg-primary-dark text-white";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {exam.title}
            </h3>
            <p className="text-sm text-text-secondary mb-3 line-clamp-2">
              {exam.description}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              exam.status,
              exam
            )}`}
          >
            {getStatusIcon(exam.status, exam)}
            {getStatusText(exam.status, exam)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary font-medium">
              {Math.floor(exam.duration / 60)}h {exam.duration % 60}m
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary font-medium">
              {exam.totalQuestions} Questions
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Available Until:</span>
            <span className="font-medium text-text-primary">
              {format(new Date(exam.availableUntil), "MMM d, yyyy HH:mm")}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Passing Score:</span>
            <span className="font-medium text-text-primary">
              {exam.passingScore}%
            </span>
          </div>
        </div>

        {exam.result && exam.status === "COMPLETED" && (
          <div
            className={`mb-6 p-3 rounded-lg border ${
              exam.result.score >= exam.passingScore
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Score: {exam.result.score}%
                </p>
                <p className="text-xs text-text-secondary">
                  {exam.result.rank && `Rank: #${exam.result.rank}`}
                  {exam.result.rank && ` • `}
                  {exam.result.score >= exam.passingScore ? "PASS" : "FAIL"}
                </p>
              </div>
              <Award
                className={`w-5 h-5 ${
                  exam.result.score >= exam.passingScore
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onStart(exam)}
            disabled={isStarting}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${getButtonColor(
              exam.status,
              exam
            )} hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isStarting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Starting...</span>
              </>
            ) : (
              getButtonText(exam.status, exam, isStarting)
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
