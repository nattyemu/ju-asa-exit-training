import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const from = location.state?.from || "/dashboard";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to={from} replace /> : children;
};
