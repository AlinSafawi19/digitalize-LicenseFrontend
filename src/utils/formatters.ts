import { DATE_FORMATS, CURRENCY } from './constants';
import { toBeirutTime } from './dateUtils';

/**
 * Formatting utility functions for dates, currency, and other data types.
 *
 * Performance optimizations:
 * 1. Early returns: Null/undefined checks happen before expensive operations
 * 2. Try-catch optimization: Errors are caught and handled gracefully
 * 3. Constant reuse: Uses constants from constants.ts to avoid string recreation
 * 4. Lookup maps: Payment type functions use efficient lookup maps instead of multiple if statements
 * 5. Optimized regex: License key formatting uses efficient regex patterns
 */

// Constants for performance and maintainability
const DEFAULT_EMPTY_VALUE = '-';
const LICENSE_KEY_SEPARATOR = '-';

/**
 * Format date for display (converts UTC to Asia/Beirut timezone).
 *
 * Performance considerations:
 * - Early return for null/undefined avoids unnecessary processing
 * - Reuses toBeirutTime() for consistent timezone handling
 * - Uses constant format string to avoid recreation
 *
 * @param date - UTC date string or Date object
 * @returns Formatted date string, or '-' if invalid
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return DEFAULT_EMPTY_VALUE;
  try {
    const beirutTime = toBeirutTime(date);
    if (!beirutTime) return DEFAULT_EMPTY_VALUE;
    return beirutTime.format(DATE_FORMATS.DISPLAY);
  } catch {
    return DEFAULT_EMPTY_VALUE;
  }
};

/**
 * Format date and time for display (converts UTC to Asia/Beirut timezone).
 *
 * Performance considerations:
 * - Early return for null/undefined avoids unnecessary processing
 * - Reuses toBeirutTime() for consistent timezone handling
 * - Uses constant format string to avoid recreation
 *
 * @param date - UTC date string or Date object
 * @returns Formatted date and time string, or '-' if invalid
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return DEFAULT_EMPTY_VALUE;
  try {
    const beirutTime = toBeirutTime(date);
    if (!beirutTime) return DEFAULT_EMPTY_VALUE;
    return beirutTime.format(DATE_FORMATS.DISPLAY_WITH_TIME);
  } catch {
    return DEFAULT_EMPTY_VALUE;
  }
};

/**
 * Format currency amount for display.
 *
 * Performance considerations:
 * - Early return for null/undefined avoids unnecessary processing
 * - Uses constants for currency symbol and decimal places
 * - parseFloat() is efficient for string-to-number conversion
 * - toFixed() is optimized by JavaScript engine
 *
 * @param amount - Number or string representing currency amount
 * @returns Formatted currency string, or '-' if invalid
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return DEFAULT_EMPTY_VALUE;
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if conversion resulted in NaN
  if (isNaN(numAmount)) return DEFAULT_EMPTY_VALUE;
  
  return `${CURRENCY.SYMBOL}${numAmount.toFixed(CURRENCY.DECIMAL_PLACES)}`;
};

/**
 * Format license key with separators (e.g., "ABCD-EFGH-IJKL").
 *
 * Performance considerations:
 * - toUpperCase() is efficient for string transformation
 * - Regex with replace() is optimized by JavaScript engine
 * - slice() is efficient for removing trailing separator
 * - Single pass through the string
 *
 * @param key - License key string
 * @returns Formatted license key with separators
 */
export const formatLicenseKey = (key: string): string => {
  // Performance: Regex with replace() is efficient for this pattern
  // Matches every 4 characters and adds separator after each group
  return key.toUpperCase().replace(/(.{4})/g, `$1${LICENSE_KEY_SEPARATOR}`).slice(0, -1);
};

/**
 * Payment type label lookup map for efficient lookups.
 * Performance: Object property access is O(1) vs multiple if statements
 */
const PAYMENT_TYPE_LABEL_MAP: Record<'initial' | 'annual' | 'user', string> = {
  initial: 'Initial',
  annual: 'Annual',
  user: 'User',
} as const;

/**
 * Payment type color lookup map for efficient lookups.
 * Performance: Object property access is O(1) vs multiple if statements
 */
const PAYMENT_TYPE_COLOR_MAP: Record<'initial' | 'annual' | 'user', 'default' | 'primary' | 'success'> = {
  initial: 'default',
  annual: 'primary',
  user: 'success',
} as const;

/**
 * Get payment type label from paymentType or fallback to isAnnualSubscription.
 *
 * Performance considerations:
 * - Uses lookup map for O(1) property access instead of multiple if statements
 * - Early returns for known payment types
 * - Fallback only when paymentType is not provided
 *
 * @param paymentType - Optional payment type
 * @param isAnnualSubscription - Fallback flag for backward compatibility
 * @returns Payment type label string
 */
export const getPaymentTypeLabel = (
  paymentType?: 'initial' | 'annual' | 'user',
  isAnnualSubscription?: boolean
): string => {
  // Performance: Use lookup map for O(1) access instead of multiple if statements
  if (paymentType && paymentType in PAYMENT_TYPE_LABEL_MAP) {
    return PAYMENT_TYPE_LABEL_MAP[paymentType];
  }
  // Fallback for backward compatibility
  return isAnnualSubscription ? PAYMENT_TYPE_LABEL_MAP.annual : PAYMENT_TYPE_LABEL_MAP.initial;
};

/**
 * Get payment type color for Chip component.
 *
 * Performance considerations:
 * - Uses lookup map for O(1) property access instead of multiple if statements
 * - Early returns for known payment types
 * - Fallback only when paymentType is not provided
 *
 * @param paymentType - Optional payment type
 * @param isAnnualSubscription - Fallback flag for backward compatibility
 * @returns MUI Chip color value
 */
export const getPaymentTypeColor = (
  paymentType?: 'initial' | 'annual' | 'user',
  isAnnualSubscription?: boolean
): 'default' | 'primary' | 'success' => {
  // Performance: Use lookup map for O(1) access instead of multiple if statements
  if (paymentType && paymentType in PAYMENT_TYPE_COLOR_MAP) {
    return PAYMENT_TYPE_COLOR_MAP[paymentType];
  }
  // Fallback for backward compatibility
  return isAnnualSubscription ? PAYMENT_TYPE_COLOR_MAP.annual : PAYMENT_TYPE_COLOR_MAP.initial;
};