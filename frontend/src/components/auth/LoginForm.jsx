import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import toast from "react-hot-toast";

export const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Validation rules based on backend schema
  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Please enter a valid email address";
        if (value.length < 5) return "Email must be at least 5 characters";
        return "";

      case "password":
        if (!value.trim()) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";

      default:
        return "";
    }
  };

  // Validate entire form
  const validateForm = () => {
    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);

    setErrors({
      email: emailError,
      password: passwordError,
    });

    return !emailError && !passwordError;
  };

  // Update validation on form change
  useEffect(() => {
    setIsValid(validateForm());
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field if it's been touched
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate the blurred field
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, formData[name]),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    });

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success("Login successful!");
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
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
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Mail
                  className={`w-5 h-5 ${errors.email ? "text-red-400" : "text-gray-400"} group-focus-within:text-emerald-600 transition-colors`}
                />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg ${
                  errors.email && touched.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300"
                }`}
                placeholder="student@ju.edu.et"
                required
                disabled={isLoading}
              />
            </div>
            {errors.email && touched.email && (
              <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.email}</span>
              </div>
            )}
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
                <Lock
                  className={`w-5 h-5 ${errors.password ? "text-red-400" : "text-gray-400"} group-focus-within:text-emerald-600 transition-colors`}
                />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg ${
                  errors.password && touched.password
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300"
                }`}
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
            {errors.password && touched.password && (
              <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          <div className="mt-6 text-right">
            <Link
              to="/reset-password"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl mt-2 ${
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
