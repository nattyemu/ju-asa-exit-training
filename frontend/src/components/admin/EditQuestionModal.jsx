import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { QuestionForm } from "./QuestionForm";
import toast from "react-hot-toast";

export const EditQuestionModal = ({ question, examId, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());

  // Validation function based on backend updateQuestionSchema
  const validateFormData = (formData) => {
    const errors = {};

    // For update, fields are optional but if provided must meet validation rules
    if (formData.questionText !== undefined && formData.questionText !== null) {
      if (formData.questionText.trim() === "") {
        errors.questionText = "Question text cannot be empty";
      } else if (formData.questionText.length < 5) {
        errors.questionText = "Question text must be at least 5 characters";
      } else if (formData.questionText.length > 2000) {
        errors.questionText = "Question text cannot exceed 2000 characters";
      }
    }

    // Validate options only if provided
    ["optionA", "optionB", "optionC", "optionD"].forEach((option) => {
      if (formData[option] !== undefined && formData[option] !== null) {
        if (formData[option].trim() === "") {
          errors[option] = `${option} cannot be empty`;
        } else if (formData[option].length > 500) {
          errors[option] = `${option} cannot exceed 500 characters`;
        }
      }
    });

    if (
      formData.correctAnswer !== undefined &&
      formData.correctAnswer !== null
    ) {
      if (!["A", "B", "C", "D"].includes(formData.correctAnswer)) {
        errors.correctAnswer = "Correct answer must be A, B, C, or D";
      }
    }

    if (formData.subject !== undefined && formData.subject !== null) {
      if (formData.subject.trim() === "") {
        errors.subject = "Subject cannot be empty";
      } else if (formData.subject.length < 2) {
        errors.subject = "Subject must be at least 2 characters";
      } else if (formData.subject.length > 255) {
        errors.subject = "Subject cannot exceed 255 characters";
      }
    }

    if (formData.difficulty !== undefined && formData.difficulty !== null) {
      if (!["EASY", "MEDIUM", "HARD"].includes(formData.difficulty)) {
        errors.difficulty = "Difficulty must be EASY, MEDIUM, or HARD";
      }
    }

    if (formData.explanation !== undefined && formData.explanation !== null) {
      if (formData.explanation.length > 2000) {
        errors.explanation = "Explanation cannot exceed 2000 characters";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  useEffect(() => {
    if (!question) {
      onClose();
    } else {
      // Update form key when question changes to reset form
      setFormKey(Date.now());
      // Initial form data is valid since it's existing data
      setIsValid(true);
    }
  }, [question]);

  const handleSubmit = async (formData) => {
    // Validate form data first
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

      // Create update object with only provided fields
      const updateData = {};
      Object.keys(formData).forEach((field) => {
        // Only include fields that are different from initial or explicitly set
        if (formData[field] !== question[field]) {
          updateData[field] = formData[field];
        }
      });

      // Add examId to update data
      updateData.examId = examId;

      // Only submit if there are changes
      if (Object.keys(updateData).length > 1) {
        // More than just examId
        await onSuccess(question.id, updateData);
      } else {
        toast.success("No changes detected. Question is up to date.");
        onClose();
        return;
      }

      onClose();
    } catch (error) {
      toast.error("Failed to update question");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Edit Question
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Update question details
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

        {/* Form - Add key prop to force re-render when question changes */}
        <div className="p-6" key={formKey}>
          <QuestionForm
            initialData={question}
            onSubmit={handleSubmit}
            submitText="Update Question"
            isSubmitting={isSubmitting}
            validateFormData={validateFormData}
            isEditMode={true}
          />
        </div>
      </div>
    </div>
  );
};
