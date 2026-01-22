import { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { authService } from "../../services/authService";
import toast from "react-hot-toast";

export const PasswordVerificationModal = ({
  user,
  action, // "make-admin" or "make-student"
  onClose,
  onVerified,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // PROPER VALIDATION FUNCTION
  const validatePassword = (value) => {
    if (!value.trim()) return "Admin password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  // Update validation on password change
  useEffect(() => {
    const validationError = validatePassword(password);
    setError(touched ? validationError : ""); // Only show error if touched
    setIsValid(!validationError && password.trim().length >= 6);
  }, [password, touched]);

  const getActionText = () => {
    if (action === "make-admin") {
      return {
        title: "Make User Admin",
        description: `Enter your admin password to make ${
          user.profile?.fullName || user.email
        } an Administrator`,
        confirmText: "Make Admin",
        successMessage: "User promoted to Admin",
      };
    } else {
      return {
        title: "Make User Student",
        description: `Enter your admin password to make ${
          user.profile?.fullName || user.email
        } a Student`,
        confirmText: "Make Student",
        successMessage: "User changed to Student",
      };
    }
  };

  const actionText = getActionText();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark field as touched
    setTouched(true);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onVerified(password);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    // Clear API errors when user starts typing
    if (error && !error.includes("must be")) {
      setError("");
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isSubmitDisabled = !isValid || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {actionText.title}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Admin verification required
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-text-primary">{actionText.description}</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>User:</strong> {user.email}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Current Role:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.role}
                </span>
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>New Role:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    action === "make-admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {action === "make-admin" ? "ADMIN" : "STUDENT"}
                </span>
              </p>
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Your Admin Password *
              </div>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-12 ${
                  error && touched
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-border"
                }`}
                placeholder="Enter your admin password"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-text-secondary">
                {password.length >= 6
                  ? "✓ Password meets minimum length"
                  : `Enter at least 6 characters (${password.length}/6)`}
              </p>
            </div>
            {error && touched && (
              <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2 transition-colors ${
                isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                actionText.confirmText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
