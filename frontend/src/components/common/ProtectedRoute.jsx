import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect to login with return url
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check if user object exists
  if (!user) {
    console.error("User object is null or undefined");
    return <Navigate to="/login" replace />;
  }

  // If roles specified, check if user has required role
  if (allowedRoles.length > 0) {
    if (!user.role) {
      console.error("User role is undefined");
      return <Navigate to="/dashboard" replace />;
    }

    // Check if user's role is in allowed roles
    const hasRequiredRole = allowedRoles.includes(user.role);

    if (!hasRequiredRole) {
      if (user.role === "ADMIN") {
        return <Navigate to="/dashboard" replace />;
      } else if (user.role === "STUDENT") {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};
