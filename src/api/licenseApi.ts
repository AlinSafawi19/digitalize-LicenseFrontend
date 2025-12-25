import { baseApi } from './baseApi';
import { License, CreateLicenseInput, UpdateLicenseInput } from '../types/license.types';
import { PaginationParams, FilterParams } from '../types/api.types';

interface GetLicensesParams extends PaginationParams, FilterParams {
  isFreeTrial?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRelations?: boolean; // Performance: Set to false for list views to reduce payload size
}

interface GetLicensesResponse {
  licenses: License[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  meta?: {
    totalActive?: number;
    totalExpired?: number;
    totalRevoked?: number;
  };
}

export const licenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLicenses: builder.query<GetLicensesResponse, GetLicensesParams>({
      query: (params) => ({
        url: '/admin/licenses',
        params: {
          page: params.page,
          pageSize: params.limit,
          status: params.status,
          search: params.search,
          isFreeTrial: params.isFreeTrial !== undefined ? String(params.isFreeTrial) : undefined,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
          includeRelations: params.includeRelations !== undefined ? String(params.includeRelations) : undefined,
        },
      }),
      transformResponse: (response: { data: GetLicensesResponse }) => response.data,
      providesTags: ['License'],
      // Performance optimization: Keep cached data for 5 minutes to reduce unnecessary refetches
      keepUnusedDataFor: 300,
    }),
    getLicenseById: builder.query<License, number>({
      query: (id) => `/admin/licenses/${id}`,
      transformResponse: (response: { data: License }) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'License', id }],
      // Performance optimization: Keep individual license data cached for 10 minutes
      keepUnusedDataFor: 600,
    }),
    createLicense: builder.mutation<{ licenseKey: string; licenseId: number; status: string; expiresAt: string }, CreateLicenseInput>({
      query: (data) => ({
        url: '/license/generate',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: { licenseKey: string; licenseId: number; status: string; expiresAt: string } }) => response.data,
      invalidatesTags: ['License', 'Stats'],
    }),
    updateLicense: builder.mutation<License, { id: number; data: UpdateLicenseInput }>({
      query: ({ id, data }) => ({
        url: `/admin/licenses/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { data: License }) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'License', id }, 'License'],
    }),
    revokeLicense: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/licenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'License', id }, 'License', 'Stats'],
    }),
    deleteLicense: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/licenses/${id}/permanent`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'License', id }, 'License', 'Stats'],
    }),
    reactivateLicense: builder.mutation<
      { license: License; deactivatedActivations: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/admin/licenses/${id}/reactivate`,
        method: 'POST',
      }),
      transformResponse: (response: {
        data: { license: License; deactivatedActivations: number; message: string };
      }) => response.data,
      invalidatesTags: (_result, _error, id) => [{ type: 'License', id }, 'License', 'Stats'],
    }),
    increaseUserLimit: builder.mutation<
      { id: number; licenseKey: string; userCount: number; userLimit: number; previousLimit: number },
      { id: number; additionalUsers: number }
    >({
      query: ({ id, additionalUsers }) => ({
        url: `/admin/licenses/${id}/user-limit`,
        method: 'PATCH',
        body: { additionalUsers },
      }),
      transformResponse: (response: {
        data: { id: number; licenseKey: string; userCount: number; userLimit: number; previousLimit: number };
      }) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'License', id }, 'License'],
    }),
    exportLicensesCSV: builder.query<string, GetLicensesParams>({
      query: (params) => ({
        url: '/admin/reports/licenses',
        params: {
          status: params.status,
          search: params.search,
          isFreeTrial: params.isFreeTrial !== undefined ? String(params.isFreeTrial) : undefined,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
        responseHandler: (response) => response.text(),
      }),
      // Performance optimization: CSV exports are typically one-time operations
      // Cache for 10 minutes in case user wants to re-download
      keepUnusedDataFor: 600,
    }),
    getLicenseByKey: builder.query<License, string>({
      query: (key) => `/license/${encodeURIComponent(key)}`,
      transformResponse: (response: { data: License }) => response.data,
      providesTags: (_result, _error, key) => [{ type: 'License', id: key }],
      // Performance optimization: Keep license by key cached for 5 minutes
      // This is useful when searching for licenses by key (with debouncing in components)
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetLicensesQuery,
  useGetLicenseByIdQuery,
  useCreateLicenseMutation,
  useUpdateLicenseMutation,
  useRevokeLicenseMutation,
  useDeleteLicenseMutation,
  useReactivateLicenseMutation,
  useIncreaseUserLimitMutation,
  useLazyExportLicensesCSVQuery,
  useLazyGetLicenseByKeyQuery,
} = licenseApi;