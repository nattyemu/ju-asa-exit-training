import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
let lastNetworkErrorTime = 0;
const NETWORK_ERROR_DEBOUNCE_MS = 3000;
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Track redirect state
let isRedirecting = false;

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // You can add any response transformation here if needed
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      const now = Date.now();
      const config = error.config || {};

      // Check if we should show toast
      const shouldShowToast =
        !config.suppressNetworkErrorToast &&
        now - lastNetworkErrorTime > NETWORK_ERROR_DEBOUNCE_MS;

      if (shouldShowToast) {
        toast.error("Network error. Please check your connection.");
        lastNetworkErrorTime = now;
      }

      return Promise.reject(error);
    }

    const message = error.response?.data?.message || "An error occurred";
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // IGNORE "No active exam session found" - this is NOT an error
    // It's just informational since students often don't have active sessions
    if (status === 404 && message.includes("No active exam session found")) {
      console.log("No active exam session - this is normal");
      return Promise.reject(error); // Reject but don't show toast
    }

    // IGNORE other 404 errors that are informational
    if (status === 404) {
      const ignore404Messages = [
        "Exam session not found",
        "No exams available",
        "No results found",
        "User not found",
        "Question not found",
        "No data available",
        "Record not found",
      ];

      if (ignore404Messages.some((ignoreMsg) => message.includes(ignoreMsg))) {
        console.log(`Ignoring 404: ${message}`);
        return Promise.reject(error);
      }
    }

    // Handle 401 Unauthorized (token expired or invalid)
    if (status === 401) {
      // Only redirect if not already redirecting
      if (!isRedirecting) {
        isRedirecting = true;

        // Clear auth data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Remove axios default headers
        delete api.defaults.headers.common["Authorization"];

        // Reset redirect flag after 2 seconds
        setTimeout(() => {
          isRedirecting = false;
        }, 2000);

        // Check if we're already on login page
        const isLoginPage = window.location.pathname.includes("/login");
        const isPublicPage =
          window.location.pathname === "/" ||
          window.location.pathname.includes("/public");

        if (!isLoginPage && !isPublicPage) {
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }

    // Handle 403 Forbidden (no permission)
    if (status === 403) {
      toast.error("Access denied. You do not have permission.");
      return Promise.reject(error);
    }

    // Handle 400 Bad Request (validation errors)
    if (status === 400) {
      // Check if it's a validation error with details
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((err) => {
            if (err.message) toast.error(err.message);
          });
        }
      } else {
        toast.error(message || "Invalid request. Please check your input.");
      }
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests (rate limiting)
    if (status === 429) {
      toast.error("Too many requests. Please try again later.");
      return Promise.reject(error);
    }

    // Handle 500+ Server errors
    if (status >= 500) {
      console.error("Server error:", error.response?.data);
      toast.error("Server error. Please try again later.");
      return Promise.reject(error);
    }

    // Handle other client errors (402, 405, 409, etc.)
    if (status >= 400 && status < 500) {
      // Only show toast if not a silent error
      const silentMessages = [
        "No exams available",
        "No results found",
        "No submissions yet",
      ];

      if (!silentMessages.some((silentMsg) => message.includes(silentMsg))) {
        toast.error(message || `Error ${status}: Something went wrong`);
      }
    }

    return Promise.reject(error);
  }
);

// Add a helper method to check if user is authenticated
api.isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user);
};

// Add a helper method to clear auth
api.clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  delete api.defaults.headers.common["Authorization"];
};

export default api;
