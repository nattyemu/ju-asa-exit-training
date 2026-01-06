import { useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

export const QuestionCard = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  questionNumber,
  totalQuestions,
  isSubmitting,
  timeExpired = false,
}) => {
  const options = [
    { key: "A", value: question.optionA },
    { key: "B", value: question.optionB },
    { key: "C", value: question.optionC },
    { key: "D", value: question.optionD },
  ];

  // Check if this question is answered
  const isAnswered = selectedAnswer !== undefined && selectedAnswer !== null;

  const handleOptionClick = (optionKey) => {
    if (timeExpired || isSubmitting || !onAnswerSelect) return;

    // Call parent handler immediately
    onAnswerSelect(optionKey);
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
      {/* Time expired warning */}
      {timeExpired && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            ⏰ Exam time has expired. You can review questions but cannot change
            answers.
          </p>
        </div>
      )}

      {/* Question Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {question.subject}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              {question.difficulty}
            </span>
          </div>
          <h3 className="text-lg font-medium text-text-primary">
            Question {questionNumber} of {totalQuestions}
          </h3>
        </div>
        <div className="mt-2 md:mt-0">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              isAnswered
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isAnswered ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
            {isAnswered ? "Answered" : "Unanswered"}
          </span>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-8">
        <p className="text-text-primary text-lg leading-relaxed">
          {question.questionText}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.key;

          return (
            <button
              key={option.key}
              onClick={() => handleOptionClick(option.key)}
              disabled={timeExpired || isSubmitting}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 
    ${
      isSelected
        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
        : "border-border"
    }
    ${
      timeExpired
        ? "opacity-60 cursor-not-allowed"
        : "hover:scale-[1.02] cursor-pointer"
    }
  `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {option.key}
                </div>
                <div className="flex-1">
                  <p className="text-text-primary leading-relaxed">
                    {option.value}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isSubmitting && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
