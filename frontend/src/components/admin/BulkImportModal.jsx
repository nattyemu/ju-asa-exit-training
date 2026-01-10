import { useState, useRef } from "react";
import { X, Upload, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";

export const BulkImportModal = ({ examId, onClose, onSuccess }) => {
  const [importType, setImportType] = useState("json"); // 'json' or 'csv'
  const [jsonData, setJsonData] = useState("");
  const [csvData, setCsvData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const jsonTemplate = `[
  {
    "questionText": "What is 2 + 2?",
    "optionA": "3",
    "optionB": "4",
    "optionC": "5",
    "optionD": "6",
    "correctAnswer": "B",
    "subject": "Mathematics",
    "difficulty": "EASY",
    "explanation": "Basic addition"
  },
  {
    "questionText": "What is the capital of Ethiopia?",
    "optionA": "Addis Ababa",
    "optionB": "Nairobi",
    "optionC": "Cairo",
    "optionD": "Khartoum",
    "correctAnswer": "A",
    "subject": "Geography",
    "difficulty": "MEDIUM",
    "explanation": "Addis Ababa is the capital and largest city of Ethiopia"
  }
]`;

  const csvTemplate = `questionText,optionA,optionB,optionC,optionD,correctAnswer,subject,difficulty,explanation
"What is 2 + 2?","3","4","5","6","B","Mathematics","EASY","Basic addition"
"What is the capital of Ethiopia?","Addis Ababa","Nairobi","Cairo","Khartoum","A","Geography","MEDIUM","Addis Ababa is the capital and largest city of Ethiopia"`;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      if (importType === "json") {
        setJsonData(content);
      } else {
        setCsvData(content);
      }
      toast.success("File loaded successfully");
    };

    if (importType === "json") {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  };

  const validateJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new Error("Data must be an array of questions");
      }

      // Basic validation
      parsed.forEach((q, index) => {
        if (!q.questionText)
          throw new Error(`Question ${index + 1}: Missing questionText`);
        if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
          throw new Error(
            `Question ${index + 1}: All options (A, B, C, D) are required`
          );
        }
        if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
          throw new Error(
            `Question ${index + 1}: correctAnswer must be A, B, C, or D`
          );
        }
        if (!q.subject)
          throw new Error(`Question ${index + 1}: Missing subject`);
        if (!["EASY", "MEDIUM", "HARD"].includes(q.difficulty)) {
          throw new Error(
            `Question ${index + 1}: difficulty must be EASY, MEDIUM, or HARD`
          );
        }
      });

      return parsed;
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  };

  const parseCsv = (csvString) => {
    try {
      const lines = csvString.split("\n");
      if (lines.length < 2) {
        throw new Error("CSV must have at least header and one data row");
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const requiredHeaders = [
        "questionText",
        "optionA",
        "optionB",
        "optionC",
        "optionD",
        "correctAnswer",
        "subject",
        "difficulty",
      ];

      // Check headers
      requiredHeaders.forEach((header) => {
        if (!headers.includes(header)) {
          throw new Error(`Missing required column: ${header}`);
        }
      });

      const questions = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map((v) => v.trim());
        const question = {};

        headers.forEach((header, index) => {
          if (index < values.length) {
            question[header] = values[index];
          }
        });

        // Validate required fields
        if (!question.questionText)
          throw new Error(`Row ${i}: Missing questionText`);
        if (
          !question.optionA ||
          !question.optionB ||
          !question.optionC ||
          !question.optionD
        ) {
          throw new Error(`Row ${i}: All options (A, B, C, D) are required`);
        }
        if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
          throw new Error(`Row ${i}: correctAnswer must be A, B, C, or D`);
        }
        if (!question.subject) throw new Error(`Row ${i}: Missing subject`);
        if (!["EASY", "MEDIUM", "HARD"].includes(question.difficulty)) {
          question.difficulty = "MEDIUM"; // Default
        }

        questions.push(question);
      }

      return questions;
    } catch (error) {
      throw new Error(`Invalid CSV format: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      let questions;
      if (importType === "json") {
        questions = validateJson(jsonData);
      } else {
        questions = parseCsv(csvData);
      }

      if (questions.length === 0) {
        throw new Error("No valid questions found in the import data");
      }

      if (questions.length > 100) {
        throw new Error("Cannot import more than 100 questions at once");
      }

      // Prepare data for API
      const importData = {
        examId,
        questions,
      };

      // Call API via parent component
      await onSuccess(importData);

      onClose();
    } catch (error) {
      // console.error("Import error:", error);
      toast.error(error.message || "Failed to import questions");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const template = importType === "json" ? jsonTemplate : csvTemplate;
    const blob = new Blob([template], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `questions-template.${importType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Bulk Import Questions
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Import multiple questions via JSON or CSV
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Import Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Import Format
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setImportType("json")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  importType === "json"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                }`}
              >
                JSON Format
              </button>
              <button
                type="button"
                onClick={() => setImportType("csv")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  importType === "csv"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                }`}
              >
                CSV Format
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Upload File
            </label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-primary font-medium mb-2">
                Click to upload {importType.toUpperCase()} file
              </p>
              <p className="text-sm text-text-secondary">
                or drag and drop your file here
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept={importType === "json" ? ".json" : ".csv"}
                className="hidden"
              />
            </div>
          </div>

          {/* Data Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-text-secondary">
                Or paste {importType.toUpperCase()} data directly
              </label>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
            <textarea
              value={importType === "json" ? jsonData : csvData}
              onChange={(e) =>
                importType === "json"
                  ? setJsonData(e.target.value)
                  : setCsvData(e.target.value)
              }
              rows={10}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm"
              placeholder={`Paste your ${importType.toUpperCase()} data here...`}
            />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Import Instructions
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Maximum 100 questions per import</li>
                  <li>
                    • Required fields: questionText, optionA-D, correctAnswer,
                    subject, difficulty
                  </li>
                  <li>• Difficulty must be: EASY, MEDIUM, or HARD</li>
                  <li>• Correct answer must be: A, B, C, or D</li>
                  <li>• Explanation field is optional</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!jsonData && !csvData)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Questions
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
