import { AlertCircle } from "lucide-react";
import { LoadingSpinner } from "../../common/LoadingSpinner";

const DifficultyChart = ({ difficultyData, isLoading, questionAnalysis }) => {
  if (isLoading) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  let displayData = [];
  if (
    difficultyData &&
    Array.isArray(difficultyData) &&
    difficultyData.length > 0
  ) {
    displayData = difficultyData
      .map((item) => ({
        difficulty: item.difficulty || item.level || "UNKNOWN",
        totalQuestions: item.totalQuestions || item.count || 0,
        averageAccuracy: item.averageAccuracy || item.accuracy || 0,
      }))
      .filter((item) => item.totalQuestions > 0);
  }

  if (displayData.length === 0) {
    return (
      <div className="h-48 w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-text-secondary">No difficulty data</span>
      </div>
    );
  }

  const total = displayData.reduce((sum, item) => sum + item.totalQuestions, 0);
  const allZeroAccuracy = displayData.every(
    (item) => item.averageAccuracy === 0
  );

  const colors = {
    EASY: "bg-green-500",
    MEDIUM: "bg-yellow-500",
    HARD: "bg-red-500",
    VERY_EASY: "bg-green-300",
    VERY_HARD: "bg-red-700",
    BEGINNER: "bg-blue-300",
    ADVANCED: "bg-purple-500",
    UNKNOWN: "bg-gray-500",
  };

  const labels = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
    VERY_EASY: "Very Easy",
    VERY_HARD: "Very Hard",
    BEGINNER: "Beginner",
    ADVANCED: "Advanced",
    UNKNOWN: "Unknown",
  };

  const pieData = displayData.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.totalQuestions / total) * 100) : 0,
    color: colors[item.difficulty] || "bg-gray-500",
    label: labels[item.difficulty] || item.difficulty,
  }));

  const weightedAvgAccuracy =
    total > 0
      ? Math.round(
          pieData.reduce(
            (sum, item) => sum + item.averageAccuracy * item.totalQuestions,
            0
          ) / total
        )
      : 0;

  return (
    <div className="h-48 w-full bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-primary">
          Question Difficulty
        </span>
        <span className="text-xs text-text-secondary">Distribution</span>
      </div>

      <div className="h-24 flex items-center justify-center mb-2">
        <div className="relative w-20 h-20">
          {pieData.map((item, index, arr) => {
            const prevPercentage = arr
              .slice(0, index)
              .reduce((sum, i) => sum + i.percentage, 0);
            const rotation = (prevPercentage / 100) * 360;

            return (
              <div
                key={item.difficulty}
                className={`absolute inset-0 border-8 ${item.color} rounded-full`}
                style={{
                  clipPath: `inset(0 ${100 - item.percentage}% 0 0)`,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center",
                }}
              ></div>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-text-primary">
                {weightedAvgAccuracy}%
              </div>
              <div className="text-xs text-text-secondary">Avg Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-2 flex-wrap">
        {pieData.map((item) => (
          <div key={item.difficulty} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
            <span className="text-xs">
              {item.label} ({item.totalQuestions})
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="text-xs text-text-primary text-center">
          {displayData.length} difficulty level
          {displayData.length !== 1 ? "s" : ""}
        </div>
        {allZeroAccuracy && total > 0 && (
          <div className="text-xs text-amber-600 font-medium text-center">
            All questions have 0% accuracy
          </div>
        )}
      </div>
    </div>
  );
};

export default DifficultyChart;
