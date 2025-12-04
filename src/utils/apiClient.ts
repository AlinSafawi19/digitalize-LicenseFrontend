import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { config } from '../config/env';
import { store } from '../store';
import { logout } from '../features/auth/slice/authSlice';
import { isTokenExpired } from './jwtUtils';

/**
 * Axios API client with authentication and error handling.
 *
 * Performance optimizations:
 * 1. Module-level singleton: Created once and reused across all API calls
 * 2. Optimized token expiration check: Uses tokenExpiry from Redux state instead of
 *    parsing JWT on every request, avoiding expensive base64 decoding and JSON parsing
 * 3. Efficient interceptors: Set up once and reused for all requests
 * 4. Constants extracted: Magic numbers and strings extracted to constants
 */

// Constants for performance and maintainability
const REQUEST_TIMEOUT = 30000; // 30 seconds
const TOKEN_EXPIRY_BUFFER_MS = 5000; // 5 second buffer for clock skew
const LOGIN_PATH = '/login';
const TOKEN_EXPIRED_ERROR = 'Token expired';
const BEARER_PREFIX = 'Bearer ';

const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Handle session expiry - logout and redirect to login.
 *
 * Performance optimization: Checks current pathname to avoid unnecessary redirects.
 */
const handleSessionExpiry = () => {
  store.dispatch(logout());
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
};

// Request interceptor for adding auth token and checking expiry
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const { token, tokenExpiry } = state.auth;

    // Performance optimization: Use cached tokenExpiry from state instead of decoding JWT
    // This avoids expensive base64 decoding and JSON parsing on every request
    if (token) {
      let isExpired = false;

      if (tokenExpiry) {
        // Use cached expiry time (much faster than decoding JWT)
        const expiryTime = new Date(tokenExpiry).getTime();
        const currentTime = Date.now();
        // Add buffer for clock skew
        isExpired = currentTime >= expiryTime - TOKEN_EXPIRY_BUFFER_MS;
      } else {
        // Fallback to JWT decoding if expiry not cached (shouldn't happen in normal flow)
        isExpired = isTokenExpired(token);
      }

      if (isExpired) {
        handleSessionExpiry();
        return Promise.reject(new Error(TOKEN_EXPIRED_ERROR));
      }

      // Add auth header
      if (config.headers) {
        config.headers.Authorization = `${BEARER_PREFIX}${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      handleSessionExpiry();
    }
    return Promise.reject(error);
  }
);

export default apiClient;