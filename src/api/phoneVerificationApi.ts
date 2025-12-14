import { baseApi } from './baseApi';

interface SendOTPRequest {
  phone: string;
}

interface SendOTPResponse {
  expiresAt: string;
}

interface VerifyOTPRequest {
  phone: string;
  otpCode: string;
}

interface VerifyOTPResponse {
  verificationToken: string;
}

export const phoneVerificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOTP: builder.mutation<SendOTPResponse, SendOTPRequest>({
      query: (data) => ({
        url: '/phone-verification/send-otp',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: SendOTPResponse }) => response.data,
    }),
    verifyOTP: builder.mutation<VerifyOTPResponse, VerifyOTPRequest>({
      query: (data) => ({
        url: '/phone-verification/verify-otp',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: VerifyOTPResponse }) => response.data,
    }),
  }),
});

export const { useSendOTPMutation, useVerifyOTPMutation } = phoneVerificationApi;

