import { baseApi } from '../../../api/baseApi';
import { LoginCredentials, AuthResponse } from '../../../types/auth.types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/admin/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: {
          token: string;
          admin: {
            id: number;
            username: string;
            phone: string;
          };
        };
      }): AuthResponse => ({
        token: response.data.token,
        user: {
          id: response.data.admin.id,
          phone: response.data.admin.phone,
          name: response.data.admin.username,
        },
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/admin/logout',
        method: 'POST',
      }),
      // Invalidate Auth tags to clear cached user info on logout
      invalidatesTags: ['Auth'],
    }),
    getUserInfo: builder.query<{ phone: string; name?: string }, void>({
      query: () => '/admin/me',
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: { id: number; username: string; phone: string };
      }) => ({
        phone: response.data.phone,
        name: response.data.username,
      }),
      providesTags: ['Auth'],
      // Performance optimization: Cache user info for 10 minutes since it doesn't change frequently
      // This reduces unnecessary API calls when navigating between pages
      keepUnusedDataFor: 600,
    }),
    updateProfile: builder.mutation<
      { phone: string; name: string },
      { username?: string; phone?: string }
    >({
      query: (updates) => ({
        url: '/admin/profile',
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: { id: number; username: string; phone: string };
      }) => ({
        phone: response.data.phone,
        name: response.data.username,
      }),
      invalidatesTags: ['Auth'],
    }),
    changePassword: builder.mutation<
      void,
      { currentPassword: string; newPassword: string }
    >({
      query: (passwords) => ({
        url: '/admin/password',
        method: 'PUT',
        body: passwords,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetUserInfoQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;