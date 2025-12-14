/**
 * License status type - union of possible license states.
 *
 * Performance considerations:
 * - Literal union type provides type safety and efficient comparisons
 * - String literals are more efficient than enum lookups at runtime
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended';

/**
 * License entity with all associated data.
 *
 * Performance considerations:
 * - Optional nested arrays (activations, subscriptions, payments) allow for lazy loading
 *   and reduce initial payload size when not all data is needed
 * - Boolean flag (isFreeTrial) is more efficient than string comparisons
 * - Dates stored as ISO strings for efficient serialization and Redux compatibility
 * - Nullable types allow for efficient state representation and reduce memory usage
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface License {
  id: number;
  licenseKey: string;
  customerName: string | null;
  customerPhone: string | null;
  purchaseDate: string;
  initialPrice: number;
  pricePerUser: number;
  status: LicenseStatus;
  isFreeTrial: boolean;
  freeTrialEndDate: string | null;
  startDate: string | null;
  endDate: string | null;
  userCount: number;
  userLimit: number;
  locationName: string | null;
  locationAddress: string | null;
  version: string;
  createdAt: string;
  updatedAt: string;
  activations?: Activation[];
  subscriptions?: Subscription[];
  payments?: Payment[];
}

/**
 * License status information for validation and display.
 *
 * Performance considerations:
 * - Boolean flag (valid) is more efficient than string comparisons
 * - Nullable types allow for efficient representation of optional data
 * - Number type (daysRemaining) is more efficient than string calculations
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface LicenseStatusInfo {
  valid: boolean;
  status: string;
  message: string;
  expiresAt: string | null;
  gracePeriodEnd: string | null;
  daysRemaining: number | null;
}

/**
 * Input data for creating a new license.
 *
 * Performance considerations:
 * - Optional properties allow for flexible input and reduce unnecessary data transfer
 * - Boolean flag (isFreeTrial) is more efficient than string comparisons
 * - Number types for prices allow for efficient calculations
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface CreateLicenseInput {
  customerName: string;
  customerPhone: string;
  verificationToken?: string; // Required for phone verification
  initialPrice?: number;
  annualPrice?: number;
  pricePerUser?: number;
  locationName: string;
  locationAddress: string;
  isFreeTrial?: boolean;
  startDate?: string;
  endDate?: string;
  version?: string;
}

/**
 * Input data for updating an existing license.
 *
 * Performance considerations:
 * - All properties are optional to allow partial updates
 * - Partial updates reduce data transfer and processing overhead
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface UpdateLicenseInput {
  customerName?: string;
  customerPhone?: string;
  locationName?: string;
  locationAddress?: string;
  status?: LicenseStatus;
  initialPrice?: number;
  annualPrice?: number;
  pricePerUser?: number;
}

/**
 * License activation record.
 *
 * Performance considerations:
 * - Boolean flag (isActive) is more efficient than string comparisons
 * - Nullable types allow for efficient representation of optional data
 * - Dates stored as ISO strings for efficient serialization
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface Activation {
  id: number;
  licenseId: number;
  hardwareId: string;
  machineName: string | null;
  activatedAt: string;
  lastValidation: string | null;
  isActive: boolean;
}

/**
 * Subscription record for a license.
 *
 * Performance considerations:
 * - Literal union type for status provides type safety and efficient comparisons
 * - Number type (annualFee) allows for efficient calculations
 * - Nullable gracePeriodEnd allows for efficient representation of optional data
 * - Dates stored as ISO strings for efficient serialization
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface Subscription {
  id: number;
  licenseId: number;
  startDate: string;
  endDate: string;
  annualFee: number;
  status: 'active' | 'expired' | 'grace_period';
  gracePeriodEnd: string | null;
  createdAt: string;
}

/**
 * Payment record for a license.
 *
 * Performance considerations:
 * - Boolean flag (isAnnualSubscription) is more efficient than string comparisons
 * - Optional paymentType allows for flexible payment categorization
 * - Number type (amount) allows for efficient calculations
 * - Dates stored as ISO strings for efficient serialization
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface Payment {
  id: number;
  licenseId: number;
  amount: number;
  paymentDate: string;
  isAnnualSubscription: boolean;
  paymentType?: 'initial' | 'annual' | 'user';
  createdAt: string;
}