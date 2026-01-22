// src/components/auth/PasswordResetSuccess.jsx
import React from "react";
import { CheckCircle, LogIn } from "lucide-react";

export const PasswordResetSuccess = ({ onBackToLogin }) => {
  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Password Reset Successful!
        </h2>
        <p className="text-gray-600 mb-8">
          Your password has been reset successfully. You can now login with your new password.
        </p>
        <button
          onClick={onBackToLogin}
          className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg"
          style={{
            backgroundColor: "#134E4A",
            backgroundImage: "linear-gradient(135deg, #134E4A 0%, #0D3A36 100%)",
          }}
        >
          <LogIn className="w-5 h-5" />
          <span>Go to Login</span>
        </button>
      </div>
    </div>
  );
};