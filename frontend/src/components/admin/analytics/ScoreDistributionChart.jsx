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

const ScoreDistributionChart = ({ distributionData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-64 w-full bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-center">
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
      <div className="h-64 w-full bg-white rounded-lg p-4 border border-gray-200 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <span className="text-sm font-medium text-gray-600 mb-1">
          No Score Data
        </span>
        <span className="text-xs text-gray-500 text-center">
          Select an exam with completed submissions
        </span>
      </div>
    );
  }

  // Process data for Recharts
  const processChartData = () => {
    if (
      distributionData[0]?.range &&
      distributionData[0]?.students !== undefined
    ) {
      return distributionData.map((item) => ({
        name: item.range,
        students: item.students || 0,
        percentage: item.percentage || 0,
      }));
    }
    if (
      distributionData[0]?.scoreRange &&
      distributionData[0]?.count !== undefined
    ) {
      return distributionData.map((item) => ({
        name: item.scoreRange,
        students: item.count || 0,
      }));
    }
    if (
      distributionData[0]?.label &&
      distributionData[0]?.value !== undefined
    ) {
      return distributionData.map((item) => ({
        name: item.label,
        students: item.value || 0,
      }));
    }
    return distributionData.map((item, index) => ({
      name: `Range ${index + 1}`,
      students: item || 0,
    }));
  };

  const chartData = processChartData();
  const totalStudents = chartData.reduce((sum, item) => sum + item.students, 0);

  // Color gradient based on score range
  const getBarColor = (name) => {
    if (!name) return "#3b82f6"; // Blue default

    const score = parseInt(name.split("-")[0]) || 0;
    if (score >= 81) return "#10b981"; // Green
    if (score >= 61) return "#3b82f6"; // Blue
    if (score >= 41) return "#f59e0b"; // Amber
    if (score >= 21) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const percentage =
        totalStudents > 0
          ? Math.round((payload[0].value / totalStudents) * 100)
          : 0;

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{payload[0].value}</span> students
          </p>
          <p className="text-xs text-gray-500">{percentage}% of total</p>
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
            Score Distribution
          </h3>
          <p className="text-xs text-gray-500">
            Histogram showing score ranges
          </p>
        </div>
        <div className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-600">
          {totalStudents} total students
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              label={{
                value: "Students",
                angle: -90,
                position: "insideLeft",
                offset: -5,
                style: { fill: "#6b7280", fontSize: 12 },
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(243, 244, 246, 0.5)" }}
            />
            <Bar dataKey="students" radius={[4, 4, 0, 0]} barSize={30}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.name)}
                  strokeWidth={0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getBarColor(item.name) }}
            />
            <span className="text-xs text-gray-600">
              {item.name}:{" "}
              <span className="font-semibold">{item.students}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreDistributionChart;
