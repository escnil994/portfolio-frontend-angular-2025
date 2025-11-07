export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  requires_2fa: boolean;
  temp_token?: string;
}

export interface Verify2FARequest {
  temp_token: string;
  code: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  email_2fa_enabled: boolean;
  totp_enabled: boolean;
  created_at: string;
  last_login: string | null;
}

export interface EnableTOTPRequest {
  password: string;
}

export interface EnableTOTPResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface VerifyTOTPRequest {
  code: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}
