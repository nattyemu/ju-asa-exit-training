import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Award,
  Users,
  BarChart3,
  Download,
  Send,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import { format } from "date-fns";
import { adminService } from "../../services/adminService.js";
import { LoadingSpinner } from "../common/LoadingSpinner.jsx";
import { CreateExamModal } from "./CreateExamModal.jsx";
import { EditExamModal } from "./EditExamModal.jsx";
import { QuestionBank } from "./QuestionBank.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const ExamManager = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Question Bank State
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [selectedExamForQuestions, setSelectedExamForQuestions] =
    useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, [pagination.page]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllExams(
        pagination.page,
        pagination.limit
      );
      if (response.data.success) {
        setExams(response.data.data.exams);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load exams:", error);
      toast.error("Failed to load exams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (examData) => {
    try {
      const response = await adminService.createExam(examData);
      if (response.data.success) {
        toast.success("Exam created successfully!");
        loadExams();
        setShowCreateModal(false);
      } else {
        toast.error(response.data.message || "Failed to create exam");
      }
    } catch (error) {
      console.error("Failed to create exam:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to create exam. Please try again.");
      }
    }
  };

  const handleUpdateExam = async (examId, examData) => {
    try {
      const response = await adminService.updateExam(examId, examData);
      if (response.data.success) {
        toast.success("Exam updated successfully!");
        loadExams();
        setShowEditModal(false);
      } else {
        toast.error(response.data.message || "Failed to update exam");
      }
    } catch (error) {
      console.error("Failed to update exam:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to update exam. Please try again.");
      }
    }
  };

  const handleToggleStatus = async (examId, currentStatus) => {
    try {
      const response = await adminService.updateExamStatus(
        examId,
        !currentStatus
      );
      if (response.data.success) {
        const action = !currentStatus ? "activated" : "deactivated";
        toast.success(`Exam ${action} successfully!`);
        loadExams();
      } else {
        toast.error(response.data.message || "Failed to update exam status");
      }
    } catch (error) {
      console.error("Failed to update exam status:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to update exam status. Please try again.");
      }
    }
  };

  const handleManageQuestions = (exam) => {
    setSelectedExamForQuestions(exam);
    setShowQuestionBank(true);
  };

  const handleViewAnalytics = (examId, examTitle) => {
    // Navigate to analytics page with examId as URL parameter
    navigate("/admin/analytics", {
      state: {
        examId: examId,
        examTitle: examTitle,
      },
    });
  };

  const getStatusBadge = (isActive) => (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
        isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
      }`}
    >
      {isActive ? (
        <>
          <Eye className="w-3 h-3" />
          Active
        </>
      ) : (
        <>
          <EyeOff className="w-3 h-3" />
          Inactive
        </>
      )}
    </span>
  );

  if (loading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-secondary">Loading exams...</p>
      </div>
    );
  }

  // If showing question bank, render it
  if (showQuestionBank && selectedExamForQuestions) {
    return (
      <div>
        {/* Question Bank Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowQuestionBank(false);
              setSelectedExamForQuestions(null);
            }}
            className="flex items-center gap-2 text-text-secondary hover:text-primary mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Exams
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {selectedExamForQuestions.title}
              </h1>
              <p className="text-text-secondary mt-1">Question Management</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                {selectedExamForQuestions.totalQuestions} questions
              </span>
            </div>
          </div>
        </div>

        {/* Question Bank Component */}
        <QuestionBank
          examId={selectedExamForQuestions.id}
          examTitle={selectedExamForQuestions.title}
          onClose={() => {
            setShowQuestionBank(false);
            setSelectedExamForQuestions(null);
          }}
        />
      </div>
    );
  }

  // Render Exam Manager
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Exam Management
          </h2>
          <p className="text-sm text-text-secondary">
            Create and manage practice exams
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Exam
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Exams</p>
              <p className="text-2xl font-bold text-text-primary">
                {pagination.total}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Active Exams</p>
              <p className="text-2xl font-bold text-text-primary">
                {exams.filter((e) => e.isActive).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Inactive Exams</p>
              <p className="text-2xl font-bold text-text-primary">
                {exams.filter((e) => !e.isActive).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Avg Questions</p>
              <p className="text-2xl font-bold text-text-primary">
                {exams.length > 0
                  ? Math.round(
                      exams.reduce((sum, e) => sum + e.totalQuestions, 0) /
                        exams.length
                    )
                  : 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Title
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Duration
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Questions
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Available Period
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr
                  key={exam.id}
                  className="border-b border-border hover:bg-gray-50"
                >
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-text-primary">
                        {exam.title}
                      </div>
                      <div className="text-xs text-text-secondary mt-1 line-clamp-1">
                        {exam.description}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(exam.isActive)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-sm text-text-primary">
                      <Clock className="w-4 h-4" />
                      {Math.floor(exam.duration / 60)}h {exam.duration % 60}m
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-text-primary font-medium">
                      {exam.totalQuestions}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-text-secondary">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(exam.availableFrom), "MMM d, yyyy")}
                      </div>
                      <div className="text-xs text-text-secondary">
                        to{" "}
                        {format(new Date(exam.availableUntil), "MMM d, yyyy")}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleToggleStatus(exam.id, exam.isActive)
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={exam.isActive ? "Deactivate" : "Activate"}
                      >
                        {exam.isActive ? (
                          <EyeOff className="w-4 h-4 text-gray-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedExam(exam);
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Exam"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleManageQuestions(exam)}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Manage Questions"
                      >
                        <Award className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => handleViewAnalytics(exam.id, exam.title)}
                        className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} exams
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exam Modals */}
      {showCreateModal && (
        <CreateExamModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateExam}
        />
      )}

      {showEditModal && selectedExam && (
        <EditExamModal
          exam={selectedExam}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExam(null);
          }}
          onSubmit={handleUpdateExam}
        />
      )}
    </div>
  );
};
