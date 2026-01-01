import { Clock, Award, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export const ExamCard = ({ exam, onStart }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
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
              exam.status
            )}`}
          >
            {getStatusIcon(exam.status)}
            {exam.statusText}
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

        {exam.result && (
          <div className="mb-6 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Previous Attempt
                </p>
                <p className="text-xs text-text-secondary">
                  Score:{" "}
                  <span className="font-bold text-primary">
                    {exam.result.score}%
                  </span>
                  {exam.result.rank && ` • Rank: #${exam.result.rank}`}
                </p>
              </div>
              <Award className="w-5 h-5 text-primary" />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onStart(exam)}
            disabled={!exam.canStart}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              exam.canStart
                ? "bg-primary hover:bg-primary-dark text-white hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {exam.status === "IN_PROGRESS" ? (
              <>
                <ArrowRight className="w-4 h-4" />
                Continue Exam
              </>
            ) : exam.status === "COMPLETED" ? (
              "View Results"
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Start Exam
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
