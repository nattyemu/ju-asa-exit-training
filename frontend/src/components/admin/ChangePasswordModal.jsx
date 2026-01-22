import { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, Mail, AlertCircle } from "lucide-react";

export const ChangePasswordModal = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validation based on backend changePasswordSchema
  const validateField = (name, value) => {
    switch (name) {
      case "newPassword":
        if (!value.trim()) return "New password is required";
        if (value.length < 6)
          return "New password must be at least 6 characters";
        return "";

      case "confirmPassword":
        if (!value.trim()) return "Please confirm your password";
        if (formData.newPassword !== value) return "Passwords do not match";
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

  useEffect(() => {
    const formIsValid = validateForm();
    setIsValid(formIsValid);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {};
    Object.keys(formData).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        userId: user.id,
        newPassword: formData.newPassword,
      });
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate field if it's been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }

    // Clear general error when user starts typing
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }

    // Special case: if confirmPassword is being changed and newPassword exists,
    // validate both passwords match
    if (
      field === "confirmPassword" &&
      formData.newPassword &&
      touched.newPassword
    ) {
      if (value !== formData.newPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }

    // Special case: if newPassword is being changed and confirmPassword exists,
    // validate both passwords match
    if (
      field === "newPassword" &&
      formData.confirmPassword &&
      touched.confirmPassword
    ) {
      if (value !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate the blurred field
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const isSubmitDisabled = !isValid || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Change Password
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Set a new password for this user
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Email: {user?.email}
              </p>
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
        <form onSubmit={handleSubmit} noValidate className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
              </label>
              <div className="w-full px-4 py-3 border border-border rounded-lg bg-gray-50 text-text-primary">
                {user?.email}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  New Password *
                </div>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  onBlur={() => handleBlur("newPassword")}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-12 ${
                    errors.newPassword && touched.newPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-border"
                  }`}
                  placeholder="At least 6 characters"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={toggleNewPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors disabled:opacity-50"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                  disabled={isSubmitting}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {formData.newPassword.length >= 6
                  ? "✓ Password meets minimum length"
                  : `Enter at least 6 characters (${formData.newPassword.length}/6)`}
              </p>
              {errors.newPassword && touched.newPassword && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.newPassword}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm New Password *
                </div>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  onBlur={() => handleBlur("confirmPassword")}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-12 ${
                    errors.confirmPassword && touched.confirmPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-border"
                  }`}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors disabled:opacity-50"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {formData.confirmPassword &&
                formData.newPassword === formData.confirmPassword
                  ? "✓ Passwords match"
                  : formData.confirmPassword
                    ? "Passwords do not match"
                    : "Re-enter your password"}
              </p>
              {errors.confirmPassword && touched.confirmPassword && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
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
                !isValid ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
