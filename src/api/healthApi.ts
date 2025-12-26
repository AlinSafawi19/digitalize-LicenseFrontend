import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createApi } from '@reduxjs/toolkit/query/react';
import { config } from '../config/env';

export interface HealthItem {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  timestamp?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime?: {
    seconds: number;
    formatted: string;
  };
  database?: {
    status: string;
    responseTime?: string;
    error?: string;
  };
  memory?: {
    system?: {
      total: string;
      free: string;
      used: string;
      usagePercent: string;
    };
    process?: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      external: string;
    };
  };
  system?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpuCores: number;
  };
  whatsapp?: {
    enabled: boolean;
    configured: boolean;
    provider: string;
  };
  error?: string;
}

export interface TransformedHealthData {
  status: 'healthy' | 'unhealthy' | 'degraded';
  health: HealthItem[];
  timestamp: string;
}

// Health endpoint is at /health (not /api/health), so we need a separate base URL
// Remove /api from the base URL if it exists
const getHealthBaseUrl = () => {
  const baseUrl = config.apiBaseUrl;
  // Remove trailing /api if present
  if (baseUrl.endsWith('/api')) {
    return baseUrl.slice(0, -4); // Remove '/api'
  }
  // If it ends with /api/, remove that too
  if (baseUrl.endsWith('/api/')) {
    return baseUrl.slice(0, -5); // Remove '/api/'
  }
  return baseUrl;
};

// Create a separate API instance for health checks with the correct base URL
const healthBaseQuery = fetchBaseQuery({
  baseUrl: getHealthBaseUrl(),
  // Health endpoint doesn't require authentication
  prepareHeaders: () => {
    return new Headers();
  },
});

export const healthApi = createApi({
  reducerPath: 'healthApi',
  baseQuery: healthBaseQuery,
  tagTypes: ['Health'],
  endpoints: (builder) => ({
    getHealth: builder.query<TransformedHealthData, void>({
      query: () => '/health',
      providesTags: ['Health'],
      // Keep data for 1 minute
      keepUnusedDataFor: 60,
      transformResponse: (response: HealthResponse): TransformedHealthData => {
        // Transform server response to match frontend expected format
        const healthItems: HealthItem[] = [];
        
        // Add overall status
        healthItems.push({
          name: 'Server',
          status: response.status,
          message: response.status === 'healthy' ? 'All systems operational' : 'System issues detected',
        });
        
        // Add database status
        if (response.database) {
          const dbStatus = response.database.status === 'connected' ? 'healthy' : 'unhealthy';
          healthItems.push({
            name: 'Database',
            status: dbStatus,
            message: response.database.responseTime 
              ? `Response time: ${response.database.responseTime}`
              : response.database.error || undefined,
          });
        }
        
        // Add memory status if available
        if (response.memory?.system) {
          const memoryUsage = parseFloat(response.memory.system.usagePercent);
          const memoryStatus = memoryUsage < 80 ? 'healthy' : memoryUsage < 95 ? 'degraded' : 'unhealthy';
          healthItems.push({
            name: 'Memory',
            status: memoryStatus,
            message: `Usage: ${response.memory.system.usagePercent}`,
          });
        }
        
        return {
          status: response.status,
          health: healthItems,
          timestamp: response.timestamp,
        };
      },
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;

