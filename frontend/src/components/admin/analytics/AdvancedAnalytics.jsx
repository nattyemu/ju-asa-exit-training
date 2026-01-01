import { Clock, TrendingUp, BookOpen } from "lucide-react";

const AdvancedAnalytics = ({
  timeAnalytics,
  questionAnalysis,
  difficultyData,
}) => {
  return (
    <div className="bg-white rounded-xl border border-border p-6 mb-6">
      <h3 className="font-medium text-text-primary mb-6">Advanced Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Time Analytics</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Correlation:</span>
              <span className="font-medium">
                {timeAnalytics?.timeScoreCorrelation || "No data"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Completion Rate:</span>
              <span className="font-medium">
                {timeAnalytics?.completionRate || "0%"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">On Time Students:</span>
              <span className="font-medium">
                {timeAnalytics?.timeUsage?.onTimeStudents || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">
              Performance Trends
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Total Questions:</span>
              <span className="font-medium">
                {questionAnalysis?.summary?.totalQuestions || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Attempted:</span>
              <span className="font-medium">
                {questionAnalysis?.summary?.attemptedQuestions || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Avg Accuracy:</span>
              <span className="font-medium">
                {questionAnalysis?.summary?.averageAccuracy || "0%"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-800">
              Question Analysis
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-700">Most Difficult:</span>
              <span className="font-medium">
                {questionAnalysis?.summary?.mostDifficultQuestions?.[0]
                  ?.subject || "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Difficulty:</span>
              <span className="font-medium">
                {questionAnalysis?.summary?.mostDifficultQuestions?.[0]
                  ?.accuracy || "0%"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Total Difficulty Levels:</span>
              <span className="font-medium">{difficultyData.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
