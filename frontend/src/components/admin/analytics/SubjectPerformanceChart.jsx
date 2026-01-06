import { AlertCircle } from "lucide-react";
import { LoadingSpinner } from "../../common/LoadingSpinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const SubjectPerformanceChart = ({ subjectData, isLoading, examStats }) => {
  if (isLoading) {
    return (
      <div className="h-64 w-full bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!subjectData || subjectData.length === 0) {
    return (
      <div className="h-64 w-full bg-white rounded-lg p-4 border border-gray-200 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <span className="text-sm font-medium text-gray-600 mb-1">
          No Subject Data
        </span>
        <span className="text-xs text-gray-500 text-center">
          Select an exam with subject performance data
        </span>
      </div>
    );
  }

  // Process data for Recharts
  const processChartData = () => {
    if (subjectData[0]?.subject && subjectData[0]?.avgScore !== undefined) {
      return subjectData.map((item) => ({
        subject: item.subject,
        score: item.avgScore || 0,
        participants: item.participants || 0,
        difficulty: item.difficulty || "MEDIUM",
      }));
    }
    if (subjectData[0]?.name && subjectData[0]?.score !== undefined) {
      return subjectData.map((item) => ({
        subject: item.name,
        score: item.score || 0,
        participants: item.count || 0,
      }));
    }
    if (subjectData[0]?.label && subjectData[0]?.value !== undefined) {
      return subjectData.map((item) => ({
        subject: item.label,
        score: item.value || 0,
        participants: item.questions || 0,
      }));
    }
    return subjectData.map((item, index) => ({
      subject: `Subject ${index + 1}`,
      score: item || 0,
    }));
  };

  const chartData = processChartData()
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // Show top 6 subjects

  // Beautiful gradient colors for subjects
  const subjectColors = [
    "#8b5cf6", // Purple
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#ec4899", // Pink
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
          <p className="font-medium text-gray-900">{data.subject}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Score:</span>
              <span className="font-semibold text-gray-900">{data.score}%</span>
            </div>
            {data.participants && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Questions:</span>
                <span className="font-semibold text-gray-900">
                  {data.participants}
                </span>
              </div>
            )}
            {data.difficulty && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Difficulty:</span>
                <span
                  className={`font-semibold ${
                    data.difficulty === "EASY"
                      ? "text-green-600"
                      : data.difficulty === "MEDIUM"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {data.difficulty}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Subject Performance
          </h3>
          <p className="text-xs text-gray-500">Average scores by subject</p>
        </div>
        <div className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-600">
          Top {chartData.length} subjects
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
            layout="vertical" // Horizontal bars
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="subject"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
              width={80}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(243, 244, 246, 0.5)" }}
            />
            <Bar
              dataKey="score"
              radius={[0, 4, 4, 0]}
              barSize={20}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={subjectColors[index % subjectColors.length]}
                  strokeWidth={0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance indicators */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xs text-gray-600">Highest</div>
          <div className="text-lg font-bold text-blue-700">
            {chartData.length > 0 ? `${chartData[0].score}%` : "N/A"}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {chartData.length > 0 ? chartData[0].subject : ""}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600">Average</div>
          <div className="text-lg font-bold text-gray-700">
            {chartData.length > 0
              ? `${Math.round(
                  chartData.reduce((sum, item) => sum + item.score, 0) /
                    chartData.length
                )}%`
              : "N/A"}
          </div>
          <div className="text-xs text-gray-500">All subjects</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-xs text-gray-600">Lowest</div>
          <div className="text-lg font-bold text-red-700">
            {chartData.length > 0
              ? `${chartData[chartData.length - 1].score}%`
              : "N/A"}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {chartData.length > 0
              ? chartData[chartData.length - 1].subject
              : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectPerformanceChart;
