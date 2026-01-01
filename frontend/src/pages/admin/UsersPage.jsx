import { UserManager } from "../../components/admin/UserManager";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export const UsersPage = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background-light">
      <div className="container mx-auto px-4 py-8">
        <UserManager />
      </div>
    </div>
  );
};
