/**
 * Generic API response wrapper.
 *
 * Performance considerations:
 * - Generic type parameter allows for type-safe responses without runtime overhead
 * - Optional properties reduce unnecessary data transfer and parsing
 * - TypeScript compiles to efficient JavaScript with no runtime type checking
 *
 * @template T - The type of the data payload
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Paginated API response structure.
 *
 * Performance considerations:
 * - Separates data from pagination metadata for efficient processing
 * - Array type allows for efficient iteration and memory usage
 * - TypeScript ensures type safety at compile time with no runtime overhead
 *
 * @template T - The type of items in the paginated array
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Pagination parameters for API requests.
 *
 * Performance considerations:
 * - All properties are optional to allow flexible query construction
 * - Literal union type for sortOrder provides type safety and autocomplete
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters for API requests.
 *
 * Performance considerations:
 * - All properties are optional to allow flexible query construction
 * - String types for dates allow efficient serialization/deserialization
 * - Boolean type for isFreeTrial is more efficient than string comparisons
 * - TypeScript compiles to efficient JavaScript with no runtime overhead
 */
export interface FilterParams {
  status?: string;
  search?: string;
  isFreeTrial?: boolean;
  startDate?: string;
  endDate?: string;
}