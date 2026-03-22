export interface AuthState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  reset_token?: string;
  new_password?: string;
  confirm_password?: string;
}

export interface AuthResponse {
  message: string;
}

export interface LoginResponse extends AuthResponse {
  user: UserDto;
}

export interface VerifyOtpResponse extends AuthResponse {
  reset_token: string;
}

export interface AuthStore {
  authState: AuthState;
  user: UserDto | null;
  resetToken: string | null;
  resetAuthState: () => void;
  signup: (data: SignupRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
}
