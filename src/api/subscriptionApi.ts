import { baseApi } from './baseApi';
import { Subscription } from '../types/license.types';
import { PaginationParams, FilterParams } from '../types/api.types';

interface GetSubscriptionsParams extends PaginationParams, FilterParams {
  licenseId?: number;
  expiringSoon?: boolean;
  expired?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetSubscriptionsResponse {
  subscriptions: Subscription[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  meta?: {
    totalActive?: number;
    totalExpired?: number;
    totalGracePeriod?: number;
  };
}

interface SubscriptionWithLicense extends Subscription {
  license?: {
    id: number;
    licenseKey: string;
    customerName: string | null;
    locationName: string | null;
    isFreeTrial: boolean;
  };
}

interface RenewSubscriptionResponse {
  subscription: Subscription;
  message: string;
}

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptions: builder.query<GetSubscriptionsResponse, GetSubscriptionsParams>({
      query: (params) => ({
        url: '/admin/subscriptions',
        params: {
          page: params.page,
          pageSize: params.limit,
          status: params.status,
          licenseId: params.licenseId,
          expiringSoon: params.expiringSoon,
          expired: params.expired,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      }),
      transformResponse: (response: { data: GetSubscriptionsResponse }) => response.data,
      providesTags: ['Subscription'],
      // Performance optimization: Keep cached data for 5 minutes to reduce unnecessary refetches
      keepUnusedDataFor: 300,
    }),
    getSubscriptionById: builder.query<SubscriptionWithLicense, number>({
      query: (id) => `/admin/subscriptions/${id}`,
      transformResponse: (response: { data: SubscriptionWithLicense }) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Subscription', id }],
      // Performance optimization: Keep individual subscription data cached for 10 minutes
      keepUnusedDataFor: 600,
    }),
    renewSubscription: builder.mutation<RenewSubscriptionResponse, number>({
      query: (id) => ({
        url: `/admin/subscriptions/${id}/renew`,
        method: 'POST',
      }),
      transformResponse: (response: { data: RenewSubscriptionResponse }) => response.data,
      invalidatesTags: (_result, _error, id) => [{ type: 'Subscription', id }, 'Subscription', 'License', 'Stats'],
    }),
  }),
});

export const {
  useGetSubscriptionsQuery,
  useGetSubscriptionByIdQuery,
  useRenewSubscriptionMutation,
} = subscriptionApi;