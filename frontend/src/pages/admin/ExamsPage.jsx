import { ExamManager } from "../../components/admin/ExamManager";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export const ExamsPage = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background-light">
      <div className="container mx-auto px-4 py-8">
        <ExamManager />
      </div>
    </div>
  );
};
