import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { ThemeContext } from "./ThemeContext";
import { getTokenFromUrl, getSubdomain, saveSubdomain, clearSubdomain } from "../utils/subdomainHelper";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { updatePrimaryColor } = useContext(ThemeContext);
  const onboardingCompleted = user?.onboardingCompleted ?? false;

  const checkAuth = async () => {
    // Check URL for token parameter (passed after subdomain redirect)
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      // Clean URL — remove ?token=... without triggering a reload
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ME);
        const userData = response.data.data;
        setUser(userData);
        setIsAuthenticated(true);

        // Only persist subdomain after successful authentication —
        // prevents public pages (login/register) from contaminating localStorage
        // with a subdomain the user doesn't own.
        const detectedSubdomain = getSubdomain();
        if (detectedSubdomain) {
          saveSubdomain(detectedSubdomain);
        }

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

      localStorage.setItem("token", token);

      // Fetch full user profile with onboarding status
      const meResponse = await api.get(API_ENDPOINTS.AUTH.ME);
      const userData = meResponse.data.data;

      setUser(userData);
      setIsAuthenticated(true);

      // Load school primary color if available
      if (userData.school?.primaryColor) {
        updatePrimaryColor(userData.school.primaryColor);
      }

      return { success: true, onboardingCompleted: userData.onboardingCompleted };
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
    clearSubdomain();
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
        onboardingCompleted,
        login,
        logout,
        verifySchool,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
