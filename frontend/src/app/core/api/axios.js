import axios from 'axios';
import { getSubdomain } from '../utils/subdomainHelper';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}
export function getAccessToken() {
  return _accessToken;
}

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.request.use(
  (config) => {
    const subdomain = getSubdomain();
    if (subdomain) {
      config.headers['x-school-subdomain'] = subdomain;
    }
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger si on est déjà sur la page de login — le 401 y est attendu
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isPublicAuthPage = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
      ].includes(window.location.pathname);
      if (!isLoginRequest && !isPublicAuthPage) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
