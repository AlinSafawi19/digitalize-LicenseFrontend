import { z } from 'zod';

/**
 * Validation schemas and utilities using Zod.
 *
 * Performance optimizations:
 * 1. Module-level schemas: Schemas are created once when the module is first imported
 *    and then cached by the module system, avoiding recreation.
 * 2. Zod compilation: Zod schemas are compiled once and reused for all validations,
 *    providing efficient runtime validation.
 * 3. Type inference: Using z.infer for type generation is compile-time only,
 *    providing type safety with zero runtime overhead.
 * 4. Constants extracted: Default values extracted to constants for better maintainability.
 */

// Constants for default values
const DEFAULT_INITIAL_PRICE = 350;
const DEFAULT_ANNUAL_PRICE = 50;
const DEFAULT_PRICE_PER_USER = 25;

// Error messages as constants for consistency and potential i18n
const ERROR_MESSAGES = {
  CUSTOMER_NAME_REQUIRED: 'Customer name is required',
  INVALID_EMAIL: 'Invalid email address',
  PRICE_MUST_BE_POSITIVE: 'Price must be positive',
  ANNUAL_PRICE_MUST_BE_POSITIVE: 'Annual price must be positive',
  PRICE_PER_USER_MUST_BE_POSITIVE: 'Price per user must be positive',
  LOCATION_NAME_REQUIRED: 'Branch/location name is required',
  LOCATION_ADDRESS_REQUIRED: 'Branch/location address is required',
} as const;

/**
 * License form validation schema.
 *
 * Performance considerations:
 * - Schema is created once at module load and reused for all validations
 * - Zod's compiled schema provides efficient runtime validation
 * - Default values are applied only when fields are missing
 * - Type inference happens at compile time with no runtime overhead
 *
 * The schema validates:
 * - Customer information (name, email)
 * - Pricing information (initial, annual, per-user)
 * - Location information (name, address)
 * - License flags (free trial)
 */
export const licenseFormSchema = z.object({
  customerName: z.string().min(1, ERROR_MESSAGES.CUSTOMER_NAME_REQUIRED),
  customerEmail: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
  initialPrice: z.number().min(0, ERROR_MESSAGES.PRICE_MUST_BE_POSITIVE).default(DEFAULT_INITIAL_PRICE),
  annualPrice: z.number().min(0, ERROR_MESSAGES.ANNUAL_PRICE_MUST_BE_POSITIVE).default(DEFAULT_ANNUAL_PRICE),
  pricePerUser: z.number().min(0, ERROR_MESSAGES.PRICE_PER_USER_MUST_BE_POSITIVE).default(DEFAULT_PRICE_PER_USER),
  locationName: z.string().min(1, ERROR_MESSAGES.LOCATION_NAME_REQUIRED),
  locationAddress: z.string().min(1, ERROR_MESSAGES.LOCATION_ADDRESS_REQUIRED),
  isFreeTrial: z.boolean().default(false),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine((data) => {
  // If both dates are provided, endDate should be after startDate
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

/**
 * TypeScript type inferred from the license form schema.
 *
 * Performance considerations:
 * - Type inference is compile-time only, zero runtime overhead
 * - Automatically stays in sync with schema changes
 * - Provides full type safety for form data
 */
export type LicenseFormData = z.infer<typeof licenseFormSchema>;