import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState, store } from '../store';
import { config } from '../config/env';
import { isTokenExpired } from '../utils/jwtUtils';
import { logout } from '../features/auth/slice/authSlice';

/**
 * Handle session expiry - logout and redirect to login
 */
const handleSessionExpiry = () => {
  store.dispatch(logout());
  if (window.location.pathname !== '/login') {
    // Use pathname assignment to avoid file:// protocol issues
    // For http/https, pathname assignment works correctly
    // For file:// protocol, construct URL properly
    if (window.location.protocol === 'file:') {
      const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
      window.location.href = basePath + 'login';
    } else {
      window.location.pathname = '/login';
    }
  }
};

// Custom base query with token expiry checking and 401 handling
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,
  prepareHeaders: (headers, { getState, endpoint }) => {
    // Get auth state
    const state = getState() as RootState;
    const { token, tokenExpiry } = state.auth;

    // Check if this is a login endpoint
    // RTK Query endpoint names follow pattern: 'api/endpointName' or 'reducerPath/endpointName'
    // For injected endpoints from authApi, it might be 'api/login' or similar
    // Performance: Only check if endpoint is a string (most common case)
    if (typeof endpoint === 'string' && endpoint.toLowerCase().includes('login')) {
      // Remove any existing authorization header for login endpoints
      headers.delete('authorization');
      headers.delete('Authorization');
      return headers;
    }

    // Performance optimization: Use cached tokenExpiry from state instead of decoding JWT
    // This avoids expensive base64 decoding and JSON parsing on every request
    if (token) {
      // Check expiration using cached expiry time (much faster than decoding JWT)
      if (tokenExpiry) {
        const expiryTime = new Date(tokenExpiry).getTime();
        const currentTime = Date.now();
        // Add 5 second buffer for clock skew
        if (currentTime >= expiryTime - 5000) {
          handleSessionExpiry();
          return headers;
        }
      } else {
        // Fallback to JWT decoding if expiry not cached (shouldn't happen in normal flow)
        if (isTokenExpired(token)) {
          handleSessionExpiry();
          return headers;
        }
      }

      // Add auth header
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Wrapper to handle 401 errors
const baseQueryWithReauth: typeof baseQueryWithAuth = async (args, api, extraOptions) => {
  const result = await baseQueryWithAuth(args, api, extraOptions);
  
  // Handle 401 Unauthorized responses
  if (result.error && 'status' in result.error && result.error.status === 401) {
    handleSessionExpiry();
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['License', 'Activation', 'Subscription', 'Payment', 'Stats', 'Auth', 'Preferences', 'Health'],
  endpoints: () => ({}),
  // Performance optimizations:
  // - Keep unused data cached for 5 minutes globally (can be overridden per endpoint)
  //   This reduces unnecessary refetches when navigating between pages
  keepUnusedDataFor: 300,
  // - Don't refetch on window focus by default (can be overridden per query)
  //   This prevents unnecessary API calls when user switches browser tabs
  refetchOnFocus: false,
  // - Don't refetch on reconnect by default (can be overridden per query)
  //   This prevents API spam when network reconnects
  refetchOnReconnect: false,
});