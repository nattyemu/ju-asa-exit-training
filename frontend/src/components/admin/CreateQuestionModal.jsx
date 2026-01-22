import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { QuestionForm } from "./QuestionForm";
import toast from "react-hot-toast";

export const CreateQuestionModal = ({ examId, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validation function based on backend schema
  const validateFormData = (formData) => {
    const errors = {};

    if (!formData.questionText?.trim()) {
      errors.questionText = "Question text is required";
    } else if (formData.questionText.length < 5) {
      errors.questionText = "Question text must be at least 5 characters";
    } else if (formData.questionText.length > 2000) {
      errors.questionText = "Question text cannot exceed 2000 characters";
    }

    if (!formData.optionA?.trim()) {
      errors.optionA = "Option A is required";
    } else if (formData.optionA.length > 500) {
      errors.optionA = "Option A cannot exceed 500 characters";
    }

    if (!formData.optionB?.trim()) {
      errors.optionB = "Option B is required";
    } else if (formData.optionB.length > 500) {
      errors.optionB = "Option B cannot exceed 500 characters";
    }

    if (!formData.optionC?.trim()) {
      errors.optionC = "Option C is required";
    } else if (formData.optionC.length > 500) {
      errors.optionC = "Option C cannot exceed 500 characters";
    }

    if (!formData.optionD?.trim()) {
      errors.optionD = "Option D is required";
    } else if (formData.optionD.length > 500) {
      errors.optionD = "Option D cannot exceed 500 characters";
    }

    if (!formData.correctAnswer) {
      errors.correctAnswer = "Correct answer is required";
    } else if (!["A", "B", "C", "D"].includes(formData.correctAnswer)) {
      errors.correctAnswer = "Correct answer must be A, B, C, or D";
    }

    if (!formData.subject?.trim()) {
      errors.subject = "Subject is required";
    } else if (formData.subject.length < 2) {
      errors.subject = "Subject must be at least 2 characters";
    } else if (formData.subject.length > 255) {
      errors.subject = "Subject cannot exceed 255 characters";
    }

    if (!formData.difficulty) {
      errors.difficulty = "Difficulty is required";
    } else if (!["EASY", "MEDIUM", "HARD"].includes(formData.difficulty)) {
      errors.difficulty = "Difficulty must be EASY, MEDIUM, or HARD";
    }

    if (formData.explanation && formData.explanation.length > 2000) {
      errors.explanation = "Explanation cannot exceed 2000 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  const handleSubmit = async (formData) => {
    // Validate form data
    const validation = validateFormData(formData);

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare data for API
      const questionData = {
        examId,
        ...formData,
      };

      // Call API via parent component
      await onSuccess(questionData);

      onClose();
    } catch (error) {
      toast.error("Failed to create question");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Add New Question
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Fill in the question details
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
        <div className="p-6">
          <QuestionForm
            onSubmit={handleSubmit}
            submitText="Add Question"
            isSubmitting={isSubmitting}
            validateFormData={validateFormData}
          />
        </div>
      </div>
    </div>
  );
};
