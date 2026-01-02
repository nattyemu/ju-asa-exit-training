import { ProgressDashboard } from "../../components/student/ProgressDashboard";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export const ProgressPage = () => {
  const { isStudent } = useAuth();

  if (!isStudent) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProgressDashboard />
      </div>
    </div>
  );
};
