import { apiRequest } from './client'
import type { MessageResponse, Post, PostInput, PublicUser } from './types'

export type { Post } from './types'

function isPublicUser(value: unknown): value is PublicUser {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'number' &&
    typeof user.username === 'string' &&
    typeof user.created_at === 'string'
  )
}

function isPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const post = value as Record<string, unknown>
  return (
    typeof post.id === 'number' &&
    typeof post.owner_id === 'number' &&
    isPublicUser(post.owner) &&
    typeof post.title === 'string' &&
    typeof post.description === 'string' &&
    typeof post.category === 'string' &&
    typeof post.location === 'string' &&
    (post.image_url === null || typeof post.image_url === 'string') &&
    Array.isArray(post.hashtags) &&
    post.hashtags.every((hashtag) => typeof hashtag === 'string') &&
    typeof post.event_date === 'string' &&
    typeof post.created_at === 'string' &&
    typeof post.like_count === 'number' &&
    typeof post.comment_count === 'number'
  )
}

export async function getPosts(signal?: AbortSignal): Promise<Post[]> {
  const posts = await apiRequest<unknown>('/posts/', { signal })

  if (!Array.isArray(posts) || !posts.every(isPost)) {
    throw new Error('The events service returned an unexpected response.')
  }

  return posts
}

export async function getHeartedPosts(token: string, signal?: AbortSignal): Promise<Post[]> {
  const posts = await apiRequest<unknown>('/auth/me/liked-posts', { token, signal })

  if (!Array.isArray(posts) || !posts.every(isPost)) {
    throw new Error('The events service returned an unexpected response.')
  }

  return posts
}

export async function getPost(postId: number, signal?: AbortSignal): Promise<Post> {
  const post = await apiRequest<unknown>(`/posts/${postId}`, { signal })

  if (!isPost(post)) {
    throw new Error('The events service returned an unexpected response.')
  }

  return post
}

export function createPost(input: PostInput, token: string) {
  return apiRequest<Post>('/posts/', {
    method: 'POST',
    body: input,
    token,
  })
}

export function deletePost(postId: number, token: string) {
  return apiRequest<MessageResponse>(`/posts/${postId}`, {
    method: 'DELETE',
    token,
  })
}
