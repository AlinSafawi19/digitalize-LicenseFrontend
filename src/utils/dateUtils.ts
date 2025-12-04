import moment from 'moment-timezone';

/**
 * Date utility functions for timezone conversion and date calculations.
 *
 * Performance optimizations:
 * 1. Module-level constants: TIMEZONE is created once and reused
 * 2. Early returns: Null/undefined checks happen before expensive operations
 * 3. Try-catch optimization: Errors are caught and handled gracefully without throwing
 * 4. Moment.js caching: moment-timezone caches timezone data internally
 * 5. Efficient date operations: Uses moment's optimized date manipulation methods
 */

const TIMEZONE = 'Asia/Beirut';

/**
 * Convert UTC date from database to Asia/Beirut timezone for display.
 *
 * Performance considerations:
 * - Early return for null/undefined avoids unnecessary processing
 * - moment.utc() handles both string and Date inputs efficiently
 * - Timezone conversion is optimized by moment-timezone's internal caching
 *
 * @param date - UTC date string or Date object
 * @returns Moment object in Beirut timezone, or null if invalid
 */
export const toBeirutTime = (date: string | Date | null | undefined): moment.Moment | null => {
  if (!date) return null;
  try {
    // Performance: moment.utc() handles both string and Date inputs efficiently
    const dateObj = moment.utc(date);
    return dateObj.tz(TIMEZONE);
  } catch {
    return null;
  }
};

/**
 * Convert date from Asia/Beirut timezone to UTC for database storage.
 *
 * Performance considerations:
 * - Early return for null/undefined avoids unnecessary processing
 * - moment.tz() efficiently handles timezone conversion
 * - toDate() conversion is optimized by moment.js
 *
 * @param date - Date or Moment object in Beirut timezone
 * @returns UTC Date object, or null if invalid
 */
export const fromBeirutToUTC = (date: Date | moment.Moment | null | undefined): Date | null => {
  if (!date) return null;
  try {
    const beirutMoment = moment.tz(date, TIMEZONE);
    return beirutMoment.utc().toDate();
  } catch {
    return null;
  }
};

/**
 * Get days remaining until end date (using Beirut timezone).
 *
 * Performance considerations:
 * - Reuses toBeirutTime() for consistent timezone handling
 * - moment.tz() creates current time efficiently
 * - diff() calculation is optimized by moment.js
 * - Math.max() ensures non-negative result
 *
 * @param endDate - End date string or Date object
 * @returns Number of days remaining (0 if expired or invalid)
 */
export const getDaysRemaining = (endDate: string | Date): number => {
  try {
    const end = toBeirutTime(endDate);
    if (!end) return 0;
    const now = moment.tz(TIMEZONE);
    // Use Math.ceil() to round up, matching server and desktop POS behavior
    // This ensures that any partial day counts as a full day (user-friendly)
    const millisecondsDiff = end.valueOf() - now.valueOf();
    const days = Math.ceil(millisecondsDiff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  } catch {
    return 0;
  }
};

/**
 * Check if date is expired (using Beirut timezone).
 *
 * Performance considerations:
 * - Reuses toBeirutTime() for consistent timezone handling
 * - isBefore() is an efficient comparison method
 * - Early return if date is null/invalid
 *
 * @param endDate - End date string or Date object
 * @returns True if expired, false otherwise
 */
export const isExpired = (endDate: string | Date): boolean => {
  try {
    const end = toBeirutTime(endDate);
    if (!end) return false;
    const now = moment.tz(TIMEZONE);
    return end.isBefore(now);
  } catch {
    return false;
  }
};

/**
 * Check if date is expiring soon (using Beirut timezone).
 *
 * Performance considerations:
 * - Reuses toBeirutTime() for consistent timezone handling
 * - Single diff() calculation for efficiency
 * - Early return if date is null/invalid
 * - Default parameter value avoids unnecessary function calls
 *
 * @param endDate - End date string or Date object
 * @param days - Number of days threshold (default: 30)
 * @returns True if expiring within threshold, false otherwise
 */
export const isExpiringSoon = (endDate: string | Date, days: number = 30): boolean => {
  try {
    const end = toBeirutTime(endDate);
    if (!end) return false;
    const now = moment.tz(TIMEZONE);
    const daysRemaining = end.diff(now, 'days');
    return daysRemaining > 0 && daysRemaining <= days;
  } catch {
    return false;
  }
};

/**
 * Convert date from date picker (local time) to UTC ISO string for API.
 * Assumes the date picker value is in Beirut timezone context.
 *
 * Performance considerations:
 * - Early return for null/undefined avoids unnecessary processing
 * - toISOString() is an efficient standard method
 * - Timezone conversion is optimized by moment-timezone
 *
 * @param date - Date object from date picker
 * @returns UTC ISO string, or undefined if invalid
 */
export const dateToUTCISOString = (date: Date | null | undefined): string | undefined => {
  if (!date) return undefined;
  try {
    const beirutMoment = moment.tz(date, TIMEZONE);
    return beirutMoment.utc().toISOString();
  } catch {
    return undefined;
  }
};

/**
 * Convert date from date picker to UTC date string (YYYY-MM-DD) for API.
 * Assumes the date picker value is in Beirut timezone context.
 *
 * Performance considerations:
 * - Early return for null/undefined avoids unnecessary processing
 * - format() is optimized by moment.js
 * - Timezone conversion is optimized by moment-timezone
 *
 * @param date - Date object from date picker
 * @returns UTC date string (YYYY-MM-DD), or undefined if invalid
 */
export const dateToUTCDateString = (date: Date | null | undefined): string | undefined => {
  if (!date) return undefined;
  try {
    const beirutMoment = moment.tz(date, TIMEZONE);
    return beirutMoment.utc().format('YYYY-MM-DD');
  } catch {
    return undefined;
  }
};

/**
 * Convert UTC date string from API to Date object for date picker.
 * The date picker will display it in the user's local timezone, but we treat it as Beirut time.
 *
 * Performance considerations:
 * - Early return for null/undefined avoids unnecessary processing
 * - moment.utc() efficiently parses UTC strings
 * - Timezone conversion is optimized by moment-timezone
 * - toDate() conversion is optimized by moment.js
 *
 * @param dateString - UTC date string from API
 * @returns Date object for date picker, or null if invalid
 */
export const utcDateStringToDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    // Parse as UTC and convert to Beirut timezone, then get the Date object
    const utcMoment = moment.utc(dateString);
    const beirutMoment = utcMoment.tz(TIMEZONE);
    // Return as Date object - date picker will use this
    return beirutMoment.toDate();
  } catch {
    return null;
  }
};