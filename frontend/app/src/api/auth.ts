import { apiJson } from '@/api/client'

export type SignupRequest = {
  email: string
  password: string
  firstName: string
  lastName: string
}

export type SignupResponse = {
  userId: string
  email: string
  message: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  firstName?: string
  lastName?: string
  phone?: string | null
  company?: string | null
  message: string
}

export type Verify2FARequest = {
  userId: string
  code: string
}

export type Verify2FAResponse = {
  accessToken: string
  refreshToken: string
  message: string
}

export type UserProfileResponse = {
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  company?: string | null
  message: string
}

export type UpdateUserProfileRequest = {
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
}

export type RequestPasswordResetRequest = {
  email: string
}

export type RequestPasswordResetResponse = {
  message: string
}

export type ResetPasswordRequest = {
  token: string
  password: string
}

export type ResetPasswordResponse = {
  message: string
}

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return apiJson<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiJson<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function verify2FA(data: Verify2FARequest): Promise<Verify2FAResponse> {
  return apiJson<Verify2FAResponse>('/auth/verify-2fa', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getUserProfile(): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>('/auth/user', {
    method: 'GET',
  })
}

export async function updateUserProfile(
  data: UpdateUserProfileRequest
): Promise<UserProfileResponse> {
  return apiJson<UserProfileResponse>('/auth/user', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function requestPasswordReset(
  data: RequestPasswordResetRequest
): Promise<RequestPasswordResetResponse> {
  return apiJson<RequestPasswordResetResponse>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return apiJson<ResetPasswordResponse>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
