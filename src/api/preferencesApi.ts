import { baseApi } from './baseApi';

export interface Preferences {
  general: {
    phoneNumberVerification: boolean;
  };
  customer: {
    // Future customer preferences will go here
  };
  licenseTypeVersion: {
    // Future license type version preferences will go here
  };
}

export interface UpdatePreferencesRequest {
  general?: Partial<Preferences['general']>;
  customer?: Partial<Preferences['customer']>;
  licenseTypeVersion?: Partial<Preferences['licenseTypeVersion']>;
}

export const preferencesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPreferences: builder.query<Preferences, void>({
      query: () => ({
        url: '/preferences',
        method: 'GET',
      }),
      transformResponse: (response: { data: Preferences }) => response.data,
      providesTags: ['Preferences'],
    }),
    updatePreferences: builder.mutation<Preferences, UpdatePreferencesRequest>({
      query: (data) => ({
        url: '/preferences',
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: { data: Preferences }) => response.data,
      invalidatesTags: ['Preferences'],
    }),
  }),
});

export const { useGetPreferencesQuery, useUpdatePreferencesMutation } = preferencesApi;

