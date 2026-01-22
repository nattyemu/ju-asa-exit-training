import { useState, useEffect } from "react";
import { X, Calendar, Clock, Award, AlertCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";

export const CreateExamModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    availableFrom: new Date(Date.now() + 60000), // 1 minute from now
    availableUntil: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 7 days from now
    duration: 180, // 3 hours in minutes
    totalQuestions: 100,
    passingScore: 50,
    isActive: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validation rules based on backend Zod schema
  const validateField = (name, value) => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Title is required";
        if (value.length < 3) return "Title must be at least 3 characters";
        if (value.length > 255) return "Title cannot exceed 255 characters";
        return "";

      case "description":
        if (value && value.length > 0 && value.length < 10) {
          return "Description must be at least 10 characters";
        }
        return "";

      case "availableFrom":
        if (!value) return "Available from date is required";
        const fromDate = new Date(value);
        if (isNaN(fromDate.getTime())) {
          return "Invalid date format";
        }
        const now = new Date();
        // Allow dates up to 1 minute in the past to account for small time differences
        if (fromDate <= new Date(now.getTime() - 60000)) {
          return "Available from date must be in the future";
        }
        return "";

      case "availableUntil":
        if (!value) return "Available until date is required";
        const untilDate = new Date(value);
        if (isNaN(untilDate.getTime())) {
          return "Invalid date format";
        }
        const fromDateToCompare = new Date(formData.availableFrom);
        if (untilDate <= fromDateToCompare) {
          return "Available until date must be after available from date";
        }
        return "";

      case "duration":
        if (!value && value !== 0) return "Duration is required";
        const durationNum = parseInt(value);
        if (isNaN(durationNum)) return "Duration must be a number";
        if (!Number.isInteger(durationNum))
          return "Duration must be an integer";
        if (durationNum < 1) return "Duration must be at least 1 minute";
        if (durationNum > 480)
          return "Duration cannot exceed 480 minutes (8 hours)";
        return "";

      case "totalQuestions":
        if (!value && value !== 0) return "Total questions is required";
        const questionsNum = parseInt(value);
        if (isNaN(questionsNum)) return "Total questions must be a number";
        if (!Number.isInteger(questionsNum))
          return "Total questions must be an integer";
        if (questionsNum < 1) return "Exam must have at least 1 question";
        if (questionsNum > 500)
          return "Exam cannot have more than 500 questions";
        return "";

      case "passingScore":
        if (!value && value !== 0) return "Passing score is required";
        const scoreNum = parseFloat(value);
        if (isNaN(scoreNum)) return "Passing score must be a number";
        if (scoreNum < 0) return "Passing score cannot be negative";
        if (scoreNum > 100) return "Passing score cannot exceed 100%";
        return "";

      default:
        return "";
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    // Validate all fields
    Object.keys(formData).forEach((field) => {
      if (field !== "isActive") {
        // Skip isActive for validation
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    // Additional validation for date comparison
    const fromDate = new Date(formData.availableFrom);
    const untilDate = new Date(formData.availableUntil);
    if (
      !newErrors.availableFrom &&
      !newErrors.availableUntil &&
      untilDate <= fromDate
    ) {
      newErrors.availableUntil =
        "Available until date must be after available from date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update validation on form change
  useEffect(() => {
    const formIsValid = validateForm();
    setIsValid(formIsValid);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((field) => {
      if (field !== "isActive") {
        allTouched[field] = true;
      }
    });
    setTouched(allTouched);

    if (!validateForm()) {
      const firstError = Object.values(errors).find((error) => error);
      if (firstError) {
        toast.error(firstError);
      }
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
      // Error will be handled by parent component with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate field if it's been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate the blurred field
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleDateChange = (field, date) => {
    setFormData((prev) => ({ ...prev, [field]: date }));

    // Validate date field if it's been touched
    if (touched[field]) {
      const error = validateField(field, date);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }

    // If changing availableFrom, also validate availableUntil
    if (field === "availableFrom" && touched.availableUntil) {
      const untilError = validateField(
        "availableUntil",
        formData.availableUntil,
      );
      setErrors((prev) => ({ ...prev, availableUntil: untilError }));
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
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6">
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
                onBlur={() => handleBlur("title")}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.title && touched.title
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-border"
                }`}
                placeholder="e.g., Ethiopian Exit Exam Practice 2026"
              />
              {errors.title && touched.title && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.title}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                onBlur={() => handleBlur("description")}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.description && touched.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-border"
                }`}
                placeholder="Brief description of the exam (at least 10 characters if provided)..."
              />
              <p className="mt-1 text-xs text-text-secondary">
                Leave empty or provide at least 10 characters
              </p>
              {errors.description && touched.description && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.description}</span>
                </div>
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
                    onChange={(date) => handleDateChange("availableFrom", date)}
                    onBlur={() => handleBlur("availableFrom")}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy HH:mm"
                    minDate={new Date(Date.now() + 60000)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                      errors.availableFrom && touched.availableFrom
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-border"
                    }`}
                  />
                  {errors.availableFrom && touched.availableFrom && (
                    <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errors.availableFrom}</span>
                    </div>
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
                    onChange={(date) =>
                      handleDateChange("availableUntil", date)
                    }
                    onBlur={() => handleBlur("availableUntil")}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy HH:mm"
                    minDate={formData.availableFrom}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                      errors.availableUntil && touched.availableUntil
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-border"
                    }`}
                  />
                  {errors.availableUntil && touched.availableUntil && (
                    <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errors.availableUntil}</span>
                    </div>
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
                  onBlur={() => handleBlur("duration")}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.duration && touched.duration
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-border"
                  }`}
                  min="1"
                  max="480"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  1-480 minutes (8 hours max)
                </p>
                {errors.duration && touched.duration && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.duration}</span>
                  </div>
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
                      parseInt(e.target.value) || 0,
                    )
                  }
                  onBlur={() => handleBlur("totalQuestions")}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.totalQuestions && touched.totalQuestions
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-border"
                  }`}
                  min="1"
                  max="500"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  1-500 questions
                </p>
                {errors.totalQuestions && touched.totalQuestions && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.totalQuestions}</span>
                  </div>
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
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  onBlur={() => handleBlur("passingScore")}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.passingScore && touched.passingScore
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-border"
                  }`}
                  min="0"
                  max="100"
                  step="0.01"
                />
                <p className="mt-1 text-xs text-text-secondary">0-100%</p>
                {errors.passingScore && touched.passingScore && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.passingScore}</span>
                  </div>
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
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2 transition-colors ${
                !isValid ? "opacity-50 cursor-not-allowed" : ""
              }`}
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
