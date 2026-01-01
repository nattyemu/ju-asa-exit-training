import React from "react";
import { LoginForm } from "../components/auth/LoginForm";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export const LoginPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log("LoginPage rendering", { loading, isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    console.log("User is authenticated, redirecting...");
    // Get redirect path from URL or default to dashboard
    const from = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-background-dark/5 flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-primary animate-pulse"></div>

      <div className="w-full flex flex-col items-center">
        {/* Logo/Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm mb-4">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
            <span className="text-xl font-bold text-text-primary">ASA </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            University Exit Exam Training
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            Practice, prepare exit exams
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  );
};
