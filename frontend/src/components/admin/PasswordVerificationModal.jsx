import { useState } from "react";
import { X, Lock, Eye, EyeOff, Shield } from "lucide-react";
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

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onVerified(password);
      // If successful, close modal
      onClose();
    } catch (error) {
      console.error("Role change failed:", error);
      setError(error.response?.data?.message || "Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-12 ${
                  error ? "border-red-300" : "border-border"
                }`}
                placeholder="Enter your admin password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <p className="mt-2 text-xs text-text-secondary">
              You must enter your own admin password to confirm this action
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-70 flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? "Verifying..." : actionText.confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
