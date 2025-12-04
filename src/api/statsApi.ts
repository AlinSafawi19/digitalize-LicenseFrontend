import { baseApi } from './baseApi';

export interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  freeTrial: number; // Licenses in free trial
  totalActivations: number;
  activeSubscriptions: number;
  totalRevenue: number;
  initialRevenue: number;
  annualRevenue: number;
  expiringSoon: number; // Licenses expiring in next 30 days
  recentActivity: {
    licenses: number;
    activations: number;
    payments: number;
  };
}

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/admin/stats',
      providesTags: ['Stats'],
      // Performance optimization: Dashboard stats are expensive to compute (aggregating from multiple tables)
      // Cache for 2 minutes to reduce server load while keeping data reasonably fresh
      // Stats are automatically invalidated when licenses/payments/activations change via tag invalidation
      keepUnusedDataFor: 120,
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: {
          licenses: {
            total: number;
            active: number;
            expired: number;
            revoked: number;
            suspended: number;
            freeTrial: number;
            expiringSoon: number;
          };
          revenue: {
            total: number;
            monthly: number;
            annual: number;
            byType: {
              initial: number;
              subscription: number;
            };
          };
          activations: {
            total: number;
            active: number;
            inactive: number;
          };
          subscriptions: {
            total: number;
            active: number;
            expired: number;
            gracePeriod: number;
            expiringSoon: number;
          };
          recentActivity: {
            licenses: number;
            activations: number;
            payments: number;
          };
        };
      }): DashboardStats => {
        const { data } = response;
        return {
          totalLicenses: data.licenses.total,
          activeLicenses: data.licenses.active,
          expiredLicenses: data.licenses.expired,
          revokedLicenses: data.licenses.revoked,
          freeTrial: data.licenses.freeTrial,
          totalActivations: data.activations.total,
          activeSubscriptions: data.subscriptions.active,
          totalRevenue: data.revenue.total,
          initialRevenue: data.revenue.byType.initial,
          annualRevenue: data.revenue.byType.subscription,
          expiringSoon: data.licenses.expiringSoon,
          recentActivity: {
            licenses: data.recentActivity.licenses,
            activations: data.recentActivity.activations,
            payments: data.recentActivity.payments,
          },
        };
      },
    }),
  }),
});

export const { useGetDashboardStatsQuery } = statsApi;