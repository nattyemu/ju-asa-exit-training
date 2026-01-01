import { AlertCircle } from "lucide-react";
import { LoadingSpinner } from "../../common/LoadingSpinner";

const SubjectPerformanceChart = ({ subjectData, isLoading, examStats }) => {
  if (isLoading) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!subjectData || subjectData.length === 0) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">No subject data</span>
      </div>
    );
  }

  const validSubjects = subjectData.filter(
    (subject) => subject.participants > 0
  );

  if (validSubjects.length === 0) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">
          No completed subject data
        </span>
      </div>
    );
  }

  const sortedSubjects = [...validSubjects].sort(
    (a, b) => b.avgScore - a.avgScore
  );
  const topSubject = sortedSubjects[0];

  const maxScore = Math.max(...sortedSubjects.map((item) => item.avgScore));
  const minScore = Math.min(...sortedSubjects.map((item) => item.avgScore));

  const scoreRange = maxScore - minScore;
  const displayMax = scoreRange === 0 ? Math.max(maxScore, 10) : maxScore;

  return (
    <div className="h-48 w-full bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-primary">
          Subject Performance
        </span>
        <span className="text-xs text-text-secondary">
          Top {Math.min(sortedSubjects.length, 5)} Subjects
        </span>
      </div>

      <div className="h-24 flex items-end gap-2 mb-2">
        {sortedSubjects.slice(0, 5).map((item, i) => {
          const height =
            displayMax > 0
              ? Math.max((item.avgScore / displayMax) * 90, 10)
              : 10;

          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  item.avgScore >= 70
                    ? "bg-green-500 hover:bg-green-600"
                    : item.avgScore >= 50
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
                style={{
                  height: `${height}%`,
                }}
                title={`${item.subject}: ${item.avgScore}% (${item.participants} questions)`}
              ></div>
              <span className="text-xs font-medium text-text-primary mt-1 truncate w-full text-center px-1">
                {item.subject.substring(0, 8)}
                {item.subject.length > 8 ? "..." : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-1 mt-2">
        <div className="text-xs text-text-primary font-medium text-center">
          {sortedSubjects.length} subject
          {sortedSubjects.length !== 1 ? "s" : ""}
        </div>
        {topSubject && (
          <div className="text-xs text-text-secondary text-center">
            Top:{" "}
            <span className="font-semibold text-primary-dark">
              {topSubject.subject}
            </span>{" "}
            ({topSubject.avgScore}%)
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectPerformanceChart;
