/// <reference types="vite/client" />

/**
 * Vite environment variable type definitions.
 *
 * Performance optimizations:
 * 1. TypeScript declaration file: This file is compile-time only and has
 *    zero runtime overhead. All type information is erased during compilation.
 * 2. Vite build-time replacement: Environment variables prefixed with VITE_
 *    are replaced at build time by Vite, eliminating runtime lookups.
 * 3. Readonly properties: Ensures immutability and prevents accidental mutations.
 * 4. Type safety: Provides autocomplete and type checking for environment variables,
 *    catching errors at compile time rather than runtime.
 *
 * Note: These environment variables are replaced at build time by Vite.
 * Access them via `import.meta.env.VITE_*` in your code.
 */

/**
 * Environment variables available in the application.
 * All variables must be prefixed with VITE_ to be exposed to the client.
 *
 * Performance: These are replaced at build time, so there's no runtime overhead
 * for accessing environment variables.
 */
interface ImportMetaEnv {
  /** API base URL for backend requests */
  readonly VITE_API_BASE_URL: string;
  /** Application name */
  readonly VITE_APP_NAME: string;
  /** Application version */
  readonly VITE_APP_VERSION: string;
  /** Whether analytics is enabled (string 'true' or 'false') */
  readonly VITE_ENABLE_ANALYTICS: string;
}

/**
 * ImportMeta interface extension for Vite.
 *
 * Performance: TypeScript compiles this to nothing at runtime.
 * The `import.meta.env` object is replaced at build time by Vite.
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}