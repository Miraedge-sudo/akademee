import axios from "axios";
import { getSubdomain } from "../utils/subdomainHelper";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:1000",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}
export function getAccessToken() {
  return _accessToken;
}

api.interceptors.request.use(
  (config) => {
    const subdomain = getSubdomain();
    if (subdomain) {
      config.headers["x-school-subdomain"] = subdomain;
    }
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger si :
    // - la requête est pour /auth/login (le 401 y est attendu)
    // - la page courante est une page publique (login, register, site vitrine, etc.)
    // - la requête n'a pas de token d'authentification (c'est une requête publique)
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes("/auth/login");
      const isAuthMeRequest = error.config?.url?.includes("/auth/me");
      const hasNoAuthHeader = !error.config?.headers?.Authorization;
      const isPublicPage = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/site",
      ].includes(window.location.pathname);

      if (!isLoginRequest && !isPublicPage && !(isAuthMeRequest && hasNoAuthHeader)) {
        localStorage.removeItem("token");
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);
export default api;
