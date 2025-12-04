/**
 * Application-wide constants.
 *
 * Performance optimizations:
 * 1. Module-level constants: Created once when the module is first imported
 *    and then cached by the module system, avoiding recreation.
 * 2. `as const` assertion: Ensures immutability and provides literal types,
 *    which allows TypeScript to optimize type checking and provides better
 *    autocomplete and type inference.
 * 3. Single evaluation: All values are computed once at module load time.
 * 4. No object recreation: Constants are reused across the application,
 *    preventing unnecessary object/array creation.
 */

/**
 * Pagination constants for data tables and lists.
 *
 * Performance considerations:
 * - Array literal is created once and reused (not recreated on each use)
 * - `as const` ensures the array is readonly and provides literal types
 * - Module-level constant avoids recreation on every import
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/**
 * Date format strings for date formatting utilities.
 *
 * Performance considerations:
 * - Format strings are created once and reused
 * - `as const` ensures immutability and provides literal types
 * - Module-level constant avoids recreation on every import
 * - Compatible with both moment.js and date-fns format strings
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY', // e.g., "Jan 15, 2024"
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm', // e.g., "Jan 15, 2024 14:30"
  API: 'YYYY-MM-DD', // e.g., "2024-01-15"
  API_DATETIME: "YYYY-MM-DD'T'HH:mm:ss.SSS'Z'", // ISO 8601 format
} as const;

/**
 * Currency formatting constants.
 *
 * Performance considerations:
 * - Constants are created once and reused
 * - `as const` ensures immutability and provides literal types
 * - Module-level constant avoids recreation on every import
 * - Number type (DECIMAL_PLACES) is more efficient than string comparisons
 */
export const CURRENCY = {
  SYMBOL: '$',
  DECIMAL_PLACES: 2,
} as const;