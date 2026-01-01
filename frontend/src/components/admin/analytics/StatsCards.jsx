import { Users, Award, TrendingUp, Clock } from "lucide-react";

const StatsCards = ({ examStats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-secondary">Total Participants</p>
            <p className="text-2xl font-bold text-text-primary">
              {examStats?.participants?.total || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          <span className="text-green-600 font-medium">
            {examStats?.participants?.passed || 0}
          </span>{" "}
          passed •{" "}
          <span className="text-red-600">
            {examStats?.participants?.failed || 0}
          </span>{" "}
          failed
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-secondary">Average Score</p>
            <p className="text-2xl font-bold text-text-primary">
              {examStats?.performance?.averageScore || "0%"}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Award className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          Pass Rate: {examStats?.participants?.passRate || "0%"}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-secondary">Highest Score</p>
            <p className="text-2xl font-bold text-text-primary">
              {examStats?.performance?.highestScore || "0%"}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          Lowest: {examStats?.performance?.lowestScore || "0%"}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-secondary">Avg Time Spent</p>
            <p className="text-2xl font-bold text-text-primary">
              {examStats?.timeAnalysis?.averageTimeSpent || "0m"}
            </p>
          </div>
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          Duration: {examStats?.timeAnalysis?.examDuration || "180m"}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
