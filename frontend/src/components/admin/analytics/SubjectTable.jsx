import { Download, AlertCircle } from "lucide-react";

const SubjectTable = ({ subjectPerformance, selectedExam, onExport }) => {
  if (subjectPerformance.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-medium text-text-primary">
            Detailed Subject Analysis
          </h3>
        </div>
        <div className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-text-secondary">
            No subject performance data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-text-primary">
          Detailed Subject Analysis
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onExport("questions")}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedExam || subjectPerformance.length === 0}
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Subject
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Avg Score
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Questions
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Difficulty Level
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                Performance
              </th>
            </tr>
          </thead>
          <tbody>
            {subjectPerformance.map((subject, index) => (
              <tr
                key={index}
                className="border-b border-border hover:bg-gray-50"
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-text-primary">
                    {subject.subject}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div
                    className={`font-medium ${
                      subject.avgScore >= 70
                        ? "text-green-600"
                        : subject.avgScore >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {subject.avgScore}%
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-text-primary">
                    {subject.participants}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      subject.difficulty === "EASY"
                        ? "bg-green-100 text-green-800"
                        : subject.difficulty === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-800"
                        : subject.difficulty === "HARD"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {subject.difficulty === "EASY"
                      ? "Easy"
                      : subject.difficulty === "MEDIUM"
                      ? "Medium"
                      : subject.difficulty === "HARD"
                      ? "Hard"
                      : subject.difficulty}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          subject.avgScore >= 70
                            ? "bg-green-500"
                            : subject.avgScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${subject.avgScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-text-secondary w-12 text-right">
                      {subject.avgScore}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-xs text-text-secondary text-center">
          Showing {subjectPerformance.length} subject
          {subjectPerformance.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
};

export default SubjectTable;
