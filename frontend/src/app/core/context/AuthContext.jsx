import { createContext, useState, useEffect } from "react";
import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ME);
        setUser(response.data.data);
        setIsAuthenticated(true);
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
