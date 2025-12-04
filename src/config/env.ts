/**
 * Application configuration object.
 * 
 * Performance notes:
 * - This object is created once at module load time and cached by the module system
 * - Vite replaces `import.meta.env.*` at build time, so there's no runtime overhead
 * - All values are computed once and stored as constants
 * - The `as const` assertion ensures immutability and better type inference
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  appName: import.meta.env.VITE_APP_NAME || 'DigitalizePOS License Manager',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
} as const;