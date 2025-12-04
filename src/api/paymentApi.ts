import { baseApi } from './baseApi';
import { Payment } from '../types/license.types';
import { PaginationParams, FilterParams } from '../types/api.types';

interface GetPaymentsParams extends PaginationParams, FilterParams {
  licenseId?: number;
  isAnnualSubscription?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetPaymentsResponse {
  payments: Payment[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  meta?: {
    totalAmount?: number;
  };
}

interface PaymentWithLicense extends Payment {
  license?: {
    id: number;
    licenseKey: string;
    customerName: string | null;
    locationName: string | null;
  };
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<GetPaymentsResponse, GetPaymentsParams>({
      query: (params) => ({
        url: '/admin/payments',
        params: {
          page: params.page,
          pageSize: params.limit,
          licenseId: params.licenseId,
          startDate: params.startDate,
          endDate: params.endDate,
          isAnnualSubscription: params.isAnnualSubscription,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      }),
      transformResponse: (response: { data: GetPaymentsResponse }) => response.data,
      providesTags: ['Payment'],
      // Performance optimization: Keep cached data for 5 minutes to reduce unnecessary refetches
      keepUnusedDataFor: 300,
    }),
    getPaymentById: builder.query<PaymentWithLicense, number>({
      query: (id) => `/admin/payments/${id}`,
      transformResponse: (response: { data: PaymentWithLicense }) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Payment', id }],
      // Performance optimization: Keep individual payment data cached for 10 minutes
      keepUnusedDataFor: 600,
    }),
    exportPaymentsCSV: builder.query<string, GetPaymentsParams>({
      query: (params) => ({
        url: '/admin/reports/payments',
        params: {
          licenseId: params.licenseId,
          startDate: params.startDate,
          endDate: params.endDate,
          isAnnualSubscription: params.isAnnualSubscription,
        },
        responseHandler: (response) => response.text(),
      }),
      // Performance optimization: CSV exports are typically one-time operations
      // Cache for 10 minutes in case user wants to re-download
      keepUnusedDataFor: 600,
    }),
    createPayment: builder.mutation<
      PaymentWithLicense,
      {
        licenseId: number;
        amount: number;
        paymentDate?: string;
        isAnnualSubscription: boolean;
        paymentType?: 'initial' | 'annual' | 'user';
        additionalUsers?: number;
      }
    >({
      query: (body) => ({
        url: '/admin/payments',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: PaymentWithLicense }) => response.data,
      invalidatesTags: ['Payment'],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useLazyExportPaymentsCSVQuery,
  useCreatePaymentMutation,
} = paymentApi;