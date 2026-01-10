import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Filter,
  Search,
  BookOpen,
  BarChart3,
  Eye,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { CreateQuestionModal } from "./CreateQuestionModal";
import { EditQuestionModal } from "./EditQuestionModal";
import { BulkImportModal } from "./BulkImportModal";
import toast from "react-hot-toast";

export const QuestionBank = ({ examId, examTitle, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (examId) {
      loadQuestions();
      loadStats();
    }
  }, [examId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getExamQuestions(examId);
      if (response.data.success) {
        setQuestions(response.data.data.questions);
      }
    } catch (error) {
      // console.error("Failed to load questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminService.getQuestionStats(examId);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      // console.error("Failed to load stats:", error);
    }
  };

  const handleCreateQuestion = async (questionData) => {
    try {
      const response = await adminService.addQuestion(questionData);
      if (response.data.success) {
        toast.success("Question added successfully!");
        loadQuestions();
        loadStats();
      } else {
        toast.error(response.data.error || "Failed to add question");
      }
    } catch (error) {
      // console.error("Failed to create question:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to add question");
      }
    }
  };

  const handleUpdateQuestion = async (questionId, questionData) => {
    try {
      const response = await adminService.updateQuestion(
        questionId,
        questionData
      );
      if (response.data.success) {
        toast.success("Question updated successfully!");
        loadQuestions();
        loadStats();
      } else {
        toast.error(response.data.error || "Failed to update question");
      }
    } catch (error) {
      // console.error("Failed to update question:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to update question");
      }
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const response = await adminService.deleteQuestion(questionId, examId);
      if (response.data.success) {
        toast.success("Question deleted successfully!");
        loadQuestions();
        loadStats();
      } else {
        toast.error(response.data.error || "Failed to delete question");
      }
    } catch (error) {
      // console.error("Failed to delete question:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to delete question");
      }
    }
  };

  const handleBulkImport = async (importData) => {
    try {
      const response = await adminService.bulkImportQuestions(importData);
      if (response.data.success) {
        toast.success(response.data.message);
        loadQuestions();
        loadStats();
      } else {
        toast.error(response.data.error || "Failed to import questions");
      }
    } catch (error) {
      // console.error("Failed to import questions:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to import questions");
      }
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || q.subject === selectedSubject;
    const matchesDifficulty =
      !selectedDifficulty || q.difficulty === selectedDifficulty;

    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HARD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCorrectAnswerLabel = (question) => {
    return question[`option${question.correctAnswer}`];
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-secondary">Loading questions...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Question Bank
            </h2>
            <p className="text-sm text-text-secondary">{examTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Back to Exams
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Card 1: Total Questions */}
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Questions</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.stats.totalQuestions}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-xs text-text-secondary mt-2">
              {stats.stats.remainingSlots} slots remaining
            </div>
          </div>
          {/* Card 2: By Difficulty */}
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  By Difficulty
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="space-y-2">
              {stats.stats.byDifficulty.map((diff, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        diff.difficulty === "EASY"
                          ? "bg-green-500"
                          : diff.difficulty === "MEDIUM"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-sm text-text-primary capitalize">
                      {diff.difficulty.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {diff.count}
                    </span>
                    <span className="text-xs text-text-secondary">
                      (
                      {Math.round(
                        (diff.count / stats.stats.totalQuestions) * 100
                      )}
                      %)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Card 3: By Subject (Improved with Scroll) */}
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Subjects
                </p>
              </div>
              <div className="text-sm font-medium text-text-primary">
                {stats.stats.bySubject.length} total
              </div>
            </div>

            {/* Scrollable container for subjects */}
            <div
              className="space-y-3 max-h-48 overflow-y-auto pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 #f1f5f9",
              }}
            >
              {stats.stats.bySubject.map((subject, index) => {
                const percentage = Math.round(
                  (subject.count / stats.stats.totalQuestions) * 100
                );
                return (
                  <div key={index} className="pr-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-primary truncate max-w-[120px]">
                        {subject.subject}
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {subject.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-text-secondary text-right">
                      {percentage}%
                    </div>
                  </div>
                );
              })}

              {stats.stats.bySubject.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-text-secondary italic">
                    No subjects yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-4 h-4 text-text-secondary" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {[...new Set(questions.map((q) => q.subject))].map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              title={showAnswer ? "Hide Answers" : "Show Answers"}
            >
              <Eye className="w-4 h-4" />
              {showAnswer ? "Hide Answers" : "Show Answers"}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>

          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>

          <button
            onClick={() => {
              const csvContent = questions.map((q) => ({
                "Question Text": q.questionText,
                "Option A": q.optionA,
                "Option B": q.optionB,
                "Option C": q.optionC,
                "Option D": q.optionD,
                "Correct Answer": q.correctAnswer,
                Subject: q.subject,
                Difficulty: q.difficulty,
                Explanation: q.explanation || "",
              }));

              // Convert to CSV
              const headers = Object.keys(csvContent[0] || {});
              const csvRows = [
                headers.join(","),
                ...csvContent.map((row) =>
                  headers
                    .map(
                      (header) =>
                        `"${String(row[header] || "").replace(/"/g, '""')}"`
                    )
                    .join(",")
                ),
              ];

              const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `questions-export-${examId}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {filteredQuestions.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredQuestions.map((question, index) => (
              <div key={question.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-medium text-text-primary">
                        Q{index + 1}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        {question.subject}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(
                          question.difficulty
                        )}`}
                      >
                        {question.difficulty}
                      </span>
                      {showAnswer && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Correct: {question.correctAnswer}
                        </span>
                      )}
                    </div>

                    <p className="text-text-primary mb-4">
                      {question.questionText}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {["A", "B", "C", "D"].map((option) => (
                        <div
                          key={option}
                          className={`p-3 rounded-lg border ${
                            showAnswer && question.correctAnswer === option
                              ? "bg-green-50 border-green-200"
                              : "bg-gray-50 border-border"
                          }`}
                        >
                          <div className="text-xs text-text-secondary mb-1">
                            {option}
                          </div>
                          <div className="text-sm">
                            {question[`option${option}`]}
                          </div>
                        </div>
                      ))}
                    </div>

                    {showAnswer && question.correctAnswer && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg">
                        <div className="text-xs font-medium text-green-800">
                          Correct Answer: {getCorrectAnswerLabel(question)}
                        </div>
                      </div>
                    )}

                    {question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs font-medium text-blue-800 mb-1">
                          Explanation
                        </div>
                        <div className="text-sm text-blue-700">
                          {question.explanation}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:flex-col">
                    <button
                      onClick={() => {
                        setSelectedQuestion(question);
                        setShowEditModal(true);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No questions found
            </h3>
            <p className="text-text-secondary mb-6">
              {searchTerm || selectedSubject || selectedDifficulty
                ? "Try adjusting your filters"
                : "Add questions to get started"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Add Your First Question
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateQuestionModal
          examId={examId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateQuestion}
        />
      )}

      {showEditModal && selectedQuestion && (
        <EditQuestionModal
          question={selectedQuestion}
          examId={examId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedQuestion(null);
          }}
          onSuccess={handleUpdateQuestion}
        />
      )}

      {showBulkImportModal && (
        <BulkImportModal
          examId={examId}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={handleBulkImport}
        />
      )}
    </div>
  );
};
