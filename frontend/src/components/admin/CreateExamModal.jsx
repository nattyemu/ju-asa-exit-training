import { useState } from "react";
import { X, Calendar, Clock, Award } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";

export const CreateExamModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    availableFrom: new Date(Date.now() + 60000), // 1 minute from now
    availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    duration: 180, // 3 hours in minutes
    totalQuestions: 100,
    passingScore: 50,
    isActive: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (formData.description && formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (formData.duration <= 0) {
      newErrors.duration = "Duration must be positive";
    } else if (formData.duration > 480) {
      newErrors.duration = "Duration cannot exceed 480 minutes (8 hours)";
    }

    if (formData.totalQuestions <= 0) {
      newErrors.totalQuestions = "Questions must be positive";
    } else if (formData.totalQuestions > 500) {
      newErrors.totalQuestions = "Exam cannot have more than 500 questions";
    }

    if (formData.passingScore < 0 || formData.passingScore > 100) {
      newErrors.passingScore = "Passing score must be between 0% and 100%";
    }

    const now = new Date();
    if (formData.availableFrom <= now) {
      newErrors.availableFrom = "Start date must be in the future";
    }

    if (formData.availableUntil <= formData.availableFrom) {
      newErrors.availableUntil = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    try {
      // Format dates to ISO string for API
      const dataToSubmit = {
        ...formData,
        availableFrom: formData.availableFrom.toISOString(),
        availableUntil: formData.availableUntil.toISOString(),
      };

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Submission failed:", error);
      // Error will be handled by parent component with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Create New Exam
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Configure exam settings and schedule
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Title & Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Exam Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.title ? "border-red-300" : "border-border"
                }`}
                placeholder="e.g., Ethiopian Exit Exam Practice 2024"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.description ? "border-red-300" : "border-border"
                }`}
                placeholder="Brief description of the exam (at least 10 characters if provided)..."
              />
              <p className="mt-1 text-xs text-text-secondary">
                Leave empty or provide at least 10 characters
              </p>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Available Period *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-secondary">
                      Start Date & Time *
                    </span>
                  </div>
                  <DatePicker
                    selected={formData.availableFrom}
                    onChange={(date) => handleChange("availableFrom", date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy HH:mm"
                    minDate={new Date(Date.now() + 60000)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                      errors.availableFrom ? "border-red-300" : "border-border"
                    }`}
                  />
                  {errors.availableFrom && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.availableFrom}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-secondary">
                      End Date & Time *
                    </span>
                  </div>
                  <DatePicker
                    selected={formData.availableUntil}
                    onChange={(date) => handleChange("availableUntil", date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy HH:mm"
                    minDate={formData.availableFrom}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                      errors.availableUntil ? "border-red-300" : "border-border"
                    }`}
                  />
                  {errors.availableUntil && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.availableUntil}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Exam Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration (minutes) *
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    handleChange("duration", parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.duration ? "border-red-300" : "border-border"
                  }`}
                  min="1"
                  max="480"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  1-480 minutes (8 hours max)
                </p>
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Total Questions *
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.totalQuestions}
                  onChange={(e) =>
                    handleChange(
                      "totalQuestions",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.totalQuestions ? "border-red-300" : "border-border"
                  }`}
                  min="1"
                  max="500"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  1-100 questions
                </p>
                {errors.totalQuestions && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.totalQuestions}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <div className="flex items-center gap-2">
                    Passing Score(%) *
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) =>
                    handleChange(
                      "passingScore",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.passingScore ? "border-red-300" : "border-border"
                  }`}
                  min="0"
                  max="100"
                  step="1"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  passing score(%)
                </p>
                {errors.passingScore && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.passingScore}
                  </p>
                )}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm text-text-primary">
                Activate exam immediately
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                "Create Exam"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
