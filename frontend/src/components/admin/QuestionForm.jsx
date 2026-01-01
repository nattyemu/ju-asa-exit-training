import { useState } from "react";
import { Info } from "lucide-react";

export const QuestionForm = ({
  initialData = {},
  onSubmit,
  submitText = "Save",
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState(() => ({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    subject: "",
    difficulty: "MEDIUM",
    explanation: "",
    ...initialData,
  }));

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.questionText.trim()) {
      newErrors.questionText = "Question text is required";
    } else if (formData.questionText.length < 5) {
      newErrors.questionText = "Question must be at least 5 characters";
    }

    if (!formData.optionA.trim()) {
      newErrors.optionA = "Option A is required";
    }

    if (!formData.optionB.trim()) {
      newErrors.optionB = "Option B is required";
    }

    if (!formData.optionC.trim()) {
      newErrors.optionC = "Option C is required";
    }

    if (!formData.optionD.trim()) {
      newErrors.optionD = "Option D is required";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.length < 2) {
      newErrors.subject = "Subject must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Question Text *
        </label>
        <textarea
          value={formData.questionText}
          onChange={(e) => handleChange("questionText", e.target.value)}
          rows={3}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
            errors.questionText ? "border-red-300" : "border-border"
          }`}
          placeholder="Enter the question..."
        />
        {errors.questionText && (
          <p className="mt-1 text-sm text-red-600">{errors.questionText}</p>
        )}
      </div>

      {/* Options Grid */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Options *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["A", "B", "C", "D"].map((option) => (
            <div key={option}>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Option {option}
              </label>
              <input
                type="text"
                value={formData[`option${option}`]}
                onChange={(e) =>
                  handleChange(`option${option}`, e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors[`option${option}`] ? "border-red-300" : "border-border"
                }`}
                placeholder={`Enter option ${option}...`}
              />
              {errors[`option${option}`] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[`option${option}`]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subject & Difficulty & Correct Answer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Subject *
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => handleChange("subject", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
              errors.subject ? "border-red-300" : "border-border"
            }`}
            placeholder="e.g., Mathematics, Biology..."
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
          )}
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Difficulty *
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => handleChange("difficulty", e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Correct Answer */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Correct Answer *
          </label>
          <select
            value={formData.correctAnswer}
            onChange={(e) => handleChange("correctAnswer", e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          >
            <option value="A">Option A</option>
            <option value="B">Option B</option>
            <option value="C">Option C</option>
            <option value="D">Option D</option>
          </select>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Explanation (Optional)
        </label>
        <textarea
          value={formData.explanation}
          onChange={(e) => handleChange("explanation", e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="Explain why this answer is correct..."
        />
        <p className="mt-1 text-xs text-text-secondary">
          This helps students understand the concept
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            submitText
          )}
        </button>
      </div>
    </form>
  );
};
