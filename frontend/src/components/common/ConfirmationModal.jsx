import PropTypes from "prop-types";
import { AlertCircle, X, Check, HelpCircle } from "lucide-react";

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // "warning", "danger", "info", "success"
  isLoading = false,
  confirmButtonDisabled = false,
  children,
}) => {
  if (!isOpen) return null;

  // Styles based on type
  const typeStyles = {
    warning: {
      iconColor: "text-yellow-600",
      iconBgColor: "bg-yellow-100",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      borderColor: "border-yellow-200",
      bgColor: "bg-yellow-50",
    },
    danger: {
      iconColor: "text-red-600",
      iconBgColor: "bg-red-100",
      buttonColor: "bg-red-600 hover:bg-red-700",
      borderColor: "border-red-200",
      bgColor: "bg-red-50",
    },
    info: {
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-100",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50",
    },
    success: {
      iconColor: "text-green-600",
      iconBgColor: "bg-green-100",
      buttonColor: "bg-green-600 hover:bg-green-700",
      borderColor: "border-green-200",
      bgColor: "bg-green-50",
    },
  };

  const styles = typeStyles[type] || typeStyles.warning;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertCircle className={`w-6 h-6 ${styles.iconColor}`} />;
      case "info":
        return <HelpCircle className={`w-6 h-6 ${styles.iconColor}`} />;
      case "success":
        return <Check className={`w-6 h-6 ${styles.iconColor}`} />;
      default:
        return <AlertCircle className={`w-6 h-6 ${styles.iconColor}`} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${styles.iconBgColor}`}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-primary">{title}</h3>
                {message && (
                  <p className="mt-2 text-text-secondary">{message}</p>
                )}
              </div>
            </div>

            {/* Custom content */}
            {children && (
              <div
                className={`mt-4 p-4 rounded-lg ${styles.bgColor} border ${styles.borderColor}`}
              >
                {children}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-border">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-text-secondary text-text-secondary rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 ${styles.buttonColor} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                disabled={isLoading || confirmButtonDisabled}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(["warning", "danger", "info", "success"]),
  isLoading: PropTypes.bool,
  confirmButtonDisabled: PropTypes.bool,
  children: PropTypes.node,
};
