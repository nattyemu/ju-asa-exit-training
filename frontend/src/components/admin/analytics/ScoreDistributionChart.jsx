import { AlertCircle } from "lucide-react";
import { LoadingSpinner } from "../../common/LoadingSpinner";

const ScoreDistributionChart = ({ distributionData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (
    !distributionData ||
    !Array.isArray(distributionData) ||
    distributionData.length === 0
  ) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">
          No score data available
        </span>
      </div>
    );
  }

  const validData = distributionData.filter(
    (item) =>
      item && typeof item === "object" && "students" in item && "range" in item
  );

  if (validData.length === 0) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">
          Invalid score data format
        </span>
      </div>
    );
  }

  const maxStudents = Math.max(...validData.map((item) => item.students || 0));
  const totalStudents = validData.reduce(
    (sum, item) => sum + (item.students || 0),
    0
  );

  const mostCommonRange = validData.reduce((prev, current) =>
    (prev.students || 0) > (current.students || 0) ? prev : current
  );

  return (
    <div className="h-48 w-full bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-primary">
          Score Distribution
        </span>
        <span className="text-xs text-text-secondary">Histogram</span>
      </div>
      <div className="h-24 flex items-end gap-1 mb-2">
        {validData.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary-dark"
              style={{
                height:
                  maxStudents > 0 && item.students > 0
                    ? `${Math.max((item.students / maxStudents) * 80, 5)}%`
                    : "0%",
                minHeight: item.students > 0 ? "5%" : "0%",
              }}
              title={`${item.range}: ${item.students} student${
                item.students !== 1 ? "s" : ""
              } (${
                item.percentage ||
                Math.round((item.students / totalStudents) * 100)
              }%)`}
            ></div>
            <span className="text-xs text-text-secondary mt-1">
              {item.range}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-1 mt-2">
        <div className="text-xs text-text-primary font-medium text-center">
          {totalStudents === 1
            ? "1 student total"
            : `${totalStudents} total students`}
        </div>
        <div className="text-xs text-text-secondary text-center">
          Most common:{" "}
          <span className="font-semibold text-primary-dark">
            {mostCommonRange?.range || "N/A"}
          </span>
          {mostCommonRange?.students
            ? ` (${mostCommonRange.students} students)`
            : ""}
        </div>
      </div>
    </div>
  );
};

export default ScoreDistributionChart;
