import { apiRequest } from './client'
import type {
  AuthenticatedUser,
  LikedItems,
  LoginInput,
  ProfileInput,
  RegisterInput,
  TokenResponse,
} from './types'

export function registerUser(input: RegisterInput) {
  return apiRequest<AuthenticatedUser>('/auth/register', {
    method: 'POST',
    body: input,
  })
}

export function loginUser(input: LoginInput) {
  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: input,
  })
}

export function getCurrentUser(token: string) {
  return apiRequest<AuthenticatedUser>('/auth/me', { token })
}

export function getCurrentUserLikes(token: string) {
  return apiRequest<LikedItems>('/auth/me/likes', { token })
}

export function updateCurrentUserProfile(input: ProfileInput, token: string) {
  return apiRequest<AuthenticatedUser>('/auth/me', {
    method: 'PATCH',
    body: input,
    token,
  })
}
