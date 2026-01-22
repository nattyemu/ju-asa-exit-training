import api from "./api";

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        const { user, token } = response.data.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Set default authorization header for all future requests
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return {
          success: true,
          data: { user, token },
          message: response.data.message || "Login successful",
        };
      }

      return {
        success: false,
        message: response.data.message || "Login failed",
        data: null,
      };
    } catch (error) {
      // console.error("authService.login error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Login failed",
        data: null,
      };
    }
  },
  logout: () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Remove authorization header
      delete api.defaults.headers.common["Authorization"];

      // console.log("authService.logout completed");
    } catch (error) {
      // console.error("authService.logout error:", error);
    }
  },
  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data || null,
      };
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send OTP. Please try again.",
        data: null,
      };
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post("/auth/confirm-otp", { email, otp });
      
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data || null,
      };
    } catch (error) {
      console.error("Verify OTP error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to verify OTP. Please try again.",
        data: null,
      };
    }
  },

  resetPassword: async (email, otp, password, confirmPassword) => {
    try {
      const response = await api.post("/auth/new-password", {
        email,
        otp,
        password,
        confirmPassword,
      });
      
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data || null,
      };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to reset password. Please try again.",
        data: null,
      };
    }
  },
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      // console.error("authService.getCurrentUser error:", error);
      return null;
    }
  },

  isAuthenticated: () => {
    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      return !!(token && user);
    } catch (error) {
      // console.error("authService.isAuthenticated error:", error);
      return false;
    }
  },

  isAdmin: () => {
    try {
      const user = authService.getCurrentUser();
      return user && user.role === "ADMIN";
    } catch (error) {
      // console.error("authService.isAdmin error:", error);
      return false;
    }
  },

  isStudent: () => {
    try {
      const user = authService.getCurrentUser();
      return user && user.role === "STUDENT";
    } catch (error) {
      // console.error("authService.isStudent error:", error);
      return false;
    }
  },

  // Optional: Token validation endpoint
  validateToken: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { success: false, message: "No token found" };
      }

      const response = await api.get("/auth/validate");
      return response.data;
    } catch (error) {
      // console.error("authService.validateToken error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Token validation failed",
      };
    }
  },

  // Optional: Refresh token if you have refresh token functionality
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      const response = await api.post("/auth/refresh", { refreshToken });

      if (response.data.success) {
        const { token, user } = response.data.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return { success: true, data: { token, user } };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      // console.error("authService.refreshToken error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Token refresh failed",
      };
    }
  },
};

export default authService;
