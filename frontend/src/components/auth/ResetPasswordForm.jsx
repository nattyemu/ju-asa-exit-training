// src/components/auth/ResetPasswordForm.jsx
import React, { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";

export const ResetPasswordForm = ({ email, otp, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
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

  const validatePassword = (password) => {
    const newRequirements = {
      length: password.length >= 8 && password.length <= 42,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };
    setRequirements(newRequirements);
    return Object.values(newRequirements).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      validatePassword(value);
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
    
    const { password, confirmPassword } = formData;

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      toast.error("Password does not meet requirements");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.resetPassword(email, otp, password, confirmPassword);
      
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

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm"
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
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-2">
              Confirm New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm"
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
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">Password must contain:</p>
              <ul className="space-y-1">
                <li className={`text-sm flex items-center gap-2 ${requirements.length ? "text-emerald-600" : "text-gray-500"}`}>
                  <CheckCircle className="w-4 h-4" />
                  8-42 characters
                </li>
                <li className={`text-sm flex items-center gap-2 ${requirements.uppercase ? "text-emerald-600" : "text-gray-500"}`}>
                  <CheckCircle className="w-4 h-4" />
                  At least one uppercase letter
                </li>
                <li className={`text-sm flex items-center gap-2 ${requirements.lowercase ? "text-emerald-600" : "text-gray-500"}`}>
                  <CheckCircle className="w-4 h-4" />
                  At least one lowercase letter
                </li>
                <li className={`text-sm flex items-center gap-2 ${requirements.number ? "text-emerald-600" : "text-gray-500"}`}>
                  <CheckCircle className="w-4 h-4" />
                  At least one number
                </li>
              </ul>
            </div>
          </div>

          

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg"
            style={{
              backgroundColor: "#134E4A",
              backgroundImage: "linear-gradient(135deg, #134E4A 0%, #0D3A36 100%)",
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