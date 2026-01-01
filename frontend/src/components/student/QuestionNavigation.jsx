import { CheckCircle, Circle, Flag } from "lucide-react";

export const QuestionNavigation = ({
  questions,
  answers,
  currentQuestion,
  onSelectQuestion,
  markedQuestions = [],
  onMarkQuestion,
}) => {
  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-text-primary">Question Navigation</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-text-secondary">Answered</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-text-secondary">Unanswered</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {questions.map((question, index) => {
          const questionNumber = index + 1;
          const isAnswered = answers[question.id];
          const isCurrent = currentQuestion === question.id;
          const isMarked = markedQuestions.includes(question.id);

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                isCurrent
                  ? "ring-2 ring-primary bg-primary/10"
                  : isAnswered
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span className="text-sm font-medium">{questionNumber}</span>
              {isAnswered && <CheckCircle className="w-3 h-3 mt-1" />}
              {isMarked && (
                <div className="absolute -top-1 -right-1">
                  <Flag className="w-3 h-3 text-red-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex justify-between items-center">
          <div className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">
              {Object.keys(answers).length}
            </span>{" "}
            of {questions.length} answered
          </div>
          <button
            onClick={() => onMarkQuestion(currentQuestion)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Flag className="w-4 h-4" />
            Mark for Review
          </button>
        </div>
      </div>
    </div>
  );
};
