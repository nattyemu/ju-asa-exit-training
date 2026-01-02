import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const ProgressLineChart = ({ data, title, color = "#3b82f6" }) => {
  const getTrendIcon = () => {
    if (data.length < 2) return <Minus className="w-4 h-4 text-gray-400" />;

    const firstScore = data[0]?.score || 0;
    const lastScore = data[data.length - 1]?.score || 0;

    if (lastScore > firstScore) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (lastScore < firstScore) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-text-primary">{title}</h4>
        {getTrendIcon()}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 100]}
              label={{
                value: "Score %",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value}%`, "Score"]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PerformanceBarChart = ({ data, title }) => {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <h4 className="font-medium text-text-primary mb-4">{title}</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="subject"
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
              }}
              formatter={(value) => [`${value}%`, "Accuracy"]}
            />
            <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SubjectPieChart = ({ data }) => {
  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#8b5cf6",
  ];

  const totalQuestions = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <h4 className="font-medium text-text-primary mb-4">
        Questions by Subject
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, "Questions"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center text-sm text-text-secondary mt-2">
        Total: {totalQuestions} questions
      </div>
    </div>
  );
};

export const TimeSpentChart = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <h4 className="font-medium text-text-primary mb-4">
        Study Time Distribution
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              label={{
                value: "Minutes",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
              }}
              formatter={(value) => [`${value} min`, "Study Time"]}
            />
            <Bar dataKey="minutes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
