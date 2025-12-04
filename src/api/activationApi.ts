import { baseApi } from './baseApi';
import { Activation } from '../types/license.types';
import { PaginationParams, FilterParams } from '../types/api.types';

interface GetActivationsParams extends PaginationParams, FilterParams {
  licenseId?: number;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetActivationsResponse {
  activations: Activation[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  meta?: {
    totalActive?: number;
    totalInactive?: number;
  };
}

interface ActivationWithLicense extends Activation {
  license?: {
    id: number;
    licenseKey: string;
    locationName: string | null;
    locationAddress: string | null;
  };
}

export const activationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivations: builder.query<GetActivationsResponse, GetActivationsParams>({
      query: (params) => ({
        url: '/admin/activations',
        params: {
          page: params.page,
          pageSize: params.limit,
          licenseId: params.licenseId,
          isActive: params.isActive,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      }),
      transformResponse: (response: { data: GetActivationsResponse }) => response.data,
      providesTags: ['Activation'],
      // Performance optimization: Keep cached data for 5 minutes to reduce unnecessary refetches
      keepUnusedDataFor: 300,
    }),
    getActivationById: builder.query<ActivationWithLicense, number>({
      query: (id) => `/admin/activations/${id}`,
      transformResponse: (response: { data: ActivationWithLicense }) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Activation', id }],
      // Performance optimization: Keep individual activation data cached for 10 minutes
      keepUnusedDataFor: 600,
    }),
    deactivateActivation: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/activations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Activation', id }, 'Activation'],
    }),
  }),
});

export const {
  useGetActivationsQuery,
  useGetActivationByIdQuery,
  useDeactivateActivationMutation,
} = activationApi;