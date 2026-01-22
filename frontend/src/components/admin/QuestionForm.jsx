import { useState, useEffect } from "react";
import { Info, AlertCircle } from "lucide-react";

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
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Validation based on backend schema
  const validateField = (name, value) => {
    switch (name) {
      case "questionText":
        if (!value.trim()) return "Question text is required";
        if (value.length < 5)
          return "Question text must be at least 5 characters";
        if (value.length > 2000)
          return "Question text cannot exceed 2000 characters";
        return "";

      case "optionA":
        if (!value.trim()) return "Option A is required";
        if (value.length > 500) return "Option A cannot exceed 500 characters";
        return "";

      case "optionB":
        if (!value.trim()) return "Option B is required";
        if (value.length > 500) return "Option B cannot exceed 500 characters";
        return "";

      case "optionC":
        if (!value.trim()) return "Option C is required";
        if (value.length > 500) return "Option C cannot exceed 500 characters";
        return "";

      case "optionD":
        if (!value.trim()) return "Option D is required";
        if (value.length > 500) return "Option D cannot exceed 500 characters";
        return "";

      case "correctAnswer":
        if (!value) return "Correct answer is required";
        if (!["A", "B", "C", "D"].includes(value))
          return "Correct answer must be A, B, C, or D";
        return "";

      case "subject":
        if (!value.trim()) return "Subject is required";
        if (value.length < 2) return "Subject must be at least 2 characters";
        if (value.length > 255) return "Subject cannot exceed 255 characters";
        return "";

      case "difficulty":
        if (!value) return "Difficulty is required";
        if (!["EASY", "MEDIUM", "HARD"].includes(value))
          return "Difficulty must be EASY, MEDIUM, or HARD";
        return "";

      case "explanation":
        if (value && value.length > 2000)
          return "Explanation cannot exceed 2000 characters";
        return "";

      default:
        return "";
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update validation on form change
  useEffect(() => {
    const formIsValid = validateForm();
    setIsValid(formIsValid);
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Question Text *
        </label>
        <textarea
          value={formData.questionText}
          onChange={(e) => handleChange("questionText", e.target.value)}
          onBlur={() => handleBlur("questionText")}
          rows={3}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
            errors.questionText && touched.questionText
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-border"
          }`}
          placeholder="Enter the question..."
        />
        <p className="mt-1 text-xs text-text-secondary">
          {formData.questionText.length}/2000 characters
        </p>
        {errors.questionText && touched.questionText && (
          <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.questionText}</span>
          </div>
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
                onBlur={() => handleBlur(`option${option}`)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors[`option${option}`] && touched[`option${option}`]
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-border"
                }`}
                placeholder={`Enter option ${option}...`}
              />
              <p className="mt-1 text-xs text-text-secondary">
                {formData[`option${option}`].length}/500 characters
              </p>
              {errors[`option${option}`] && touched[`option${option}`] && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors[`option${option}`]}</span>
                </div>
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
            onBlur={() => handleBlur("subject")}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
              errors.subject && touched.subject
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-border"
            }`}
            placeholder="e.g., Mathematics, Biology..."
          />
          <p className="mt-1 text-xs text-text-secondary">
            {formData.subject.length}/255 characters
          </p>
          {errors.subject && touched.subject && (
            <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.subject}</span>
            </div>
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
            onBlur={() => handleBlur("difficulty")}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
              errors.difficulty && touched.difficulty
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-border"
            }`}
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          {errors.difficulty && touched.difficulty && (
            <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.difficulty}</span>
            </div>
          )}
        </div>

        {/* Correct Answer */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Correct Answer *
          </label>
          <select
            value={formData.correctAnswer}
            onChange={(e) => handleChange("correctAnswer", e.target.value)}
            onBlur={() => handleBlur("correctAnswer")}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
              errors.correctAnswer && touched.correctAnswer
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-border"
            }`}
          >
            <option value="A">Option A</option>
            <option value="B">Option B</option>
            <option value="C">Option C</option>
            <option value="D">Option D</option>
          </select>
          {errors.correctAnswer && touched.correctAnswer && (
            <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.correctAnswer}</span>
            </div>
          )}
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
          onBlur={() => handleBlur("explanation")}
          rows={2}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
            errors.explanation && touched.explanation
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-border"
          }`}
          placeholder="Explain why this answer is correct..."
        />
        <p className="mt-1 text-xs text-text-secondary">
          {formData.explanation.length}/2000 characters (optional)
        </p>
        {errors.explanation && touched.explanation && (
          <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.explanation}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-border">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center justify-center gap-2 transition-colors ${
            !isValid ? "opacity-50 cursor-not-allowed" : ""
          }`}
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
