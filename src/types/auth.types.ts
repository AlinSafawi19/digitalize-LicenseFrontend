/**
 * User login credentials.
 *
 * Performance considerations:
 * - Simple object structure for efficient serialization/deserialization
 * - String types allow for efficient JSON parsing
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Authentication response from the API.
 *
 * Performance considerations:
 * - Token stored as string for efficient serialization and localStorage access
 * - User object structure allows for efficient state updates
 * - Optional name property reduces unnecessary data transfer
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface AuthResponse {
  token: string;
  user: {
    id: number;
    phone: string;
    name?: string;
  };
}

/**
 * Authentication state in Redux store.
 *
 * Performance considerations:
 * - Uses `AuthResponse['user']` type for type reuse and consistency
 * - Nullable types allow for efficient state initialization and cleanup
 * - Boolean flags (isAuthenticated, isLoading) are more efficient than string comparisons
 * - tokenExpiry stored as ISO string for Redux serialization compatibility
 *   (Redux requires serializable state, so Date objects are converted to strings)
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 *
 * Note: The tokenExpiry is stored as an ISO string rather than a Date object
 * to comply with Redux's serializable state requirement. This allows for
 * efficient state persistence and avoids serialization errors.
 */
export interface AuthState {
  token: string | null;
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenExpiry: string | null; // Token expiration time (ISO string for Redux serialization)
}