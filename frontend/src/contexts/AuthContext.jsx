import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/authService";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setUser(result.data.user);
        return { success: true, message: "Login successful" };
      }
      return { success: false, message: result.message || "Login failed" };
    } catch (error) {
      console.error("AuthContext.login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  const logout = useCallback(() => {
    try {
      authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    isStudent: user?.role === "STUDENT",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
