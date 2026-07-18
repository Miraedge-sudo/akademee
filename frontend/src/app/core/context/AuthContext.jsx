import { createContext, useState, useEffect, useContext } from "react";
import api, { setAccessToken } from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { ThemeContext } from "./ThemeContext";
import { getTokenFromUrl, getSubdomain, saveSubdomain, clearSubdomain } from "../utils/subdomainHelper";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const { updatePrimaryColor } = useContext(ThemeContext);
  const onboardingCompleted = user?.onboardingCompleted ?? false;

  // ── Restore token from localStorage on mount ──
  useEffect(() => {
    const urlToken = getTokenFromUrl();
    const savedToken = localStorage.getItem("token");
    if (savedToken && !urlToken) {
      setAccessToken(savedToken);
      setToken(savedToken);
    }
    const exchangePromise = urlToken
      ? api.post(API_ENDPOINTS.AUTH.EXCHANGE, { token: urlToken }).then(res => {
          const exchangeToken = res.data?.data?.token;
          if (exchangeToken) {
            setAccessToken(exchangeToken);
            setToken(exchangeToken);
            localStorage.setItem("token", exchangeToken);
          }
        }).catch(() => {})
      : Promise.resolve();

    exchangePromise
      .then(() => window.history.replaceState({}, document.title, window.location.pathname + window.location.hash))
      .then(() => api.get(API_ENDPOINTS.AUTH.ME))
      .then(response => {
        const userData = response.data.data;
        setUser(userData);
        setIsAuthenticated(true);
        const detectedSubdomain = getSubdomain();
        if (detectedSubdomain) saveSubdomain(detectedSubdomain);
        if (userData.school?.primaryColor) updatePrimaryColor(userData.school.primaryColor);
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const data = response.data.data;
      const loginUser = data.user || {};

      setAccessToken(data.token);
      setToken(data.token);
      localStorage.setItem("token", data.token);

      const fallbackUser = {
        ...loginUser,
        school: loginUser.school || {
          id: loginUser.schoolId,
          name: loginUser.schoolName,
          subdomain: loginUser.subdomain,
          educationalSystems: loginUser.educationalSystems || [],
        },
      };

      setUser(fallbackUser);
      setIsAuthenticated(true);
      if (fallbackUser.school?.primaryColor) {
        updatePrimaryColor(fallbackUser.school.primaryColor);
      }

      try {
        const meResponse = await api.get(API_ENDPOINTS.AUTH.ME);
        const fullUserData = meResponse.data.data;
        const mergedUser = {
          ...fallbackUser,
          ...fullUserData,
          school: {
            ...(fallbackUser.school || {}),
            ...(fullUserData.school || {}),
          },
        };

        setUser(mergedUser);
        setIsAuthenticated(true);
        if (mergedUser.school?.primaryColor) {
          updatePrimaryColor(mergedUser.school.primaryColor);
        }

        return {
          success: true,
          onboardingCompleted: mergedUser.onboardingCompleted,
          subdomain: mergedUser.subdomain,
          token: data.token,
          user: mergedUser,
        };
      } catch {
        return {
          success: true,
          onboardingCompleted: fallbackUser.onboardingCompleted,
          subdomain: fallbackUser.subdomain,
          token: data.token,
          user: fallbackUser,
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch { /* continue */ }
    setAccessToken(null);
    setToken(null);
    localStorage.removeItem("token");
    clearSubdomain();
    setUser(null);
    setIsAuthenticated(false);
    updatePrimaryColor("#085041");
  };

  const refreshUser = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      const userData = response.data.data;
      setUser(userData);
      setIsAuthenticated(true);
      if (userData.school?.primaryColor) {
        updatePrimaryColor(userData.school.primaryColor);
      }
      return userData;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
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
        token,
        login,
        logout,
        refreshUser,
        verifySchool,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
