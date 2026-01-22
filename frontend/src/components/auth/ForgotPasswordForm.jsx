// src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";

export const ForgotPasswordForm = ({ onBackToLogin, onEmailSent }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.forgotPassword(email);
      
      if (result.success) {
        setEmailSent(true);
        toast.success("OTP sent to your email! Check your inbox.");
        
        if (onEmailSent) {
          onEmailSent(email);
        }
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600 mb-6">
            We've sent a 6-digit OTP to <span className="font-semibold">{email}</span>. 
            It will expire in 3 minutes.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Didn't receive the email? Check your spam folder or request a new OTP.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
              className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors duration-200"
            >
              Send OTP Again
            </button>
            <button
              onClick={onBackToLogin}
              className="w-full py-3 px-4 text-emerald-600 font-medium rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
      <button
        onClick={onBackToLogin}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Forgot Password?
        </h2>
        <p className="text-gray-600">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
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
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 shadow-sm"
                placeholder="student@ju.edu.et"
                required
                disabled={isLoading}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter the email address associated with your account
            </p>
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
                <span>Sending OTP...</span>
              </>
            ) : (
              <span>Send OTP</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};