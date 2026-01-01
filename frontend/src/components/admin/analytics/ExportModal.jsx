import { useState, useEffect } from "react";
import { Download, X, Info } from "lucide-react";
import { LoadingSpinner } from "../../common/LoadingSpinner";

const ExportModal = ({ isOpen, onClose, onExport, selectedExam, loading }) => {
  const [exportType, setExportType] = useState("complete");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      setStartDate(formatDate(thirtyDaysAgo));
      setEndDate(formatDate(today));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (exportType === "complete") {
      if (!startDate || !endDate) {
        alert("Please select both start and end dates for complete report");
        return;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        alert("Please use YYYY-MM-DD format for dates");
        return;
      }

      onExport(exportType, { startDate, endDate });
    } else {
      onExport(exportType);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Export Report
            </h3>
            <p className="text-sm text-text-secondary">
              Select export options for {selectedExam?.title || "selected exam"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Export Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportType"
                    value="complete"
                    checked={exportType === "complete"}
                    onChange={(e) => setExportType(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium">Complete Report</div>
                    <div className="text-sm text-text-secondary">
                      Comprehensive analytics with date range
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportType"
                    value="results"
                    checked={exportType === "results"}
                    onChange={(e) => setExportType(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium">Exam Results Only</div>
                    <div className="text-sm text-text-secondary">
                      Student scores and rankings
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportType"
                    value="questions"
                    checked={exportType === "questions"}
                    onChange={(e) => setExportType(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium">Question Analytics</div>
                    <div className="text-sm text-text-secondary">
                      Question performance and subject analysis
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {exportType === "complete" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Info className="w-4 h-4" />
                  <span>Complete report requires date range selection</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Start Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      pattern="\d{4}-\d{2}-\d{2}"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Format: YYYY-MM-DD
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      End Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      pattern="\d{4}-\d{2}-\d{2}"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Format: YYYY-MM-DD
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportModal;
