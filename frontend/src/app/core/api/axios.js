import axios from "axios";
import { getSubdomain } from "../utils/subdomainHelper";
import toast from "react-hot-toast";

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

// ── Token refresh queue ──────────────────────────────────────────
let _refreshPromise = null;
let _failedQueue = [];

function processQueue(error, token = null) {
  _failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  _failedQueue = [];
}

/**
 * Attempt to refresh the access token using the httpOnly refresh cookie.
 * Only one refresh attempt runs at a time; concurrent 401s are queued.
 */
async function refreshAccessToken() {
  // If a refresh is already in progress, queue this request
  if (_refreshPromise) {
    return new Promise((resolve, reject) => {
      _failedQueue.push({ resolve, reject });
    });
  }

  _refreshPromise = api
    .post("/api/auth/refresh")
    .then((res) => {
      const newToken = res.data?.data?.token;
      if (newToken) {
        _accessToken = newToken;
        localStorage.setItem("token", newToken);
      }
      processQueue(null, newToken);
      return newToken;
    })
    .catch((err) => {
      processQueue(err, null);
      throw err;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

// ── Request interceptor ──────────────────────────────────────────
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

// ── Response interceptor — automatic refresh on 401 ──────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only attempt refresh on 401
    if (status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest?.url || "";

    // Never retry these endpoints
    const isLoginRequest = requestUrl.includes("/auth/login");
    const isRefreshRequest = requestUrl.includes("/auth/refresh");
    const isPublicPage = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      "/site",
    ].includes(window.location.pathname);

    if (isLoginRequest || isRefreshRequest || isPublicPage) {
      return Promise.reject(error);
    }

    // Don't retry if we've already tried refreshing for this request
    if (originalRequest._retry) {
      // Refresh failed — force logout with a human-friendly message
      localStorage.removeItem("token");
      _accessToken = null;

      // Avoid stacking toasts if already on login page
      if (!window.location.pathname.startsWith("/login")) {
        toast.error(
          "Your session has expired. Please log in again.",
          { id: "session-expired", duration: 6000 }
        );
      }

      // Brief delay so the toast is visible before redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    } catch {
      // Refresh itself failed — force logout with a human-friendly message
      localStorage.removeItem("token");
      _accessToken = null;

      if (!window.location.pathname.startsWith("/login")) {
        toast.error(
          "Your session has expired. Please log in again.",
          { id: "session-expired", duration: 6000 }
        );
      }

      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    }

    return Promise.reject(error);
  },
);

export default api;
