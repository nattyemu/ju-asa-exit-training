import React from "react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import toast from "react-hot-toast";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("Login form submitted", { email, password });

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      // console.log("Calling login function...");
      const result = await login(email, password);
      // console.log("Login result:", result);

      if (result.success) {
        toast.success("Login successful!");
        // Get redirect path from location state or default to dashboard
        const from = location.state?.from?.pathname || "/dashboard";
        // console.log("Redirecting to:", from);
        navigate(from, { replace: true });
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      // console.error("Login error:", error);
      toast.error(error.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                placeholder="student@ju.edu.et"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl mt-2"
            style={{
              backgroundColor: "#134E4A",
              backgroundImage:
                "linear-gradient(135deg, #134E4A 0%, #0D3A36 100%)",
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>

        {/* Admin Note */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Important:</span> Student
              registration is managed by administrators only. If you need
              account access, please contact your department administrator.
            </p>
          </div>
        </div>
      </form>

      {/* Footer - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block mt-8 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} JU ASA Exit Exam Platform
        </p>
        <p className="text-xs text-gray-400 mt-1">
          For official use by authorized JU ASA students
        </p>
      </div>
    </div>
  );
};
