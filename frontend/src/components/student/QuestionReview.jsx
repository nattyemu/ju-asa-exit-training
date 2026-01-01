import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";

export const QuestionReview = ({
  question,
  answer,
  questionNumber,
  showAnswers = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCorrect = answer?.isCorrect;

  const options = [
    { key: "A", value: question.optionA },
    { key: "B", value: question.optionB },
    { key: "C", value: question.optionC },
    { key: "D", value: question.optionD },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className={`p-4 cursor-pointer transition-colors ${
          isCorrect
            ? "bg-green-50 hover:bg-green-100"
            : "bg-red-50 hover:bg-red-100"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                isCorrect
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {questionNumber}
            </div>
            <div>
              <div className="font-medium text-text-primary line-clamp-1">
                {question.questionText.substring(0, 100)}...
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {question.subject}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs rounded ${
                    isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white border-t border-border">
          {/* Full Question */}
          <div className="mb-6">
            <div className="text-sm text-text-secondary mb-2">Question:</div>
            <p className="text-text-primary">{question.questionText}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {options.map((option) => {
              const isCorrectOption = option.key === question.correctAnswer;
              const isChosenOption = option.key === answer?.chosenAnswer;

              let bgColor = "bg-white";
              let borderColor = "border-gray-200";
              let textColor = "text-text-primary";

              if (isCorrectOption && showAnswers) {
                bgColor = "bg-green-50";
                borderColor = "border-green-300";
                textColor = "text-green-800";
              } else if (isChosenOption) {
                bgColor = isCorrect ? "bg-green-50" : "bg-red-50";
                borderColor = isCorrect ? "border-green-300" : "border-red-300";
                textColor = isCorrect ? "text-green-800" : "text-red-800";
              }

              return (
                <div
                  key={option.key}
                  className={`p-3 border rounded-lg ${bgColor} ${borderColor} ${textColor}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-medium flex-shrink-0 ${
                        isChosenOption
                          ? isCorrect
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                          : isCorrectOption && showAnswers
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {option.key}
                    </div>
                    <span>{option.value}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User's Answer vs Correct Answer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-text-secondary mb-1">
                Your Answer
              </div>
              <div
                className={`font-medium ${
                  isCorrect ? "text-green-700" : "text-red-700"
                }`}
              >
                {answer?.chosenAnswer || "Not answered"}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-text-secondary mb-1">
                Correct Answer
              </div>
              <div className="font-medium text-green-700">
                {showAnswers ? question.correctAnswer : "Hidden"}
              </div>
            </div>
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Explanation
                </span>
              </div>
              <p className="text-sm text-blue-700">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
