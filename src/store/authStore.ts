import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { AuthStore, AuthResponse, LoginResponse, VerifyOtpResponse } from '../models/AuthModels';

export const useAuthStore = create<AuthStore>((set, get) => ({
  authState: { status: 'idle', message: '' },
  user: null,
  resetToken: null,

  resetAuthState: () => set({ authState: { status: 'idle', message: '' } }),

  // ✅ SIGNUP
  signup: async (data) => {
    set({ authState: { status: 'loading', message: '' } });

    try {
      const response = await apiClient.post<AuthResponse>('/signup', {
        full_name: data.fullName,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
      });

      set({
        authState: {
          status: 'success',
          message: 'Account created successfully',
        },
      });

    } catch (e: any) {
      set({
        authState: {
          status: 'error',
          message: e.message || 'Signup failed',
        },
      });
    }
  },

  // ✅ LOGIN
  login: async (data) => {
    set({ authState: { status: 'loading', message: '' } });

    try {
      const response = await apiClient.post<LoginResponse>('/login', data);

      set({
        user: response.user || null,
        authState: {
          status: 'success',
          message: 'Login successful',
        },
      });

    } catch (e: any) {
      set({
        authState: {
          status: 'error',
          message: e.message || 'Login failed',
        },
      });
    }
  },

  // ✅ FORGOT PASSWORD
  forgotPassword: async (data) => {
    set({ authState: { status: 'loading', message: '' } });

    try {
      await apiClient.post<AuthResponse>('/forgot-password', data);

      set({
        authState: {
          status: 'success',
          message: 'Reset link sent to email',
        },
      });

    } catch (e: any) {
      set({
        authState: {
          status: 'error',
          message: e.message || 'Failed to send reset link',
        },
      });
    }
  },

  // ✅ VERIFY OTP (optional if you use)
  verifyOtp: async (data) => {
    set({ authState: { status: 'loading', message: '' } });

    try {
      const response = await apiClient.post<VerifyOtpResponse>('/verify-otp', data);

      set({
        resetToken: response.reset_token,
        authState: {
          status: 'success',
          message: 'OTP verified',
        },
      });

    } catch (e: any) {
      set({
        authState: {
          status: 'error',
          message: e.message || 'Invalid OTP',
        },
      });
    }
  },

  // ✅ RESET PASSWORD (optional)
  resetPassword: async (data) => {
    const { resetToken } = get();
    if (!resetToken) return;

    set({ authState: { status: 'loading', message: '' } });

    try {
      await apiClient.post<AuthResponse>('/reset-password', {
        reset_token: resetToken,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });

      set({
        authState: {
          status: 'success',
          message: 'Password reset successful',
        },
      });

    } catch (e: any) {
      set({
        authState: {
          status: 'error',
          message: e.message || 'Reset failed',
        },
      });
    }
  },
}));