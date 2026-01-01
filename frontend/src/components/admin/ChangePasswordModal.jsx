import { useState } from "react";
import { X, Lock, Eye, EyeOff, Mail } from "lucide-react";

export const ChangePasswordModal = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        userId: user.id,
        newPassword: formData.newPassword,
      });
    } catch (error) {
      console.error("Failed to change password:", error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

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
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-12 ${
                    errors.newPassword ? "border-red-300" : "border-border"
                  }`}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-12 ${
                    errors.confirmPassword ? "border-red-300" : "border-border"
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-70 flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
