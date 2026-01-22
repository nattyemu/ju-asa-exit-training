import React, { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";

export const ResetPasswordForm = ({ email, otp, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });
  const [isValid, setIsValid] = useState(false);

  // Validate password based on backend schema
  const validatePassword = (password) => {
    const newRequirements = {
      length: password.length >= 8 && password.length <= 42,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };
    setRequirements(newRequirements);

    if (!password.trim()) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password.length > 42) return "Password must be less than 42 characters";
    if (!/[A-Z]/.test(password))
      return "At least one uppercase letter required";
    if (!/[a-z]/.test(password))
      return "At least one lowercase letter required";
    if (!/\d/.test(password)) return "At least one number required";

    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword.trim()) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  // Validate entire form
  const validateForm = () => {
    const passwordError = validatePassword(formData.password);
    const confirmError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password,
    );

    setErrors({
      password: passwordError,
      confirmPassword: confirmError,
    });

    return !passwordError && !confirmError;
  };

  // Update validation on form changes
  useEffect(() => {
    setIsValid(validateForm());
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field if it's been touched
    if (touched[name]) {
      if (name === "password") {
        setErrors((prev) => ({
          ...prev,
          password: validatePassword(value),
          confirmPassword: validateConfirmPassword(
            formData.confirmPassword,
            value,
          ),
        }));
      } else if (name === "confirmPassword") {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateConfirmPassword(value, formData.password),
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(formData.password),
        confirmPassword: validateConfirmPassword(
          formData.confirmPassword,
          formData.password,
        ),
      }));
    } else if (name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(
          formData.confirmPassword,
          formData.password,
        ),
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      password: true,
      confirmPassword: true,
    });

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword(
        email,
        otp,
        formData.password,
        formData.confirmPassword,
      );

      if (result.success) {
        toast.success("Password reset successfully!");

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
          <Lock className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Set New Password
        </h2>
        <p className="text-gray-600 text-center">
          Create a new strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          {/* New Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Lock
                  className={`w-5 h-5 ${errors.password && touched.password ? "text-red-400" : "text-gray-400"} group-focus-within:text-emerald-600 transition-colors`}
                />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl focus:ring-2 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm ${
                  errors.password && touched.password
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:ring-2 focus:ring-emerald-200"
                }`}
                placeholder="Enter new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && touched.password && (
              <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Lock
                  className={`w-5 h-5 ${errors.confirmPassword && touched.confirmPassword ? "text-red-400" : "text-gray-400"} group-focus-within:text-emerald-600 transition-colors`}
                />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl focus:ring-2 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm ${
                  errors.confirmPassword && touched.confirmPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:ring-2 focus:ring-emerald-200"
                }`}
                placeholder="Confirm new password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          {/* Password Requirements */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Password must contain:
            </p>
            <ul className="space-y-2">
              <li
                className={`text-sm flex items-center gap-2 ${requirements.length ? "text-emerald-600" : "text-gray-500"}`}
              >
                <CheckCircle
                  className={`w-4 h-4 ${requirements.length ? "text-emerald-500" : "text-gray-400"}`}
                />
                8-42 characters
              </li>
              <li
                className={`text-sm flex items-center gap-2 ${requirements.uppercase ? "text-emerald-600" : "text-gray-500"}`}
              >
                <CheckCircle
                  className={`w-4 h-4 ${requirements.uppercase ? "text-emerald-500" : "text-gray-400"}`}
                />
                At least one uppercase letter (A-Z)
              </li>
              <li
                className={`text-sm flex items-center gap-2 ${requirements.lowercase ? "text-emerald-600" : "text-gray-500"}`}
              >
                <CheckCircle
                  className={`w-4 h-4 ${requirements.lowercase ? "text-emerald-500" : "text-gray-400"}`}
                />
                At least one lowercase letter (a-z)
              </li>
              <li
                className={`text-sm flex items-center gap-2 ${requirements.number ? "text-emerald-600" : "text-gray-500"}`}
              >
                <CheckCircle
                  className={`w-4 h-4 ${requirements.number ? "text-emerald-500" : "text-gray-400"}`}
                />
                At least one number (0-9)
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg ${
              !isValid ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{
              backgroundColor: "#134E4A",
              backgroundImage:
                "linear-gradient(135deg, #134E4A 0%, #0D3A36 100%)",
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
