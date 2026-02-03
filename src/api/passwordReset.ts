import { apiClient } from './client';

export interface RequestOTPResponse {
  message: string;
}

export interface VerifyOTPResponse {
  message: string;
  resetToken: string;
  expiresAt: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * Request password reset OTP
 */
export async function requestPasswordResetOTP(phone: string): Promise<RequestOTPResponse> {
  const response = await apiClient.post<RequestOTPResponse>('/password-reset/request', { phone });
  return response.data;
}

/**
 * Verify OTP
 */
export async function verifyOTP(phone: string, otp: string): Promise<VerifyOTPResponse> {
  const response = await apiClient.post<VerifyOTPResponse>('/password-reset/verify', { phone, otp });
  return response.data;
}

/**
 * Reset password with verified token
 */
export async function resetPassword(
  phone: string,
  resetToken: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  const response = await apiClient.post<ResetPasswordResponse>('/password-reset/reset', {
    phone,
    resetToken,
    newPassword,
  });
  return response.data;
}
