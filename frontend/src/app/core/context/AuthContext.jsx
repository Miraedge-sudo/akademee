import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { ThemeContext } from "./ThemeContext";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { updatePrimaryColor } = useContext(ThemeContext);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ME);
        const userData = response.data.data;
        setUser(userData);
        setIsAuthenticated(true);

        // Load school primary color if available
        if (userData.school?.primaryColor) {
          updatePrimaryColor(userData.school.primaryColor);
        }
      } catch {
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const data = response.data.data;
      const token = data.token;
      const userData = data.user;

      localStorage.setItem("token", token);
      setUser(userData);
      setIsAuthenticated(true);

      // Load school primary color if available
      if (userData.school?.primaryColor) {
        updatePrimaryColor(userData.school.primaryColor);
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    // Reset to default color
    updatePrimaryColor("#085041");
  };

  const verifySchool = async (subdomain) => {
    const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_SCHOOL, {
      subdomain,
    });
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        verifySchool,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
