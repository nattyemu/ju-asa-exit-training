import React from "react";
import { LoginForm } from "../components/auth/LoginForm.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Navigate, useLocation } from "react-router-dom";

export const LoginPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // console.log("LoginPage rendering", { loading, isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
          <p className="mt-4 text-emerald-700 font-medium">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // console.log("User is authenticated, redirecting...");
    // Get redirect path from URL or default to dashboard
    const from = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-8 sm:py-12">
      <div className="w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 bg-white">
        {/* LEFT BRAND PANEL - 1/3 width on desktop, hidden on mobile */}
        <div
          className="hidden lg:flex flex-col justify-between p-8 md:p-12 text-white relative overflow-hidden"
          style={{ backgroundColor: "#134E4A" }}
        >
          {/* Decorative background pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700 rounded-full -translate-y-16 translate-x-8 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-800 rounded-full translate-y-20 -translate-x-12 opacity-20"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <img
                src="/ju_asa_logo.jpg"
                alt="JU ASA Logo"
                className="w-24 h-24 rounded-xl shadow-lg object-cover border-2 border-emerald-300"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 leading-tight">
                  JU ASA Exit Exam Practicing Platform
                </h1>
                <p className="text-emerald-200 text-sm mt-2">
                  Jimma University Architecture Student Association
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-800/40 backdrop-blur-sm rounded-xl p-4 border border-emerald-700/30">
                <h2 className="text-lg font-semibold mb-2">
                  Practice Makes Perfect
                </h2>
                <p className="text-sm text-emerald-200/90 leading-relaxed">
                  Comprehensive practice exam platform for Architecture students
                  to prepare for exit exams with real-time feedback and
                  performance tracking.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-center">
            <div className="border-t border-emerald-700/50 pt-4">
              <p className="text-xs text-emerald-300/70">
                © {new Date().getFullYear()} Jimma University Architecture
                Student Association
              </p>
              <p className="text-xs text-emerald-300/50 mt-1">
                For Architecture students only
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL - 2/3 width on desktop, full on mobile */}
        <div className="lg:col-span-2 flex flex-col justify-center p-6 sm:p-8 md:p-12 lg:p-16">
          {/* Mobile Header - Only shows on mobile */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <img
                src="/ju_asa_logo.jpg"
                alt="JU ASA Logo"
                className="w-24 h-24 rounded-xl shadow-md object-cover border-2 border-emerald-200"
              />
              <div>
                <h1 className="text-2xl font-bold text-emerald-900">
                  JU ASA Exit Exam <br />
                  Practicing Platform
                </h1>

                <p className="text-emerald-700 text-sm mt-2">
                  Jimma University Architecture Student Association
                </p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Sign in to access practice exams and track your progress
              </p>
            </div>

            <LoginForm />
          </div>

          {/* Mobile Footer - Only shows on mobile */}
          <div className="lg:hidden mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Jimma University Architecture Student
              Association
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Exit Exam Practice Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
