import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../features/auth/slice/authSlice';
import { isTokenExpired, isTokenExpiringSoon, getTokenTimeRemaining } from '../utils/jwtUtils';
import { useToastContext } from '../components/common/Toast/useToastContext';

// Constants
const CHECK_INTERVAL = 30000; // 30 seconds
const WARNING_THRESHOLD_MINUTES = 5;
const WARNING_TOAST_DURATION = 10000; // 10 seconds
const EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
const LOGIN_PATH = '/login';

/**
 * Hook to monitor session expiry and show warnings
 * 
 * Features:
 * - Checks token expiry periodically
 * - Shows warning when token is about to expire
 * - Automatically logs out when token expires
 * - Returns session status information
 * 
 * Performance optimizations:
 * - Uses tokenExpiry from Redux state to avoid redundant JWT parsing
 * - Memoizes return values to prevent unnecessary re-renders
 * - Optimized selector to only select needed values
 */
export const useSessionExpiry = () => {
  const dispatch = useDispatch();
  const { showToast } = useToastContext();
  // Performance optimization: Only select token and tokenExpiry instead of entire auth state
  // This prevents re-renders when other auth state properties change
  const token = useSelector((state: RootState) => state.auth.token);
  const tokenExpiry = useSelector((state: RootState) => state.auth.tokenExpiry);
  
  // Track if we've already shown the warning to avoid spam
  const warningShownRef = useRef(false);

  /**
   * Check and handle token expiry
   * Performance optimization: Uses tokenExpiry from state when available to avoid JWT parsing
   */
  const checkTokenExpiry = useCallback(() => {
    if (!token) {
      return;
    }

    // Performance optimization: Use tokenExpiry from state if available, otherwise parse JWT
    let isExpired = false;
    if (tokenExpiry) {
      const expiryTime = new Date(tokenExpiry).getTime();
      const currentTime = Date.now();
      isExpired = currentTime >= expiryTime;
    } else {
      // Fallback to JWT parsing if tokenExpiry not available
      isExpired = isTokenExpired(token);
    }

    if (isExpired) {
      dispatch(logout());
      showToast(EXPIRED_MESSAGE, 'warning');
      if (window.location.pathname !== LOGIN_PATH) {
        // Use pathname assignment to avoid file:// protocol issues
        // For http/https, pathname assignment works correctly
        // For file:// protocol, construct URL properly
        if (window.location.protocol === 'file:') {
          const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
          window.location.href = basePath + 'login';
        } else {
          window.location.pathname = LOGIN_PATH;
        }
      }
      return;
    }

    // Check if token is expiring soon (within 5 minutes)
    // Performance: Only check if we haven't shown the warning yet
    if (!warningShownRef.current) {
      const isExpiringSoon = tokenExpiry
        ? (() => {
            const expiryTime = new Date(tokenExpiry).getTime();
            const currentTime = Date.now();
            const timeRemaining = expiryTime - currentTime;
            return timeRemaining > 0 && timeRemaining <= WARNING_THRESHOLD_MINUTES * 60 * 1000;
          })()
        : isTokenExpiringSoon(token, WARNING_THRESHOLD_MINUTES);

      if (isExpiringSoon) {
        const timeRemaining = tokenExpiry
          ? new Date(tokenExpiry).getTime() - Date.now()
          : getTokenTimeRemaining(token);
        
        if (timeRemaining && timeRemaining > 0) {
          const minutes = Math.ceil(timeRemaining / (60 * 1000));
          const message = `Your session will expire in ${minutes} minute${minutes !== 1 ? 's' : ''}. Please save your work.`;
          showToast(message, 'warning', WARNING_TOAST_DURATION);
          warningShownRef.current = true;
        }
      }
    }
  }, [token, tokenExpiry, dispatch, showToast]);

  /**
   * Set up periodic checking
   */
  useEffect(() => {
    if (!token) {
      warningShownRef.current = false; // Reset warning flag when token is removed
      return;
    }

    // Reset warning flag when token changes
    warningShownRef.current = false;

    // Check immediately
    checkTokenExpiry();

    // Check every 30 seconds
    const interval = setInterval(() => {
      checkTokenExpiry();
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [token, checkTokenExpiry]);

  // Performance optimization: Memoize return values to prevent unnecessary re-renders
  // Use tokenExpiry from state when available to avoid redundant JWT parsing
  const sessionStatus = useMemo(() => {
    if (!token) {
      return {
        isExpired: true,
        isExpiringSoon: false,
        timeRemaining: null,
        minutesRemaining: null,
        tokenExpiry: null,
      };
    }

    // Performance: Use tokenExpiry from state if available, otherwise parse JWT
    let timeRemaining: number | null = null;
    let isExpired = false;
    let isExpiringSoon = false;

    if (tokenExpiry) {
      const expiryTime = new Date(tokenExpiry).getTime();
      const currentTime = Date.now();
      timeRemaining = expiryTime - currentTime;
      isExpired = timeRemaining <= 0;
      isExpiringSoon = timeRemaining > 0 && timeRemaining <= WARNING_THRESHOLD_MINUTES * 60 * 1000;
    } else {
      // Fallback to JWT parsing if tokenExpiry not available
      isExpired = isTokenExpired(token);
      if (!isExpired) {
        timeRemaining = getTokenTimeRemaining(token);
        isExpiringSoon = isTokenExpiringSoon(token, WARNING_THRESHOLD_MINUTES);
      }
    }

    const minutesRemaining = timeRemaining && timeRemaining > 0 
      ? Math.ceil(timeRemaining / (60 * 1000)) 
      : null;

    return {
      isExpired,
      isExpiringSoon,
      timeRemaining: timeRemaining && timeRemaining > 0 ? timeRemaining : null,
      minutesRemaining,
      tokenExpiry,
    };
  }, [token, tokenExpiry]);

  return sessionStatus;
};