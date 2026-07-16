import { apiRequest } from './client'
import type { Post, PublicUser } from './types'

export function searchUsers(query: string, token: string, signal?: AbortSignal) {
  return apiRequest<PublicUser[]>(`/users/search?query=${encodeURIComponent(query)}`, {
    token,
    signal,
  })
}

export function getUser(userId: number, signal?: AbortSignal) {
  return apiRequest<PublicUser>(`/users/${userId}`, { signal })
}

export function getUserPosts(userId: number, signal?: AbortSignal) {
  return apiRequest<Post[]>(`/users/${userId}/posts`, { signal })
}
