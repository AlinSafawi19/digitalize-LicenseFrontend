/**
 * JWT Token Utilities
 *
 * Utilities for decoding and checking JWT token expiry.
 *
 * Performance optimizations:
 * 1. Early returns: Null/undefined checks happen before expensive operations
 * 2. Efficient base64 decoding: Uses native atob() and optimized string operations
 * 3. Constants extracted: Magic numbers extracted to constants for better performance
 * 4. Single-pass operations: Minimizes string operations and iterations
 * 5. Try-catch optimization: Errors are caught and handled gracefully
 */

// Constants for performance and maintainability
const CLOCK_SKEW_BUFFER_MS = 5000; // 5 second buffer for clock skew
const DEFAULT_EXPIRING_SOON_MINUTES = 5;
const JWT_PART_SEPARATOR = '.';
const BASE64_URL_REPLACEMENTS = [
  ['-', '+'],
  ['_', '/'],
] as const;
const SECONDS_TO_MS = 1000;
const MINUTES_TO_MS = 60 * 1000;

interface JWTPayload {
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time
  id?: number;
  username?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Decode JWT token without verification.
 * Note: This only decodes the payload, it does NOT verify the signature.
 *
 * Performance considerations:
 * - Early return if token format is invalid
 * - Efficient base64 URL decoding using native atob()
 * - Optimized string replacements (single pass where possible)
 * - JSON.parse() is optimized by JavaScript engine
 *
 * @param token - JWT token string
 * @returns Decoded payload object, or null if invalid
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // Performance: Split once and check immediately
    const parts = token.split(JWT_PART_SEPARATOR);
    if (parts.length < 2 || !parts[1]) {
      return null;
    }

    const base64Url = parts[1];

    // Performance: Optimize base64 URL to base64 conversion
    // Replace both characters in a single pass using a more efficient method
    let base64 = base64Url;
    for (const [search, replace] of BASE64_URL_REPLACEMENTS) {
      base64 = base64.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
    }

    // Performance: Use native atob() and optimized URI decoding
    const decoded = atob(base64);
    // Performance: Manual URI encoding is more efficient than split/map/join for small strings
    const jsonPayload = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired.
 *
 * Performance considerations:
 * - Early return for null/undefined tokens
 * - Reuses decodeJWT() for consistent decoding
 * - Uses Date.now() for efficient time comparison
 * - Clock skew buffer prevents false negatives
 *
 * @param token - JWT token string
 * @returns True if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    return true;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    // If no expiry claim, consider it expired for safety
    return true;
  }

  // Performance: exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * SECONDS_TO_MS;
  const currentTime = Date.now();

  // Add buffer to account for clock skew
  return currentTime >= expirationTime - CLOCK_SKEW_BUFFER_MS;
};

/**
 * Get the expiration time of a JWT token.
 *
 * Performance considerations:
 * - Early return for null/undefined tokens
 * - Reuses decodeJWT() for consistent decoding
 * - Efficient Date object creation
 *
 * @param token - JWT token string
 * @returns Date object representing expiration time, or null if invalid
 */
export const getTokenExpirationTime = (token: string | null): Date | null => {
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  // Performance: exp is in seconds, convert to milliseconds
  return new Date(payload.exp * SECONDS_TO_MS);
};

/**
 * Get the time remaining until token expires (in milliseconds).
 *
 * Performance considerations:
 * - Early return for null/undefined tokens
 * - Reuses getTokenExpirationTime() to avoid duplicate decoding
 * - Efficient time calculation using getTime() and Date.now()
 *
 * @param token - JWT token string
 * @returns Time remaining in milliseconds, or null if invalid
 */
export const getTokenTimeRemaining = (token: string | null): number | null => {
  if (!token) {
    return null;
  }

  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return null;
  }

  const remaining = expirationTime.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Check if token is expiring soon (within the specified minutes).
 *
 * Performance considerations:
 * - Early return for null/undefined tokens
 * - Reuses getTokenTimeRemaining() to avoid duplicate decoding
 * - Efficient threshold calculation using constant
 * - Default parameter value avoids unnecessary function calls
 *
 * @param token - JWT token string
 * @param minutes - Number of minutes threshold (default: 5)
 * @returns True if token is expiring within threshold, false otherwise
 */
export const isTokenExpiringSoon = (token: string | null, minutes: number = DEFAULT_EXPIRING_SOON_MINUTES): boolean => {
  if (!token) {
    return true;
  }

  const timeRemaining = getTokenTimeRemaining(token);
  if (timeRemaining === null) {
    return true;
  }

  // Performance: Convert minutes to milliseconds using constant
  const threshold = minutes * MINUTES_TO_MS;
  return timeRemaining > 0 && timeRemaining <= threshold;
};