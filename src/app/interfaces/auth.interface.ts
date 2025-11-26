import { User } from './user.interface';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  requires_2fa: boolean;
  temp_token?: string;
  user?: User;
  available_2fa_methods?: string[];
}

export interface Verify2FARequest {
  temp_token: string;
  code: string;
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

export interface TokenData {
  user_id: number;
  email: string;
  exp: number;
  type: string;
}
