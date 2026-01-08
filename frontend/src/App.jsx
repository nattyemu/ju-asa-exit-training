import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ExamProvider } from "./contexts/ExamContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { PublicRoute } from "./components/common/PublicRoute";
import { LoadingSpinner } from "./components/common/LoadingSpinner";

// Student Pages
import { Dashboard } from "./pages/Dashboard";
import { LoginPage } from "./pages/LoginPage";
import { ExamPage } from "./pages/ExamPage";
import { ProgressPage } from "./pages/student/ProgressPage";
import { ResultsPage } from "./pages/ResultsPage";

// Admin Pages
import { AnalyticsPage } from "./pages/admin/AnalyticsPage";
import { ExamsPage } from "./pages/admin/ExamsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { NotificationsPage } from "./pages/admin/NotificationsPage";

import "./App.css";
import { ExamGuard } from "./components/common/ExamGuard";

function AppContent() {
  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "14px",
            fontWeight: "500",
          },
          success: {
            style: {
              background: "#10B981",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#EF4444",
            },
          },
        }}
      />

      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected routes - Available for both STUDENT and ADMIN */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Student only routes */}
        <Route
          path="/exam"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <ExamGuard>
                <ExamPage />
              </ExamGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <ResultsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <ProgressPage />
            </ProtectedRoute>
          }
        />

        {/* Admin only routes */}
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ExamsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ExamProvider>
          <React.Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <AppContent />
          </React.Suspense>
        </ExamProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
