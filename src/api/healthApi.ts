import { baseApi } from './baseApi';

export interface HealthItem {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  timestamp?: string;
}

export interface HealthResponse {
  success: boolean;
  message: string;
  data: {
    status: 'healthy' | 'unhealthy' | 'degraded';
    health: HealthItem[];
    timestamp: string;
  };
}

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse['data'], void>({
      query: () => '/health',
      providesTags: ['Health'],
      // Poll every 30 seconds to keep health status updated
      pollingInterval: 30000,
      // Keep data for 1 minute
      keepUnusedDataFor: 60,
      transformResponse: (response: HealthResponse): HealthResponse['data'] => {
        return response.data;
      },
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;

