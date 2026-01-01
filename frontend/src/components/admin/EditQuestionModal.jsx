import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { QuestionForm } from "./QuestionForm";
import toast from "react-hot-toast";

export const EditQuestionModal = ({ question, examId, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(Date.now()); // Add key to force re-render

  useEffect(() => {
    if (!question) {
      onClose();
    } else {
      // Update form key when question changes to reset form
      setFormKey(Date.now());
    }
  }, [question]); // Only depend on question

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      // Prepare data for API
      const questionData = {
        examId,
        ...formData,
      };

      // Call API via parent component
      await onSuccess(question.id, questionData);

      onClose();
    } catch (error) {
      console.error("Failed to update question:", error);
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
          />
        </div>
      </div>
    </div>
  );
};
