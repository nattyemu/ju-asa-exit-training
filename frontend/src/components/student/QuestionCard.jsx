import { useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

export const QuestionCard = ({
  question,
  selectedAnswer,
  onSelect,
  questionNumber,
  totalQuestions,
  isAnswered,
  subject,
}) => {
  const options = [
    { key: "A", value: question.optionA },
    { key: "B", value: question.optionB },
    { key: "C", value: question.optionC },
    { key: "D", value: question.optionD },
  ];

  const getOptionLetter = (index) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
      {/* Question Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {subject}
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
        {options.map((option, index) => {
          const optionKey = getOptionLetter(index);
          const isSelected = selectedAnswer === optionKey;

          return (
            <button
              key={optionKey}
              onClick={() => onSelect(question.id, optionKey)}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-primary/2"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {optionKey}
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
    </div>
  );
};
